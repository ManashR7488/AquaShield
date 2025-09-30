/**
 * Central validation index file that exports all validation schemas
 */

// Import all validation modules
import * as authValidation from './auth.validation.js';
import * as waterQualityTestValidation from './waterQualityTest.validation.js';
import * as healthReportValidation from './healthReport.validation.js';
import * as alertSystemValidation from './alertSystem.validation.js';
import * as healthProgramValidation from './healthProgram.validation.js';
import * as vaccinationRecordValidation from './vaccinationRecord.validation.js';
import * as healthObservationValidation from './healthObservation.validation.js';
import * as communityObservationValidation from './communityObservation.validation.js';
import * as diseaseRecordValidation from './diseaseRecord.validation.js';
import * as patientRecordValidation from './patientRecord.validation.js';
import * as familyMemberValidation from './familyMember.validation.js';
import * as personalHealthRecordValidation from './personalHealthRecord.validation.js';

// Import Joi for common validation schemas
import Joi from 'joi';

/**
 * Common validation schemas used across multiple entities
 */
const commonSchemas = {
  // Pagination schema
  paginationSchema: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),

  // Date range schema
  dateRangeSchema: Joi.object({
    dateFrom: Joi.date(),
    dateTo: Joi.date().greater(Joi.ref('dateFrom'))
  }),

  // Location filter schema
  locationFilterSchema: Joi.object({
    villageId: Joi.string(),
    blockId: Joi.string(),
    districtId: Joi.string(),
    stateId: Joi.string()
  }),

  // User reference schema
  userReferenceSchema: Joi.object({
    userId: Joi.string().required(),
    role: Joi.string().valid('admin', 'health_official', 'asha_worker', 'volunteer')
  }),

  // Coordinates schema
  coordinatesSchema: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required()
  }),

  // MongoDB ObjectId schema
  objectIdSchema: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),

  // Phone number schema
  phoneNumberSchema: Joi.string().pattern(/^[0-9+\-\s()]+$/),

  // Email schema
  emailSchema: Joi.string().email(),

  // Text search schema
  searchSchema: Joi.object({
    search: Joi.string().min(3).max(100),
    searchFields: Joi.array().items(Joi.string())
  })
};

/**
 * Validation schemas organized by entity
 */
const validationSchemas = {
  // Authentication schemas
  auth: {
    signup: authValidation.signupSchema,
    login: authValidation.loginSchema,
    changePassword: authValidation.changePasswordSchema,
    verifyEmail: authValidation.verifyEmailSchema,
    verifyPhone: authValidation.verifyPhoneSchema,
    forgotPassword: authValidation.forgotPasswordSchema,
    resetPassword: authValidation.resetPasswordSchema,
    updateProfile: authValidation.updateProfileSchema,
    resendVerification: authValidation.resendVerificationSchema,
    sendPhoneOTP: authValidation.sendPhoneOTPSchema
  },

  // Water Quality Test schemas
  waterQualityTest: {
    create: waterQualityTestValidation.createWaterQualityTestSchema,
    update: waterQualityTestValidation.updateWaterQualityTestSchema,
    query: waterQualityTestValidation.queryWaterQualityTestsSchema,
    resultSubmission: waterQualityTestValidation.testResultSubmissionSchema,
    params: waterQualityTestValidation.waterQualityTestParamsSchema
  },

  // Health Report schemas
  healthReport: {
    create: healthReportValidation.createHealthReportSchema,
    update: healthReportValidation.updateHealthReportSchema,
    review: healthReportValidation.reviewHealthReportSchema,
    escalate: healthReportValidation.escalateHealthReportSchema,
    query: healthReportValidation.queryHealthReportsSchema,
    params: healthReportValidation.healthReportParamsSchema
  },

  // Alert System schemas
  alertSystem: {
    create: alertSystemValidation.createAlertSchema,
    updateStatus: alertSystemValidation.updateAlertStatusSchema,
    acknowledge: alertSystemValidation.acknowledgeAlertSchema,
    escalate: alertSystemValidation.escalateAlertSchema,
    bulk: alertSystemValidation.bulkAlertSchema,
    query: alertSystemValidation.queryAlertsSchema,
    deliveryPreferences: alertSystemValidation.updateDeliveryPreferencesSchema,
    params: alertSystemValidation.alertParamsSchema
  },

  // Health Program schemas
  healthProgram: {
    create: healthProgramValidation.createHealthProgramSchema,
    update: healthProgramValidation.updateHealthProgramSchema,
    assignStaff: healthProgramValidation.assignStaffSchema,
    updateProgress: healthProgramValidation.updateProgressSchema,
    complete: healthProgramValidation.completeProgramSchema,
    query: healthProgramValidation.queryHealthProgramsSchema,
    params: healthProgramValidation.healthProgramParamsSchema
  },

  // Vaccination Record schemas
  vaccinationRecord: {
    create: vaccinationRecordValidation.createVaccinationSchema,
    update: vaccinationRecordValidation.updateVaccinationSchema,
    administer: vaccinationRecordValidation.administerVaccinationSchema,
    reschedule: vaccinationRecordValidation.rescheduleVaccinationSchema,
    query: vaccinationRecordValidation.queryVaccinationsSchema,
    coverage: vaccinationRecordValidation.vaccinationCoverageSchema,
    certificate: vaccinationRecordValidation.vaccinationCertificateSchema
  },

  // Health Observation schemas
  healthObservation: {
    create: healthObservationValidation.createHealthObservationSchema,
    update: healthObservationValidation.updateHealthObservationSchema,
    addFollowUp: healthObservationValidation.addFollowUpSchema,
    query: healthObservationValidation.queryHealthObservationsSchema,
    trends: healthObservationValidation.observationTrendsSchema,
    patterns: healthObservationValidation.patternAnalysisSchema
  },

  // Community Observation schemas
  communityObservation: {
    create: communityObservationValidation.createCommunityObservationSchema,
    update: communityObservationValidation.updateCommunityObservationSchema,
    escalate: communityObservationValidation.escalateObservationSchema,
    addFollowUp: communityObservationValidation.addFollowUpSchema,
    query: communityObservationValidation.queryCommunityObservationsSchema,
    patterns: communityObservationValidation.observationPatternsSchema
  },

  // Disease Record schemas (updated with comprehensive implementation)
  diseaseRecord: {
    create: diseaseRecordValidation.createDiseaseRecordSchema,
    update: diseaseRecordValidation.updateDiseaseRecordSchema,
    confirmDiagnosis: diseaseRecordValidation.confirmDiagnosisSchema,
    addFollowUp: diseaseRecordValidation.addFollowUpSchema,
    investigation: diseaseRecordValidation.investigationSchema,
    contactTracing: diseaseRecordValidation.contactTracingSchema,
    query: diseaseRecordValidation.queryDiseaseRecordsSchema,
    outbreak: diseaseRecordValidation.outbreakTrackingSchema
  },

  // Patient Record schemas (updated with comprehensive implementation)
  patientRecord: {
    create: patientRecordValidation.createPatientRecordSchema,
    update: patientRecordValidation.updatePatientRecordSchema,
    linkFamily: patientRecordValidation.linkFamilyMemberSchema,
    transfer: patientRecordValidation.transferPatientSchema,
    query: patientRecordValidation.queryPatientRecordsSchema,
    stats: patientRecordValidation.patientStatsSchema
  },

  // Family Member schemas
  familyMember: {
    create: familyMemberValidation.createFamilyMemberSchema,
    update: familyMemberValidation.updateFamilyMemberSchema,
    linkUser: familyMemberValidation.linkUserSchema,
    query: familyMemberValidation.queryFamilyMembersSchema,
    params: familyMemberValidation.familyMemberIdSchema,
    updateHealthProfile: familyMemberValidation.updateHealthProfileSchema
  },

  // Personal Health Record schemas
  personalHealthRecord: {
    create: personalHealthRecordValidation.createHealthRecordSchema,
    update: personalHealthRecordValidation.updateHealthRecordSchema,
    query: personalHealthRecordValidation.queryHealthRecordsSchema,
    params: personalHealthRecordValidation.healthRecordIdSchema,
    createVitalSigns: personalHealthRecordValidation.createVitalSignsSchema,
    createSymptomLog: personalHealthRecordValidation.createSymptomLogSchema,
    createMedicalHistory: personalHealthRecordValidation.createMedicalHistorySchema,
    healthTrends: personalHealthRecordValidation.healthTrendsSchema,
    generateReport: personalHealthRecordValidation.generateHealthReportSchema
  },

  // Common schemas
  common: commonSchemas
};

/**
 * Helper functions for combining and conditional validation
 */
const validationHelpers = {
  /**
   * Combine multiple schemas with AND logic
   * @param {...Joi.Schema} schemas - Schemas to combine
   * @returns {Joi.Schema} Combined schema
   */
  combineSchemas: (...schemas) => {
    return Joi.object().concat(...schemas);
  },

  /**
   * Create conditional validation based on user role
   * @param {string} userRole - User role
   * @param {Object} roleSchemas - Object mapping roles to schemas
   * @returns {Joi.Schema} Role-specific schema
   */
  roleBasedValidation: (userRole, roleSchemas) => {
    return roleSchemas[userRole] || roleSchemas.default || Joi.any();
  },

  /**
   * Create validation for partial updates (all fields optional)
   * @param {Joi.Schema} baseSchema - Base schema to make optional
   * @returns {Joi.Schema} Schema with all fields optional
   */
  createUpdateSchema: (baseSchema) => {
    return baseSchema.fork(Object.keys(baseSchema.describe().keys), (schema) => schema.optional());
  },

  /**
   * Add pagination to any query schema
   * @param {Joi.Schema} baseSchema - Base query schema
   * @returns {Joi.Schema} Schema with pagination added
   */
  addPagination: (baseSchema) => {
    return baseSchema.concat(commonSchemas.paginationSchema);
  },

  /**
   * Validate array of IDs
   * @param {number} minItems - Minimum number of items
   * @param {number} maxItems - Maximum number of items
   * @returns {Joi.Schema} Array validation schema
   */
  validateIdArray: (minItems = 1, maxItems = 100) => {
    return Joi.array()
      .items(commonSchemas.objectIdSchema)
      .min(minItems)
      .max(maxItems)
      .unique();
  }
};

/**
 * Additional validation helper functions
 */
const additionalHelpers = {
  /**
   * Custom validator for age-appropriate vaccines
   */
  validateAgeAppropriateVaccine: vaccinationRecordValidation.validateAgeAppropriateVaccine,

  /**
   * Custom validator for dose sequence
   */
  validateDoseSequence: vaccinationRecordValidation.validateDoseSequence,

  /**
   * Custom validator for geographic coordinates within bounds
   */
  validateCoordinatesWithinBounds: healthObservationValidation.validateCoordinatesWithinBounds,

  /**
   * Custom validator for demographic data consistency
   */
  validateDemographicConsistency: healthObservationValidation.validateDemographicConsistency,

  /**
   * Custom validator for community area boundaries
   */
  validateWithinCommunityBounds: communityObservationValidation.validateWithinCommunityBounds,

  /**
   * Custom validator for escalation criteria
   */
  validateEscalationCriteria: communityObservationValidation.validateEscalationCriteria,

  /**
   * Custom validator for disease code format
   */
  validateDiseaseCode: diseaseRecordValidation.validateDiseaseCode,

  /**
   * Custom validator for symptom pattern
   */
  validateSymptomPattern: diseaseRecordValidation.validateSymptomPattern,

  /**
   * Custom validator for outbreak correlation
   */
  validateOutbreakCorrelation: diseaseRecordValidation.validateOutbreakCorrelation,

  /**
   * Age calculation helper
   */
  calculateAge: patientRecordValidation.calculateAge,

  /**
   * Family relationship validator
   */
  validateFamilyRelationship: patientRecordValidation.validateFamilyRelationship,

  /**
   * Health ID format validator
   */
  validateHealthIdFormat: patientRecordValidation.validateHealthIdFormat,

  /**
   * ASHA assignment validator
   */
  validateASHAAssignment: patientRecordValidation.validateASHAAssignment
};

// Add helper functions to exports
validationSchemas.helpers = { ...validationHelpers, ...additionalHelpers };

export default validationSchemas;