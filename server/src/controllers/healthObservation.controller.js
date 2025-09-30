import HealthObservation from '../models/healthObservation.model.js';
import { successResponse, errorResponse } from '../utils/responseHelper.js';
import { sendNotification } from '../utils/notificationService.js';
import { getPatientsInVillage } from '../models/index.js';
import mongoose from 'mongoose';

/**
 * Health Observation Controller
 * Handles community health monitoring and observation tracking
 */

/**
 * Create a new health observation
 */
export const createObservation = async (req, res) => {
  try {
    const observationData = {
      ...req.body,
      observerId: req.user.id,
      createdAt: new Date()
    };

    // Create the observation
    const observation = new HealthObservation(observationData);
    await observation.save();

    // Assess severity and trigger alerts if needed
    if (observation.severity === 'critical' || observation.requiresImmediateAction) {
      await triggerCriticalAlert(observation);
    }

    // Check for potential outbreak patterns
    if (observation.potentialOutbreak) {
      await assessOutbreakRisk(observation);
    }

    await observation.populate([
      { path: 'observerId', select: 'name role' },
      { path: 'location.villageId', select: 'name district block' }
    ]);

    return successResponse(res, {
      observation,
      message: 'Health observation created successfully'
    }, 201);

  } catch (error) {
    console.error('Error creating health observation:', error);
    return errorResponse(res, 'Failed to create health observation', 500);
  }
};

/**
 * Get all health observations with filtering
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
      villageId,
      observationDateFrom,
      observationDateTo,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};

    // Role-based access control
    if (req.user.role === 'asha_worker') {
      // ASHA workers can see observations from their assigned villages
      filter['location.villageId'] = { $in: req.user.assignedVillages || [] };
    } else if (req.user.role === 'volunteer') {
      // Volunteers can see their own observations and public ones in their area
      filter.$or = [
        { observerId: req.user.id },
        { 
          'location.villageId': { $in: req.user.assignedAreas || [] },
          confidentialityLevel: { $in: ['public'] }
        }
      ];
    }

    // Apply filters
    if (observationType) filter.observationType = observationType;
    if (severity) filter.severity = severity;
    if (status) filter.status = status;
    if (observerId) filter.observerId = observerId;
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
        { 'symptoms.primary.symptom': { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const [observations, total] = await Promise.all([
      HealthObservation.find(filter)
        .populate([
          { path: 'observerId', select: 'name role' },
          { path: 'location.villageId', select: 'name district block' }
        ])
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      HealthObservation.countDocuments(filter)
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
      message: 'Health observations fetched successfully'
    });

  } catch (error) {
    console.error('Error fetching health observations:', error);
    return errorResponse(res, 'Failed to fetch health observations', 500);
  }
};

/**
 * Get single health observation by ID
 */
export const getObservationById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid observation ID', 400);
    }

    const observation = await HealthObservation.findById(id)
      .populate([
        { path: 'observerId', select: 'name role contactInfo' },
        { path: 'location.villageId', select: 'name district block' },
        { path: 'followUp.assignedTo', select: 'name role' }
      ]);

    if (!observation) {
      return errorResponse(res, 'Health observation not found', 404);
    }

    // Check access permissions
    const hasAccess = await checkObservationAccess(observation, req.user);
    if (!hasAccess) {
      return errorResponse(res, 'Access denied to this observation', 403);
    }

    return successResponse(res, {
      observation,
      message: 'Health observation fetched successfully'
    });

  } catch (error) {
    console.error('Error fetching health observation:', error);
    return errorResponse(res, 'Failed to fetch health observation', 500);
  }
};

/**
 * Update health observation
 */
export const updateObservation = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid observation ID', 400);
    }

    const observation = await HealthObservation.findById(id);
    if (!observation) {
      return errorResponse(res, 'Health observation not found', 404);
    }

    // Check permissions (only creator, assigned health workers, or health officials can update)
    if (!canUpdateObservation(observation, req.user)) {
      return errorResponse(res, 'Not authorized to update this observation', 403);
    }

    // Track changes for audit
    const changes = {
      updatedBy: req.user.id,
      updatedAt: new Date(),
      previousSeverity: observation.severity,
      previousStatus: observation.status
    };

    const updatedObservation = await HealthObservation.findByIdAndUpdate(
      id,
      { ...updateData, ...changes },
      { new: true, runValidators: true }
    ).populate([
      { path: 'observerId', select: 'name role' },
      { path: 'location.villageId', select: 'name district block' }
    ]);

    // Check if severity increased - trigger alerts
    if (updateData.severity && updateData.severity === 'critical' && changes.previousSeverity !== 'critical') {
      await triggerCriticalAlert(updatedObservation);
    }

    return successResponse(res, {
      observation: updatedObservation,
      message: 'Health observation updated successfully'
    });

  } catch (error) {
    console.error('Error updating health observation:', error);
    return errorResponse(res, 'Failed to update health observation', 500);
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
      createdBy: req.user.id,
      createdAt: new Date()
    };

    const observation = await HealthObservation.findByIdAndUpdate(
      id,
      {
        $push: { 'followUp.actions': followUpData },
        'followUp.lastFollowUp': new Date(),
        'followUp.nextScheduled': followUpData.followUpDate
      },
      { new: true }
    ).populate([
      { path: 'observerId', select: 'name role' },
      { path: 'followUp.assignedTo', select: 'name role' }
    ]);

    if (!observation) {
      return errorResponse(res, 'Health observation not found', 404);
    }

    // Send notification to assigned person
    if (followUpData.assignedTo && followUpData.assignedTo.length > 0) {
      await sendFollowUpNotification(observation, followUpData);
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
 * Resolve observation
 */
export const resolveObservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolutionNotes, outcome } = req.body;

    const observation = await HealthObservation.findByIdAndUpdate(
      id,
      {
        status: 'resolved',
        resolutionDate: new Date(),
        resolutionNotes,
        outcome,
        resolvedBy: req.user.id
      },
      { new: true }
    ).populate([
      { path: 'observerId', select: 'name role' },
      { path: 'resolvedBy', select: 'name role' }
    ]);

    if (!observation) {
      return errorResponse(res, 'Health observation not found', 404);
    }

    return successResponse(res, {
      observation,
      message: 'Health observation resolved successfully'
    });

  } catch (error) {
    console.error('Error resolving observation:', error);
    return errorResponse(res, 'Failed to resolve observation', 500);
  }
};

/**
 * Get observations by village
 */
export const getObservationsByVillage = async (req, res) => {
  try {
    const { villageId } = req.params;
    const { startDate, endDate, observationType } = req.query;

    const filter = { 'location.villageId': villageId };

    if (startDate || endDate) {
      filter.observationDate = {};
      if (startDate) filter.observationDate.$gte = new Date(startDate);
      if (endDate) filter.observationDate.$lte = new Date(endDate);
    }

    if (observationType) {
      filter.observationType = observationType;
    }

    const observations = await HealthObservation.find(filter)
      .populate('observerId', 'name role')
      .sort({ observationDate: -1 });

    // Generate summary statistics
    const summary = {
      total: observations.length,
      byType: {},
      bySeverity: {},
      byStatus: {}
    };

    observations.forEach(obs => {
      summary.byType[obs.observationType] = (summary.byType[obs.observationType] || 0) + 1;
      summary.bySeverity[obs.severity] = (summary.bySeverity[obs.severity] || 0) + 1;
      summary.byStatus[obs.status] = (summary.byStatus[obs.status] || 0) + 1;
    });

    return successResponse(res, {
      observations,
      summary,
      message: 'Village observations fetched successfully'
    });

  } catch (error) {
    console.error('Error fetching village observations:', error);
    return errorResponse(res, 'Failed to fetch village observations', 500);
  }
};

/**
 * Get observation trends
 */
export const getObservationTrends = async (req, res) => {
  try {
    const { 
      villageId, 
      dateFrom, 
      dateTo, 
      groupBy = 'week',
      observationType 
    } = req.query;

    const matchStage = {
      observationDate: {
        $gte: new Date(dateFrom),
        $lte: new Date(dateTo)
      }
    };

    if (villageId) matchStage['location.villageId'] = new mongoose.Types.ObjectId(villageId);
    if (observationType) matchStage.observationType = observationType;

    const groupByFormat = {
      day: { $dateToString: { format: '%Y-%m-%d', date: '$observationDate' } },
      week: { $dateToString: { format: '%Y-W%V', date: '$observationDate' } },
      month: { $dateToString: { format: '%Y-%m', date: '$observationDate' } }
    };

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: {
            period: groupByFormat[groupBy],
            observationType: '$observationType',
            severity: '$severity'
          },
          count: { $sum: 1 },
          avgAffectedPopulation: { $avg: '$affectedDemographics.populationCount' }
        }
      },
      {
        $group: {
          _id: '$_id.period',
          observations: {
            $push: {
              type: '$_id.observationType',
              severity: '$_id.severity',
              count: '$count',
              avgAffectedPopulation: '$avgAffectedPopulation'
            }
          },
          totalCount: { $sum: '$count' }
        }
      },
      { $sort: { _id: 1 } }
    ];

    const trends = await HealthObservation.aggregate(pipeline);

    return successResponse(res, {
      trends,
      message: 'Observation trends fetched successfully'
    });

  } catch (error) {
    console.error('Error fetching observation trends:', error);
    return errorResponse(res, 'Failed to fetch observation trends', 500);
  }
};

/**
 * Get critical observations
 */
export const getCriticalObservations = async (req, res) => {
  try {
    const { villageId } = req.query;

    const filter = {
      $or: [
        { severity: 'critical' },
        { requiresImmediateAction: true },
        { potentialOutbreak: true }
      ],
      status: { $in: ['active', 'investigating'] }
    };

    if (villageId) {
      filter['location.villageId'] = villageId;
    }

    const criticalObservations = await HealthObservation.find(filter)
      .populate([
        { path: 'observerId', select: 'name role contactInfo' },
        { path: 'location.villageId', select: 'name district block' }
      ])
      .sort({ observationDate: -1 });

    return successResponse(res, {
      observations: criticalObservations,
      count: criticalObservations.length,
      message: 'Critical observations fetched successfully'
    });

  } catch (error) {
    console.error('Error fetching critical observations:', error);
    return errorResponse(res, 'Failed to fetch critical observations', 500);
  }
};

/**
 * Generate observation report
 */
export const generateObservationReport = async (req, res) => {
  try {
    const { villageId, startDate, endDate, reportType = 'summary' } = req.query;

    const filter = {
      observationDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    if (villageId) {
      filter['location.villageId'] = villageId;
    }

    const observations = await HealthObservation.find(filter)
      .populate('observerId', 'name role')
      .populate('location.villageId', 'name');

    const report = generateHealthReport(observations, reportType);

    return successResponse(res, {
      report,
      period: { startDate, endDate },
      message: 'Health observation report generated successfully'
    });

  } catch (error) {
    console.error('Error generating observation report:', error);
    return errorResponse(res, 'Failed to generate observation report', 500);
  }
};

// Helper functions

/**
 * Trigger critical alert for high-priority observations
 */
const triggerCriticalAlert = async (observation) => {
  try {
    const alertData = {
      type: 'critical_health_observation',
      priority: 'urgent',
      message: `Critical health observation: ${observation.observationType}`,
      observation: observation._id,
      location: observation.location.villageId
    };

    await sendNotification(alertData);
  } catch (error) {
    console.error('Error triggering critical alert:', error);
  }
};

/**
 * Assess outbreak risk based on observation patterns
 */
const assessOutbreakRisk = async (observation) => {
  try {
    // Look for similar observations in the area within the last 2 weeks
    const recentObservations = await HealthObservation.find({
      'location.villageId': observation.location.villageId,
      observationType: observation.observationType,
      observationDate: {
        $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) // 2 weeks ago
      },
      _id: { $ne: observation._id }
    });

    if (recentObservations.length >= 2) {
      // Potential outbreak - escalate
      await sendNotification({
        type: 'potential_outbreak',
        priority: 'urgent',
        message: `Potential ${observation.observationType} outbreak detected`,
        location: observation.location.villageId,
        relatedObservations: recentObservations.map(o => o._id)
      });
    }
  } catch (error) {
    console.error('Error assessing outbreak risk:', error);
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
           (user.assignedAreas?.includes(observation.location.villageId?.toString()) && 
            observation.confidentialityLevel === 'public');
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
 * Send follow-up notification
 */
const sendFollowUpNotification = async (observation, followUpData) => {
  try {
    await sendNotification({
      type: 'follow_up_assigned',
      recipients: followUpData.assignedTo,
      message: `Follow-up assigned for health observation: ${observation.observationType}`,
      observation: observation._id,
      dueDate: followUpData.followUpDate
    });
  } catch (error) {
    console.error('Error sending follow-up notification:', error);
  }
};

/**
 * Generate health report based on observations
 */
const generateHealthReport = (observations, reportType) => {
  const report = {
    summary: {
      totalObservations: observations.length,
      byType: {},
      bySeverity: {},
      byStatus: {},
      totalAffectedPopulation: 0
    },
    trends: [],
    recommendations: []
  };

  observations.forEach(obs => {
    // Count by type
    report.summary.byType[obs.observationType] = (report.summary.byType[obs.observationType] || 0) + 1;
    
    // Count by severity
    report.summary.bySeverity[obs.severity] = (report.summary.bySeverity[obs.severity] || 0) + 1;
    
    // Count by status
    report.summary.byStatus[obs.status] = (report.summary.byStatus[obs.status] || 0) + 1;
    
    // Sum affected population
    if (obs.affectedDemographics?.populationCount) {
      report.summary.totalAffectedPopulation += obs.affectedDemographics.populationCount;
    }
  });

  // Generate recommendations based on patterns
  if (report.summary.bySeverity.critical > 0) {
    report.recommendations.push('Immediate intervention required for critical observations');
  }

  if (report.summary.byType.disease_outbreak > 1) {
    report.recommendations.push('Monitor for potential disease outbreak patterns');
  }

  return report;
};

export default {
  createObservation,
  getObservations,
  getObservationById,
  updateObservation,
  addFollowUp,
  resolveObservation,
  getObservationsByVillage,
  getObservationTrends,
  getCriticalObservations,
  generateObservationReport
};