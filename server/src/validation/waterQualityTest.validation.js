import Joi from 'joi';

/**
 * Joi validation schemas for water quality test operations
 */

// Common schemas for reuse
const coordinatesSchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required()
});

const weatherConditionsSchema = Joi.object({
  temperature: Joi.number().min(-50).max(60),
  humidity: Joi.number().min(0).max(100),
  rainfall: Joi.number().min(0),
  windSpeed: Joi.number().min(0)
});

// Test parameters schemas
const physicalParametersSchema = Joi.object({
  turbidity: Joi.number().min(0),
  color: Joi.string().max(50),
  odor: Joi.string().max(100),
  taste: Joi.string().max(100),
  temperature: Joi.number().min(0).max(100)
});

const chemicalParametersSchema = Joi.object({
  ph: Joi.number().min(0).max(14),
  dissolvedOxygen: Joi.number().min(0),
  biochemicalOxygenDemand: Joi.number().min(0),
  chemicalOxygenDemand: Joi.number().min(0),
  totalDissolvedSolids: Joi.number().min(0),
  totalSuspendedSolids: Joi.number().min(0),
  hardness: Joi.number().min(0),
  alkalinity: Joi.number().min(0),
  chloride: Joi.number().min(0),
  sulfate: Joi.number().min(0),
  nitrate: Joi.number().min(0),
  phosphate: Joi.number().min(0),
  ammonia: Joi.number().min(0),
  iron: Joi.number().min(0),
  manganese: Joi.number().min(0),
  copper: Joi.number().min(0),
  zinc: Joi.number().min(0),
  lead: Joi.number().min(0),
  cadmium: Joi.number().min(0),
  mercury: Joi.number().min(0),
  arsenic: Joi.number().min(0),
  fluoride: Joi.number().min(0),
  residualChlorine: Joi.number().min(0)
});

const biologicalParametersSchema = Joi.object({
  totalColiformCount: Joi.number().min(0),
  fecalColiformCount: Joi.number().min(0),
  eColi: Joi.number().min(0),
  enterococci: Joi.number().min(0),
  salmonella: Joi.boolean(),
  shigella: Joi.boolean(),
  vibrioCholera: Joi.boolean()
});

const remediationActionSchema = Joi.object({
  actionType: Joi.string().valid(
    'chlorination',
    'boiling_advisory',
    'alternative_source',
    'filtration',
    'source_protection',
    'infrastructure_repair'
  ).required(),
  description: Joi.string().min(10).max(500).required(),
  implementedBy: Joi.string().required(),
  implementedAt: Joi.date(),
  estimatedCost: Joi.number().min(0),
  expectedCompletion: Joi.date(),
  status: Joi.string().valid('planned', 'in_progress', 'completed', 'cancelled').default('planned')
});

// Main validation schemas

/**
 * Schema for creating water quality tests
 */
const createWaterQualityTestSchema = Joi.object({
  // Required basic information
  villageId: Joi.string().required(),
  waterSourceId: Joi.string().required(),
  testType: Joi.string().valid('routine', 'follow_up', 'emergency', 'complaint_based').required(),
  testingMethod: Joi.string().valid('field_testing', 'laboratory_testing', 'rapid_testing').required(),
  conductedBy: Joi.string().required(),

  // Optional test parameters
  testParameters: Joi.object({
    physical: physicalParametersSchema,
    chemical: chemicalParametersSchema,
    biological: biologicalParametersSchema
  }),

  // Location and weather
  coordinates: coordinatesSchema,
  weatherConditions: weatherConditionsSchema,

  // Collection details
  collectionDetails: Joi.object({
    collectionTime: Joi.date().default(Date.now),
    collectionMethod: Joi.string().max(200),
    sampleVolume: Joi.number().min(0),
    preservatives: Joi.array().items(Joi.string()),
    transportConditions: Joi.string().max(200)
  }),

  // Results and recommendations
  overallStatus: Joi.string().valid('safe', 'moderate_risk', 'high_risk', 'contaminated'),
  riskLevel: Joi.string().valid('low', 'medium', 'high', 'critical'),
  testRemarks: Joi.string().max(500),
  recommendations: Joi.array().items(Joi.string().max(200)),
  
  // Follow-up and remediation
  requiresFollowUp: Joi.boolean().default(false),
  followUpDate: Joi.date(),
  remediationActions: Joi.array().items(remediationActionSchema),

  // Administrative
  laboratoryDetails: Joi.object({
    name: Joi.string(),
    address: Joi.string(),
    accreditation: Joi.string(),
    reportNumber: Joi.string()
  }),
  costDetails: Joi.object({
    testingCost: Joi.number().min(0),
    transportCost: Joi.number().min(0),
    totalCost: Joi.number().min(0)
  })
});

/**
 * Schema for updating water quality tests (partial updates allowed)
 */
const updateWaterQualityTestSchema = Joi.object({
  testType: Joi.string().valid('routine', 'follow_up', 'emergency', 'complaint_based'),
  testingMethod: Joi.string().valid('field_testing', 'laboratory_testing', 'rapid_testing'),
  
  testParameters: Joi.object({
    physical: physicalParametersSchema,
    chemical: chemicalParametersSchema,
    biological: biologicalParametersSchema
  }),

  coordinates: coordinatesSchema,
  weatherConditions: weatherConditionsSchema,
  
  collectionDetails: Joi.object({
    collectionTime: Joi.date(),
    collectionMethod: Joi.string().max(200),
    sampleVolume: Joi.number().min(0),
    preservatives: Joi.array().items(Joi.string()),
    transportConditions: Joi.string().max(200)
  }),

  overallStatus: Joi.string().valid('safe', 'moderate_risk', 'high_risk', 'contaminated'),
  riskLevel: Joi.string().valid('low', 'medium', 'high', 'critical'),
  testRemarks: Joi.string().max(500),
  recommendations: Joi.array().items(Joi.string().max(200)),
  
  requiresFollowUp: Joi.boolean(),
  followUpDate: Joi.date(),
  remediationActions: Joi.array().items(remediationActionSchema),

  laboratoryDetails: Joi.object({
    name: Joi.string(),
    address: Joi.string(),
    accreditation: Joi.string(),
    reportNumber: Joi.string()
  }),
  costDetails: Joi.object({
    testingCost: Joi.number().min(0),
    transportCost: Joi.number().min(0),
    totalCost: Joi.number().min(0)
  })
});

/**
 * Schema for querying water quality tests
 */
const queryWaterQualityTestsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  
  // Filters
  villageId: Joi.string(),
  waterSourceId: Joi.string(),
  testType: Joi.string().valid('routine', 'follow_up', 'emergency', 'complaint_based'),
  testingMethod: Joi.string().valid('field_testing', 'laboratory_testing', 'rapid_testing'),
  overallStatus: Joi.string().valid('safe', 'moderate_risk', 'high_risk', 'contaminated'),
  riskLevel: Joi.string().valid('low', 'medium', 'high', 'critical'),
  conductedBy: Joi.string(),
  
  // Date filters
  dateFrom: Joi.date(),
  dateTo: Joi.date(),
  testDateFrom: Joi.date(),
  testDateTo: Joi.date(),
  
  // Boolean filters
  requiresFollowUp: Joi.boolean(),
  hasRemediationActions: Joi.boolean(),
  
  // Sorting
  sortBy: Joi.string().valid('testDate', 'createdAt', 'overallStatus', 'riskLevel').default('testDate'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

/**
 * Schema for test result submission
 */
const testResultSubmissionSchema = Joi.object({
  testParameters: Joi.object({
    physical: physicalParametersSchema,
    chemical: chemicalParametersSchema,
    biological: biologicalParametersSchema
  }).required(),

  overallStatus: Joi.string().valid('safe', 'moderate_risk', 'high_risk', 'contaminated').required(),
  riskLevel: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
  testRemarks: Joi.string().max(500),
  recommendations: Joi.array().items(Joi.string().max(200)),
  
  laboratoryDetails: Joi.object({
    name: Joi.string().required(),
    address: Joi.string(),
    accreditation: Joi.string(),
    reportNumber: Joi.string().required()
  }),

  requiresFollowUp: Joi.boolean().default(false),
  followUpDate: Joi.when('requiresFollowUp', {
    is: true,
    then: Joi.date().greater('now').required(),
    otherwise: Joi.date()
  }),

  remediationActions: Joi.array().items(remediationActionSchema)
});

/**
 * Schema for parameter validation (route params)
 */
const waterQualityTestParamsSchema = Joi.object({
  id: Joi.string().required(),
  villageId: Joi.string()
});

export {
  createWaterQualityTestSchema,
  updateWaterQualityTestSchema,
  queryWaterQualityTestsSchema,
  testResultSubmissionSchema,
  waterQualityTestParamsSchema
};