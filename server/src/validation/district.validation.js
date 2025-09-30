import Joi from 'joi';
import { validateRequest } from '../middleware/validateRequest.js';

// Base schemas for reusable components
const demographicsSchema = Joi.object({
  totalPopulation: Joi.number().integer().min(0).required(),
  malePopulation: Joi.number().integer().min(0).required(),
  femalePopulation: Joi.number().integer().min(0).required(),
  ruralPopulation: Joi.number().integer().min(0).optional(),
  urbanPopulation: Joi.number().integer().min(0).optional(),
  literacyRate: Joi.number().min(0).max(100).optional(),
  childrenUnder5: Joi.number().integer().min(0).optional(),
  womenOfReproductiveAge: Joi.number().integer().min(0).optional(),
  elderlyPopulation: Joi.number().integer().min(0).optional(),
  tribalPopulation: Joi.number().integer().min(0).optional(),
  scPopulation: Joi.number().integer().min(0).optional(),
  stPopulation: Joi.number().integer().min(0).optional()
});

const healthInfrastructureSchema = Joi.object({
  districtHospitals: Joi.number().integer().min(0).required(),
  communityHealthCenters: Joi.number().integer().min(0).required(),
  primaryHealthCenters: Joi.number().integer().min(0).required(),
  subHealthCenters: Joi.number().integer().min(0).required(),
  privateHospitals: Joi.number().integer().min(0).optional(),
  totalBeds: Joi.number().integer().min(0).optional(),
  doctors: Joi.number().integer().min(0).optional(),
  nurses: Joi.number().integer().min(0).optional(),
  anmWorkers: Joi.number().integer().min(0).optional(),
  ashaWorkers: Joi.number().integer().min(0).optional(),
  specializedServices: Joi.array().items(Joi.string()).optional(),
  emergencyServices: Joi.boolean().optional(),
  ambulanceServices: Joi.number().integer().min(0).optional(),
  bloodBank: Joi.boolean().optional(),
  diagnosticFacilities: Joi.array().items(Joi.string()).optional()
});

const boundariesSchema = Joi.object({
  area: Joi.number().positive().required(), // in sq km
  coordinates: Joi.object({
    north: Joi.number().required(),
    south: Joi.number().required(),
    east: Joi.number().required(),
    west: Joi.number().required()
  }).required(),
  borderDistricts: Joi.array().items(Joi.string()).optional(),
  geographicFeatures: Joi.array().items(Joi.string()).optional(),
  climate: Joi.string().valid('tropical', 'subtropical', 'temperate', 'arid', 'semi-arid', 'coastal').optional(),
  terrain: Joi.string().valid('plain', 'hilly', 'mountainous', 'coastal', 'plateau', 'forest').optional(),
  averageRainfall: Joi.number().min(0).optional(), // in mm
  averageTemperature: Joi.object({
    min: Joi.number().required(),
    max: Joi.number().required()
  }).optional()
});

const blockRegistrationSchema = Joi.object({
  registrationEnabled: Joi.boolean().default(true),
  requiresApproval: Joi.boolean().default(false),
  autoGenerateTokens: Joi.boolean().default(true),
  tokenValidityDays: Joi.number().integer().min(1).max(365).default(30),
  maxBlocksAllowed: Joi.number().integer().min(1).max(200).default(50),
  allowedBlockTypes: Joi.array().items(
    Joi.string().valid('rural', 'urban', 'tribal', 'coastal', 'hill')
  ).optional(),
  registrationInstructions: Joi.string().max(1000).optional(),
  contactInfo: Joi.object({
    phone: Joi.string().pattern(/^[0-9]{10}$/).optional(),
    email: Joi.string().email().optional(),
    office: Joi.string().max(200).optional()
  }).optional()
});

/**
 * Create District Validation
 */
const createDistrictSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'District name must be at least 2 characters long',
      'string.max': 'District name cannot exceed 100 characters',
      'any.required': 'District name is required'
    }),

  state: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': 'State name must be at least 2 characters long',
      'string.max': 'State name cannot exceed 50 characters',
      'any.required': 'State name is required'
    }),

  code: Joi.string()
    .trim()
    .alphanum()
    .min(2)
    .max(10)
    .uppercase()
    .required()
    .messages({
      'string.alphanum': 'District code must contain only letters and numbers',
      'string.min': 'District code must be at least 2 characters long',
      'string.max': 'District code cannot exceed 10 characters',
      'any.required': 'District code is required'
    }),

  boundaries: boundariesSchema.required(),

  demographics: demographicsSchema.required(),

  healthInfrastructure: healthInfrastructureSchema.required(),

  blockRegistration: blockRegistrationSchema.optional(),

  districtOfficer: Joi.object({
    userId: Joi.string().hex().length(24).required(),
    contactNumber: Joi.string().pattern(/^[0-9]{10}$/).required(),
    email: Joi.string().email().optional()
  }).optional(),

  description: Joi.string().max(1000).optional(),
  
  specialFeatures: Joi.array().items(Joi.string().max(100)).optional(),
  
  majorCities: Joi.array().items(Joi.string().max(50)).optional(),
  
  economicProfile: Joi.object({
    majorIndustries: Joi.array().items(Joi.string()).optional(),
    agriculture: Joi.object({
      majorCrops: Joi.array().items(Joi.string()).optional(),
      irrigationCoverage: Joi.number().min(0).max(100).optional()
    }).optional(),
    employmentRate: Joi.number().min(0).max(100).optional(),
    povertyRate: Joi.number().min(0).max(100).optional()
  }).optional()
});

/**
 * Update District Validation
 */
const updateDistrictSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .optional(),

  code: Joi.string()
    .trim()
    .alphanum()
    .min(2)
    .max(10)
    .uppercase()
    .optional(),

  boundaries: boundariesSchema.optional(),

  demographics: demographicsSchema.optional(),

  healthInfrastructure: healthInfrastructureSchema.optional(),

  blockRegistration: blockRegistrationSchema.optional(),

  description: Joi.string().max(1000).optional(),
  
  specialFeatures: Joi.array().items(Joi.string().max(100)).optional(),
  
  majorCities: Joi.array().items(Joi.string().max(50)).optional(),
  
  economicProfile: Joi.object({
    majorIndustries: Joi.array().items(Joi.string()).optional(),
    agriculture: Joi.object({
      majorCrops: Joi.array().items(Joi.string()).optional(),
      irrigationCoverage: Joi.number().min(0).max(100).optional()
    }).optional(),
    employmentRate: Joi.number().min(0).max(100).optional(),
    povertyRate: Joi.number().min(0).max(100).optional()
  }).optional(),

  status: Joi.string().valid('active', 'inactive', 'suspended').optional()
}).min(1); // At least one field must be provided for update

/**
 * Assign District Officer Validation
 */
const assignOfficerSchema = Joi.object({
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
 * Generate Block Token Validation
 */
const generateTokenSchema = Joi.object({
  blockName: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Block name must be at least 2 characters long',
      'string.max': 'Block name cannot exceed 100 characters',
      'any.required': 'Block name is required'
    }),

  expiryDate: Joi.date()
    .min('now')
    .optional()
    .messages({
      'date.min': 'Expiry date cannot be in the past'
    }),

  notes: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Notes cannot exceed 500 characters'
    }),

  blockType: Joi.string()
    .valid('rural', 'urban', 'tribal', 'coastal', 'hill')
    .optional(),

  estimatedPopulation: Joi.number().integer().min(0).optional(),
  
  priority: Joi.string().valid('high', 'medium', 'low').default('medium').optional()
});

/**
 * Token Validation Schema
 */
const tokenValidationSchema = Joi.object({
  token: Joi.string()
    .trim()
    .min(10)
    .max(100)
    .required()
    .messages({
      'string.min': 'Token must be at least 10 characters long',
      'string.max': 'Token cannot exceed 100 characters',
      'any.required': 'Token is required'
    }),

  blockInfo: Joi.object({
    name: Joi.string().max(100).optional(),
    type: Joi.string().valid('rural', 'urban', 'tribal', 'coastal', 'hill').optional()
  }).optional()
});

/**
 * Status Update Validation
 */
const statusUpdateSchema = Joi.object({
  status: Joi.string()
    .valid('active', 'inactive', 'suspended', 'under_review')
    .required()
    .messages({
      'any.only': 'Status must be one of: active, inactive, suspended, under_review',
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
  
  notifyOfficer: Joi.boolean().default(true).optional()
});

/**
 * District Search Validation
 */
const districtSearchSchema = Joi.object({
  query: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Search query cannot be empty',
      'string.max': 'Search query cannot exceed 100 characters'
    }),

  state: Joi.string().trim().max(50).optional(),

  status: Joi.string().valid('active', 'inactive', 'suspended', 'all').default('all').optional(),

  districtOfficer: Joi.string().hex().length(24).optional(),

  demographics: Joi.object({
    minPopulation: Joi.number().integer().min(0).optional(),
    maxPopulation: Joi.number().integer().min(0).optional(),
    minLiteracyRate: Joi.number().min(0).max(100).optional(),
    maxLiteracyRate: Joi.number().min(0).max(100).optional()
  }).optional(),

  healthInfrastructure: Joi.object({
    minHospitals: Joi.number().integer().min(0).optional(),
    minPHCs: Joi.number().integer().min(0).optional(),
    minCHCs: Joi.number().integer().min(0).optional(),
    hasEmergencyServices: Joi.boolean().optional(),
    hasBloodBank: Joi.boolean().optional()
  }).optional(),

  boundaries: Joi.object({
    minArea: Joi.number().positive().optional(),
    maxArea: Joi.number().positive().optional(),
    climate: Joi.string().valid('tropical', 'subtropical', 'temperate', 'arid', 'semi-arid', 'coastal').optional(),
    terrain: Joi.string().valid('plain', 'hilly', 'mountainous', 'coastal', 'plateau', 'forest').optional()
  }).optional(),

  sortBy: Joi.string()
    .valid('name', 'state', 'createdAt', 'totalPopulation', 'area')
    .default('createdAt')
    .optional(),

  sortOrder: Joi.string().valid('asc', 'desc').default('desc').optional(),

  limit: Joi.number().integer().min(1).max(100).default(20).optional()
});

// Validation middleware functions
export const validateCreateDistrict = validateRequest(createDistrictSchema);
export const validateUpdateDistrict = validateRequest(updateDistrictSchema);
export const validateAssignOfficer = validateRequest(assignOfficerSchema);
export const validateGenerateToken = validateRequest(generateTokenSchema);
export const validateTokenValidation = validateRequest(tokenValidationSchema);
export const validateStatusUpdate = validateRequest(statusUpdateSchema);
export const validateDistrictSearch = validateRequest(districtSearchSchema);

// Export schemas for potential reuse
export {
  createDistrictSchema,
  updateDistrictSchema,
  assignOfficerSchema,
  generateTokenSchema,
  tokenValidationSchema,
  statusUpdateSchema,
  districtSearchSchema,
  demographicsSchema,
  healthInfrastructureSchema,
  boundariesSchema,
  blockRegistrationSchema
};