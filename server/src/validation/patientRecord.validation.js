import Joi from 'joi';

/**
 * Patient Record Validation Schemas
 * Comprehensive Joi validation schemas for patient record operations
 */

// Common schemas
const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/).message('Invalid ObjectId format');
const dateSchema = Joi.date().iso();
const phoneSchema = Joi.string().regex(/^[\+]?[1-9][\d]{0,15}$/).message('Invalid phone number format');

const paginationSchema = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().valid('name', 'dateOfBirth', 'registrationDate', 'healthId').default('name'),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc')
};

// Patient demographics and categories
const genderOptions = ['male', 'female', 'other'];
const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'];
const maritalStatuses = ['single', 'married', 'divorced', 'widowed', 'separated'];
const relationshipTypes = [
  'father', 'mother', 'son', 'daughter', 'husband', 'wife', 'brother', 'sister',
  'grandfather', 'grandmother', 'uncle', 'aunt', 'cousin', 'guardian', 'other'
];

/**
 * Schema for creating patient records
 */
export const createPatientRecordSchema = Joi.object({
  // Basic demographics
  name: Joi.object({
    firstName: Joi.string().min(2).max(50).required()
      .messages({
        'any.required': 'First name is required',
        'string.min': 'First name must be at least 2 characters',
        'string.max': 'First name cannot exceed 50 characters'
      }),
    lastName: Joi.string().min(1).max(50).required()
      .messages({
        'any.required': 'Last name is required'
      }),
    middleName: Joi.string().max(50),
    nickname: Joi.string().max(30)
  }).required(),
  
  dateOfBirth: dateSchema.required()
    .max('now')
    .messages({
      'any.required': 'Date of birth is required',
      'date.max': 'Date of birth cannot be in the future'
    }),
    
  gender: Joi.string().valid(...genderOptions).required()
    .messages({
      'any.required': 'Gender is required'
    }),
    
  // Location and residence
  villageId: objectId.required()
    .messages({
      'any.required': 'Village ID is required',
      'string.pattern.base': 'Invalid village ID format'
    }),
    
  address: Joi.object({
    houseNumber: Joi.string().max(20),
    street: Joi.string().max(100),
    locality: Joi.string().max(100),
    landmark: Joi.string().max(100),
    pincode: Joi.string().regex(/^\d{6}$/).message('Pincode must be 6 digits'),
    coordinates: Joi.object({
      latitude: Joi.number().min(-90).max(90),
      longitude: Joi.number().min(-180).max(180)
    })
  }),
  
  // Registration information
  registeredBy: objectId.required()
    .messages({
      'any.required': 'Registered by field is required'
    }),
    
  registrationDate: dateSchema.default(() => new Date()),
  
  // Health identification
  healthId: Joi.string().regex(/^[A-Z0-9]{10,20}$/)
    .message('Health ID must be 10-20 alphanumeric characters'),
    
  nationalId: Joi.object({
    type: Joi.string().valid('aadhaar', 'voter_id', 'pan', 'ration_card', 'other'),
    number: Joi.string().max(50)
  }),
  
  // Personal details
  personalDetails: Joi.object({
    bloodGroup: Joi.string().valid(...bloodGroups),
    maritalStatus: Joi.string().valid(...maritalStatuses),
    occupation: Joi.string().max(100),
    education: Joi.string().valid(
      'illiterate', 'primary', 'secondary', 'higher_secondary', 
      'graduate', 'post_graduate', 'professional'
    ),
    religion: Joi.string().max(50),
    caste: Joi.string().max(50),
    economicStatus: Joi.string().valid('bpl', 'apl', 'middle_class', 'upper_middle', 'affluent')
  }),
  
  // Contact information
  contactInfo: Joi.object({
    primaryPhone: phoneSchema,
    alternatePhone: phoneSchema,
    email: Joi.string().email().max(100),
    emergencyContact: Joi.object({
      name: Joi.string().max(100).required(),
      relationship: Joi.string().valid(...relationshipTypes).required(),
      phone: phoneSchema.required()
    })
  }),
  
  // Family relationships
  familyMembers: Joi.array().items(Joi.object({
    patientId: objectId,
    name: Joi.string().max(100),
    relationship: Joi.string().valid(...relationshipTypes).required(),
    dateOfBirth: dateSchema,
    gender: Joi.string().valid(...genderOptions),
    isEmergencyContact: Joi.boolean().default(false),
    livesInSameHouse: Joi.boolean().default(true)
  })),
  
  // Health profile
  healthProfile: Joi.object({
    allergies: Joi.array().items(Joi.object({
      allergen: Joi.string().max(100).required(),
      severity: Joi.string().valid('mild', 'moderate', 'severe').required(),
      reaction: Joi.string().max(300),
      diagnosedDate: dateSchema
    })),
    
    chronicConditions: Joi.array().items(Joi.object({
      condition: Joi.string().max(200).required(),
      diagnosisDate: dateSchema,
      severity: Joi.string().valid('mild', 'moderate', 'severe'),
      managementPlan: Joi.string().max(500),
      lastReviewDate: dateSchema
    })),
    
    medications: Joi.array().items(Joi.object({
      name: Joi.string().max(100).required(),
      dosage: Joi.string().max(50).required(),
      frequency: Joi.string().max(50).required(),
      startDate: dateSchema.required(),
      endDate: dateSchema,
      prescribedBy: objectId,
      indication: Joi.string().max(200)
    })),
    
    immunizationHistory: Joi.array().items(Joi.object({
      vaccine: Joi.string().max(100).required(),
      dateAdministered: dateSchema.required(),
      batchNumber: Joi.string().max(50),
      administeredBy: objectId,
      reactions: Joi.string().max(300)
    })),
    
    hospitalizations: Joi.array().items(Joi.object({
      admissionDate: dateSchema.required(),
      dischargeDate: dateSchema,
      facility: Joi.string().max(200).required(),
      diagnosis: Joi.string().max(300),
      treatmentSummary: Joi.string().max(1000)
    }))
  }),
  
  // Insurance and benefits
  insurance: Joi.object({
    hasInsurance: Joi.boolean().default(false),
    schemes: Joi.array().items(Joi.object({
      schemeName: Joi.string().max(100).required(),
      policyNumber: Joi.string().max(50).required(),
      validity: Joi.object({
        startDate: dateSchema.required(),
        endDate: dateSchema.required()
      }),
      coverageAmount: Joi.number().min(0),
      beneficiaryId: Joi.string().max(50)
    })),
    govtSchemes: Joi.array().items(Joi.string().valid(
      'ayushman_bharat', 'rashtriya_swasthya_bima_yojana', 'employee_state_insurance',
      'central_govt_health_scheme', 'state_health_insurance'
    ))
  }),
  
  // ASHA worker assignment
  ashaWorker: Joi.object({
    assignedASHA: objectId,
    assignmentDate: dateSchema.default(() => new Date()),
    assignmentReason: Joi.string().max(300),
    previousASHA: objectId
  }),
  
  // Special categories and flags
  specialCategories: Joi.array().items(Joi.string().valid(
    'pregnant', 'lactating', 'disabled', 'elderly', 'chronically_ill', 
    'malnourished', 'high_risk', 'migrant', 'tribal'
  )),
  
  // Privacy and consent
  consent: Joi.object({
    dataSharing: Joi.boolean().default(false),
    researchParticipation: Joi.boolean().default(false),
    photographyConsent: Joi.boolean().default(false),
    consentDate: dateSchema,
    consentWitnessedBy: objectId
  }),
  
  // Additional information
  notes: Joi.string().max(1000),
  
  // Status and flags
  status: Joi.string().valid('active', 'inactive', 'transferred', 'deceased').default('active'),
  
  isActive: Joi.boolean().default(true)
});

/**
 * Schema for updating patient records
 */
export const updatePatientRecordSchema = Joi.object({
  name: Joi.object({
    firstName: Joi.string().min(2).max(50),
    lastName: Joi.string().min(1).max(50),
    middleName: Joi.string().max(50),
    nickname: Joi.string().max(30)
  }),
  
  gender: Joi.string().valid(...genderOptions),
  
  address: Joi.object(),
  
  personalDetails: Joi.object(),
  
  contactInfo: Joi.object(),
  
  familyMembers: Joi.array().items(Joi.object()),
  
  healthProfile: Joi.object(),
  
  insurance: Joi.object(),
  
  ashaWorker: Joi.object(),
  
  specialCategories: Joi.array().items(Joi.string()),
  
  consent: Joi.object(),
  
  notes: Joi.string().max(1000),
  
  status: Joi.string().valid('active', 'inactive', 'transferred', 'deceased'),
  
  isActive: Joi.boolean()
}).min(1);

/**
 * Schema for linking family members
 */
export const linkFamilyMemberSchema = Joi.object({
  familyMemberPatientId: objectId.required()
    .messages({
      'any.required': 'Family member patient ID is required'
    }),
    
  relationship: Joi.string().valid(...relationshipTypes).required()
    .messages({
      'any.required': 'Relationship is required'
    }),
    
  isEmergencyContact: Joi.boolean().default(false),
  
  livesInSameHouse: Joi.boolean().default(true),
  
  notes: Joi.string().max(300)
});

/**
 * Schema for patient transfer
 */
export const transferPatientSchema = Joi.object({
  newVillageId: objectId.required()
    .messages({
      'any.required': 'New village ID is required'
    }),
    
  newASHAWorkerId: objectId,
  
  transferReason: Joi.string().valid(
    'relocation', 'marriage', 'employment', 'education', 'family_reasons', 'other'
  ).required(),
  
  transferDate: dateSchema.default(() => new Date()),
  
  newAddress: Joi.object({
    houseNumber: Joi.string().max(20),
    street: Joi.string().max(100),
    locality: Joi.string().max(100),
    landmark: Joi.string().max(100),
    pincode: Joi.string().regex(/^\d{6}$/),
    coordinates: Joi.object({
      latitude: Joi.number().min(-90).max(90),
      longitude: Joi.number().min(-180).max(180)
    })
  }),
  
  retainHealthRecords: Joi.boolean().default(true),
  
  notifyPreviousASHA: Joi.boolean().default(true),
  
  transferNotes: Joi.string().max(500),
  
  transferredBy: objectId.required()
});

/**
 * Schema for querying patient records
 */
export const queryPatientRecordsSchema = Joi.object({
  // Basic filters
  villageId: objectId,
  
  ashaWorkerId: objectId,
  
  gender: Joi.string().valid(...genderOptions),
  
  // Age filters
  ageFrom: Joi.number().integer().min(0).max(120),
  ageTo: Joi.number().integer().min(0).max(120),
  
  // Date filters
  registrationDateFrom: dateSchema,
  registrationDateTo: dateSchema,
  dobFrom: dateSchema,
  dobTo: dateSchema,
  
  // Health status filters
  hasChronicConditions: Joi.boolean(),
  hasAllergies: Joi.boolean(),
  
  // Special category filters
  specialCategories: Joi.array().items(Joi.string()),
  
  // Insurance filters
  hasInsurance: Joi.boolean(),
  insuranceScheme: Joi.string(),
  
  // Status filters
  status: Joi.string().valid('active', 'inactive', 'transferred', 'deceased'),
  isActive: Joi.boolean(),
  
  // Search
  search: Joi.string().min(1).max(100),
  
  // Family relationships
  hasFamilyMembers: Joi.boolean(),
  
  ...paginationSchema
});

/**
 * Schema for patient statistics
 */
export const patientStatsSchema = Joi.object({
  villageId: objectId,
  
  ashaWorkerId: objectId,
  
  groupBy: Joi.string().valid('village', 'asha_worker', 'age_group', 'gender', 'health_status').default('village'),
  
  includeMetrics: Joi.array().items(Joi.string().valid(
    'total_patients', 'age_distribution', 'gender_distribution', 
    'chronic_conditions', 'insurance_coverage', 'special_categories'
  )).default(['total_patients', 'age_distribution']),
  
  dateRange: Joi.object({
    startDate: dateSchema,
    endDate: dateSchema
  })
});

/**
 * Custom validator for age calculation
 */
export const calculateAge = (dateOfBirth) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Custom validator for family relationship
 */
export const validateFamilyRelationship = (patientGender, patientAge, relationship, relativeGender, relativeAge) => {
  // Basic relationship validation logic
  const validations = {
    father: relativeGender === 'male' && relativeAge > patientAge,
    mother: relativeGender === 'female' && relativeAge > patientAge,
    son: relativeGender === 'male' && relativeAge < patientAge,
    daughter: relativeGender === 'female' && relativeAge < patientAge,
    husband: patientGender === 'female' && relativeGender === 'male',
    wife: patientGender === 'male' && relativeGender === 'female'
  };
  
  return validations[relationship] !== false;
};

/**
 * Custom validator for health ID format
 */
export const validateHealthIdFormat = (healthId, villageCode) => {
  // Health ID format: VV-YYYY-NNNNNN (Village-Year-Sequential)
  const pattern = new RegExp(`^${villageCode}-\\d{4}-\\d{6}$`);
  return pattern.test(healthId);
};

/**
 * Custom validator for ASHA worker assignment
 */
export const validateASHAAssignment = (patientVillageId, ashaWorkerVillages) => {
  // Ensure ASHA worker is assigned to the patient's village
  return ashaWorkerVillages.includes(patientVillageId);
};

export default {
  createPatientRecordSchema,
  updatePatientRecordSchema,
  linkFamilyMemberSchema,
  transferPatientSchema,
  queryPatientRecordsSchema,
  patientStatsSchema,
  calculateAge,
  validateFamilyRelationship,
  validateHealthIdFormat,
  validateASHAAssignment
};