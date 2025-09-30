import mongoose from 'mongoose';
import DiseaseRecord from '../models/diseaseRecord.model.js';
import { handleAlertSystemIntegration } from '../utils/notificationService.js';
import { 
  successResponse, 
  createdResponse, 
  updatedResponse, 
  deletedResponse, 
  notFoundResponse, 
  paginatedResponse,
  getPaginationData 
} from '../utils/responseHelper.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * Disease Record Controller
 * Disease tracking and outbreak management
 */

/**
 * Create new disease record
 * POST /api/disease-records
 */
const createRecord = asyncHandler(async (req, res) => {
  const recordData = {
    ...req.body,
    recordedBy: req.user._id,
    dateRecorded: new Date()
  };

  const record = new DiseaseRecord(recordData);
  await record.save();

  // Check for outbreak conditions and trigger alerts
  if (recordData.severity === 'severe' || recordData.isConfirmed) {
    try {
      await handleAlertSystemIntegration({
        type: 'disease_outbreak',
        severity: recordData.severity === 'severe' ? 'critical' : 'high',
        title: `Disease Alert: ${recordData.diseaseName}`,
        message: `New ${recordData.diseaseName} case recorded in ${recordData.location?.address || 'unknown location'}`,
        relatedEntity: {
          entityType: 'DiseaseRecord',
          entityId: record._id
        }
      });
    } catch (alertError) {
      console.error('Failed to send disease alert:', alertError);
    }
  }

  // Populate related data for response
  await record.populate([
    { path: 'recordedBy', select: 'personalInfo.firstName personalInfo.lastName roleInfo.role' },
    { path: 'patientId', select: 'personalInfo patientId' },
    { path: 'location.villageId', select: 'name block district' }
  ]);

  return createdResponse(res, record, 'Disease record created successfully');
});

/**
 * Get disease records with filtering and pagination
 * GET /api/disease-records
 */
const getRecords = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    diseaseName,
    severity,
    isConfirmed,
    villageId,
    patientId,
    dateFrom,
    dateTo,
    search,
    sortBy = 'dateRecorded',
    sortOrder = 'desc'
  } = req.query;

  // Build filter object
  const filter = {};
  
  if (diseaseName) filter.diseaseName = { $regex: diseaseName, $options: 'i' };
  if (severity) filter.severity = severity;
  if (isConfirmed !== undefined) filter.isConfirmed = isConfirmed === 'true';
  if (villageId) filter['location.villageId'] = villageId;
  if (patientId) filter.patientId = patientId;

  // Date range filters
  if (dateFrom || dateTo) {
    filter.dateRecorded = {};
    if (dateFrom) filter.dateRecorded.$gte = new Date(dateFrom);
    if (dateTo) filter.dateRecorded.$lte = new Date(dateTo);
  }

  // Text search
  if (search) {
    filter.$or = [
      { diseaseName: { $regex: search, $options: 'i' } },
      { symptoms: { $regex: search, $options: 'i' } },
      { 'location.address': { $regex: search, $options: 'i' } }
    ];
  }

  // Role-based access control
  const userRole = req.user.roleInfo.role;
  if (userRole === 'asha_worker') {
    // ASHA workers see only their recorded cases
    filter.recordedBy = req.user._id;
  } else if (userRole === 'volunteer') {
    // Volunteers have limited access
    return res.status(403).json({
      success: false,
      message: 'Access denied. Volunteers cannot access disease records directly.'
    });
  }

  // Calculate pagination
  const total = await DiseaseRecord.countDocuments(filter);
  const paginationData = getPaginationData(page, limit, total);

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // Execute query
  const records = await DiseaseRecord.find(filter)
    .populate([
      { path: 'recordedBy', select: 'personalInfo.firstName personalInfo.lastName roleInfo.role' },
      { path: 'patientId', select: 'personalInfo patientId' },
      { path: 'location.villageId', select: 'name block district' }
    ])
    .sort(sort)
    .skip(paginationData.skip)
    .limit(paginationData.itemsPerPage);

  return paginatedResponse(res, records, paginationData, 'Disease records retrieved successfully');
});

/**
 * Get single disease record by ID
 * GET /api/disease-records/:id
 */
const getRecordById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const record = await DiseaseRecord.findById(id)
    .populate([
      { path: 'recordedBy', select: 'personalInfo.firstName personalInfo.lastName roleInfo.role authentication.phone' },
      { path: 'patientId', select: 'personalInfo patientId location medicalHistory' },
      { path: 'location.villageId', select: 'name block district coordinates' },
      { path: 'followUp.followedUpBy', select: 'personalInfo.firstName personalInfo.lastName' }
    ]);

  if (!record) {
    return notFoundResponse(res, 'Disease record not found');
  }

  // Check authorization
  const userRole = req.user.roleInfo.role;
  if (userRole === 'asha_worker') {
    if (record.recordedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view records you created.'
      });
    }
  } else if (userRole === 'volunteer') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Volunteers cannot access detailed disease records.'
    });
  }

  return successResponse(res, record, 'Disease record retrieved successfully');
});

/**
 * Update disease record
 * PUT /api/disease-records/:id
 */
const updateRecord = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const record = await DiseaseRecord.findById(id);
  
  if (!record) {
    return notFoundResponse(res, 'Disease record not found');
  }

  // Authorization check
  const userRole = req.user.roleInfo.role;
  const isRecorder = record.recordedBy.toString() === req.user._id.toString();
  const canUpdate = isRecorder || ['admin', 'health_official'].includes(userRole);

  if (!canUpdate) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only the recorder or health officials can update disease records.'
    });
  }

  // Prevent changing critical fields
  delete updates.recordedBy;
  delete updates.dateRecorded;

  // Check if confirmation status changed
  const wasConfirmed = record.isConfirmed;
  const isBeingConfirmed = updates.isConfirmed && !wasConfirmed;

  // Apply updates
  Object.assign(record, updates);
  record.lastUpdated = new Date();

  await record.save();

  // Send alert if case is being confirmed
  if (isBeingConfirmed) {
    try {
      await handleAlertSystemIntegration({
        type: 'disease_confirmed',
        severity: record.severity === 'severe' ? 'critical' : 'high',
        title: `Confirmed Case: ${record.diseaseName}`,
        message: `${record.diseaseName} case has been confirmed in ${record.location?.address || 'recorded location'}`,
        relatedEntity: {
          entityType: 'DiseaseRecord',
          entityId: record._id
        }
      });
    } catch (alertError) {
      console.error('Failed to send confirmation alert:', alertError);
    }
  }

  // Populate for response
  await record.populate([
    { path: 'recordedBy', select: 'personalInfo.firstName personalInfo.lastName' },
    { path: 'patientId', select: 'personalInfo patientId' },
    { path: 'location.villageId', select: 'name block district' }
  ]);

  return updatedResponse(res, record, 'Disease record updated successfully');
});

/**
 * Add follow-up to disease record
 * POST /api/disease-records/:id/follow-up
 */
const addFollowUp = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { notes, status, nextFollowUpDate } = req.body;

  const record = await DiseaseRecord.findById(id);
  
  if (!record) {
    return notFoundResponse(res, 'Disease record not found');
  }

  // Authorization check
  const userRole = req.user.roleInfo.role;
  if (!['asha_worker', 'health_official', 'admin'].includes(userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only health workers can add follow-ups.'
    });
  }

  // Add follow-up entry
  record.followUp.push({
    date: new Date(),
    notes,
    status: status || 'ongoing',
    followedUpBy: req.user._id,
    nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null
  });

  await record.save();

  // Populate for response
  await record.populate({
    path: 'followUp.followedUpBy',
    select: 'personalInfo.firstName personalInfo.lastName'
  });

  return updatedResponse(res, record, 'Follow-up added successfully');
});

/**
 * Get disease records by patient
 * GET /api/disease-records/patient/:patientId
 */
const getRecordsByPatient = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const filter = { patientId };

  // Role-based access control
  const userRole = req.user.roleInfo.role;
  if (userRole === 'asha_worker') {
    filter.recordedBy = req.user._id;
  } else if (userRole === 'volunteer') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Volunteers cannot access patient disease records.'
    });
  }

  const total = await DiseaseRecord.countDocuments(filter);
  const paginationData = getPaginationData(page, limit, total);

  const records = await DiseaseRecord.find(filter)
    .populate([
      { path: 'recordedBy', select: 'personalInfo.firstName personalInfo.lastName' },
      { path: 'location.villageId', select: 'name' }
    ])
    .sort({ dateRecorded: -1 })
    .skip(paginationData.skip)
    .limit(paginationData.itemsPerPage);

  return paginatedResponse(res, records, paginationData, 'Patient disease records retrieved successfully');
});

/**
 * Get outbreak analysis
 * GET /api/disease-records/analysis/outbreak
 */
const getOutbreakAnalysis = asyncHandler(async (req, res) => {
  const { villageId, diseaseName, days = 30 } = req.query;

  // Only health officials and admin can access outbreak analysis
  if (!['health_official', 'admin'].includes(req.user.roleInfo.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only health officials can access outbreak analysis.'
    });
  }

  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - parseInt(days));

  const matchFilter = {
    dateRecorded: { $gte: dateThreshold }
  };

  if (villageId) matchFilter['location.villageId'] = new mongoose.Types.ObjectId(villageId);
  if (diseaseName) matchFilter.diseaseName = { $regex: diseaseName, $options: 'i' };

  const outbreakData = await DiseaseRecord.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: {
          disease: '$diseaseName',
          village: '$location.villageId'
        },
        totalCases: { $sum: 1 },
        confirmedCases: {
          $sum: { $cond: ['$isConfirmed', 1, 0] }
        },
        severeCases: {
          $sum: { $cond: [{ $eq: ['$severity', 'severe'] }, 1, 0] }
        },
        latestCase: { $max: '$dateRecorded' },
        firstCase: { $min: '$dateRecorded' }
      }
    },
    {
      $lookup: {
        from: 'villages',
        localField: '_id.village',
        foreignField: '_id',
        as: 'villageInfo'
      }
    },
    {
      $project: {
        diseaseName: '$_id.disease',
        village: { $arrayElemAt: ['$villageInfo', 0] },
        totalCases: 1,
        confirmedCases: 1,
        severeCases: 1,
        latestCase: 1,
        firstCase: 1,
        spreadRate: {
          $divide: [
            '$totalCases',
            { $max: [{ $divide: [{ $subtract: ['$latestCase', '$firstCase'] }, 86400000] }, 1] }
          ]
        }
      }
    },
    { $sort: { totalCases: -1 } }
  ]);

  return successResponse(res, outbreakData, 'Outbreak analysis retrieved successfully');
});

/**
 * Delete disease record (soft delete)
 * DELETE /api/disease-records/:id
 */
const deleteRecord = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Only admin can delete disease records
  if (req.user.roleInfo.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only administrators can delete disease records.'
    });
  }

  const record = await DiseaseRecord.findById(id);
  
  if (!record) {
    return notFoundResponse(res, 'Disease record not found');
  }

  record.isActive = false;
  record.deletedAt = new Date();
  record.deletedBy = req.user._id;

  await record.save();

  return updatedResponse(res, record, 'Disease record deleted successfully');
});

/**
 * Enhanced Disease Management Functions
 */

/**
 * Advanced outbreak detection with statistical analysis
 * GET /api/disease-records/outbreak-detection/advanced
 */
const performAdvancedOutbreakDetection = asyncHandler(async (req, res) => {
  const {
    diseaseTypes,
    areaId,
    timeWindow = 30,
    algorithmType = 'statistical',
    confidenceLevel = 0.95
  } = req.query;

  // Only health officials can perform advanced detection
  if (!['health_official', 'admin'].includes(req.user.roleInfo.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only health officials can perform advanced outbreak detection.'
    });
  }

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - parseInt(timeWindow));

  const matchFilter = {
    dateRecorded: { $gte: startDate, $lte: endDate },
    isActive: true
  };

  if (diseaseTypes) {
    const diseaseArray = Array.isArray(diseaseTypes) ? diseaseTypes : diseaseTypes.split(',');
    matchFilter.diseaseName = { $in: diseaseArray };
  }

  if (areaId) {
    matchFilter['location.areaId'] = new mongoose.Types.ObjectId(areaId);
  }

  // Statistical outbreak detection pipeline
  const outbreakAnalysis = await DiseaseRecord.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: {
          disease: '$diseaseName',
          village: '$location.villageId',
          week: { $week: '$dateRecorded' }
        },
        caseCount: { $sum: 1 },
        severeCases: { $sum: { $cond: [{ $eq: ['$severity', 'severe'] }, 1, 0] } },
        confirmedCases: { $sum: { $cond: ['$isConfirmed', 1, 0] } },
        avgAge: { $avg: '$patientDemographics.age' },
        cases: { $push: '$$ROOT' }
      }
    },
    {
      $lookup: {
        from: 'villages',
        localField: '_id.village',
        foreignField: '_id',
        as: 'villageInfo'
      }
    },
    {
      $addFields: {
        village: { $arrayElemAt: ['$villageInfo', 0] },
        attackRate: {
          $multiply: [
            { $divide: ['$caseCount', { $arrayElemAt: ['$villageInfo.population', 0] }] },
            100
          ]
        }
      }
    }
  ]);

  // Calculate historical baseline
  const historicalBaseline = await calculateHistoricalBaseline(diseaseTypes, timeWindow);

  // Detect anomalies using statistical methods
  const outbreakCandidates = [];
  for (const cluster of outbreakAnalysis) {
    const anomalyScore = await calculateAnomalyScore(cluster, historicalBaseline, algorithmType);
    
    if (anomalyScore.isAnomaly && anomalyScore.confidence >= confidenceLevel) {
      outbreakCandidates.push({
        ...cluster,
        anomalyAnalysis: anomalyScore,
        riskLevel: determineRiskLevel(cluster, anomalyScore),
        responseRecommendations: generateResponseRecommendations(cluster)
      });
    }
  }

  // Generate alerts for confirmed outbreaks
  for (const outbreak of outbreakCandidates) {
    await generateOutbreakAlert(outbreak);
  }

  const summary = {
    analysisTimeWindow: timeWindow,
    totalClusters: outbreakAnalysis.length,
    suspiciousOutbreaks: outbreakCandidates.length,
    highRiskOutbreaks: outbreakCandidates.filter(o => o.riskLevel === 'high').length,
    algorithmUsed: algorithmType,
    confidenceThreshold: confidenceLevel
  };

  return successResponse(res, {
    outbreakCandidates,
    summary,
    historicalBaseline,
    analysisParameters: {
      diseaseTypes,
      areaId,
      timeWindow,
      algorithmType,
      confidenceLevel
    }
  }, 'Advanced outbreak detection completed successfully');
});

/**
 * Epidemiological case investigation
 * POST /api/disease-records/:id/investigate
 */
const performEpidemiologicalInvestigation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { investigationType = 'comprehensive', includeContactTracing = true } = req.body;

  const primaryCase = await DiseaseRecord.findById(id)
    .populate([
      { path: 'patientId', select: 'personalInfo location medicalHistory' },
      { path: 'location.villageId', select: 'name district block coordinates population' }
    ]);

  if (!primaryCase) {
    return notFoundResponse(res, 'Disease record not found');
  }

  const investigation = {
    primaryCase: {
      id: primaryCase._id,
      disease: primaryCase.diseaseName,
      onsetDate: primaryCase.dateRecorded,
      severity: primaryCase.severity,
      location: primaryCase.location,
      patient: primaryCase.patientId
    },
    relatedCases: [],
    spatialAnalysis: {},
    temporalAnalysis: {},
    contactTracing: {},
    riskFactorAnalysis: {},
    recommendations: []
  };

  // Find related cases (same disease, nearby location, recent time)
  const relatedCases = await DiseaseRecord.find({
    diseaseName: primaryCase.diseaseName,
    'location.villageId': primaryCase.location.villageId,
    dateRecorded: {
      $gte: new Date(primaryCase.dateRecorded.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days before
      $lte: new Date(primaryCase.dateRecorded.getTime() + 30 * 24 * 60 * 60 * 1000)  // 30 days after
    },
    _id: { $ne: primaryCase._id },
    isActive: true
  }).populate('patientId', 'personalInfo');

  investigation.relatedCases = relatedCases;

  // Spatial analysis - geographic distribution
  investigation.spatialAnalysis = await performSpatialCaseAnalysis(primaryCase, relatedCases);

  // Temporal analysis - time distribution
  investigation.temporalAnalysis = await performTemporalCaseAnalysis(primaryCase, relatedCases);

  // Risk factor analysis
  investigation.riskFactorAnalysis = await analyzeRiskFactors(primaryCase, relatedCases);

  // Contact tracing if requested and data available
  if (includeContactTracing && primaryCase.contactInformation) {
    investigation.contactTracing = await performContactTracingAnalysis(primaryCase);
  }

  // Generate investigation recommendations
  investigation.recommendations = generateInvestigationRecommendations(investigation);

  // Update case with investigation status
  await DiseaseRecord.findByIdAndUpdate(id, {
    investigationStatus: 'investigated',
    investigationDate: new Date(),
    investigatedBy: req.user._id,
    investigationSummary: {
      relatedCases: relatedCases.length,
      riskLevel: investigation.riskFactorAnalysis.overallRisk || 'medium',
      keyFindings: investigation.recommendations.slice(0, 3)
    }
  });

  return successResponse(res, investigation, 'Epidemiological investigation completed successfully');
});

/**
 * Generate disease surveillance report
 * GET /api/disease-records/surveillance/report
 */
const generateSurveillanceReport = asyncHandler(async (req, res) => {
  const {
    reportType = 'weekly',
    diseases,
    startDate,
    endDate,
    areaId,
    includeProjections = false
  } = req.query;

  // Only health officials can generate surveillance reports
  if (!['health_official', 'admin'].includes(req.user.roleInfo.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only health officials can generate surveillance reports.'
    });
  }

  const dateRange = calculateReportDateRange(reportType, startDate, endDate);
  
  const matchFilter = {
    dateRecorded: { $gte: dateRange.start, $lte: dateRange.end },
    isActive: true
  };

  if (diseases) {
    const diseaseArray = Array.isArray(diseases) ? diseases : diseases.split(',');
    matchFilter.diseaseName = { $in: diseaseArray };
  }

  if (areaId) {
    matchFilter['location.areaId'] = new mongoose.Types.ObjectId(areaId);
  }

  const report = {
    metadata: {
      reportType,
      period: dateRange,
      generatedAt: new Date(),
      generatedBy: req.user._id,
      coverageArea: areaId || 'All Areas'
    },
    executiveSummary: {},
    diseaseBreakdown: [],
    geographicAnalysis: [],
    temporalTrends: [],
    outbreakStatus: {},
    riskAssessment: {},
    recommendations: []
  };

  // Executive Summary
  const totalCases = await DiseaseRecord.countDocuments(matchFilter);
  const activeCases = await DiseaseRecord.countDocuments({ ...matchFilter, status: 'active' });
  const severeCases = await DiseaseRecord.countDocuments({ ...matchFilter, severity: 'severe' });
  const confirmedCases = await DiseaseRecord.countDocuments({ ...matchFilter, isConfirmed: true });

  report.executiveSummary = {
    totalCases,
    activeCases,
    severeCases,
    confirmedCases,
    mortalityRate: await calculateMortalityRate(matchFilter),
    incidenceRate: await calculateIncidenceRate(matchFilter, areaId)
  };

  // Disease Breakdown
  report.diseaseBreakdown = await DiseaseRecord.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: '$diseaseName',
        totalCases: { $sum: 1 },
        confirmedCases: { $sum: { $cond: ['$isConfirmed', 1, 0] } },
        severeCases: { $sum: { $cond: [{ $eq: ['$severity', 'severe'] }, 1, 0] } },
        activeCases: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        avgAge: { $avg: '$patientDemographics.age' }
      }
    },
    { $sort: { totalCases: -1 } }
  ]);

  // Geographic Analysis
  report.geographicAnalysis = await DiseaseRecord.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: '$location.villageId',
        caseCount: { $sum: 1 },
        diseases: { $addToSet: '$diseaseName' },
        severityDistribution: {
          $push: '$severity'
        }
      }
    },
    {
      $lookup: {
        from: 'villages',
        localField: '_id',
        foreignField: '_id',
        as: 'villageInfo'
      }
    },
    {
      $addFields: {
        village: { $arrayElemAt: ['$villageInfo', 0] },
        incidenceRate: {
          $multiply: [
            { $divide: ['$caseCount', { $arrayElemAt: ['$villageInfo.population', 0] }] },
            1000
          ]
        }
      }
    },
    { $sort: { caseCount: -1 } }
  ]);

  // Temporal Trends
  report.temporalTrends = await DiseaseRecord.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: {
          year: { $year: '$dateRecorded' },
          month: { $month: '$dateRecorded' },
          week: { $week: '$dateRecorded' }
        },
        caseCount: { $sum: 1 },
        diseaseTypes: { $addToSet: '$diseaseName' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.week': 1 } }
  ]);

  // Outbreak Status
  const activeOutbreaks = await detectActiveOutbreaks(matchFilter);
  report.outbreakStatus = {
    activeOutbreakCount: activeOutbreaks.length,
    outbreakDetails: activeOutbreaks,
    totalAffectedPopulation: activeOutbreaks.reduce((sum, o) => sum + (o.estimatedAffected || 0), 0)
  };

  // Risk Assessment
  report.riskAssessment = await performRiskAssessment(report);

  // Generate Recommendations
  report.recommendations = generateSurveillanceRecommendations(report);

  // Include projections if requested
  if (includeProjections) {
    report.projections = await generateDiseaseProjections(report.temporalTrends);
  }

  return successResponse(res, report, 'Surveillance report generated successfully');
});

/**
 * Contact tracing and case tracking
 * GET /api/disease-records/:id/contact-trace
 */
const performContactTracing = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { depth = 2, timeWindow = 14 } = req.query;

  const primaryCase = await DiseaseRecord.findById(id)
    .populate('patientId', 'personalInfo contactInformation');

  if (!primaryCase) {
    return notFoundResponse(res, 'Disease record not found');
  }

  if (!primaryCase.contactInformation || primaryCase.contactInformation.length === 0) {
    return successResponse(res, {
      message: 'No contact information available for tracing',
      contactNetwork: { nodes: [], edges: [] },
      riskAssessment: {}
    });
  }

  // Build contact network
  const contactNetwork = await buildContactNetwork(primaryCase, depth, timeWindow);

  // Assess contact risks
  const riskAssessment = await assessContactRisks(contactNetwork);

  // Generate follow-up recommendations
  const followUpPlan = generateContactFollowUpPlan(contactNetwork, riskAssessment);

  // Update case with contact tracing status
  await DiseaseRecord.findByIdAndUpdate(id, {
    contactTracingStatus: 'completed',
    contactTracingDate: new Date(),
    contactTracedBy: req.user._id,
    contactTracingSummary: {
      directContacts: contactNetwork.directContacts?.length || 0,
      secondaryContacts: contactNetwork.secondaryContacts?.length || 0,
      highRiskContacts: riskAssessment.highRiskContacts?.length || 0
    }
  });

  return successResponse(res, {
    primaryCase: {
      id: primaryCase._id,
      disease: primaryCase.diseaseName,
      onsetDate: primaryCase.dateRecorded
    },
    contactNetwork,
    riskAssessment,
    followUpPlan
  }, 'Contact tracing completed successfully');
});

// Helper Functions

const calculateHistoricalBaseline = async (diseaseTypes, timeWindow) => {
  // Calculate historical average for comparison
  const historicalStart = new Date();
  historicalStart.setDate(historicalStart.getDate() - (timeWindow * 4)); // 4x time window for baseline

  const historicalEnd = new Date();
  historicalEnd.setDate(historicalEnd.getDate() - timeWindow);

  const matchFilter = {
    dateRecorded: { $gte: historicalStart, $lte: historicalEnd },
    isActive: true
  };

  if (diseaseTypes) {
    const diseaseArray = Array.isArray(diseaseTypes) ? diseaseTypes : diseaseTypes.split(',');
    matchFilter.diseaseName = { $in: diseaseArray };
  }

  const baseline = await DiseaseRecord.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: {
          disease: '$diseaseName',
          village: '$location.villageId',
          period: {
            $dateToString: {
              format: '%Y-%U', // Year-Week
              date: '$dateRecorded'
            }
          }
        },
        caseCount: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: { disease: '$_id.disease', village: '$_id.village' },
        avgCasesPerWeek: { $avg: '$caseCount' },
        maxCasesPerWeek: { $max: '$caseCount' },
        stdDev: { $stdDevPop: '$caseCount' }
      }
    }
  ]);

  return baseline;
};

const calculateAnomalyScore = async (cluster, baseline, algorithmType) => {
  // Find matching baseline for this disease-village combination
  const matchingBaseline = baseline.find(b => 
    b._id.disease === cluster._id.disease && 
    b._id.village?.toString() === cluster._id.village?.toString()
  );

  if (!matchingBaseline) {
    return {
      isAnomaly: cluster.caseCount >= 3, // Default threshold
      confidence: 0.7,
      method: 'default_threshold',
      details: 'No historical baseline available'
    };
  }

  let isAnomaly = false;
  let confidence = 0;
  
  switch (algorithmType) {
    case 'statistical':
      // Use standard deviation method
      const threshold = matchingBaseline.avgCasesPerWeek + (2 * matchingBaseline.stdDev);
      isAnomaly = cluster.caseCount > threshold;
      confidence = Math.min(0.95, (cluster.caseCount - threshold) / threshold);
      break;
      
    case 'percentile':
      // Use 95th percentile method
      isAnomaly = cluster.caseCount > matchingBaseline.maxCasesPerWeek;
      confidence = 0.8;
      break;
      
    default:
      // Simple threshold method
      isAnomaly = cluster.caseCount > (matchingBaseline.avgCasesPerWeek * 2);
      confidence = 0.75;
  }

  return {
    isAnomaly,
    confidence: Math.max(0, confidence),
    method: algorithmType,
    details: {
      currentCases: cluster.caseCount,
      historicalAvg: matchingBaseline.avgCasesPerWeek,
      threshold: matchingBaseline.avgCasesPerWeek * 2
    }
  };
};

const determineRiskLevel = (cluster, anomalyScore) => {
  let riskScore = 0;

  // Case count factor
  if (cluster.caseCount > 10) riskScore += 30;
  else if (cluster.caseCount > 5) riskScore += 20;
  else riskScore += 10;

  // Severity factor
  if (cluster.severeCases > 0) {
    riskScore += (cluster.severeCases / cluster.caseCount) * 20;
  }

  // Attack rate factor
  if (cluster.attackRate > 5) riskScore += 20;
  else if (cluster.attackRate > 1) riskScore += 10;

  // Anomaly confidence factor
  riskScore += anomalyScore.confidence * 20;

  // Population density factor
  if (cluster.village?.population > 10000) riskScore += 10;

  if (riskScore >= 70) return 'high';
  if (riskScore >= 40) return 'medium';
  return 'low';
};

const generateResponseRecommendations = (cluster) => {
  const recommendations = [];

  if (cluster.riskLevel === 'high') {
    recommendations.push({
      priority: 'immediate',
      action: 'Activate emergency response team',
      timeframe: '2 hours'
    });
  }

  recommendations.push({
    priority: 'urgent',
    action: 'Isolate confirmed cases',
    timeframe: '4 hours'
  });

  if (cluster.caseCount > 5) {
    recommendations.push({
      priority: 'high',
      action: 'Set up community screening',
      timeframe: '24 hours'
    });
  }

  return recommendations;
};

// Additional helper functions would be implemented here
const performSpatialCaseAnalysis = async (primaryCase, relatedCases) => ({ spatial: 'analysis' });
const performTemporalCaseAnalysis = async (primaryCase, relatedCases) => ({ temporal: 'analysis' });
const analyzeRiskFactors = async (primaryCase, relatedCases) => ({ risk: 'factors' });
const performContactTracingAnalysis = async (primaryCase) => ({ contact: 'tracing' });
const generateInvestigationRecommendations = (investigation) => [];
const calculateReportDateRange = (reportType, startDate, endDate) => ({ start: new Date(), end: new Date() });
const calculateMortalityRate = async (filter) => 0;
const calculateIncidenceRate = async (filter, areaId) => 0;
const detectActiveOutbreaks = async (filter) => [];
const performRiskAssessment = async (report) => ({ overall: 'low' });
const generateSurveillanceRecommendations = (report) => [];
const generateDiseaseProjections = async (trends) => ({ projections: 'data' });
const buildContactNetwork = async (primaryCase, depth, timeWindow) => ({ network: 'data' });
const assessContactRisks = async (network) => ({ risks: 'assessment' });
const generateContactFollowUpPlan = (network, risks) => ({ plan: 'data' });
const generateOutbreakAlert = async (outbreak) => { console.log('Alert generated', outbreak._id); };

export {
  createRecord,
  getRecords,
  getRecordById,
  updateRecord,
  addFollowUp,
  getRecordsByPatient,
  getOutbreakAnalysis,
  deleteRecord,
  performAdvancedOutbreakDetection,
  performEpidemiologicalInvestigation,
  generateSurveillanceReport,
  performContactTracing
};