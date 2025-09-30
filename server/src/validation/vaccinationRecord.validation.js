import Joi from 'joi';

/**
 * Vaccination Record Validation Schemas
 * Comprehensive Joi validation schemas for vaccination tracking operations
 */

// Common schemas
const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/).message('Invalid ObjectId format');
const dateSchema = Joi.date().iso();
const paginationSchema = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().valid('scheduledDate', 'vaccineType', 'status', 'createdAt').default('scheduledDate'),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc')
};

// Vaccine types and administration sites
const vaccineTypes = [
  'BCG', 'Hepatitis_B', 'OPV', 'DPT', 'Hib', 'Rotavirus', 'Pneumococcal',
  'IPV', 'Measles', 'Japanese_Encephalitis', 'Vitamin_A', 'DPT_Booster',
  'Measles_Booster', 'Typhoid', 'HPV', 'Td', 'COVID_19', 'Influenza'
];

const administrationSites = [
  'left_arm', 'right_arm', 'left_thigh', 'right_thigh', 'oral', 'nasal'
];

const vaccinationStatuses = [
  'scheduled', 'completed', 'overdue', 'missed', 'cancelled', 'rescheduled'
];

/**
 * Schema for creating vaccination records
 */
export const createVaccinationSchema = Joi.object({
  patientId: objectId.required()
    .messages({
      'any.required': 'Patient ID is required',
      'string.pattern.base': 'Invalid patient ID format'
    }),
    
  vaccineType: Joi.string().valid(...vaccineTypes).required()
    .messages({
      'any.required': 'Vaccine type is required',
      'any.only': 'Invalid vaccine type'
    }),
    
  scheduledDate: dateSchema.required()
    .min('now')
    .messages({
      'any.required': 'Scheduled date is required',
      'date.min': 'Scheduled date cannot be in the past'
    }),
    
  administratorId: objectId.required()
    .messages({
      'any.required': 'Administrator ID is required',
      'string.pattern.base': 'Invalid administrator ID format'
    }),
    
  // Vaccine details
  vaccineName: Joi.string().min(2).max(100).required()
    .messages({
      'any.required': 'Vaccine name is required',
      'string.min': 'Vaccine name must be at least 2 characters',
      'string.max': 'Vaccine name cannot exceed 100 characters'
    }),
    
  manufacturer: Joi.string().min(2).max(100),
  
  batchNumber: Joi.string().min(2).max(50),
  
  // Dose information
  doseNumber: Joi.number().integer().min(1).max(10).default(1),
  
  totalDoses: Joi.number().integer().min(1).max(10).default(1),
  
  // Administration details
  administrationSite: Joi.string().valid(...administrationSites),
  
  notes: Joi.string().max(500),
  
  // Location
  villageId: objectId,
  
  // Follow-up information
  nextDueDate: dateSchema.greater(Joi.ref('scheduledDate')),
  
  // Priority and category
  priority: Joi.string().valid('routine', 'urgent', 'catch_up').default('routine'),
  
  category: Joi.string().valid('infant', 'child', 'adolescent', 'adult', 'elderly').default('infant')
});

/**
 * Schema for updating vaccination records
 */
export const updateVaccinationSchema = Joi.object({
  scheduledDate: dateSchema,
  
  administratorId: objectId,
  
  vaccineName: Joi.string().min(2).max(100),
  
  manufacturer: Joi.string().min(2).max(100),
  
  batchNumber: Joi.string().min(2).max(50),
  
  administrationSite: Joi.string().valid(...administrationSites),
  
  notes: Joi.string().max(500),
  
  nextDueDate: dateSchema,
  
  priority: Joi.string().valid('routine', 'urgent', 'catch_up'),
  
  status: Joi.string().valid(...vaccinationStatuses)
}).min(1);

/**
 * Schema for marking vaccination as administered
 */
export const administerVaccinationSchema = Joi.object({
  administeredDate: dateSchema.required()
    .max('now')
    .messages({
      'any.required': 'Administration date is required',
      'date.max': 'Administration date cannot be in the future'
    }),
    
  administratorId: objectId.required(),
  
  administrationSite: Joi.string().valid(...administrationSites).required()
    .messages({
      'any.required': 'Administration site is required'
    }),
    
  batchNumber: Joi.string().min(2).max(50).required()
    .messages({
      'any.required': 'Batch number is required'
    }),
    
  manufacturer: Joi.string().min(2).max(100),
  
  adverseReactions: Joi.string().max(1000),
  
  notes: Joi.string().max(500),
  
  // Vital signs if applicable
  temperature: Joi.number().min(95).max(110),
  
  weight: Joi.number().min(1).max(200),
  
  // Follow-up
  followUpRequired: Joi.boolean().default(false),
  
  followUpDate: Joi.when('followUpRequired', {
    is: true,
    then: dateSchema.greater('now').required(),
    otherwise: dateSchema
  })
});

/**
 * Schema for rescheduling vaccination
 */
export const rescheduleVaccinationSchema = Joi.object({
  newScheduledDate: dateSchema.required()
    .min('now')
    .messages({
      'any.required': 'New scheduled date is required',
      'date.min': 'New scheduled date cannot be in the past'
    }),
    
  reason: Joi.string().valid(
    'patient_unavailable', 'vaccine_unavailable', 'illness', 'weather', 
    'emergency', 'administrative', 'other'
  ).required(),
  
  notes: Joi.string().max(500),
  
  rescheduledBy: objectId.required()
});

/**
 * Schema for querying vaccinations
 */
export const queryVaccinationsSchema = Joi.object({
  patientId: objectId,
  
  vaccineType: Joi.string().valid(...vaccineTypes),
  
  status: Joi.string().valid(...vaccinationStatuses),
  
  administratorId: objectId,
  
  villageId: objectId,
  
  // Date filters
  scheduledDateFrom: dateSchema,
  scheduledDateTo: dateSchema,
  administeredDateFrom: dateSchema,
  administeredDateTo: dateSchema,
  
  // Age group filter
  ageGroup: Joi.string().valid('infant', 'child', 'adolescent', 'adult', 'elderly'),
  
  // Overdue filter
  overdueOnly: Joi.boolean(),
  
  // Due soon filter (within X days)
  dueSoonDays: Joi.number().integer().min(1).max(365),
  
  // Search
  search: Joi.string().min(1).max(100),
  
  ...paginationSchema
});

/**
 * Schema for vaccination coverage query
 */
export const vaccinationCoverageSchema = Joi.object({
  villageId: objectId,
  
  vaccineType: Joi.string().valid(...vaccineTypes),
  
  ageGroup: Joi.string().valid('infant', 'child', 'adolescent', 'adult', 'elderly'),
  
  dateFrom: dateSchema,
  
  dateTo: dateSchema.min(Joi.ref('dateFrom')),
  
  groupBy: Joi.string().valid('village', 'vaccineType', 'ageGroup', 'month').default('village')
});

/**
 * Custom validator for age-appropriate vaccines
 */
export const validateAgeAppropriateVaccine = (patientAge, vaccineType) => {
  const ageVaccineMap = {
    'BCG': { minAge: 0, maxAge: 1 },
    'Hepatitis_B': { minAge: 0, maxAge: 18 },
    'OPV': { minAge: 0, maxAge: 5 },
    'DPT': { minAge: 0, maxAge: 7 },
    'Measles': { minAge: 9, maxAge: 15 },
    'HPV': { minAge: 9, maxAge: 26 },
    'COVID_19': { minAge: 12, maxAge: 100 }
  };
  
  const ageRange = ageVaccineMap[vaccineType];
  if (!ageRange) return true; // No age restriction
  
  const ageInMonths = patientAge * 12; // Assuming age is in years
  return ageInMonths >= ageRange.minAge && ageInMonths <= ageRange.maxAge;
};

/**
 * Custom validator for dose sequence
 */
export const validateDoseSequence = (patientVaccinations, vaccineType, doseNumber) => {
  const previousDoses = patientVaccinations.filter(v => 
    v.vaccineType === vaccineType && v.status === 'completed'
  );
  
  const expectedDoseNumber = previousDoses.length + 1;
  return doseNumber === expectedDoseNumber;
};

/**
 * Schema for vaccination certificate request
 */
export const vaccinationCertificateSchema = Joi.object({
  patientId: objectId.required(),
  
  vaccineTypes: Joi.array().items(Joi.string().valid(...vaccineTypes)),
  
  dateFrom: dateSchema,
  
  dateTo: dateSchema.min(Joi.ref('dateFrom')),
  
  format: Joi.string().valid('pdf', 'json').default('pdf'),
  
  includeQRCode: Joi.boolean().default(true)
});

export default {
  createVaccinationSchema,
  updateVaccinationSchema,
  administerVaccinationSchema,
  rescheduleVaccinationSchema,
  queryVaccinationsSchema,
  vaccinationCoverageSchema,
  vaccinationCertificateSchema,
  validateAgeAppropriateVaccine,
  validateDoseSequence
};