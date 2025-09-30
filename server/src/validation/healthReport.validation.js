import Joi from 'joi';

/**
 * Joi validation schemas for health report operations
 */

// Common schemas for reuse
const coordinatesSchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required()
});

const evidenceSchema = Joi.object({
  type: Joi.string().valid('photo', 'document', 'video', 'audio').required(),
  url: Joi.string().uri().required(),
  filename: Joi.string().required(),
  description: Joi.string().max(200),
  uploadedAt: Joi.date().default(Date.now)
});

const affectedPopulationSchema = Joi.object({
  ageGroups: Joi.object({
    infants: Joi.number().min(0).default(0),
    children: Joi.number().min(0).default(0),
    adults: Joi.number().min(0).default(0),
    elderly: Joi.number().min(0).default(0)
  }),
  genderBreakdown: Joi.object({
    male: Joi.number().min(0).default(0),
    female: Joi.number().min(0).default(0),
    other: Joi.number().min(0).default(0)
  }),
  vulnerableGroups: Joi.object({
    pregnant: Joi.number().min(0).default(0),
    immunocompromised: Joi.number().min(0).default(0),
    chronicIllness: Joi.number().min(0).default(0),
    disabled: Joi.number().min(0).default(0)
  }),
  totalAffected: Joi.number().min(0).required()
});

const reviewHistorySchema = Joi.object({
  reviewedBy: Joi.string().required(),
  reviewDate: Joi.date().default(Date.now),
  status: Joi.string().valid('approved', 'rejected', 'needs_revision', 'escalated').required(),
  comments: Joi.string().min(10).max(500).required(),
  recommendations: Joi.array().items(Joi.string().max(200))
});

// Report type specific validation
const diseaseOutbreakReportSchema = Joi.object({
  diseaseType: Joi.string().required(),
  suspectedCases: Joi.number().min(0).required(),
  confirmedCases: Joi.number().min(0).default(0),
  deaths: Joi.number().min(0).default(0),
  onsetDate: Joi.date().required(),
  symptomsReported: Joi.array().items(Joi.string()).min(1).required(),
  riskFactors: Joi.array().items(Joi.string())
});

const waterQualityConcernSchema = Joi.object({
  contaminationType: Joi.string().valid(
    'biological', 'chemical', 'physical', 'unknown'
  ).required(),
  waterSource: Joi.string().required(),
  affectedHouseholds: Joi.number().min(1).required(),
  reportedSymptoms: Joi.array().items(Joi.string()),
  waterTestRequested: Joi.boolean().default(true)
});

const infrastructureIssueSchema = Joi.object({
  facilityType: Joi.string().valid(
    'health_center', 'water_supply', 'sanitation', 'road_access'
  ).required(),
  issueType: Joi.string().required(),
  severity: Joi.string().valid('minor', 'major', 'critical').required(),
  impactOnServices: Joi.string().max(300),
  estimatedRepairCost: Joi.number().min(0)
});

// Main validation schemas

/**
 * Schema for creating health reports
 */
const createHealthReportSchema = Joi.object({
  // Required basic information
  reportType: Joi.string().valid(
    'disease_outbreak',
    'routine_survey',
    'emergency_alert',
    'water_quality_concern',
    'infrastructure_issue',
    'vaccination_coverage',
    'maternal_health',
    'child_health',
    'other'
  ).required(),
  
  reporter: Joi.string().required(), // User ID
  title: Joi.string().min(10).max(200).required(),
  description: Joi.string().min(20).max(2000).required(),

  // Location information
  location: Joi.object({
    villageId: Joi.string().required(),
    address: Joi.string().max(300),
    coordinates: coordinatesSchema,
    landmarks: Joi.array().items(Joi.string().max(100))
  }).required(),

  // Priority and urgency
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
  urgencyLevel: Joi.string().valid('routine', 'urgent', 'emergency').default('routine'),

  // Affected population
  affectedPopulation: affectedPopulationSchema,

  // Report type specific data
  diseaseOutbreakDetails: Joi.when('reportType', {
    is: 'disease_outbreak',
    then: diseaseOutbreakReportSchema.required(),
    otherwise: diseaseOutbreakReportSchema
  }),

  waterQualityDetails: Joi.when('reportType', {
    is: 'water_quality_concern',
    then: waterQualityConcernSchema.required(),
    otherwise: waterQualityConcernSchema
  }),

  infrastructureDetails: Joi.when('reportType', {
    is: 'infrastructure_issue',
    then: infrastructureIssueSchema.required(),
    otherwise: infrastructureIssueSchema
  }),

  // Evidence and documentation
  evidence: Joi.array().items(evidenceSchema),
  
  // Follow-up and recommendations
  immediateActions: Joi.array().items(Joi.string().max(200)),
  recommendedActions: Joi.array().items(Joi.string().max(200)),
  resourcesRequired: Joi.array().items(Joi.string().max(200)),

  // Contact information
  contactInfo: Joi.object({
    primaryContact: Joi.string().max(100),
    phoneNumber: Joi.string().pattern(/^[0-9+\-\s()]+$/),
    alternateContact: Joi.string().max(100),
    alternatePhone: Joi.string().pattern(/^[0-9+\-\s()]+$/)
  })
});

/**
 * Schema for updating health reports (partial updates allowed)
 */
const updateHealthReportSchema = Joi.object({
  title: Joi.string().min(10).max(200),
  description: Joi.string().min(20).max(2000),
  
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent'),
  urgencyLevel: Joi.string().valid('routine', 'urgent', 'emergency'),

  affectedPopulation: affectedPopulationSchema,

  diseaseOutbreakDetails: diseaseOutbreakReportSchema,
  waterQualityDetails: waterQualityConcernSchema,
  infrastructureDetails: infrastructureIssueSchema,

  evidence: Joi.array().items(evidenceSchema),
  
  immediateActions: Joi.array().items(Joi.string().max(200)),
  recommendedActions: Joi.array().items(Joi.string().max(200)),
  resourcesRequired: Joi.array().items(Joi.string().max(200)),

  contactInfo: Joi.object({
    primaryContact: Joi.string().max(100),
    phoneNumber: Joi.string().pattern(/^[0-9+\-\s()]+$/),
    alternateContact: Joi.string().max(100),
    alternatePhone: Joi.string().pattern(/^[0-9+\-\s()]+$/)
  })
});

/**
 * Schema for reviewing health reports
 */
const reviewHealthReportSchema = Joi.object({
  status: Joi.string().valid('approved', 'rejected', 'needs_revision', 'escalated').required(),
  comments: Joi.string().min(10).max(500).required(),
  recommendations: Joi.array().items(Joi.string().max(200)),
  
  // For escalation
  escalateTo: Joi.when('status', {
    is: 'escalated',
    then: Joi.string().required(), // User ID to escalate to
    otherwise: Joi.string()
  }),

  // For rejection
  rejectionReason: Joi.when('status', {
    is: 'rejected',
    then: Joi.string().min(10).max(300).required(),
    otherwise: Joi.string()
  }),

  // Priority adjustment
  adjustPriority: Joi.string().valid('low', 'medium', 'high', 'urgent'),
  adjustUrgency: Joi.string().valid('routine', 'urgent', 'emergency')
});

/**
 * Schema for escalating health reports
 */
const escalateHealthReportSchema = Joi.object({
  escalateTo: Joi.string().required(), // User ID or role
  escalationReason: Joi.string().min(10).max(300).required(),
  urgencyJustification: Joi.string().max(500),
  additionalEvidence: Joi.array().items(evidenceSchema),
  requestedResources: Joi.array().items(Joi.string().max(200))
});

/**
 * Schema for querying health reports
 */
const queryHealthReportsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  
  // Filters
  reportType: Joi.string().valid(
    'disease_outbreak', 'routine_survey', 'emergency_alert', 
    'water_quality_concern', 'infrastructure_issue', 'vaccination_coverage',
    'maternal_health', 'child_health', 'other'
  ),
  status: Joi.string().valid(
    'draft', 'submitted', 'under_review', 'approved', 'rejected', 
    'needs_revision', 'escalated', 'resolved'
  ),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent'),
  urgencyLevel: Joi.string().valid('routine', 'urgent', 'emergency'),
  reporter: Joi.string(),
  villageId: Joi.string(),
  
  // Date filters
  dateFrom: Joi.date(),
  dateTo: Joi.date(),
  reportDateFrom: Joi.date(),
  reportDateTo: Joi.date(),
  
  // Text search
  search: Joi.string().min(3).max(100),
  
  // Sorting
  sortBy: Joi.string().valid(
    'reportDate', 'createdAt', 'priority', 'urgencyLevel', 'status'
  ).default('reportDate'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

/**
 * Schema for parameter validation (route params)
 */
const healthReportParamsSchema = Joi.object({
  id: Joi.string().required(),
  villageId: Joi.string()
});

export {
  createHealthReportSchema,
  updateHealthReportSchema,
  reviewHealthReportSchema,
  escalateHealthReportSchema,
  queryHealthReportsSchema,
  healthReportParamsSchema
};