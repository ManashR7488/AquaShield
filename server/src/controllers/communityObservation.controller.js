import CommunityObservation from '../models/communityObservation.model.js';
import { successResponse, errorResponse } from '../utils/responseHelper.js';
import { sendNotification } from '../utils/notificationService.js';
import mongoose from 'mongoose';

/**
 * Community Observation Controller
 * Handles volunteer-reported community observations and escalations
 */

/**
 * Create a new community observation
 */
export const createObservation = async (req, res) => {
  try {
    const observationData = {
      ...req.body,
      observerId: req.user.id,
      createdAt: new Date(),
      status: 'reported'
    };

    // Create the observation
    const observation = new CommunityObservation(observationData);
    await observation.save();

    // Analyze patterns and check for escalation
    await analyzeObservationPatterns(observation);

    // Auto-escalate if criteria are met
    if (observation.requiresEscalation) {
      await autoEscalateObservation(observation);
    }

    await observation.populate([
      { path: 'observerId', select: 'name role contactInfo' },
      { path: 'location.areaId', select: 'name type' },
      { path: 'location.villageId', select: 'name district block' }
    ]);

    return successResponse(res, {
      observation,
      message: 'Community observation created successfully'
    }, 201);

  } catch (error) {
    console.error('Error creating community observation:', error);
    return errorResponse(res, 'Failed to create community observation', 500);
  }
};

/**
 * Get all community observations with area-based filtering
 */
export const getObservations = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      observationType,
      severity,
      status,
      observerId,
      areaId,
      villageId,
      observationDateFrom,
      observationDateTo,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object with role-based access control
    const filter = {};

    if (req.user.role === 'volunteer') {
      // Volunteers can see their own observations and public ones in their area
      filter.$or = [
        { observerId: req.user.id },
        { 
          'location.areaId': { $in: req.user.assignedAreas || [] },
          sensitivityLevel: 'public'
        }
      ];
    } else if (req.user.role === 'asha_worker') {
      // ASHA workers can see observations from their assigned villages
      filter['location.villageId'] = { $in: req.user.assignedVillages || [] };
    }

    // Apply additional filters
    if (observationType) filter.observationType = observationType;
    if (severity) filter.severity = severity;
    if (status) filter.status = status;
    if (observerId) filter.observerId = observerId;
    if (areaId) filter['location.areaId'] = areaId;
    if (villageId) filter['location.villageId'] = villageId;

    // Date range filter
    if (observationDateFrom || observationDateTo) {
      filter.observationDate = {};
      if (observationDateFrom) filter.observationDate.$gte = new Date(observationDateFrom);
      if (observationDateTo) filter.observationDate.$lte = new Date(observationDateTo);
    }

    // Search filter
    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { 'recommendedActions.description': { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const [observations, total] = await Promise.all([
      CommunityObservation.find(filter)
        .populate([
          { path: 'observerId', select: 'name role' },
          { path: 'location.areaId', select: 'name type' },
          { path: 'location.villageId', select: 'name' }
        ])
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      CommunityObservation.countDocuments(filter)
    ]);

    const pagination = {
      current: parseInt(page),
      total: Math.ceil(total / limit),
      count: observations.length,
      totalRecords: total
    };

    return successResponse(res, {
      observations,
      pagination,
      message: 'Community observations fetched successfully'
    });

  } catch (error) {
    console.error('Error fetching community observations:', error);
    return errorResponse(res, 'Failed to fetch community observations', 500);
  }
};

/**
 * Get single community observation by ID
 */
export const getObservationById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid observation ID', 400);
    }

    const observation = await CommunityObservation.findById(id)
      .populate([
        { path: 'observerId', select: 'name role contactInfo' },
        { path: 'location.areaId', select: 'name type coordinates' },
        { path: 'location.villageId', select: 'name district block' },
        { path: 'escalationCriteria.escalatedTo', select: 'name role' },
        { path: 'communityValidation.validatedByMembers', select: 'name' }
      ]);

    if (!observation) {
      return errorResponse(res, 'Community observation not found', 404);
    }

    // Check access permissions
    const hasAccess = await checkObservationAccess(observation, req.user);
    if (!hasAccess) {
      return errorResponse(res, 'Access denied to this observation', 403);
    }

    return successResponse(res, {
      observation,
      message: 'Community observation fetched successfully'
    });

  } catch (error) {
    console.error('Error fetching community observation:', error);
    return errorResponse(res, 'Failed to fetch community observation', 500);
  }
};

/**
 * Update community observation
 */
export const updateObservation = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid observation ID', 400);
    }

    const observation = await CommunityObservation.findById(id);
    if (!observation) {
      return errorResponse(res, 'Community observation not found', 404);
    }

    // Check permissions (only creator can update, unless health worker)
    if (!canUpdateObservation(observation, req.user)) {
      return errorResponse(res, 'Not authorized to update this observation', 403);
    }

    // Track changes for audit
    const changes = {
      lastUpdatedBy: req.user.id,
      lastUpdatedAt: new Date()
    };

    const updatedObservation = await CommunityObservation.findByIdAndUpdate(
      id,
      { ...updateData, ...changes },
      { new: true, runValidators: true }
    ).populate([
      { path: 'observerId', select: 'name role' },
      { path: 'location.areaId', select: 'name type' }
    ]);

    return successResponse(res, {
      observation: updatedObservation,
      message: 'Community observation updated successfully'
    });

  } catch (error) {
    console.error('Error updating community observation:', error);
    return errorResponse(res, 'Failed to update community observation', 500);
  }
};

/**
 * Escalate observation to higher authority
 */
export const escalateObservation = async (req, res) => {
  try {
    const { id } = req.params;
    const escalationData = {
      ...req.body,
      escalatedBy: req.user.id,
      escalationDate: new Date()
    };

    const observation = await CommunityObservation.findByIdAndUpdate(
      id,
      {
        status: 'escalated',
        requiresEscalation: true,
        escalationCriteria: escalationData,
        $push: {
          escalationHistory: {
            ...escalationData,
            timestamp: new Date()
          }
        }
      },
      { new: true }
    ).populate([
      { path: 'observerId', select: 'name role' },
      { path: 'escalationCriteria.escalatedTo', select: 'name role' }
    ]);

    if (!observation) {
      return errorResponse(res, 'Community observation not found', 404);
    }

    // Send escalation notification
    await sendEscalationNotification(observation, escalationData);

    return successResponse(res, {
      observation,
      message: 'Observation escalated successfully'
    });

  } catch (error) {
    console.error('Error escalating observation:', error);
    return errorResponse(res, 'Failed to escalate observation', 500);
  }
};

/**
 * Add follow-up to observation
 */
export const addFollowUp = async (req, res) => {
  try {
    const { id } = req.params;
    const followUpData = {
      ...req.body,
      addedBy: req.user.id,
      addedAt: new Date()
    };

    const observation = await CommunityObservation.findByIdAndUpdate(
      id,
      {
        $push: { followUpActions: followUpData },
        lastFollowUpDate: new Date(),
        status: 'investigating'
      },
      { new: true }
    ).populate([
      { path: 'observerId', select: 'name role' },
      { path: 'followUpActions.assignedTo', select: 'name role' }
    ]);

    if (!observation) {
      return errorResponse(res, 'Community observation not found', 404);
    }

    return successResponse(res, {
      observation,
      message: 'Follow-up added successfully'
    });

  } catch (error) {
    console.error('Error adding follow-up:', error);
    return errorResponse(res, 'Failed to add follow-up', 500);
  }
};

/**
 * Get observations by area
 */
export const getObservationsByArea = async (req, res) => {
  try {
    const { areaId } = req.params;
    const { startDate, endDate, observationType } = req.query;

    const filter = { 'location.areaId': areaId };

    if (startDate || endDate) {
      filter.observationDate = {};
      if (startDate) filter.observationDate.$gte = new Date(startDate);
      if (endDate) filter.observationDate.$lte = new Date(endDate);
    }

    if (observationType) {
      filter.observationType = observationType;
    }

    const observations = await CommunityObservation.find(filter)
      .populate('observerId', 'name role')
      .sort({ observationDate: -1 });

    // Generate area summary
    const summary = {
      total: observations.length,
      byType: {},
      bySeverity: {},
      byStatus: {},
      totalAffectedHouseholds: 0,
      totalAffectedIndividuals: 0
    };

    observations.forEach(obs => {
      summary.byType[obs.observationType] = (summary.byType[obs.observationType] || 0) + 1;
      summary.bySeverity[obs.severity] = (summary.bySeverity[obs.severity] || 0) + 1;
      summary.byStatus[obs.status] = (summary.byStatus[obs.status] || 0) + 1;
      
      if (obs.affectedPopulation) {
        summary.totalAffectedHouseholds += obs.affectedPopulation.households || 0;
        summary.totalAffectedIndividuals += obs.affectedPopulation.individuals || 0;
      }
    });

    return successResponse(res, {
      observations,
      summary,
      message: 'Area observations fetched successfully'
    });

  } catch (error) {
    console.error('Error fetching area observations:', error);
    return errorResponse(res, 'Failed to fetch area observations', 500);
  }
};

/**
 * Get observation patterns analysis
 */
export const getObservationPatterns = async (req, res) => {
  try {
    const { 
      analysisType, 
      areaIds, 
      dateFrom, 
      dateTo,
      observationTypes 
    } = req.query;

    const matchStage = {
      observationDate: {
        $gte: new Date(dateFrom),
        $lte: new Date(dateTo)
      }
    };

    if (areaIds) {
      const areaIdArray = Array.isArray(areaIds) ? areaIds : areaIds.split(',');
      matchStage['location.areaId'] = { 
        $in: areaIdArray.map(id => new mongoose.Types.ObjectId(id)) 
      };
    }

    if (observationTypes) {
      const typeArray = Array.isArray(observationTypes) ? observationTypes : observationTypes.split(',');
      matchStage.observationType = { $in: typeArray };
    }

    let pipeline = [{ $match: matchStage }];

    switch (analysisType) {
      case 'geographic_clustering':
        pipeline.push({
          $group: {
            _id: {
              areaId: '$location.areaId',
              coordinates: '$location.coordinates'
            },
            count: { $sum: 1 },
            avgSeverity: { $avg: { $cond: [
              { $eq: ['$severity', 'critical'] }, 4,
              { $cond: [
                { $eq: ['$severity', 'high'] }, 3,
                { $cond: [
                  { $eq: ['$severity', 'medium'] }, 2, 1
                ]}
              ]}
            ]}},
            observations: { $push: '$$ROOT' }
          }
        });
        break;

      case 'temporal_patterns':
        pipeline.push({
          $group: {
            _id: {
              week: { $week: '$observationDate' },
              year: { $year: '$observationDate' },
              observationType: '$observationType'
            },
            count: { $sum: 1 },
            avgAffectedPopulation: { $avg: '$affectedPopulation.individuals' }
          }
        });
        break;

      case 'escalation_patterns':
        pipeline.push({
          $group: {
            _id: '$requiresEscalation',
            count: { $sum: 1 },
            avgResolutionTime: { $avg: {
              $subtract: ['$lastFollowUpDate', '$observationDate']
            }}
          }
        });
        break;

      default:
        pipeline.push({
          $group: {
            _id: '$observationType',
            count: { $sum: 1 },
            severityDistribution: {
              $push: '$severity'
            }
          }
        });
    }

    const patterns = await CommunityObservation.aggregate(pipeline);

    return successResponse(res, {
      patterns,
      analysisType,
      message: 'Observation patterns analyzed successfully'
    });

  } catch (error) {
    console.error('Error analyzing observation patterns:', error);
    return errorResponse(res, 'Failed to analyze observation patterns', 500);
  }
};

/**
 * Generate community report
 */
export const generateCommunityReport = async (req, res) => {
  try {
    const { areaId, startDate, endDate, includeRecommendations = true } = req.query;

    const filter = {
      observationDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    if (areaId) {
      filter['location.areaId'] = areaId;
    }

    const observations = await CommunityObservation.find(filter)
      .populate('observerId', 'name role')
      .populate('location.areaId', 'name type');

    const report = generateDetailedReport(observations, includeRecommendations);

    return successResponse(res, {
      report,
      period: { startDate, endDate },
      message: 'Community observation report generated successfully'
    });

  } catch (error) {
    console.error('Error generating community report:', error);
    return errorResponse(res, 'Failed to generate community report', 500);
  }
};

// Helper functions

/**
 * Analyze observation patterns for potential issues
 */
const analyzeObservationPatterns = async (observation) => {
  try {
    // Check for similar observations in the area
    const similarObservations = await CommunityObservation.find({
      'location.areaId': observation.location.areaId,
      observationType: observation.observationType,
      observationDate: {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last week
      },
      _id: { $ne: observation._id }
    });

    if (similarObservations.length >= 2) {
      // Pattern detected - update observation
      await CommunityObservation.findByIdAndUpdate(observation._id, {
        'trendData.isRecurring': true,
        'trendData.frequency': 'weekly',
        'trendData.previousOccurrences': similarObservations.map(o => ({
          date: o.observationDate,
          severity: o.severity,
          description: o.description.substring(0, 100)
        }))
      });
    }
  } catch (error) {
    console.error('Error analyzing observation patterns:', error);
  }
};

/**
 * Auto-escalate observation based on criteria
 */
const autoEscalateObservation = async (observation) => {
  try {
    const escalationCriteria = {
      reason: 'auto_escalation',
      escalateToLevel: 'village',
      urgencyLevel: 'within_24h',
      escalatedBy: observation.observerId,
      escalationDate: new Date()
    };

    await CommunityObservation.findByIdAndUpdate(observation._id, {
      status: 'escalated',
      escalationCriteria,
      $push: {
        escalationHistory: {
          ...escalationCriteria,
          timestamp: new Date(),
          automatic: true
        }
      }
    });

    // Send notification
    await sendNotification({
      type: 'auto_escalation',
      priority: 'high',
      message: `Observation auto-escalated: ${observation.observationType}`,
      observation: observation._id
    });
  } catch (error) {
    console.error('Error auto-escalating observation:', error);
  }
};

/**
 * Check observation access permissions
 */
const checkObservationAccess = async (observation, user) => {
  if (user.role === 'health_official' || user.role === 'admin') {
    return true;
  }

  if (user.role === 'asha_worker') {
    return user.assignedVillages?.includes(observation.location.villageId?.toString());
  }

  if (user.role === 'volunteer') {
    return observation.observerId.toString() === user.id ||
           (user.assignedAreas?.includes(observation.location.areaId?.toString()) && 
            observation.sensitivityLevel === 'public');
  }

  return false;
};

/**
 * Check if user can update observation
 */
const canUpdateObservation = (observation, user) => {
  if (user.role === 'admin' || user.role === 'health_official') {
    return true;
  }

  if (observation.observerId.toString() === user.id) {
    return true;
  }

  if (user.role === 'asha_worker' && 
      user.assignedVillages?.includes(observation.location.villageId?.toString())) {
    return true;
  }

  return false;
};

/**
 * Send escalation notification
 */
const sendEscalationNotification = async (observation, escalationData) => {
  try {
    await sendNotification({
      type: 'observation_escalated',
      priority: escalationData.urgencyLevel === 'immediate' ? 'urgent' : 'high',
      message: `Community observation escalated: ${observation.observationType}`,
      observation: observation._id,
      escalatedTo: escalationData.escalatedTo,
      reason: escalationData.reason
    });
  } catch (error) {
    console.error('Error sending escalation notification:', error);
  }
};

/**
 * Generate detailed community report
 */
const generateDetailedReport = (observations, includeRecommendations) => {
  const report = {
    executive_summary: {
      totalObservations: observations.length,
      criticalIssues: observations.filter(o => o.severity === 'critical').length,
      escalatedIssues: observations.filter(o => o.status === 'escalated').length,
      totalAffectedPopulation: observations.reduce((sum, o) => 
        sum + (o.affectedPopulation?.individuals || 0), 0)
    },
    breakdown: {
      byType: {},
      bySeverity: {},
      byStatus: {},
      byArea: {}
    },
    trends: {
      recurringIssues: observations.filter(o => o.trendData?.isRecurring).length,
      seasonalPatterns: observations.filter(o => o.trendData?.seasonalPattern).length
    },
    recommendations: []
  };

  // Calculate breakdowns
  observations.forEach(obs => {
    const type = obs.observationType;
    const severity = obs.severity;
    const status = obs.status;
    const area = obs.location?.areaId?.toString();

    report.breakdown.byType[type] = (report.breakdown.byType[type] || 0) + 1;
    report.breakdown.bySeverity[severity] = (report.breakdown.bySeverity[severity] || 0) + 1;
    report.breakdown.byStatus[status] = (report.breakdown.byStatus[status] || 0) + 1;
    if (area) {
      report.breakdown.byArea[area] = (report.breakdown.byArea[area] || 0) + 1;
    }
  });

  // Generate recommendations if requested
  if (includeRecommendations) {
    if (report.executive_summary.criticalIssues > 0) {
      report.recommendations.push({
        priority: 'urgent',
        action: 'Address all critical observations within 24 hours',
        rationale: `${report.executive_summary.criticalIssues} critical issues require immediate attention`
      });
    }

    if (report.trends.recurringIssues > 2) {
      report.recommendations.push({
        priority: 'high',
        action: 'Investigate root causes of recurring issues',
        rationale: 'Multiple recurring patterns indicate systemic problems'
      });
    }

    // Area-specific recommendations
    const problemAreas = Object.entries(report.breakdown.byArea)
      .filter(([area, count]) => count > 5)
      .map(([area]) => area);

    if (problemAreas.length > 0) {
      report.recommendations.push({
        priority: 'medium',
        action: 'Focus interventions on high-observation areas',
        rationale: `Areas ${problemAreas.join(', ')} show high observation frequency`
      });
    }
  }

  return report;
};

export default {
  createObservation,
  getObservations,
  getObservationById,
  updateObservation,
  escalateObservation,
  addFollowUp,
  getObservationsByArea,
  getObservationPatterns,
  generateCommunityReport
};