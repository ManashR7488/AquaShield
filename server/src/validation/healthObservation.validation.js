import Joi from 'joi';

/**
 * Health Observation Validation Schemas
 * Comprehensive Joi validation schemas for health observation operations
 */

// Common schemas
const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/).message('Invalid ObjectId format');
const dateSchema = Joi.date().iso();
const coordinatesSchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required()
});

const paginationSchema = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().valid('createdAt', 'observationType', 'severity', 'observationDate').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
};

// Observation types and categories
const observationTypes = [
  'symptom_pattern', 'environmental_health', 'behavioral_change', 
  'infrastructure_health', 'disease_outbreak', 'nutritional_status',
  'water_quality_issue', 'sanitation_problem', 'vector_breeding'
];

const severityLevels = ['low', 'medium', 'high', 'critical'];

const observationStatuses = ['active', 'investigating', 'resolved', 'escalated'];

const ageGroups = ['infant', 'child', 'adolescent', 'adult', 'elderly'];

const genders = ['male', 'female', 'other'];

/**
 * Schema for creating health observations
 */
export const createHealthObservationSchema = Joi.object({
  observationType: Joi.string().valid(...observationTypes).required()
    .messages({
      'any.required': 'Observation type is required',
      'any.only': 'Invalid observation type'
    }),
    
  observerId: objectId.required()
    .messages({
      'any.required': 'Observer ID is required',
      'string.pattern.base': 'Invalid observer ID format'
    }),
    
  description: Joi.string().min(10).max(1000).required()
    .messages({
      'any.required': 'Description is required',
      'string.min': 'Description must be at least 10 characters',
      'string.max': 'Description cannot exceed 1000 characters'
    }),
    
  // Location information
  location: Joi.object({
    villageId: objectId.required(),
    coordinates: coordinatesSchema,
    address: Joi.string().max(200),
    landmark: Joi.string().max(100)
  }).required(),
  
  // Observation details
  observationDate: dateSchema.required()
    .max('now')
    .messages({
      'any.required': 'Observation date is required',
      'date.max': 'Observation date cannot be in the future'
    }),
    
  severity: Joi.string().valid(...severityLevels).required()
    .messages({
      'any.required': 'Severity level is required'
    }),
    
  // Affected demographics
  affectedDemographics: Joi.object({
    ageGroups: Joi.array().items(Joi.string().valid(...ageGroups)),
    genders: Joi.array().items(Joi.string().valid(...genders)),
    populationCount: Joi.number().integer().min(1).max(10000),
    householdsAffected: Joi.number().integer().min(1).max(1000)
  }),
  
  // Environmental context
  environmentalContext: Joi.object({
    weatherConditions: Joi.string().valid(
      'sunny', 'rainy', 'cloudy', 'windy', 'humid', 'dry', 'extreme_heat', 'flood'
    ),
    seasonalFactors: Joi.array().items(Joi.string().valid(
      'monsoon', 'post_monsoon', 'winter', 'summer', 'harvest_season', 'drought'
    )),
    temperature: Joi.number().min(-10).max(60),
    humidity: Joi.number().min(0).max(100),
    airQualityIndex: Joi.number().min(0).max(500)
  }),
  
  // Symptoms or patterns observed (for symptom_pattern type)
  symptoms: Joi.when('observationType', {
    is: 'symptom_pattern',
    then: Joi.object({
      primarySymptoms: Joi.array().items(Joi.string()).min(1).required(),
      secondarySymptoms: Joi.array().items(Joi.string()),
      duration: Joi.string().valid('acute', 'chronic', 'recurrent'),
      progression: Joi.string().valid('improving', 'worsening', 'stable'),
      commonFactors: Joi.array().items(Joi.string())
    }).required(),
    otherwise: Joi.object()
  }),
  
  // Infrastructure details (for infrastructure_health type)
  infrastructureDetails: Joi.when('observationType', {
    is: 'infrastructure_health',
    then: Joi.object({
      facilityType: Joi.string().valid(
        'health_center', 'school', 'water_system', 'sanitation', 'road', 'bridge'
      ).required(),
      condition: Joi.string().valid('good', 'fair', 'poor', 'critical').required(),
      maintenanceRequired: Joi.boolean().default(false),
      safetyIssues: Joi.array().items(Joi.string())
    }),
    otherwise: Joi.object()
  }),
  
  // Evidence and documentation
  evidence: Joi.array().items(Joi.object({
    type: Joi.string().valid('photo', 'video', 'audio', 'document').required(),
    url: Joi.string().uri(),
    description: Joi.string().max(200)
  })),
  
  // Additional notes
  notes: Joi.string().max(500),
  
  // Urgency indicators
  requiresImmediateAction: Joi.boolean().default(false),
  
  potentialOutbreak: Joi.boolean().default(false),
  
  // Follow-up information
  followUpRequired: Joi.boolean().default(false),
  
  followUpDate: Joi.when('followUpRequired', {
    is: true,
    then: dateSchema.greater('now'),
    otherwise: dateSchema
  }),
  
  // Tags for categorization
  tags: Joi.array().items(Joi.string().max(50)).max(10)
});

/**
 * Schema for updating health observations
 */
export const updateHealthObservationSchema = Joi.object({
  description: Joi.string().min(10).max(1000),
  
  severity: Joi.string().valid(...severityLevels),
  
  status: Joi.string().valid(...observationStatuses),
  
  affectedDemographics: Joi.object({
    ageGroups: Joi.array().items(Joi.string().valid(...ageGroups)),
    genders: Joi.array().items(Joi.string().valid(...genders)),
    populationCount: Joi.number().integer().min(1).max(10000),
    householdsAffected: Joi.number().integer().min(1).max(1000)
  }),
  
  environmentalContext: Joi.object({
    weatherConditions: Joi.string().valid(
      'sunny', 'rainy', 'cloudy', 'windy', 'humid', 'dry', 'extreme_heat', 'flood'
    ),
    seasonalFactors: Joi.array().items(Joi.string()),
    temperature: Joi.number().min(-10).max(60),
    humidity: Joi.number().min(0).max(100),
    airQualityIndex: Joi.number().min(0).max(500)
  }),
  
  evidence: Joi.array().items(Joi.object({
    type: Joi.string().valid('photo', 'video', 'audio', 'document').required(),
    url: Joi.string().uri(),
    description: Joi.string().max(200)
  })),
  
  notes: Joi.string().max(500),
  
  requiresImmediateAction: Joi.boolean(),
  
  potentialOutbreak: Joi.boolean(),
  
  followUpRequired: Joi.boolean(),
  
  followUpDate: dateSchema,
  
  tags: Joi.array().items(Joi.string().max(50)).max(10)
}).min(1);

/**
 * Schema for adding follow-up to observations
 */
export const addFollowUpSchema = Joi.object({
  followUpDate: dateSchema.required()
    .min('now')
    .messages({
      'any.required': 'Follow-up date is required'
    }),
    
  followUpBy: objectId.required(),
  
  followUpType: Joi.string().valid(
    'field_visit', 'phone_call', 'community_meeting', 'health_screening', 
    'laboratory_test', 'investigation', 'intervention'
  ).required(),
  
  description: Joi.string().min(10).max(500).required(),
  
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
  
  assignedTo: Joi.array().items(objectId),
  
  expectedOutcome: Joi.string().max(300),
  
  resources: Joi.array().items(Joi.object({
    type: Joi.string().valid('personnel', 'equipment', 'medication', 'funds'),
    description: Joi.string().max(100),
    quantity: Joi.number().min(1)
  }))
});

/**
 * Schema for querying health observations
 */
export const queryHealthObservationsSchema = Joi.object({
  observationType: Joi.string().valid(...observationTypes),
  
  severity: Joi.string().valid(...severityLevels),
  
  status: Joi.string().valid(...observationStatuses),
  
  observerId: objectId,
  
  villageId: objectId,
  
  // Date filters
  observationDateFrom: dateSchema,
  observationDateTo: dateSchema,
  createdDateFrom: dateSchema,
  createdDateTo: dateSchema,
  
  // Geographic filters
  nearLocation: Joi.object({
    coordinates: coordinatesSchema.required(),
    radiusKm: Joi.number().min(0.1).max(100).default(10)
  }),
  
  // Demographic filters
  affectedAgeGroups: Joi.array().items(Joi.string().valid(...ageGroups)),
  affectedGenders: Joi.array().items(Joi.string().valid(...genders)),
  
  // Urgency filters
  requiresImmediateAction: Joi.boolean(),
  potentialOutbreak: Joi.boolean(),
  
  // Search
  search: Joi.string().min(1).max(100),
  
  // Tags
  tags: Joi.array().items(Joi.string()),
  
  ...paginationSchema
});

/**
 * Schema for observation trends analysis
 */
export const observationTrendsSchema = Joi.object({
  villageId: objectId,
  
  observationType: Joi.string().valid(...observationTypes),
  
  dateFrom: dateSchema.required(),
  
  dateTo: dateSchema.required().min(Joi.ref('dateFrom')),
  
  groupBy: Joi.string().valid('day', 'week', 'month').default('week'),
  
  includeMetrics: Joi.array().items(Joi.string().valid(
    'count', 'severity_distribution', 'affected_population', 
    'resolution_time', 'follow_up_compliance'
  )).default(['count', 'severity_distribution'])
});

/**
 * Schema for pattern analysis
 */
export const patternAnalysisSchema = Joi.object({
  analysisType: Joi.string().valid(
    'symptom_clustering', 'seasonal_patterns', 'geographic_clustering',
    'demographic_patterns', 'environmental_correlations'
  ).required(),
  
  villageIds: Joi.array().items(objectId),
  
  dateFrom: dateSchema.required(),
  
  dateTo: dateSchema.required().min(Joi.ref('dateFrom')),
  
  observationTypes: Joi.array().items(Joi.string().valid(...observationTypes)),
  
  includeEnvironmentalData: Joi.boolean().default(false),
  
  clusteringRadius: Joi.when('analysisType', {
    is: 'geographic_clustering',
    then: Joi.number().min(0.1).max(50).required(),
    otherwise: Joi.number()
  })
});

/**
 * Custom validator for geographic coordinates within district bounds
 */
export const validateCoordinatesWithinBounds = (coordinates, districtBounds) => {
  const { latitude, longitude } = coordinates;
  const { north, south, east, west } = districtBounds;
  
  return latitude >= south && latitude <= north && 
         longitude >= west && longitude <= east;
};

/**
 * Custom validator for demographic data consistency
 */
export const validateDemographicConsistency = (demographics) => {
  const { populationCount, householdsAffected, ageGroups, genders } = demographics;
  
  // Basic consistency checks
  if (householdsAffected && populationCount && householdsAffected > populationCount) {
    return false;
  }
  
  // Age group population should not exceed total
  if (ageGroups && ageGroups.length > 5) {
    return false; // Too many age groups selected
  }
  
  return true;
};

export default {
  createHealthObservationSchema,
  updateHealthObservationSchema,
  addFollowUpSchema,
  queryHealthObservationsSchema,
  observationTrendsSchema,
  patternAnalysisSchema,
  validateCoordinatesWithinBounds,
  validateDemographicConsistency
};