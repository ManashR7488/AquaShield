import mongoose from 'mongoose';
import VaccinationRecord from '../models/vaccinationRecord.model.js';
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
 * Vaccination Record Controller
 * Vaccination tracking and immunization management
 */

/**
 * Create new vaccination record
 * POST /api/vaccination-records
 */
const createRecord = asyncHandler(async (req, res) => {
  const recordData = {
    ...req.body,
    administeredBy: req.user._id,
    dateAdministered: new Date()
  };

  const record = new VaccinationRecord(recordData);
  await record.save();

  // Send notification for vaccine administration
  try {
    await handleAlertSystemIntegration({
      type: 'vaccination_administered',
      severity: 'low',
      title: 'Vaccination Completed',
      message: `${recordData.vaccineName} vaccine administered successfully`,
      recipients: [recordData.patientId],
      relatedEntity: {
        entityType: 'VaccinationRecord',
        entityId: record._id
      }
    });
  } catch (alertError) {
    console.error('Failed to send vaccination notification:', alertError);
  }

  // Populate related data for response
  await record.populate([
    { path: 'administeredBy', select: 'personalInfo.firstName personalInfo.lastName roleInfo.role' },
    { path: 'patientId', select: 'personalInfo patientId' },
    { path: 'location.villageId', select: 'name block district' }
  ]);

  return createdResponse(res, record, 'Vaccination record created successfully');
});

/**
 * Get vaccination records with filtering and pagination
 * GET /api/vaccination-records
 */
const getRecords = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    vaccineName,
    patientId,
    administeredBy,
    villageId,
    dateFrom,
    dateTo,
    isCompleted,
    search,
    sortBy = 'dateAdministered',
    sortOrder = 'desc'
  } = req.query;

  // Build filter object
  const filter = {};
  
  if (vaccineName) filter.vaccineName = { $regex: vaccineName, $options: 'i' };
  if (patientId) filter.patientId = patientId;
  if (administeredBy) filter.administeredBy = administeredBy;
  if (villageId) filter['location.villageId'] = villageId;
  if (isCompleted !== undefined) filter.isCompleted = isCompleted === 'true';

  // Date range filters
  if (dateFrom || dateTo) {
    filter.dateAdministered = {};
    if (dateFrom) filter.dateAdministered.$gte = new Date(dateFrom);
    if (dateTo) filter.dateAdministered.$lte = new Date(dateTo);
  }

  // Text search
  if (search) {
    filter.$or = [
      { vaccineName: { $regex: search, $options: 'i' } },
      { manufacturer: { $regex: search, $options: 'i' } },
      { batchNumber: { $regex: search, $options: 'i' } }
    ];
  }

  // Role-based access control
  const userRole = req.user.roleInfo.role;
  if (userRole === 'asha_worker') {
    // ASHA workers see only their administered vaccines
    filter.administeredBy = req.user._id;
  } else if (userRole === 'volunteer') {
    // Volunteers have limited access
    return res.status(403).json({
      success: false,
      message: 'Access denied. Volunteers cannot access vaccination records directly.'
    });
  }

  // Calculate pagination
  const total = await VaccinationRecord.countDocuments(filter);
  const paginationData = getPaginationData(page, limit, total);

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // Execute query
  const records = await VaccinationRecord.find(filter)
    .populate([
      { path: 'administeredBy', select: 'personalInfo.firstName personalInfo.lastName roleInfo.role' },
      { path: 'patientId', select: 'personalInfo patientId personalInfo.dateOfBirth' },
      { path: 'location.villageId', select: 'name block district' }
    ])
    .sort(sort)
    .skip(paginationData.skip)
    .limit(paginationData.itemsPerPage);

  return paginatedResponse(res, records, paginationData, 'Vaccination records retrieved successfully');
});

/**
 * Get single vaccination record by ID
 * GET /api/vaccination-records/:id
 */
const getRecordById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const record = await VaccinationRecord.findById(id)
    .populate([
      { path: 'administeredBy', select: 'personalInfo.firstName personalInfo.lastName roleInfo.role authentication.phone' },
      { path: 'patientId', select: 'personalInfo patientId location medicalHistory' },
      { path: 'location.villageId', select: 'name block district coordinates' }
    ]);

  if (!record) {
    return notFoundResponse(res, 'Vaccination record not found');
  }

  // Check authorization
  const userRole = req.user.roleInfo.role;
  if (userRole === 'asha_worker') {
    if (record.administeredBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view records you created.'
      });
    }
  } else if (userRole === 'volunteer') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Volunteers cannot access detailed vaccination records.'
    });
  }

  return successResponse(res, record, 'Vaccination record retrieved successfully');
});

/**
 * Update vaccination record
 * PUT /api/vaccination-records/:id
 */
const updateRecord = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const record = await VaccinationRecord.findById(id);
  
  if (!record) {
    return notFoundResponse(res, 'Vaccination record not found');
  }

  // Authorization check
  const userRole = req.user.roleInfo.role;
  const isAdministerer = record.administeredBy.toString() === req.user._id.toString();
  const canUpdate = isAdministerer || ['admin', 'health_official'].includes(userRole);

  if (!canUpdate) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only the administerer or health officials can update vaccination records.'
    });
  }

  // Prevent changing critical fields
  delete updates.administeredBy;
  delete updates.dateAdministered;
  delete updates.patientId;

  // Apply updates
  Object.assign(record, updates);
  record.lastUpdated = new Date();

  await record.save();

  // Populate for response
  await record.populate([
    { path: 'administeredBy', select: 'personalInfo.firstName personalInfo.lastName' },
    { path: 'patientId', select: 'personalInfo patientId' },
    { path: 'location.villageId', select: 'name block district' }
  ]);

  return updatedResponse(res, record, 'Vaccination record updated successfully');
});

/**
 * Record adverse reaction
 * POST /api/vaccination-records/:id/adverse-reaction
 */
const recordAdverseReaction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { severity, symptoms, onsetTime, treatment, reportedBy } = req.body;

  const record = await VaccinationRecord.findById(id);
  
  if (!record) {
    return notFoundResponse(res, 'Vaccination record not found');
  }

  // Add adverse reaction
  record.adverseReactions.push({
    severity,
    symptoms,
    onsetTime: onsetTime ? new Date(onsetTime) : new Date(),
    treatment,
    reportedBy: reportedBy || req.user._id,
    reportedAt: new Date()
  });

  await record.save();

  // Send alert for severe reactions
  if (severity === 'severe') {
    try {
      await handleAlertSystemIntegration({
        type: 'adverse_reaction',
        severity: 'critical',
        title: 'Severe Adverse Reaction Reported',
        message: `Severe adverse reaction to ${record.vaccineName} vaccine reported`,
        relatedEntity: {
          entityType: 'VaccinationRecord',
          entityId: record._id
        }
      });
    } catch (alertError) {
      console.error('Failed to send adverse reaction alert:', alertError);
    }
  }

  return updatedResponse(res, record, 'Adverse reaction recorded successfully');
});

/**
 * Get vaccination records by patient
 * GET /api/vaccination-records/patient/:patientId
 */
const getRecordsByPatient = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const filter = { patientId };

  // Role-based access control
  const userRole = req.user.roleInfo.role;
  if (userRole === 'asha_worker') {
    filter.administeredBy = req.user._id;
  } else if (userRole === 'volunteer') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Volunteers cannot access patient vaccination records.'
    });
  }

  const total = await VaccinationRecord.countDocuments(filter);
  const paginationData = getPaginationData(page, limit, total);

  const records = await VaccinationRecord.find(filter)
    .populate([
      { path: 'administeredBy', select: 'personalInfo.firstName personalInfo.lastName' },
      { path: 'location.villageId', select: 'name' }
    ])
    .sort({ dateAdministered: -1 })
    .skip(paginationData.skip)
    .limit(paginationData.itemsPerPage);

  return paginatedResponse(res, records, paginationData, 'Patient vaccination records retrieved successfully');
});

/**
 * Get vaccination coverage statistics
 * GET /api/vaccination-records/stats/coverage
 */
const getVaccinationStats = asyncHandler(async (req, res) => {
  const { villageId, vaccineName, ageGroup, months = 12 } = req.query;

  // Only health officials and admin can access statistics
  if (!['health_official', 'admin'].includes(req.user.roleInfo.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only health officials can access vaccination statistics.'
    });
  }

  const dateThreshold = new Date();
  dateThreshold.setMonth(dateThreshold.getMonth() - parseInt(months));

  const matchFilter = {
    dateAdministered: { $gte: dateThreshold }
  };

  if (villageId) matchFilter['location.villageId'] = new mongoose.Types.ObjectId(villageId);
  if (vaccineName) matchFilter.vaccineName = { $regex: vaccineName, $options: 'i' };

  // Get vaccination coverage by vaccine type
  const coverageByVaccine = await VaccinationRecord.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: '$vaccineName',
        totalAdministered: { $sum: 1 },
        completedSeries: {
          $sum: { $cond: ['$isCompleted', 1, 0] }
        },
        adverseReactions: {
          $sum: { $size: '$adverseReactions' }
        }
      }
    },
    { $sort: { totalAdministered: -1 } }
  ]);

  // Get vaccination coverage by village
  const coverageByVillage = await VaccinationRecord.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: '$location.villageId',
        totalVaccinations: { $sum: 1 },
        uniquePatients: { $addToSet: '$patientId' }
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
      $project: {
        village: { $arrayElemAt: ['$villageInfo', 0] },
        totalVaccinations: 1,
        uniquePatients: { $size: '$uniquePatients' }
      }
    },
    { $sort: { totalVaccinations: -1 } }
  ]);

  // Get monthly vaccination trends
  const monthlyTrends = await VaccinationRecord.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: {
          year: { $year: '$dateAdministered' },
          month: { $month: '$dateAdministered' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  const result = {
    coverageByVaccine,
    coverageByVillage,
    monthlyTrends,
    summary: {
      totalVaccinations: await VaccinationRecord.countDocuments(matchFilter),
      completedSeries: await VaccinationRecord.countDocuments({ 
        ...matchFilter, 
        isCompleted: true 
      }),
      adverseReactions: await VaccinationRecord.countDocuments({
        ...matchFilter,
        'adverseReactions.0': { $exists: true }
      })
    }
  };

  return successResponse(res, result, 'Vaccination statistics retrieved successfully');
});

/**
 * Get due vaccinations
 * GET /api/vaccination-records/due/upcoming
 */
const getDueVaccinations = asyncHandler(async (req, res) => {
  const { villageId, days = 30 } = req.query;

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + parseInt(days));

  const matchFilter = {
    nextDoseDate: {
      $gte: new Date(),
      $lte: futureDate
    },
    isCompleted: false
  };

  if (villageId) matchFilter['location.villageId'] = new mongoose.Types.ObjectId(villageId);

  // Role-based access control
  const userRole = req.user.roleInfo.role;
  if (userRole === 'asha_worker') {
    matchFilter.administeredBy = req.user._id;
  }

  const dueVaccinations = await VaccinationRecord.find(matchFilter)
    .populate([
      { path: 'patientId', select: 'personalInfo patientId authentication.phone' },
      { path: 'administeredBy', select: 'personalInfo.firstName personalInfo.lastName' },
      { path: 'location.villageId', select: 'name block district' }
    ])
    .sort({ nextDoseDate: 1 });

  return successResponse(res, dueVaccinations, 'Due vaccinations retrieved successfully');
});

/**
 * Delete vaccination record (soft delete)
 * DELETE /api/vaccination-records/:id
 */
const deleteRecord = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Only admin can delete vaccination records
  if (req.user.roleInfo.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only administrators can delete vaccination records.'
    });
  }

  const record = await VaccinationRecord.findById(id);
  
  if (!record) {
    return notFoundResponse(res, 'Vaccination record not found');
  }

  record.isActive = false;
  record.deletedAt = new Date();
  record.deletedBy = req.user._id;

  await record.save();

  return updatedResponse(res, record, 'Vaccination record deleted successfully');
});

/**
 * Enhanced Vaccination Management Functions
 */

/**
 * Generate comprehensive vaccination schedule for patient
 * GET /api/vaccination-records/schedule/:patientId
 */
const generateVaccinationSchedule = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { includeCompleted = false } = req.query;

  // Get patient information
  const Patient = mongoose.model('Patient');
  const patient = await Patient.findById(patientId).select('personalInfo.dateOfBirth');
  
  if (!patient) {
    return notFoundResponse(res, 'Patient not found');
  }

  const birthDate = patient.personalInfo.dateOfBirth;
  const currentAge = (new Date() - birthDate) / (365.25 * 24 * 60 * 60 * 1000);

  // Get existing vaccinations
  const existingVaccinations = await VaccinationRecord.find({ 
    patientId,
    isActive: true 
  }).sort({ dateAdministered: 1 });

  // Generate age-appropriate schedule
  const scheduleTemplates = getAgeAppropriateVaccines(currentAge);
  const schedule = [];

  for (const template of scheduleTemplates) {
    const completedDoses = existingVaccinations.filter(v => 
      v.vaccineName === template.name
    );

    for (let dose = 1; dose <= template.totalDoses; dose++) {
      const completed = completedDoses.find(v => v.doseNumber === dose);
      
      if (completed && !includeCompleted) continue;

      const dueDate = calculateVaccineDueDate(birthDate, template, dose);
      const status = getVaccineStatus(dueDate, completed);

      schedule.push({
        vaccine: template.name,
        doseNumber: dose,
        totalDoses: template.totalDoses,
        dueDate,
        status,
        completedDate: completed?.dateAdministered || null,
        administeredBy: completed?.administeredBy || null,
        isRequired: template.required,
        ageAtDue: template.ageSchedule[dose - 1] || 0,
        description: template.description,
        sideEffects: template.commonSideEffects
      });
    }
  }

  // Sort by due date
  schedule.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  const summary = {
    totalScheduled: schedule.length,
    completed: schedule.filter(s => s.status === 'completed').length,
    overdue: schedule.filter(s => s.status === 'overdue').length,
    upcoming: schedule.filter(s => s.status === 'due').length,
    completionPercentage: (schedule.filter(s => s.status === 'completed').length / schedule.length) * 100
  };

  return successResponse(res, {
    schedule,
    summary,
    patientInfo: {
      patientId,
      currentAge: Math.floor(currentAge * 100) / 100,
      birthDate
    }
  }, 'Vaccination schedule generated successfully');
});

/**
 * Track dose sequences and validate dose administration
 * POST /api/vaccination-records/validate-dose
 */
const validateDoseSequence = asyncHandler(async (req, res) => {
  const { patientId, vaccineName, doseNumber, proposedDate } = req.body;

  // Get previous doses for this vaccine
  const previousDoses = await VaccinationRecord.find({
    patientId,
    vaccineName,
    isActive: true
  }).sort({ doseNumber: 1 });

  // Get vaccine schedule information
  const vaccineSchedule = getVaccineScheduleInfo(vaccineName);
  if (!vaccineSchedule) {
    return res.status(400).json({
      success: false,
      message: `Unknown vaccine: ${vaccineName}`
    });
  }

  const validation = {
    isValid: true,
    warnings: [],
    errors: [],
    recommendations: []
  };

  // Check dose sequence
  const expectedDose = previousDoses.length + 1;
  if (doseNumber !== expectedDose) {
    validation.isValid = false;
    validation.errors.push(`Invalid dose sequence. Expected dose ${expectedDose}, received ${doseNumber}`);
  }

  // Check minimum intervals
  if (previousDoses.length > 0) {
    const lastDose = previousDoses[previousDoses.length - 1];
    const daysSinceLastDose = (new Date(proposedDate) - lastDose.dateAdministered) / (1000 * 60 * 60 * 24);
    const minimumInterval = vaccineSchedule.intervals[doseNumber - 2] || 28;

    if (daysSinceLastDose < minimumInterval) {
      validation.isValid = false;
      validation.errors.push(`Minimum interval of ${minimumInterval} days required. Only ${Math.floor(daysSinceLastDose)} days have passed.`);
    }
  }

  // Check maximum age constraints
  const Patient = mongoose.model('Patient');
  const patient = await Patient.findById(patientId).select('personalInfo.dateOfBirth');
  const ageAtProposedDate = (new Date(proposedDate) - patient.personalInfo.dateOfBirth) / (365.25 * 24 * 60 * 60 * 1000);

  if (vaccineSchedule.maxAge && ageAtProposedDate > vaccineSchedule.maxAge) {
    validation.warnings.push(`Patient age (${ageAtProposedDate.toFixed(1)} years) exceeds recommended maximum age (${vaccineSchedule.maxAge} years) for ${vaccineName}`);
  }

  // Generate recommendations
  if (validation.isValid) {
    validation.recommendations.push(`Safe to administer ${vaccineName} dose ${doseNumber}`);
    
    if (doseNumber < vaccineSchedule.totalDoses) {
      const nextDoseDate = new Date(proposedDate);
      nextDoseDate.setDate(nextDoseDate.getDate() + (vaccineSchedule.intervals[doseNumber - 1] || 28));
      validation.recommendations.push(`Next dose (${doseNumber + 1}) due on ${nextDoseDate.toDateString()}`);
    } else {
      validation.recommendations.push(`This completes the ${vaccineName} vaccination series`);
    }
  }

  return successResponse(res, validation, 'Dose sequence validation completed');
});

/**
 * Advanced coverage analysis with demographic breakdowns
 * GET /api/vaccination-records/coverage/analysis
 */
const getAdvancedCoverageAnalysis = asyncHandler(async (req, res) => {
  const {
    areaType = 'village',
    areaIds,
    vaccineName,
    ageGroup,
    analysisType = 'comprehensive',
    startDate,
    endDate,
    includeProjections = false
  } = req.query;

  // Only health officials and admin can access detailed analysis
  if (!['health_official', 'admin'].includes(req.user.roleInfo.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only health officials can access detailed coverage analysis.'
    });
  }

  const dateFilter = {};
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate) dateFilter.$lte = new Date(endDate);

  const matchStage = {
    isActive: true,
    ...(Object.keys(dateFilter).length > 0 && { dateAdministered: dateFilter })
  };

  if (vaccineName) matchStage.vaccineName = vaccineName;
  if (areaIds) {
    const areaIdArray = Array.isArray(areaIds) ? areaIds : areaIds.split(',');
    matchStage[`location.${areaType}Id`] = { 
      $in: areaIdArray.map(id => new mongoose.Types.ObjectId(id)) 
    };
  }

  // Coverage by area analysis
  const coverageByArea = await VaccinationRecord.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: `$location.${areaType}Id`,
        totalVaccinations: { $sum: 1 },
        uniquePatients: { $addToSet: '$patientId' },
        completedSeries: {
          $sum: { $cond: ['$isCompleted', 1, 0] }
        },
        vaccineTypes: { $addToSet: '$vaccineName' },
        adverseReactionCount: {
          $sum: { $size: '$adverseReactions' }
        }
      }
    },
    {
      $lookup: {
        from: areaType === 'village' ? 'villages' : 'areas',
        localField: '_id',
        foreignField: '_id',
        as: 'areaInfo'
      }
    },
    {
      $addFields: {
        area: { $arrayElemAt: ['$areaInfo', 0] },
        uniquePatientCount: { $size: '$uniquePatients' },
        coverageRate: {
          $multiply: [
            { $divide: ['$uniquePatientCount', '$area.targetPopulation'] },
            100
          ]
        }
      }
    },
    { $sort: { coverageRate: -1 } }
  ]);

  // Vaccination timeline analysis
  const timelineAnalysis = await VaccinationRecord.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          year: { $year: '$dateAdministered' },
          month: { $month: '$dateAdministered' },
          vaccine: '$vaccineName'
        },
        count: { $sum: 1 },
        uniquePatients: { $addToSet: '$patientId' }
      }
    },
    {
      $group: {
        _id: { year: '$_id.year', month: '$_id.month' },
        totalVaccinations: { $sum: '$count' },
        vaccineBreakdown: {
          $push: {
            vaccine: '$_id.vaccine',
            count: '$count',
            uniquePatients: { $size: '$uniquePatients' }
          }
        }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  // Age group analysis if requested
  let ageGroupAnalysis = null;
  if (ageGroup || analysisType === 'comprehensive') {
    ageGroupAnalysis = await VaccinationRecord.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'patients',
          localField: 'patientId',
          foreignField: '_id',
          as: 'patient'
        }
      },
      {
        $addFields: {
          patientAge: {
            $divide: [
              { $subtract: ['$dateAdministered', { $arrayElemAt: ['$patient.personalInfo.dateOfBirth', 0] }] },
              365.25 * 24 * 60 * 60 * 1000
            ]
          }
        }
      },
      {
        $addFields: {
          ageGroup: {
            $switch: {
              branches: [
                { case: { $lt: ['$patientAge', 1] }, then: 'infant' },
                { case: { $lt: ['$patientAge', 5] }, then: 'toddler' },
                { case: { $lt: ['$patientAge', 12] }, then: 'child' },
                { case: { $lt: ['$patientAge', 18] }, then: 'adolescent' },
                { case: { $lt: ['$patientAge', 65] }, then: 'adult' }
              ],
              default: 'elderly'
            }
          }
        }
      },
      {
        $group: {
          _id: {
            ageGroup: '$ageGroup',
            vaccine: '$vaccineName'
          },
          count: { $sum: 1 },
          avgAge: { $avg: '$patientAge' }
        }
      },
      {
        $group: {
          _id: '$_id.ageGroup',
          vaccinations: {
            $push: {
              vaccine: '$_id.vaccine',
              count: '$count',
              avgAge: '$avgAge'
            }
          },
          totalCount: { $sum: '$count' }
        }
      }
    ]);
  }

  // Generate projections if requested
  let projections = null;
  if (includeProjections) {
    projections = await generateCoverageProjections(timelineAnalysis, coverageByArea);
  }

  const summary = {
    totalAreas: coverageByArea.length,
    highCoverageAreas: coverageByArea.filter(area => area.coverageRate >= 80).length,
    lowCoverageAreas: coverageByArea.filter(area => area.coverageRate < 50).length,
    overallCoverageRate: coverageByArea.reduce((sum, area) => sum + (area.coverageRate || 0), 0) / coverageByArea.length,
    totalVaccinations: coverageByArea.reduce((sum, area) => sum + area.totalVaccinations, 0),
    totalUniquePatients: new Set(coverageByArea.flatMap(area => area.uniquePatients)).size
  };

  return successResponse(res, {
    summary,
    coverageByArea,
    timelineAnalysis,
    ageGroupAnalysis,
    projections,
    analysisParameters: {
      areaType,
      vaccineName,
      ageGroup,
      analysisType,
      dateRange: { startDate, endDate }
    }
  }, 'Advanced coverage analysis completed successfully');
});

/**
 * Generate vaccination reminders and follow-ups
 * GET /api/vaccination-records/reminders
 */
const generateVaccinationReminders = asyncHandler(async (req, res) => {
  const { 
    reminderType = 'upcoming',
    daysAhead = 7,
    areaId,
    urgencyLevel = 'all'
  } = req.query;

  const currentDate = new Date();
  const futureDate = new Date();
  futureDate.setDate(currentDate.getDate() + parseInt(daysAhead));

  let matchStage = { isActive: true };
  
  // Role-based filtering
  const userRole = req.user.roleInfo.role;
  if (userRole === 'asha_worker') {
    matchStage.administeredBy = req.user._id;
  }

  if (areaId) {
    matchStage['location.villageId'] = new mongoose.Types.ObjectId(areaId);
  }

  const reminders = [];

  if (reminderType === 'upcoming' || reminderType === 'all') {
    // Next dose reminders
    const upcomingDoses = await VaccinationRecord.find({
      ...matchStage,
      nextDoseDate: {
        $gte: currentDate,
        $lte: futureDate
      },
      isCompleted: false
    }).populate([
      { path: 'patientId', select: 'personalInfo patientId authentication.phone' },
      { path: 'location.villageId', select: 'name' }
    ]);

    reminders.push(...upcomingDoses.map(record => ({
      type: 'next_dose',
      urgency: getUrgencyLevel(record.nextDoseDate),
      patientId: record.patientId._id,
      patientName: `${record.patientId.personalInfo.firstName} ${record.patientId.personalInfo.lastName}`,
      patientPhone: record.patientId.authentication?.phone,
      vaccineName: record.vaccineName,
      doseNumber: record.doseNumber + 1,
      dueDate: record.nextDoseDate,
      location: record.location,
      message: `${record.vaccineName} dose ${record.doseNumber + 1} is due on ${record.nextDoseDate.toDateString()}`
    })));
  }

  if (reminderType === 'overdue' || reminderType === 'all') {
    // Overdue vaccinations
    const overdueDoses = await VaccinationRecord.find({
      ...matchStage,
      nextDoseDate: { $lt: currentDate },
      isCompleted: false
    }).populate([
      { path: 'patientId', select: 'personalInfo patientId authentication.phone' },
      { path: 'location.villageId', select: 'name' }
    ]);

    reminders.push(...overdueDoses.map(record => ({
      type: 'overdue',
      urgency: 'high',
      patientId: record.patientId._id,
      patientName: `${record.patientId.personalInfo.firstName} ${record.patientId.personalInfo.lastName}`,
      patientPhone: record.patientId.authentication?.phone,
      vaccineName: record.vaccineName,
      doseNumber: record.doseNumber + 1,
      dueDate: record.nextDoseDate,
      daysOverdue: Math.floor((currentDate - record.nextDoseDate) / (1000 * 60 * 60 * 24)),
      location: record.location,
      message: `${record.vaccineName} dose ${record.doseNumber + 1} is ${Math.floor((currentDate - record.nextDoseDate) / (1000 * 60 * 60 * 24))} days overdue`
    })));
  }

  // Filter by urgency level
  const filteredReminders = urgencyLevel === 'all' 
    ? reminders 
    : reminders.filter(r => r.urgency === urgencyLevel);

  // Sort by urgency and due date
  const urgencyOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
  filteredReminders.sort((a, b) => {
    if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    }
    return new Date(a.dueDate) - new Date(b.dueDate);
  });

  const summary = {
    total: filteredReminders.length,
    byUrgency: {
      critical: filteredReminders.filter(r => r.urgency === 'critical').length,
      high: filteredReminders.filter(r => r.urgency === 'high').length,
      medium: filteredReminders.filter(r => r.urgency === 'medium').length,
      low: filteredReminders.filter(r => r.urgency === 'low').length
    },
    byType: {
      upcoming: filteredReminders.filter(r => r.type === 'next_dose').length,
      overdue: filteredReminders.filter(r => r.type === 'overdue').length
    }
  };

  return successResponse(res, {
    reminders: filteredReminders,
    summary,
    parameters: {
      reminderType,
      daysAhead,
      urgencyLevel,
      areaId
    }
  }, 'Vaccination reminders generated successfully');
});

// Helper functions

const getAgeAppropriateVaccines = (ageInYears) => {
  // Comprehensive vaccine schedule based on Indian immunization guidelines
  return [
    {
      name: 'BCG',
      totalDoses: 1,
      ageSchedule: [0], // At birth
      required: true,
      description: 'Bacillus Calmette-Guérin vaccine for tuberculosis prevention',
      commonSideEffects: ['Local swelling', 'Mild fever']
    },
    {
      name: 'Hepatitis B',
      totalDoses: 3,
      ageSchedule: [0, 0.17, 0.5], // Birth, 6 weeks, 6 months
      required: true,
      description: 'Hepatitis B vaccination series',
      commonSideEffects: ['Soreness at injection site', 'Mild fever']
    },
    {
      name: 'DPT',
      totalDoses: 3,
      ageSchedule: [0.17, 0.33, 0.5], // 6 weeks, 10 weeks, 14 weeks
      required: true,
      description: 'Diphtheria, Pertussis, Tetanus vaccine',
      commonSideEffects: ['Local reactions', 'Fever', 'Irritability']
    },
    {
      name: 'Polio',
      totalDoses: 4,
      ageSchedule: [0, 0.17, 0.33, 0.5], // Birth, 6 weeks, 10 weeks, 14 weeks
      required: true,
      description: 'Oral Polio Vaccine and Injectable Polio Vaccine',
      commonSideEffects: ['Rare allergic reactions']
    },
    {
      name: 'Measles',
      totalDoses: 2,
      ageSchedule: [0.75, 1.25], // 9 months, 15 months
      required: true,
      description: 'Measles vaccination',
      commonSideEffects: ['Fever', 'Rash', 'Mild symptoms']
    }
  ].filter(vaccine => {
    const maxAge = Math.max(...vaccine.ageSchedule);
    return ageInYears <= maxAge + 2; // Include if within age range + buffer
  });
};

const calculateVaccineDueDate = (birthDate, template, doseNumber) => {
  const ageAtDue = template.ageSchedule[doseNumber - 1] || 0;
  const dueDate = new Date(birthDate);
  dueDate.setMonth(dueDate.getMonth() + (ageAtDue * 12));
  return dueDate;
};

const getVaccineStatus = (dueDate, completed) => {
  if (completed) return 'completed';
  
  const now = new Date();
  const daysDiff = (now - dueDate) / (1000 * 60 * 60 * 24);
  
  if (daysDiff > 30) return 'overdue';
  if (daysDiff > 0) return 'due';
  return 'upcoming';
};

const getVaccineScheduleInfo = (vaccineName) => {
  const schedules = {
    'BCG': { totalDoses: 1, intervals: [], maxAge: 1 },
    'Hepatitis B': { totalDoses: 3, intervals: [42, 140], maxAge: 18 },
    'DPT': { totalDoses: 3, intervals: [28, 28], maxAge: 7 },
    'Polio': { totalDoses: 4, intervals: [42, 28, 28], maxAge: 18 },
    'Measles': { totalDoses: 2, intervals: [183], maxAge: 5 }
  };
  
  return schedules[vaccineName] || null;
};

const getUrgencyLevel = (dueDate) => {
  const daysUntilDue = (dueDate - new Date()) / (1000 * 60 * 60 * 24);
  
  if (daysUntilDue < 0) return 'critical'; // Overdue
  if (daysUntilDue <= 3) return 'high';
  if (daysUntilDue <= 7) return 'medium';
  return 'low';
};

const generateCoverageProjections = async (timelineAnalysis, coverageByArea) => {
  // Simple projection based on recent trends
  // In a real implementation, this would use more sophisticated forecasting
  
  if (timelineAnalysis.length < 3) {
    return { message: 'Insufficient data for projections' };
  }

  const recentMonths = timelineAnalysis.slice(-3);
  const avgMonthlyGrowth = recentMonths.reduce((sum, month, index, arr) => {
    if (index === 0) return 0;
    return sum + (month.totalVaccinations - arr[index - 1].totalVaccinations);
  }, 0) / (recentMonths.length - 1);

  const currentMonth = recentMonths[recentMonths.length - 1];
  const projections = [];

  for (let i = 1; i <= 6; i++) {
    const projectedDate = new Date(currentMonth._id.year, currentMonth._id.month - 1 + i);
    projections.push({
      month: projectedDate.getMonth() + 1,
      year: projectedDate.getFullYear(),
      projectedVaccinations: Math.max(0, currentMonth.totalVaccinations + (avgMonthlyGrowth * i)),
      confidence: Math.max(0.3, 1 - (i * 0.1)) // Decreasing confidence over time
    });
  }

  return {
    projections,
    methodology: 'Linear trend extrapolation',
    averageMonthlyGrowth: avgMonthlyGrowth,
    baselineMonth: currentMonth
  };
};

export {
  createRecord,
  getRecords,
  getRecordById,
  updateRecord,
  recordAdverseReaction,
  getRecordsByPatient,
  getVaccinationStats,
  getDueVaccinations,
  deleteRecord,
  generateVaccinationSchedule,
  validateDoseSequence,
  getAdvancedCoverageAnalysis,
  generateVaccinationReminders
};