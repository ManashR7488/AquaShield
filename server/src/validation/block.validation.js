import Joi from 'joi';
import { validateRequest } from '../middleware/validateRequest.js';

// Reusable schemas
const demographicsSchema = Joi.object({
  totalPopulation: Joi.number().integer().min(0).required(),
  malePopulation: Joi.number().integer().min(0).required(),
  femalePopulation: Joi.number().integer().min(0).required(),
  totalVillages: Joi.number().integer().min(1).required(),
  totalHouseholds: Joi.number().integer().min(0).optional(),
  ruralPopulation: Joi.number().integer().min(0).optional(),
  urbanPopulation: Joi.number().integer().min(0).optional(),
  literacyRate: Joi.number().min(0).max(100).optional(),
  childrenUnder5: Joi.number().integer().min(0).optional(),
  womenOfReproductiveAge: Joi.number().integer().min(0).optional(),
  elderlyPopulation: Joi.number().integer().min(0).optional(),
  tribalPopulation: Joi.number().integer().min(0).optional(),
  scPopulation: Joi.number().integer().min(0).optional(),
  stPopulation: Joi.number().integer().min(0).optional(),
  belowPovertyLine: Joi.number().integer().min(0).optional(),
  averageHouseholdSize: Joi.number().min(0).optional()
});

const healthInfrastructureSchema = Joi.object({
  primaryHealthCenters: Joi.number().integer().min(0).required(),
  communityHealthCenters: Joi.number().integer().min(0).required(),
  subHealthCenters: Joi.number().integer().min(0).required(),
  privateHospitals: Joi.number().integer().min(0).optional(),
  totalBeds: Joi.number().integer().min(0).optional(),
  doctors: Joi.number().integer().min(0).optional(),
  nurses: Joi.number().integer().min(0).optional(),
  anmWorkers: Joi.number().integer().min(0).optional(),
  ashaWorkers: Joi.number().integer().min(0).optional(),
  pharmacies: Joi.number().integer().min(0).optional(),
  laboratoryFacilities: Joi.number().integer().min(0).optional(),
  xrayFacilities: Joi.number().integer().min(0).optional(),
  ambulanceServices: Joi.number().integer().min(0).optional(),
  bloodStorageUnit: Joi.boolean().optional(),
  oxygenPlant: Joi.boolean().optional(),
  emergencyServices: Joi.boolean().optional(),
  maternalHealthServices: Joi.boolean().optional(),
  childImmunizationServices: Joi.boolean().optional(),
  tbTreatmentCenter: Joi.boolean().optional(),
  mentalHealthServices: Joi.boolean().optional(),
  specializedClinics: Joi.array().items(Joi.string()).optional(),
  telemedicineCenter: Joi.boolean().optional(),
  healthEducationCenter: Joi.boolean().optional()
});

const boundariesSchema = Joi.object({
  area: Joi.number().positive().required(), // in sq km
  coordinates: Joi.object({
    north: Joi.number().required(),
    south: Joi.number().required(),
    east: Joi.number().required(),
    west: Joi.number().required()
  }).required(),
  borderBlocks: Joi.array().items(Joi.string()).optional(),
  geographicFeatures: Joi.array().items(Joi.string()).optional(),
  terrain: Joi.string().valid('plain', 'hilly', 'mountainous', 'coastal', 'plateau', 'forest', 'desert').optional(),
  climate: Joi.string().valid('tropical', 'subtropical', 'temperate', 'arid', 'semi-arid', 'coastal').optional(),
  averageRainfall: Joi.number().min(0).optional(), // in mm
  soilType: Joi.string().valid('alluvial', 'black', 'red', 'laterite', 'desert', 'mountain').optional(),
  irrigationSources: Joi.array().items(
    Joi.string().valid('river', 'canal', 'tube_well', 'well', 'tank', 'check_dam')
  ).optional(),
  forestCoverage: Joi.number().min(0).max(100).optional(), // percentage
  waterBodies: Joi.array().items(Joi.string()).optional(),
  roadConnectivity: Joi.object({
    nationalHighways: Joi.number().integer().min(0).optional(),
    stateHighways: Joi.number().integer().min(0).optional(),
    districtRoads: Joi.number().integer().min(0).optional(),
    villageRoads: Joi.number().integer().min(0).optional(),
    allWeatherRoads: Joi.number().min(0).max(100).optional() // percentage
  }).optional()
});

const administrativeInfoSchema = Joi.object({
  blockHeadquarters: Joi.string().max(100).required(),
  establishedYear: Joi.number().integer().min(1947).max(new Date().getFullYear()).optional(),
  blockCode: Joi.string().alphanum().max(20).optional(),
  subdivisionName: Joi.string().max(100).optional(),
  assemblyConstituency: Joi.string().max(100).optional(),
  parliamentaryConstituency: Joi.string().max(100).optional(),
  policeStation: Joi.string().max(100).optional(),
  postOffices: Joi.number().integer().min(0).optional(),
  bankBranches: Joi.number().integer().min(0).optional(),
  cooperativeSocieties: Joi.number().integer().min(0).optional(),
  fairPriceShops: Joi.number().integer().min(0).optional(),
  aganwadiCenters: Joi.number().integer().min(0).optional(),
  schools: Joi.object({
    primary: Joi.number().integer().min(0).optional(),
    upperPrimary: Joi.number().integer().min(0).optional(),
    secondary: Joi.number().integer().min(0).optional(),
    higherSecondary: Joi.number().integer().min(0).optional(),
    college: Joi.number().integer().min(0).optional()
  }).optional(),
  electricityConnectivity: Joi.number().min(0).max(100).optional(), // percentage
  drinkingWaterAccess: Joi.number().min(0).max(100).optional(), // percentage
  sanitationCoverage: Joi.number().min(0).max(100).optional(), // percentage
  internetConnectivity: Joi.number().min(0).max(100).optional() // percentage
});

/**
 * Block Registration Validation
 */
const blockRegistrationSchema = Joi.object({
  token: Joi.string()
    .trim()
    .min(10)
    .max(100)
    .required()
    .messages({
      'string.min': 'Registration token must be at least 10 characters long',
      'string.max': 'Registration token cannot exceed 100 characters',
      'any.required': 'Registration token is required'
    }),

  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Block name must be at least 2 characters long',
      'string.max': 'Block name cannot exceed 100 characters',
      'any.required': 'Block name is required'
    }),

  blockType: Joi.string()
    .valid('rural', 'urban', 'tribal', 'coastal', 'hill')
    .required()
    .messages({
      'any.only': 'Block type must be one of: rural, urban, tribal, coastal, hill',
      'any.required': 'Block type is required'
    }),

  boundaries: boundariesSchema.required(),

  demographics: demographicsSchema.required(),

  healthInfrastructure: healthInfrastructureSchema.required(),

  administrativeInfo: administrativeInfoSchema.required(),

  blockOfficer: Joi.object({
    userId: Joi.string().hex().length(24).optional(),
    contactNumber: Joi.string().pattern(/^[0-9]{10}$/).optional(),
    email: Joi.string().email().optional()
  }).optional(),

  description: Joi.string().max(1000).optional(),

  specialFeatures: Joi.array().items(Joi.string().max(100)).optional(),

  economicProfile: Joi.object({
    majorOccupations: Joi.array().items(Joi.string()).optional(),
    agriculture: Joi.object({
      majorCrops: Joi.array().items(Joi.string()).optional(),
      irrigationCoverage: Joi.number().min(0).max(100).optional(),
      organicFarming: Joi.boolean().optional()
    }).optional(),
    industries: Joi.array().items(Joi.string()).optional(),
    handicrafts: Joi.array().items(Joi.string()).optional(),
    tourism: Joi.object({
      touristSpots: Joi.array().items(Joi.string()).optional(),
      annualVisitors: Joi.number().integer().min(0).optional()
    }).optional(),
    employmentRate: Joi.number().min(0).max(100).optional(),
    migrationPattern: Joi.string().valid('in-migration', 'out-migration', 'stable').optional()
  }).optional(),

  challengesAndNeeds: Joi.object({
    majorChallenges: Joi.array().items(Joi.string()).optional(),
    infrastructureNeeds: Joi.array().items(Joi.string()).optional(),
    healthcareGaps: Joi.array().items(Joi.string()).optional(),
    developmentPriorities: Joi.array().items(Joi.string()).optional()
  }).optional()
});

/**
 * Update Block Validation
 */
const updateBlockSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .optional(),

  blockType: Joi.string()
    .valid('rural', 'urban', 'tribal', 'coastal', 'hill')
    .optional(),

  boundaries: boundariesSchema.optional(),

  demographics: demographicsSchema.optional(),

  healthInfrastructure: healthInfrastructureSchema.optional(),

  administrativeInfo: administrativeInfoSchema.optional(),

  description: Joi.string().max(1000).optional(),

  specialFeatures: Joi.array().items(Joi.string().max(100)).optional(),

  economicProfile: Joi.object({
    majorOccupations: Joi.array().items(Joi.string()).optional(),
    agriculture: Joi.object({
      majorCrops: Joi.array().items(Joi.string()).optional(),
      irrigationCoverage: Joi.number().min(0).max(100).optional(),
      organicFarming: Joi.boolean().optional()
    }).optional(),
    industries: Joi.array().items(Joi.string()).optional(),
    handicrafts: Joi.array().items(Joi.string()).optional(),
    tourism: Joi.object({
      touristSpots: Joi.array().items(Joi.string()).optional(),
      annualVisitors: Joi.number().integer().min(0).optional()
    }).optional(),
    employmentRate: Joi.number().min(0).max(100).optional(),
    migrationPattern: Joi.string().valid('in-migration', 'out-migration', 'stable').optional()
  }).optional(),

  challengesAndNeeds: Joi.object({
    majorChallenges: Joi.array().items(Joi.string()).optional(),
    infrastructureNeeds: Joi.array().items(Joi.string()).optional(),
    healthcareGaps: Joi.array().items(Joi.string()).optional(),
    developmentPriorities: Joi.array().items(Joi.string()).optional()
  }).optional(),

  status: Joi.string()
    .valid('active', 'inactive', 'suspended', 'pending_approval', 'rejected')
    .optional()
}).min(1); // At least one field must be provided for update

/**
 * Assign Block Officer Validation
 */
const assignBlockOfficerSchema = Joi.object({
  userId: Joi.string()
    .hex()
    .length(24)
    .required()
    .messages({
      'string.hex': 'User ID must be a valid hexadecimal string',
      'string.length': 'User ID must be exactly 24 characters long',
      'any.required': 'User ID is required'
    }),

  contactNumber: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      'string.pattern.base': 'Contact number must be exactly 10 digits',
      'any.required': 'Contact number is required'
    }),

  email: Joi.string()
    .email()
    .optional()
    .messages({
      'string.email': 'Please provide a valid email address'
    }),

  additionalResponsibilities: Joi.array().items(Joi.string().max(100)).optional(),
  
  appointmentOrder: Joi.string().max(100).optional(),
  
  notes: Joi.string().max(500).optional()
});

/**
 * Approve Block Validation
 */
const approveBlockSchema = Joi.object({
  remarks: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Approval remarks cannot exceed 500 characters'
    }),

  conditions: Joi.array().items(Joi.string().max(200)).optional(),
  
  validityPeriod: Joi.number().integer().min(1).max(120).optional(), // months
  
  reviewDate: Joi.date().min('now').optional()
});

/**
 * Reject Block Validation
 */
const rejectBlockSchema = Joi.object({
  reason: Joi.string()
    .min(10)
    .max(500)
    .required()
    .messages({
      'string.min': 'Rejection reason must be at least 10 characters long',
      'string.max': 'Rejection reason cannot exceed 500 characters',
      'any.required': 'Rejection reason is required'
    }),

  category: Joi.string()
    .valid(
      'incomplete_information',
      'invalid_data',
      'duplicate_registration',
      'insufficient_infrastructure',
      'policy_violation',
      'other'
    )
    .optional(),

  suggestedImprovements: Joi.array().items(Joi.string().max(200)).optional(),
  
  canReapply: Joi.boolean().default(true).optional(),
  
  reapplicationGuidance: Joi.string().max(1000).optional()
});

/**
 * Status Update Validation
 */
const statusUpdateSchema = Joi.object({
  status: Joi.string()
    .valid('active', 'inactive', 'suspended', 'under_review', 'pending_approval', 'rejected')
    .required()
    .messages({
      'any.only': 'Status must be one of: active, inactive, suspended, under_review, pending_approval, rejected',
      'any.required': 'Status is required'
    }),

  reason: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Reason cannot exceed 500 characters'
    }),

  effectiveDate: Joi.date().optional(),
  
  reviewDate: Joi.date().min('now').optional(),
  
  notifyOfficer: Joi.boolean().default(true).optional(),
  
  additionalNotes: Joi.string().max(1000).optional()
});

/**
 * Block Search Validation
 */
const blockSearchSchema = Joi.object({
  query: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Search query cannot be empty',
      'string.max': 'Search query cannot exceed 100 characters'
    }),

  districtId: Joi.string().hex().length(24).optional(),

  state: Joi.string().trim().max(50).optional(),

  blockType: Joi.string().valid('rural', 'urban', 'tribal', 'coastal', 'hill').optional(),

  status: Joi.string()
    .valid('active', 'inactive', 'suspended', 'pending_approval', 'rejected', 'all')
    .default('all')
    .optional(),

  demographics: Joi.object({
    minPopulation: Joi.number().integer().min(0).optional(),
    maxPopulation: Joi.number().integer().min(0).optional(),
    minVillages: Joi.number().integer().min(1).optional(),
    maxVillages: Joi.number().integer().min(1).optional(),
    minLiteracyRate: Joi.number().min(0).max(100).optional(),
    maxLiteracyRate: Joi.number().min(0).max(100).optional()
  }).optional(),

  healthInfrastructure: Joi.object({
    minPHCs: Joi.number().integer().min(0).optional(),
    minCHCs: Joi.number().integer().min(0).optional(),
    minSHCs: Joi.number().integer().min(0).optional(),
    hasEmergencyServices: Joi.boolean().optional(),
    hasAmbulance: Joi.boolean().optional(),
    minDoctors: Joi.number().integer().min(0).optional(),
    minNurses: Joi.number().integer().min(0).optional()
  }).optional(),

  boundaries: Joi.object({
    minArea: Joi.number().positive().optional(),
    maxArea: Joi.number().positive().optional(),
    terrain: Joi.string().valid('plain', 'hilly', 'mountainous', 'coastal', 'plateau', 'forest', 'desert').optional(),
    climate: Joi.string().valid('tropical', 'subtropical', 'temperate', 'arid', 'semi-arid', 'coastal').optional()
  }).optional(),

  administrativeInfo: Joi.object({
    hasInternet: Joi.boolean().optional(),
    hasElectricity: Joi.boolean().optional(),
    hasCleanWater: Joi.boolean().optional(),
    hasSanitation: Joi.boolean().optional()
  }).optional(),

  sortBy: Joi.string()
    .valid('name', 'createdAt', 'totalPopulation', 'area', 'status')
    .default('createdAt')
    .optional(),

  sortOrder: Joi.string().valid('asc', 'desc').default('desc').optional(),

  limit: Joi.number().integer().min(1).max(100).default(50).optional()
});

// Validation middleware functions
export const validateBlockRegistration = validateRequest(blockRegistrationSchema);
export const validateUpdateBlock = validateRequest(updateBlockSchema);
export const validateAssignBlockOfficer = validateRequest(assignBlockOfficerSchema);
export const validateApproveBlock = validateRequest(approveBlockSchema);
export const validateRejectBlock = validateRequest(rejectBlockSchema);
export const validateStatusUpdate = validateRequest(statusUpdateSchema);
export const validateBlockSearch = validateRequest(blockSearchSchema);

// Export schemas for potential reuse
export {
  blockRegistrationSchema,
  updateBlockSchema,
  assignBlockOfficerSchema,
  approveBlockSchema,
  rejectBlockSchema,
  statusUpdateSchema,
  blockSearchSchema,
  demographicsSchema,
  healthInfrastructureSchema,
  boundariesSchema,
  administrativeInfoSchema
};