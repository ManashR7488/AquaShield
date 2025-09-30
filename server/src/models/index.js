import mongoose from 'mongoose';

// Import existing models
import User from './user.model.js';
import Village from './village.model.js';
import District from './district.model.js';
import Block from './block.model.js';

// Import health surveillance models
import WaterQualityTest from './waterQualityTest.model.js';
import DiseaseRecord from './diseaseRecord.model.js';
import PatientRecord from './patientRecord.model.js';
import VaccinationRecord from './vaccinationRecord.model.js';
import HealthObservation from './healthObservation.model.js';

// Import comprehensive health surveillance models
import HealthReport from './healthReport.model.js';
import AlertSystem from './alertSystem.model.js';
import HealthProgram from './healthProgram.model.js';
import CommunityObservation from './communityObservation.model.js';

// Import user-focused health management models
import { FamilyMember } from './familyMember.model.js';
import { PersonalHealthRecord } from './personalHealthRecord.model.js';

/**
 * Health Surveillance System Models Index
 * 
 * This file exports all MongoDB models and establishes proper relationships
 * between them for the comprehensive health surveillance system.
 */

// =============================================================================
// MODEL RELATIONSHIPS AND VIRTUAL FIELDS
// =============================================================================

// Patient-to-User relationships for family members and healthcare workers
PatientRecord.schema.virtual('familyMembers', {
  ref: 'PatientRecord',
  localField: 'familyInfo.familyMembers.memberId',
  foreignField: '_id'
});

PatientRecord.schema.virtual('assignedAshaWorkerDetails', {
  ref: 'User',
  localField: 'careManagement.assignedAshaWorker',
  foreignField: '_id',
  justOne: true
});

PatientRecord.schema.virtual('registeredByDetails', {
  ref: 'User',
  localField: 'registration.registeredBy',
  foreignField: '_id',
  justOne: true
});

// VaccinationRecord-to-PatientRecord relationships
VaccinationRecord.schema.virtual('patientDetails', {
  ref: 'PatientRecord',
  localField: 'patientId',
  foreignField: '_id',
  justOne: true
});

VaccinationRecord.schema.virtual('administeredByDetails', {
  ref: 'User',
  localField: 'administration.administeredBy',
  foreignField: '_id',
  justOne: true
});

// DiseaseRecord-to-PatientRecord relationships
DiseaseRecord.schema.virtual('patientDetails', {
  ref: 'PatientRecord',
  localField: 'patientId',
  foreignField: '_id',
  justOne: true
});

DiseaseRecord.schema.virtual('reportedByDetails', {
  ref: 'User',
  localField: 'reporting.reportedBy',
  foreignField: '_id',
  justOne: true
});

// WaterQualityTest-to-Village relationships
WaterQualityTest.schema.virtual('villageDetails', {
  ref: 'Village',
  localField: 'villageId',
  foreignField: '_id',
  justOne: true
});

WaterQualityTest.schema.virtual('conductedByDetails', {
  ref: 'User',
  localField: 'conductedBy',
  foreignField: '_id',
  justOne: true
});

// HealthObservation-to-Village relationships
HealthObservation.schema.virtual('villageDetails', {
  ref: 'Village',
  localField: 'location.villageId',
  foreignField: '_id',
  justOne: true
});

HealthObservation.schema.virtual('observerDetails', {
  ref: 'User',
  localField: 'observerId',
  foreignField: '_id',
  justOne: true
});

// HealthReport-to-User relationships
HealthReport.schema.virtual('reporterDetails', {
  ref: 'User',
  localField: 'reporter',
  foreignField: '_id',
  justOne: true
});

HealthReport.schema.virtual('villageDetails', {
  ref: 'Village',
  localField: 'location.village',
  foreignField: '_id',
  justOne: true
});

HealthReport.schema.virtual('reviewerDetails', {
  ref: 'User',
  localField: 'reviewChain.reviewedBy',
  foreignField: '_id'
});

// AlertSystem-to-User relationships
AlertSystem.schema.virtual('recipientDetails', {
  ref: 'User',
  localField: 'recipients.userId',
  foreignField: '_id'
});

AlertSystem.schema.virtual('acknowledgmentDetails', {
  ref: 'User',
  localField: 'acknowledgments.acknowledgedBy',
  foreignField: '_id'
});

// HealthProgram-to-User relationships
HealthProgram.schema.virtual('coordinatorDetails', {
  ref: 'User',
  localField: 'programCoordinator',
  foreignField: '_id',
  justOne: true
});

HealthProgram.schema.virtual('staffDetails', {
  ref: 'User',
  localField: 'assignedStaff.userId',
  foreignField: '_id'
});

HealthProgram.schema.virtual('districtDetails', {
  ref: 'District',
  localField: 'coverageAreas.districts',
  foreignField: '_id'
});

HealthProgram.schema.virtual('blockDetails', {
  ref: 'Block',
  localField: 'coverageAreas.blocks',
  foreignField: '_id'
});

HealthProgram.schema.virtual('villageDetails', {
  ref: 'Village',
  localField: 'coverageAreas.villages',
  foreignField: '_id'
});

// CommunityObservation-to-User relationships
CommunityObservation.schema.virtual('observerDetails', {
  ref: 'User',
  localField: 'observer',
  foreignField: '_id',
  justOne: true
});

CommunityObservation.schema.virtual('villageDetails', {
  ref: 'Village',
  localField: 'location.village',
  foreignField: '_id',
  justOne: true
});

// =============================================================================
// RELATIONSHIP HELPER FUNCTIONS
// =============================================================================

/**
 * Get all patients in a village with their basic information
 * @param {ObjectId} villageId - The village ID
 * @param {Object} options - Query options (limit, skip, sort)
 * @returns {Promise<Array>} Array of patients
 */
const getPatientsInVillage = async (villageId, options = {}) => {
  const query = PatientRecord.find({
    'location.villageId': villageId,
    isActive: true,
    isDeceased: false
  });

  if (options.select) query.select(options.select);
  if (options.populate) query.populate(options.populate);
  if (options.sort) query.sort(options.sort);
  if (options.limit) query.limit(options.limit);
  if (options.skip) query.skip(options.skip);

  return await query.exec();
};

/**
 * Get vaccination history for a patient
 * @param {ObjectId} patientId - The patient ID
 * @param {Object} filters - Additional filters
 * @returns {Promise<Array>} Array of vaccination records
 */
const getPatientVaccinationHistory = async (patientId, filters = {}) => {
  return await VaccinationRecord.find({
    patientId: patientId,
    isActive: true,
    isCancelled: false,
    ...filters
  })
  .populate('administration.administeredBy', 'personalInfo.firstName personalInfo.lastName roleInfo.role')
  .populate('createdBy', 'personalInfo.firstName personalInfo.lastName roleInfo.role')
  .sort({ 'administration.administeredDate': -1, 'schedule.scheduledDate': -1 });
};

/**
 * Get disease history for a patient
 * @param {ObjectId} patientId - The patient ID
 * @param {Object} filters - Additional filters
 * @returns {Promise<Array>} Array of disease records
 */
const getPatientDiseaseHistory = async (patientId, filters = {}) => {
  return await DiseaseRecord.find({
    patientId: patientId,
    isActive: true,
    ...filters
  })
  .populate('reporting.reportedBy', 'personalInfo.firstName personalInfo.lastName roleInfo.role')
  .populate('diagnosis.confirmingAuthority', 'personalInfo.firstName personalInfo.lastName roleInfo.role')
  .sort({ 'caseDetails.onsetDate': -1 });
};

/**
 * Get water quality trends for a village
 * @param {ObjectId} villageId - The village ID
 * @param {Number} days - Number of days to look back
 * @returns {Promise<Array>} Array of water quality test results
 */
const getVillageWaterQualityTrends = async (villageId, days = 90) => {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return await WaterQualityTest.find({
    villageId: villageId,
    testDate: { $gte: cutoffDate },
    isActive: true
  })
  .populate('conductedBy', 'personalInfo.firstName personalInfo.lastName roleInfo.role')
  .sort({ testDate: -1 });
};

/**
 * Get health observations for a village
 * @param {ObjectId} villageId - The village ID
 * @param {Object} filters - Additional filters
 * @returns {Promise<Array>} Array of health observations
 */
const getVillageHealthObservations = async (villageId, filters = {}) => {
  return await HealthObservation.find({
    'location.villageId': villageId,
    isActive: true,
    ...filters
  })
  .populate('observerId', 'personalInfo.firstName personalInfo.lastName roleInfo.role authentication.phone authentication.email')
  .populate('followUp.monitoringPlan.responsiblePerson', 'personalInfo.firstName personalInfo.lastName roleInfo.role authentication.phone authentication.email')
  .sort({ 'observationInfo.observationDate': -1 });
};

/**
 * Get comprehensive health dashboard data for a village
 * @param {ObjectId} villageId - The village ID
 * @returns {Promise<Object>} Dashboard data object
 */
const getVillageHealthDashboard = async (villageId) => {
  try {
    const [
      demographics,
      recentDiseases,
      vaccinationCoverage,
      waterQualityStatus,
      activeObservations,
      patientCount,
      healthReports,
      communityObservations,
      activeAlerts
    ] = await Promise.all([
      PatientRecord.getVillageDemographics(villageId),
      DiseaseRecord.getDiseaseTrends({}, 30),
      VaccinationRecord.getVaccinationCoverage({}),
      WaterQualityTest.getContaminationTrends(villageId, 30),
      CommunityObservation.find({
        'location.village': villageId,
        'severityAssessment.severity': { $in: ['moderate', 'severe', 'critical'] },
        observationDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        isActive: true
      }).limit(30),
      PatientRecord.countDocuments({
        'location.villageId': villageId,
        isActive: true,
        isDeceased: false
      }),
      HealthReport.getReportsByLocation(villageId, 30),
      CommunityObservation.find({
        'location.village': villageId,
        'severityAssessment.severity': { $in: ['moderate', 'severe', 'critical'] },
        observationDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        isActive: true
      }).limit(20),
      AlertSystem.getAlertsByTypeAndArea('health_emergency', 'village', villageId, 7)
    ]);

    return {
      villageId,
      demographics: demographics[0] || { totalPopulation: 0 },
      recentDiseases: recentDiseases || [],
      vaccinationCoverage: vaccinationCoverage || [],
      waterQualityStatus: waterQualityStatus || [],
      activeObservations: activeObservations || [],
      totalPatients: patientCount || 0,
      healthReports: healthReports || [],
      communityObservations: communityObservations || [],
      activeAlerts: activeAlerts || [],
      generatedAt: new Date()
    };
  } catch (error) {
    throw new Error(`Error generating village health dashboard: ${error.message}`);
  }
};

/**
 * Get health surveillance summary for an ASHA worker
 * @param {ObjectId} ashaWorkerId - The ASHA worker's user ID
 * @returns {Promise<Object>} ASHA worker's health surveillance summary
 */
const getAshaWorkerSummary = async (ashaWorkerId) => {
  try {
    const [
      assignedPatients,
      pendingVaccinations,
      recentDiseaseReports,
      waterQualityTests,
      healthObservations,
      assignedPrograms,
      pendingAlerts,
      submittedReports
    ] = await Promise.all([
      PatientRecord.getPatientsByAshaWorker(ashaWorkerId),
      VaccinationRecord.find({
        'administration.isAdministered': false,
        'schedule.dueDate': { $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }, // Due within 7 days
        isActive: true
      }).populate('patientId', 'personalInfo contactInfo'),
      DiseaseRecord.find({
        'reporting.reportedBy': ashaWorkerId,
        'caseDetails.reportingDate': { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        isActive: true
      }).countDocuments(),
      WaterQualityTest.find({
        conductedBy: ashaWorkerId,
        testDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        isActive: true
      }).countDocuments(),
      CommunityObservation.getObservationsRequiringFollowUp(),
      HealthProgram.getProgramsByCoordinator(ashaWorkerId),
      AlertSystem.getActiveAlertsForUser(ashaWorkerId, 10),
      HealthReport.find({
        reporter: ashaWorkerId,
        submissionDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        isActive: true
      }).countDocuments()
    ]);

    return {
      ashaWorkerId,
      assignedPatients: assignedPatients || [],
      pendingVaccinations: pendingVaccinations || [],
      recentDiseaseReports: recentDiseaseReports || 0,
      waterQualityTestsConducted: waterQualityTests || 0,
      pendingObservations: healthObservations || [],
      assignedPrograms: assignedPrograms || [],
      pendingAlerts: pendingAlerts || [],
      submittedReports: submittedReports || 0,
      totalAssignedPatients: assignedPatients ? assignedPatients.length : 0,
      generatedAt: new Date()
    };
  } catch (error) {
    throw new Error(`Error generating ASHA worker summary: ${error.message}`);
  }
};

// =============================================================================
// MODEL VALIDATION HELPERS
// =============================================================================

/**
 * Validate patient data before creating health records
 * @param {ObjectId} patientId - The patient ID to validate
 * @returns {Promise<Object>} Validation result
 */
const validatePatientForHealthRecord = async (patientId) => {
  try {
    const patient = await PatientRecord.findById(patientId)
      .select('personalInfo location isActive isDeceased');
    
    if (!patient) {
      return { isValid: false, error: 'Patient not found' };
    }
    
    if (!patient.isActive) {
      return { isValid: false, error: 'Patient record is inactive' };
    }
    
    if (patient.isDeceased) {
      return { isValid: false, error: 'Cannot create health records for deceased patient' };
    }
    
    return { isValid: true, patient };
  } catch (error) {
    return { isValid: false, error: error.message };
  }
};

/**
 * Check for duplicate vaccination records
 * @param {Object} vaccinationData - The vaccination data to check
 * @returns {Promise<Object>} Duplicate check result
 */
const checkDuplicateVaccination = async (vaccinationData) => {
  try {
    const existingVaccination = await VaccinationRecord.findOne({
      patientId: vaccinationData.patientId,
      'vaccineInfo.vaccineName': vaccinationData.vaccineInfo.vaccineName,
      'administration.doseNumber': vaccinationData.administration.doseNumber,
      'administration.isAdministered': true,
      isActive: true,
      isCancelled: false
    });
    
    if (existingVaccination) {
      return {
        isDuplicate: true,
        existingRecord: existingVaccination,
        message: 'Vaccination record already exists for this patient, vaccine, and dose'
      };
    }
    
    return { isDuplicate: false };
  } catch (error) {
    throw new Error(`Error checking for duplicate vaccination: ${error.message}`);
  }
};

// =============================================================================
// NEW COMPREHENSIVE HEALTH SURVEILLANCE HELPERS
// =============================================================================

/**
 * Get health reports for a village
 * @param {ObjectId} villageId - The village ID
 * @param {Number} days - Number of days to look back
 * @returns {Promise<Array>} Array of health reports
 */
const getHealthReportsByVillage = async (villageId, days = 30) => {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return await HealthReport.find({
    'location.village': villageId,
    submissionDate: { $gte: cutoffDate },
    isActive: true
  })
  .populate('reporter', 'personalInfo.firstName personalInfo.lastName roleInfo.role authentication.phone authentication.email')
  .populate('escalation.escalatedTo', 'personalInfo.firstName personalInfo.lastName roleInfo.role authentication.phone authentication.email')
  .sort({ 'priority.level': 1, submissionDate: -1 });
};

/**
 * Get active alerts for a user
 * @param {ObjectId} userId - The user ID
 * @param {Number} limit - Maximum number of alerts to return
 * @returns {Promise<Array>} Array of active alerts
 */
const getActiveAlertsForUser = async (userId, limit = 20) => {
  return await AlertSystem.getActiveAlertsForUser(userId, limit);
};

/**
 * Get health programs by district/block
 * @param {String} areaType - 'district' or 'block'
 * @param {ObjectId} areaId - The district or block ID
 * @param {String} programType - Optional program type filter
 * @returns {Promise<Array>} Array of health programs
 */
const getHealthProgramsByArea = async (areaType, areaId, programType = null) => {
  const query = { isActive: true, status: 'active' };
  
  if (programType) {
    query.programType = programType;
  }
  
  if (areaType === 'district') {
    query['coverageAreas.districts'] = areaId;
  } else if (areaType === 'block') {
    query['coverageAreas.blocks'] = areaId;
  }
  
  return await HealthProgram.find(query)
    .populate('programCoordinator', 'name role contactDetails')
    .populate('coverageAreas.districts', 'name state')
    .populate('coverageAreas.blocks', 'name district')
    .sort({ startDate: -1 });
};

/**
 * Get community observations by area
 * @param {ObjectId} villageId - The village ID
 * @param {String} observationType - Optional observation type filter
 * @param {Number} days - Number of days to look back
 * @returns {Promise<Array>} Array of community observations
 */
const getCommunityObservationsByArea = async (villageId, observationType = null, days = 30) => {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const query = {
    'location.village': villageId,
    observationDate: { $gte: cutoffDate },
    isActive: true
  };
  
  if (observationType) {
    query.observationType = observationType;
  }
  
  return await CommunityObservation.find(query)
    .populate('observer', 'name role contactDetails')
    .sort({ 'severityAssessment.urgency': 1, observationDate: -1 });
};

/**
 * Get notification integration data for alerts
 * @param {String} alertType - Type of alert
 * @param {Object} triggerData - Data that triggered the alert
 * @returns {Promise<Object>} Notification integration data
 */
const getNotificationIntegrationData = async (alertType, triggerData) => {
  try {
    let recipients = [];
    let escalationChain = [];
    
    // Determine recipients based on alert type and trigger data
    switch (alertType) {
      case 'health_emergency':
        // Get district and block coordinators
        if (triggerData.villageId) {
          const village = await Village.findById(triggerData.villageId)
            .populate('block', 'healthCoordinators')
            .populate({
              path: 'block',
              populate: { path: 'district', select: 'healthCoordinators' }
            });
          
          if (village) {
            recipients = recipients.concat(village.block.healthCoordinators || []);
            if (village.block.district) {
              recipients = recipients.concat(village.block.district.healthCoordinators || []);
            }
          }
        }
        break;
        
      case 'program_milestone':
        // Get program staff and coordinators
        if (triggerData.programId) {
          const program = await HealthProgram.findById(triggerData.programId);
          if (program) {
            recipients.push(program.programCoordinator);
            recipients = recipients.concat(program.assignedStaff.map(staff => staff.userId));
          }
        }
        break;
        
      case 'community_observation':
        // Get ASHA workers and supervisors in the area
        if (triggerData.villageId) {
          const ashaWorkers = await User.find({
            'roleInfo.role': 'asha_worker',
            'roleInfo.workAssignment.workArea.coverage': triggerData.villageId,
            status: 'active'
          });
          recipients = recipients.concat(ashaWorkers.map(worker => worker._id));
        }
        break;
    }
    
    return {
      recipients: [...new Set(recipients.map(r => r.toString()))], // Remove duplicates
      escalationChain,
      alertType,
      triggerData
    };
  } catch (error) {
    throw new Error(`Error getting notification integration data: ${error.message}`);
  }
};

// =============================================================================
// USER-FOCUSED HEALTH MANAGEMENT HELPER FUNCTIONS
// =============================================================================

/**
 * Get family members for a specific user
 * @param {string} userId - User ID
 * @param {Object} options - Filter options
 * @returns {Promise<Array>} Array of family members
 */
const getFamilyMembersByUser = async (userId, options = {}) => {
  try {
    const filter = { userId, status: 'active' };
    if (options.relationship) filter.relationship = options.relationship;
    if (options.ageRange) {
      filter.age = { $gte: options.ageRange.min, $lte: options.ageRange.max };
    }
    
    return await FamilyMember.find(filter)
      .populate('linkedUserId', 'firstName lastName email')
      .sort({ createdAt: -1 });
  } catch (error) {
    throw new Error(`Error getting family members: ${error.message}`);
  }
};

/**
 * Validate family member ownership
 * @param {string} familyMemberId - Family member ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if user owns the family member
 */
const validateFamilyMemberOwnership = async (familyMemberId, userId) => {
  try {
    const familyMember = await FamilyMember.findOne({ _id: familyMemberId, userId, status: 'active' });
    return !!familyMember;
  } catch (error) {
    throw new Error(`Error validating family member ownership: ${error.message}`);
  }
};

/**
 * Get family health summary for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Health summary object
 */
const getFamilyHealthSummary = async (userId) => {
  try {
    const [familyStats, healthRecordStats] = await Promise.all([
      FamilyMember.getHealthSummary(userId),
      PersonalHealthRecord.getRecordStats(userId)
    ]);
    
    return {
      familyStats: familyStats[0] || { totalMembers: 0, avgAge: 0 },
      healthRecordStats,
      lastUpdate: new Date()
    };
  } catch (error) {
    throw new Error(`Error getting family health summary: ${error.message}`);
  }
};

/**
 * Get health records for user and family members
 * @param {string} userId - User ID
 * @param {Object} options - Filter options
 * @returns {Promise<Array>} Array of health records
 */
const getHealthRecordsByUser = async (userId, options = {}) => {
  try {
    const filter = { userId, status: 'active' };
    if (options.recordType) filter.recordType = options.recordType;
    if (options.familyMemberId) filter.familyMemberId = options.familyMemberId;
    if (options.dateRange) {
      filter.recordDate = {
        $gte: new Date(options.dateRange.start),
        $lte: new Date(options.dateRange.end)
      };
    }
    
    return await PersonalHealthRecord.find(filter)
      .populate('familyMemberId', 'firstName lastName relationship')
      .sort({ recordDate: -1 })
      .limit(options.limit || 50);
  } catch (error) {
    throw new Error(`Error getting health records: ${error.message}`);
  }
};

/**
 * Validate health record ownership
 * @param {string} recordId - Health record ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if user owns the health record
 */
const validateHealthRecordOwnership = async (recordId, userId) => {
  try {
    const record = await PersonalHealthRecord.findOne({ _id: recordId, userId, status: 'active' });
    return !!record;
  } catch (error) {
    throw new Error(`Error validating health record ownership: ${error.message}`);
  }
};

// =============================================================================
// ENHANCED QUERY BUILDERS
// =============================================================================

/**
 * Build query for health report filtering
 * @param {Object} filters - Filter options
 * @returns {Object} MongoDB query object
 */
const buildHealthReportQuery = (filters = {}) => {
  const query = { isActive: true };
  
  if (filters.reportType) query.reportType = filters.reportType;
  if (filters.priority) query['priority.level'] = filters.priority;
  if (filters.status) query['resolution.status'] = filters.status;
  if (filters.reporter) query.reporter = filters.reporter;
  if (filters.village) query['location.village'] = filters.village;
  if (filters.escalated !== undefined) query['escalation.isEscalated'] = filters.escalated;
  
  // Date range filters
  if (filters.startDate || filters.endDate) {
    query.submissionDate = {};
    if (filters.startDate) query.submissionDate.$gte = new Date(filters.startDate);
    if (filters.endDate) query.submissionDate.$lte = new Date(filters.endDate);
  }
  
  return query;
};

/**
 * Build query for alert recipient targeting
 * @param {Object} criteria - Targeting criteria
 * @returns {Promise<Array>} Array of user IDs
 */
const buildAlertRecipientQuery = async (criteria = {}) => {
  const query = { status: 'active' };
  
  if (criteria.roles && criteria.roles.length > 0) {
    query['roleInfo.role'] = { $in: criteria.roles };
  }
  
  if (criteria.locations) {
    const locationQuery = [];
    
    if (criteria.locations.villages && criteria.locations.villages.length > 0) {
      locationQuery.push({ 'roleInfo.workAssignment.workArea.coverage': { $in: criteria.locations.villages } });
    }
    
    if (criteria.locations.blocks && criteria.locations.blocks.length > 0) {
      locationQuery.push({ 'roleInfo.hierarchy.blockId': { $in: criteria.locations.blocks } });
    }
    
    if (criteria.locations.districts && criteria.locations.districts.length > 0) {
      locationQuery.push({ 'roleInfo.hierarchy.districtId': { $in: criteria.locations.districts } });
    }
    
    if (locationQuery.length > 0) {
      query.$or = locationQuery;
    }
  }
  
  const users = await User.find(query).select('_id');
  return users.map(user => user._id);
};

/**
 * Build aggregation pipeline for health program coverage analysis
 * @param {Object} filters - Analysis filters
 * @returns {Array} MongoDB aggregation pipeline
 */
const buildProgramCoverageAnalysis = (filters = {}) => {
  const matchStage = { isActive: true, status: 'active' };
  
  if (filters.programType) matchStage.programType = filters.programType;
  if (filters.district) matchStage['coverageAreas.districts'] = filters.district;
  if (filters.block) matchStage['coverageAreas.blocks'] = filters.block;
  
  return [
    { $match: matchStage },
    {
      $group: {
        _id: '$programType',
        totalPrograms: { $sum: 1 },
        totalBudget: { $sum: '$budget.totalAllocated' },
        totalSpent: { $sum: '$budget.spent' },
        avgProgress: { $avg: '$progressTracking.overallProgress' },
        totalTargetPopulation: { $sum: '$participantManagement.targetPopulation' },
        totalEnrolled: { $sum: '$participantManagement.enrolledParticipants' },
        programs: {
          $push: {
            programId: '$programId',
            name: '$name',
            coordinator: '$programCoordinator',
            progress: '$progressTracking.overallProgress',
            enrollmentRate: {
              $cond: [
                { $gt: ['$participantManagement.targetPopulation', 0] },
                {
                  $multiply: [
                    { $divide: ['$participantManagement.enrolledParticipants', '$participantManagement.targetPopulation'] },
                    100
                  ]
                },
                0
              ]
            }
          }
        }
      }
    },
    {
      $addFields: {
        budgetUtilization: {
          $cond: [
            { $gt: ['$totalBudget', 0] },
            { $multiply: [{ $divide: ['$totalSpent', '$totalBudget'] }, 100] },
            0
          ]
        },
        overallEnrollmentRate: {
          $cond: [
            { $gt: ['$totalTargetPopulation', 0] },
            { $multiply: [{ $divide: ['$totalEnrolled', '$totalTargetPopulation'] }, 100] },
            0
          ]
        }
      }
    }
  ];
};

/**
 * Build aggregation pipeline for community observation trend analysis
 * @param {Object} filters - Analysis filters
 * @returns {Array} MongoDB aggregation pipeline
 */
const buildObservationTrendAnalysis = (filters = {}) => {
  const matchStage = { isActive: true };
  
  if (filters.village) matchStage['location.village'] = filters.village;
  if (filters.observationType) matchStage.observationType = filters.observationType;
  if (filters.startDate || filters.endDate) {
    matchStage.observationDate = {};
    if (filters.startDate) matchStage.observationDate.$gte = new Date(filters.startDate);
    if (filters.endDate) matchStage.observationDate.$lte = new Date(filters.endDate);
  }
  
  return [
    { $match: matchStage },
    {
      $group: {
        _id: {
          observationType: '$observationType',
          month: { $month: '$observationDate' },
          year: { $year: '$observationDate' }
        },
        count: { $sum: 1 },
        avgSeverity: {
          $avg: {
            $switch: {
              branches: [
                { case: { $eq: ['$severityAssessment.severity', 'minimal'] }, then: 1 },
                { case: { $eq: ['$severityAssessment.severity', 'mild'] }, then: 2 },
                { case: { $eq: ['$severityAssessment.severity', 'moderate'] }, then: 3 },
                { case: { $eq: ['$severityAssessment.severity', 'severe'] }, then: 4 },
                { case: { $eq: ['$severityAssessment.severity', 'critical'] }, then: 5 }
              ],
              default: 1
            }
          }
        },
        criticalCount: {
          $sum: {
            $cond: [
              { $in: ['$severityAssessment.severity', ['severe', 'critical']] },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $sort: { '_id.year': -1, '_id.month': -1, '_id.observationType': 1 }
    }
  ];
};

// =============================================================================
// COMMON QUERY BUILDERS
// =============================================================================

/**
 * Build a query for filtering health records by date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {String} dateField - The date field to filter on
 * @returns {Object} MongoDB query object
 */
const buildDateRangeQuery = (startDate, endDate, dateField = 'createdAt') => {
  const query = {};
  
  if (startDate || endDate) {
    query[dateField] = {};
    if (startDate) query[dateField].$gte = new Date(startDate);
    if (endDate) query[dateField].$lte = new Date(endDate);
  }
  
  return query;
};

/**
 * Build a query for filtering records by location hierarchy
 * @param {Object} location - Location filters (village, block, district)
 * @returns {Object} MongoDB query object
 */
const buildLocationQuery = (location = {}) => {
  const query = {};
  
  if (location.villageId) {
    query['location.villageId'] = location.villageId;
  }
  
  if (location.village) {
    query['location.village'] = location.village;
  }
  
  if (location.block) {
    query['location.block'] = location.block;
  }
  
  if (location.district) {
    query['location.district'] = location.district;
  }
  
  return query;
};

/**
 * Build aggregation pipeline for demographic analysis
 * @param {Object} filters - Base filters to apply
 * @returns {Array} MongoDB aggregation pipeline
 */
const buildDemographicsPipeline = (filters = {}) => {
  return [
    { $match: { isActive: true, isDeceased: false, ...filters } },
    {
      $group: {
        _id: null,
        totalCount: { $sum: 1 },
        maleCount: {
          $sum: { $cond: [{ $eq: ['$personalInfo.gender', 'male'] }, 1, 0] }
        },
        femaleCount: {
          $sum: { $cond: [{ $eq: ['$personalInfo.gender', 'female'] }, 1, 0] }
        },
        ageGroups: {
          $push: {
            $switch: {
              branches: [
                { case: { $lt: ['$personalInfo.age.years', 5] }, then: 'under5' },
                { case: { $lt: ['$personalInfo.age.years', 18] }, then: 'child' },
                { case: { $lt: ['$personalInfo.age.years', 60] }, then: 'adult' }
              ],
              default: 'elderly'
            }
          }
        }
      }
    },
    {
      $project: {
        totalCount: 1,
        maleCount: 1,
        femaleCount: 1,
        genderRatio: {
          $cond: [
            { $eq: ['$femaleCount', 0] },
            null,
            { $divide: ['$maleCount', '$femaleCount'] }
          ]
        },
        ageGroupCounts: {
          $arrayToObject: {
            $map: {
              input: ['under5', 'child', 'adult', 'elderly'],
              as: 'ageGroup',
              in: {
                k: '$$ageGroup',
                v: {
                  $size: {
                    $filter: {
                      input: '$ageGroups',
                      cond: { $eq: ['$$this', '$$ageGroup'] }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  ];
};

// =============================================================================
// EXPORTS
// =============================================================================

export {
  // Existing Models
  User,
  Village,
  District,
  Block,
  
  // New Health Surveillance Models
  WaterQualityTest,
  DiseaseRecord,
  PatientRecord,
  VaccinationRecord,
  HealthObservation,
  
  // New Comprehensive Health Surveillance Models
  HealthReport,
  AlertSystem,
  HealthProgram,
  CommunityObservation,
  
  // User-focused Health Management Models
  FamilyMember,
  PersonalHealthRecord,
  
  // Relationship Helper Functions
  getPatientsInVillage,
  getPatientVaccinationHistory,
  getPatientDiseaseHistory,
  getVillageWaterQualityTrends,
  getVillageHealthObservations,
  getVillageHealthDashboard,
  getAshaWorkerSummary,
  
  // New Comprehensive Helper Functions
  getHealthReportsByVillage,
  getActiveAlertsForUser,
  getHealthProgramsByArea,
  getCommunityObservationsByArea,
  getNotificationIntegrationData,
  
  // User-focused Health Management Helper Functions
  getFamilyMembersByUser,
  validateFamilyMemberOwnership,
  getFamilyHealthSummary,
  getHealthRecordsByUser,
  validateHealthRecordOwnership,
  
  // Validation Helpers
  validatePatientForHealthRecord,
  checkDuplicateVaccination,
  
  // Query Builders
  buildDateRangeQuery,
  buildLocationQuery,
  buildDemographicsPipeline,
  
  // Enhanced Query Builders
  buildHealthReportQuery,
  buildAlertRecipientQuery,
  buildProgramCoverageAnalysis,
  buildObservationTrendAnalysis,
  
  // Mongoose instance for direct access
  mongoose
};