import Joi from 'joi';
import mongoose from 'mongoose';

// Custom validators
const objectIdValidator = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error('any.invalid');
  }
  return value;
}, 'ObjectId validation');

const phoneValidator = Joi.string().pattern(/^[6-9]\d{9}$/).messages({
  'string.pattern.base': 'Phone number must be a valid 10-digit Indian mobile number'
});

const pincodeValidator = Joi.string().pattern(/^\d{6}$/).messages({
  'string.pattern.base': 'Pincode must be a valid 6-digit Indian pincode'
});

const aadharValidator = Joi.string().pattern(/^\d{12}$/).messages({
  'string.pattern.base': 'Aadhar number must be a valid 12-digit number'
});

// Address schema
const addressSchema = Joi.object({
  street: Joi.string().max(100).trim(),
  city: Joi.string().max(50).trim(),
  state: Joi.string().max(50).trim(),
  pincode: pincodeValidator,
  country: Joi.string().max(50).trim().default('India')
});

// Health profile schemas
const allergySchema = Joi.object({
  allergen: Joi.string().required().trim().max(100),
  severity: Joi.string().valid('mild', 'moderate', 'severe').required(),
  reaction: Joi.string().max(200).trim()
});

const medicationSchema = Joi.object({
  medication: Joi.string().required().trim().max(100),
  dosage: Joi.string().required().trim().max(50),
  frequency: Joi.string().required().trim().max(50),
  startDate: Joi.date().max('now'),
  prescribedBy: Joi.string().trim().max(100)
});

const medicalHistorySchema = Joi.object({
  condition: Joi.string().required().trim().max(100),
  diagnosis: Joi.string().trim().max(500),
  treatment: Joi.string().trim().max(500),
  date: Joi.date().max('now'),
  healthcare_provider: Joi.string().trim().max(100)
});

const emergencyContactSchema = Joi.object({
  name: Joi.string().required().trim().max(100),
  relationship: Joi.string().required().trim().max(50),
  phone: phoneValidator.required()
});

const doctorContactSchema = Joi.object({
  name: Joi.string().trim().max(100),
  phone: phoneValidator,
  hospital: Joi.string().trim().max(100)
});

const emergencyMedicalInfoSchema = Joi.object({
  emergencyContact: emergencyContactSchema,
  medicalConditions: Joi.array().items(Joi.string().trim().max(100)),
  medications: Joi.array().items(Joi.string().trim().max(100)),
  doctorContact: doctorContactSchema
});

const healthProfileSchema = Joi.object({
  bloodGroup: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
  allergies: Joi.array().items(allergySchema),
  chronicConditions: Joi.array().items(Joi.string().trim().max(100)),
  currentMedications: Joi.array().items(medicationSchema),
  medicalHistory: Joi.array().items(medicalHistorySchema),
  emergencyMedicalInfo: emergencyMedicalInfoSchema
});

// Identification documents schema
const identificationDocsSchema = Joi.object({
  aadhar: Joi.object({
    number: aadharValidator,
    verified: Joi.boolean().default(false)
  }),
  healthId: Joi.string().trim().max(50),
  otherIds: Joi.array().items(Joi.object({
    type: Joi.string().required().trim().max(50),
    number: Joi.string().required().trim().max(50),
    issuedBy: Joi.string().trim().max(100)
  }))
});

// Insurance schema
const insuranceSchema = Joi.object({
  provider: Joi.string().trim().max(100),
  policyNumber: Joi.string().trim().max(50),
  validUntil: Joi.date().greater('now'),
  coverage: Joi.string().trim().max(200)
});

// Household schema
const householdSchema = Joi.object({
  isHouseholdHead: Joi.boolean().default(false),
  householdId: Joi.string().trim().max(50),
  familySize: Joi.number().integer().min(1).max(50)
});

// Preferences schema
const preferencesSchema = Joi.object({
  notifications: Joi.boolean().default(true),
  privacyLevel: Joi.string().valid('public', 'family', 'private').default('family')
});

// Main family member schemas
export const createFamilyMemberSchema = Joi.object({
  userId: objectIdValidator.forbidden(),
  firstName: Joi.string().required().trim().max(50).messages({
    'string.empty': 'First name is required',
    'string.max': 'First name cannot exceed 50 characters'
  }),
  lastName: Joi.string().required().trim().max(50).messages({
    'string.empty': 'Last name is required',
    'string.max': 'Last name cannot exceed 50 characters'
  }),
  middleName: Joi.string().trim().max(50).allow(''),
  dateOfBirth: Joi.date().required().max('now').messages({
    'date.base': 'Date of birth must be a valid date',
    'date.max': 'Date of birth cannot be in the future',
    'any.required': 'Date of birth is required'
  }),
  gender: Joi.string().required().valid('male', 'female', 'other').messages({
    'any.required': 'Gender is required',
    'any.only': 'Gender must be male, female, or other'
  }),
  relationship: Joi.string().required().valid('spouse', 'child', 'parent', 'sibling', 'grandparent', 'grandchild', 'other').messages({
    'any.required': 'Relationship is required',
    'any.only': 'Invalid relationship type'
  }),
  profilePhoto: Joi.string().uri().allow(''),
  phone: phoneValidator,
  email: Joi.string().email().lowercase().trim(),
  address: addressSchema,
  healthProfile: healthProfileSchema,
  identificationDocs: identificationDocsSchema,
  insurance: insuranceSchema,
  linkedUserId: objectIdValidator,
  household: householdSchema,
  preferences: preferencesSchema
});

export const updateFamilyMemberSchema = Joi.object({
  firstName: Joi.string().trim().max(50),
  lastName: Joi.string().trim().max(50),
  middleName: Joi.string().trim().max(50).allow(''),
  dateOfBirth: Joi.date().max('now'),
  gender: Joi.string().valid('male', 'female', 'other'),
  relationship: Joi.string().valid('spouse', 'child', 'parent', 'sibling', 'grandparent', 'grandchild', 'other'),
  profilePhoto: Joi.string().uri().allow(''),
  phone: phoneValidator,
  email: Joi.string().email().lowercase().trim(),
  address: addressSchema,
  healthProfile: healthProfileSchema,
  identificationDocs: identificationDocsSchema,
  insurance: insuranceSchema,
  linkedUserId: objectIdValidator,
  household: householdSchema,
  preferences: preferencesSchema,
  status: Joi.string().valid('active', 'inactive')
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

export const linkUserSchema = Joi.object({
  linkedUserId: objectIdValidator.required().messages({
    'any.required': 'User ID to link is required'
  })
});

export const queryFamilyMembersSchema = Joi.object({
  relationship: Joi.string().valid('spouse', 'child', 'parent', 'sibling', 'grandparent', 'grandchild', 'other'),
  minAge: Joi.number().integer().min(0).max(150),
  maxAge: Joi.number().integer().min(0).max(150).greater(Joi.ref('minAge')),
  bloodGroup: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
  status: Joi.string().valid('active', 'inactive').default('active'),
  search: Joi.string().trim().max(100),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().valid('firstName', 'lastName', 'age', 'relationship', 'createdAt').default('firstName'),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc')
});

export const familyMemberIdSchema = Joi.object({
  id: objectIdValidator.required().messages({
    'any.required': 'Family member ID is required'
  })
});

// Validation for health profile updates
export const updateHealthProfileSchema = Joi.object({
  bloodGroup: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
  allergies: Joi.array().items(allergySchema),
  chronicConditions: Joi.array().items(Joi.string().trim().max(100)),
  currentMedications: Joi.array().items(medicationSchema),
  medicalHistory: Joi.array().items(medicalHistorySchema),
  emergencyMedicalInfo: emergencyMedicalInfoSchema
}).min(1).messages({
  'object.min': 'At least one health profile field must be provided'
});

// Relationship validation rules
export const validateRelationshipLogic = (familyMembers, newMember) => {
  const errors = [];
  
  // Check for duplicate spouse
  if (newMember.relationship === 'spouse') {
    const existingSpouse = familyMembers.find(member => member.relationship === 'spouse');
    if (existingSpouse) {
      errors.push('Only one spouse can be added per user');
    }
  }
  
  // Validate age for relationship
  if (newMember.relationship === 'parent' && newMember.age < 18) {
    errors.push('Parent must be at least 18 years old');
  }
  
  if (newMember.relationship === 'grandparent' && newMember.age < 35) {
    errors.push('Grandparent must be at least 35 years old');
  }
  
  if (newMember.relationship === 'child' && newMember.age > 50) {
    errors.push('Child relationship is typically for younger family members');
  }
  
  return errors;
};

// Custom validation messages
export const validationMessages = {
  'any.required': '{#label} is required',
  'string.empty': '{#label} cannot be empty',
  'string.min': '{#label} must be at least {#limit} characters long',
  'string.max': '{#label} cannot exceed {#limit} characters',
  'string.email': 'Please provide a valid email address',
  'date.base': '{#label} must be a valid date',
  'date.max': '{#label} cannot be in the future',
  'number.base': '{#label} must be a number',
  'number.integer': '{#label} must be an integer',
  'number.min': '{#label} must be at least {#limit}',
  'number.max': '{#label} cannot exceed {#limit}',
  'array.min': '{#label} must contain at least {#limit} items',
  'any.only': '{#label} must be one of {#valids}'
};