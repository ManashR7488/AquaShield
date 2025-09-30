import Joi from 'joi';

/**
 * Community Observation Validation Schemas
 * Comprehensive Joi validation schemas for community observation operations
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

// Community observation types
const observationTypes = [
  'community_health_patterns', 'environmental_health_factors', 'behavioral_observations',
  'infrastructure_assessments', 'social_determinants', 'disease_patterns',
  'nutrition_concerns', 'hygiene_practices', 'water_sanitation_issues'
];

const severityLevels = ['low', 'medium', 'high', 'critical'];

const observationStatuses = ['reported', 'acknowledged', 'investigating', 'escalated', 'resolved'];

const escalationLevels = ['community', 'village', 'block', 'district', 'state'];

/**
 * Schema for creating community observations
 */
export const createCommunityObservationSchema = Joi.object({
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
    
  description: Joi.string().min(20).max(2000).required()
    .messages({
      'any.required': 'Description is required',
      'string.min': 'Description must be at least 20 characters',
      'string.max': 'Description cannot exceed 2000 characters'
    }),
    
  // Location information
  location: Joi.object({
    areaId: objectId.required(),
    villageId: objectId,
    coordinates: coordinatesSchema,
    address: Joi.string().max(300),
    landmark: Joi.string().max(150),
    geographicBoundary: Joi.object({
      type: Joi.string().valid('Point', 'Polygon').default('Point'),
      coordinates: Joi.alternatives().conditional('type', {
        is: 'Point',
        then: Joi.array().items(Joi.number()).length(2),
        otherwise: Joi.array().items(Joi.array().items(Joi.number()))
      })
    })
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
    
  // Affected population tracking
  affectedPopulation: Joi.object({
    households: Joi.number().integer().min(1).max(10000),
    individuals: Joi.number().integer().min(1).max(50000),
    children: Joi.number().integer().min(0),
    adults: Joi.number().integer().min(0),
    elderly: Joi.number().integer().min(0),
    vulnerableGroups: Joi.array().items(Joi.string().valid(
      'pregnant_women', 'lactating_mothers', 'disabled', 'chronic_illness', 
      'malnourished', 'homeless', 'migrant_workers'
    ))
  }),
  
  // Environmental context
  environmentalContext: Joi.object({
    season: Joi.string().valid('summer', 'monsoon', 'post_monsoon', 'winter'),
    weatherConditions: Joi.array().items(Joi.string().valid(
      'normal', 'drought', 'flood', 'extreme_heat', 'cold_wave', 'storm'
    )),
    waterSources: Joi.array().items(Joi.object({
      type: Joi.string().valid('well', 'borewell', 'river', 'pond', 'pipeline', 'tanker'),
      condition: Joi.string().valid('good', 'fair', 'poor', 'contaminated', 'unavailable'),
      accessibility: Joi.string().valid('easy', 'moderate', 'difficult', 'inaccessible')
    })),
    sanitationFacilities: Joi.object({
      toilets: Joi.string().valid('adequate', 'insufficient', 'poor_condition', 'unavailable'),
      wasteManagement: Joi.string().valid('good', 'fair', 'poor', 'none'),
      drainageSystems: Joi.string().valid('functional', 'partially_functional', 'blocked', 'none')
    })
  }),
  
  // Social context
  socialContext: Joi.object({
    communityEngagement: Joi.string().valid('high', 'medium', 'low', 'none'),
    leadershipSupport: Joi.string().valid('strong', 'moderate', 'weak', 'none'),
    culturalFactors: Joi.array().items(Joi.string().max(100)),
    economicFactors: Joi.object({
      incomeLevels: Joi.string().valid('below_poverty', 'low', 'middle', 'high'),
      employmentStatus: Joi.string().valid('mostly_employed', 'underemployed', 'high_unemployment'),
      primaryOccupations: Joi.array().items(Joi.string())
    }),
    educationLevels: Joi.object({
      literacy: Joi.string().valid('high', 'medium', 'low'),
      schoolAttendance: Joi.string().valid('regular', 'irregular', 'poor'),
      healthAwareness: Joi.string().valid('high', 'medium', 'low')
    })
  }),
  
  // Trend analysis data
  trendData: Joi.object({
    isRecurring: Joi.boolean().default(false),
    frequency: Joi.when('isRecurring', {
      is: true,
      then: Joi.string().valid('daily', 'weekly', 'monthly', 'seasonal').required(),
      otherwise: Joi.string()
    }),
    previousOccurrences: Joi.array().items(Joi.object({
      date: dateSchema.required(),
      severity: Joi.string().valid(...severityLevels).required(),
      description: Joi.string().max(300)
    })),
    seasonalPattern: Joi.boolean().default(false),
    deteriorationRate: Joi.string().valid('rapid', 'moderate', 'slow', 'stable', 'improving')
  }),
  
  // Evidence and documentation
  evidence: Joi.array().items(Joi.object({
    type: Joi.string().valid('photo', 'video', 'audio', 'document', 'survey_data').required(),
    url: Joi.string().uri(),
    description: Joi.string().max(300),
    metadata: Joi.object({
      timestamp: dateSchema,
      location: coordinatesSchema,
      quality: Joi.string().valid('high', 'medium', 'low')
    })
  })),
  
  // Community input and validation
  communityValidation: Joi.object({
    validatedByMembers: Joi.array().items(objectId),
    communityConsensus: Joi.string().valid('strong', 'moderate', 'weak', 'disputed'),
    additionalWitnesses: Joi.number().integer().min(0).max(100),
    conflictingReports: Joi.boolean().default(false)
  }),
  
  // Recommendations and actions
  recommendedActions: Joi.array().items(Joi.object({
    actionType: Joi.string().valid(
      'immediate_intervention', 'investigation', 'community_meeting', 
      'health_screening', 'infrastructure_repair', 'policy_change', 
      'resource_allocation', 'awareness_campaign'
    ).required(),
    priority: Joi.string().valid('urgent', 'high', 'medium', 'low').required(),
    description: Joi.string().max(500).required(),
    estimatedCost: Joi.number().min(0),
    timeframe: Joi.string().valid('immediate', 'days', 'weeks', 'months'),
    responsibleParty: Joi.string().valid(
      'community', 'asha_worker', 'health_department', 'local_government', 
      'ngo', 'private_sector', 'state_government'
    )
  })),
  
  // Urgency and escalation
  requiresEscalation: Joi.boolean().default(false),
  
  escalationCriteria: Joi.when('requiresEscalation', {
    is: true,
    then: Joi.object({
      reason: Joi.string().valid(
        'life_threatening', 'disease_outbreak', 'environmental_disaster', 
        'infrastructure_collapse', 'social_unrest', 'resource_shortage'
      ).required(),
      escalateToLevel: Joi.string().valid(...escalationLevels).required(),
      urgencyLevel: Joi.string().valid('immediate', 'within_24h', 'within_week').required(),
      requiredResources: Joi.array().items(Joi.string())
    }),
    otherwise: Joi.object()
  }),
  
  // Tags and categories
  tags: Joi.array().items(Joi.string().max(50)).max(15),
  
  // Additional notes
  notes: Joi.string().max(1000),
  
  // Privacy and sensitivity
  sensitivityLevel: Joi.string().valid('public', 'restricted', 'confidential').default('public'),
  
  // Follow-up requirements
  followUpRequired: Joi.boolean().default(false),
  
  followUpSchedule: Joi.when('followUpRequired', {
    is: true,
    then: Joi.object({
      nextFollowUp: dateSchema.greater('now').required(),
      frequency: Joi.string().valid('daily', 'weekly', 'monthly').required(),
      assignedTo: objectId.required()
    }),
    otherwise: Joi.object()
  })
});

/**
 * Schema for updating community observations
 */
export const updateCommunityObservationSchema = Joi.object({
  description: Joi.string().min(20).max(2000),
  
  severity: Joi.string().valid(...severityLevels),
  
  status: Joi.string().valid(...observationStatuses),
  
  affectedPopulation: Joi.object({
    households: Joi.number().integer().min(1).max(10000),
    individuals: Joi.number().integer().min(1).max(50000),
    children: Joi.number().integer().min(0),
    adults: Joi.number().integer().min(0),
    elderly: Joi.number().integer().min(0),
    vulnerableGroups: Joi.array().items(Joi.string())
  }),
  
  environmentalContext: Joi.object(),
  socialContext: Joi.object(),
  trendData: Joi.object(),
  
  evidence: Joi.array().items(Joi.object({
    type: Joi.string().valid('photo', 'video', 'audio', 'document', 'survey_data').required(),
    url: Joi.string().uri(),
    description: Joi.string().max(300),
    metadata: Joi.object()
  })),
  
  recommendedActions: Joi.array().items(Joi.object()),
  
  requiresEscalation: Joi.boolean(),
  escalationCriteria: Joi.object(),
  
  tags: Joi.array().items(Joi.string().max(50)).max(15),
  notes: Joi.string().max(1000),
  sensitivityLevel: Joi.string().valid('public', 'restricted', 'confidential'),
  
  followUpRequired: Joi.boolean(),
  followUpSchedule: Joi.object()
}).min(1);

/**
 * Schema for escalating observations
 */
export const escalateObservationSchema = Joi.object({
  escalationLevel: Joi.string().valid(...escalationLevels).required(),
  
  escalationReason: Joi.string().valid(
    'life_threatening', 'disease_outbreak', 'environmental_disaster', 
    'infrastructure_collapse', 'social_unrest', 'resource_shortage',
    'lack_of_response', 'complexity_beyond_scope'
  ).required(),
  
  urgencyLevel: Joi.string().valid('immediate', 'within_24h', 'within_week').required(),
  
  escalatedBy: objectId.required(),
  
  escalatedTo: objectId,
  
  additionalContext: Joi.string().max(1000),
  
  requiredResources: Joi.array().items(Joi.object({
    type: Joi.string().valid('personnel', 'equipment', 'funding', 'expertise').required(),
    description: Joi.string().max(200),
    quantity: Joi.string().max(100),
    urgency: Joi.string().valid('immediate', 'urgent', 'normal').default('normal')
  })),
  
  expectedOutcome: Joi.string().max(500),
  
  escalationDeadline: dateSchema.greater('now')
});

/**
 * Schema for adding follow-up to community observations
 */
export const addFollowUpSchema = Joi.object({
  followUpType: Joi.string().valid(
    'status_check', 'progress_review', 'additional_assessment', 
    'resource_allocation', 'completion_verification'
  ).required(),
  
  description: Joi.string().max(1000).required(),
  
  actionsTaken: Joi.array().items(Joi.string().max(200)),
  
  currentStatus: Joi.string().valid(
    'no_change', 'improving', 'worsening', 'resolved', 'escalated'
  ).required(),
  
  nextSteps: Joi.string().max(500),
  
  scheduledDate: dateSchema,
  
  assignedTo: objectId,
  
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium')
});

/**
 * Schema for querying community observations
 */
export const queryCommunityObservationsSchema = Joi.object({
  observationType: Joi.string().valid(...observationTypes),
  
  severity: Joi.string().valid(...severityLevels),
  
  status: Joi.string().valid(...observationStatuses),
  
  observerId: objectId,
  
  areaId: objectId,
  
  villageId: objectId,
  
  // Date filters
  observationDateFrom: dateSchema,
  observationDateTo: dateSchema,
  createdDateFrom: dateSchema,
  createdDateTo: dateSchema,
  
  // Geographic filters
  withinArea: Joi.object({
    center: coordinatesSchema.required(),
    radiusKm: Joi.number().min(0.1).max(100).default(10)
  }),
  
  // Population filters
  minAffectedPopulation: Joi.number().integer().min(1),
  maxAffectedPopulation: Joi.number().integer(),
  
  // Escalation filters
  requiresEscalation: Joi.boolean(),
  escalationLevel: Joi.string().valid(...escalationLevels),
  
  // Trend filters
  isRecurring: Joi.boolean(),
  hasSeasonalPattern: Joi.boolean(),
  
  // Sensitivity filter
  sensitivityLevel: Joi.array().items(Joi.string().valid('public', 'restricted', 'confidential')),
  
  // Search
  search: Joi.string().min(1).max(200),
  
  // Tags
  tags: Joi.array().items(Joi.string()),
  
  ...paginationSchema
});

/**
 * Schema for community observation patterns analysis
 */
export const observationPatternsSchema = Joi.object({
  analysisType: Joi.string().valid(
    'geographic_clustering', 'temporal_patterns', 'severity_trends',
    'type_distribution', 'escalation_patterns', 'resolution_efficiency'
  ).required(),
  
  areaIds: Joi.array().items(objectId),
  
  dateFrom: dateSchema.required(),
  
  dateTo: dateSchema.required().min(Joi.ref('dateFrom')),
  
  observationTypes: Joi.array().items(Joi.string().valid(...observationTypes)),
  
  groupBy: Joi.string().valid('area', 'village', 'type', 'severity', 'week', 'month').default('month'),
  
  includeEnvironmentalFactors: Joi.boolean().default(false),
  
  includeSocialFactors: Joi.boolean().default(false),
  
  clusteringParameters: Joi.object({
    radiusKm: Joi.number().min(0.1).max(50).default(5),
    minObservations: Joi.number().integer().min(2).max(100).default(3)
  })
});

/**
 * Custom validator for community area boundaries
 */
export const validateWithinCommunityBounds = (coordinates, areaBounds) => {
  // Implementation would check if coordinates fall within community area bounds
  return true; // Simplified for now
};

/**
 * Custom validator for escalation criteria
 */
export const validateEscalationCriteria = (observation) => {
  const { severity, affectedPopulation, observationType, requiresEscalation } = observation;
  
  // Auto-escalation rules
  const autoEscalationRules = {
    critical_severity: severity === 'critical',
    large_population: affectedPopulation?.individuals > 1000,
    disease_outbreak: observationType === 'disease_patterns' && severity === 'high',
    infrastructure_failure: observationType === 'infrastructure_assessments' && severity === 'critical'
  };
  
  const shouldEscalate = Object.values(autoEscalationRules).some(rule => rule);
  
  if (shouldEscalate && !requiresEscalation) {
    return { valid: false, message: 'Observation meets auto-escalation criteria' };
  }
  
  return { valid: true };
};

export default {
  createCommunityObservationSchema,
  updateCommunityObservationSchema,
  escalateObservationSchema,
  queryCommunityObservationsSchema,
  observationPatternsSchema,
  validateWithinCommunityBounds,
  validateEscalationCriteria
};