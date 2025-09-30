import Joi from 'joi';
import { validateRequest } from '../middleware/validateRequest.js';

// Base schemas for reusable components
const personalInfoSchema = Joi.object({
  firstName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name cannot exceed 50 characters',
      'any.required': 'First name is required'
    }),

  lastName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name cannot exceed 50 characters',
      'any.required': 'Last name is required'
    }),

  middleName: Joi.string()
    .trim()
    .max(50)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Middle name cannot exceed 50 characters'
    }),

  dateOfBirth: Joi.date()
    .max('now')
    .min('1940-01-01')
    .required()
    .messages({
      'date.max': 'Date of birth cannot be in the future',
      'date.min': 'Date of birth must be after 1940',
      'any.required': 'Date of birth is required'
    }),

  gender: Joi.string()
    .valid('male', 'female', 'other')
    .required()
    .messages({
      'any.only': 'Gender must be one of: male, female, other',
      'any.required': 'Gender is required'
    }),

  employeeId: Joi.string()
    .trim()
    .alphanum()
    .min(3)
    .max(20)
    .required()
    .messages({
      'string.alphanum': 'Employee ID must contain only letters and numbers',
      'string.min': 'Employee ID must be at least 3 characters long',
      'string.max': 'Employee ID cannot exceed 20 characters',
      'any.required': 'Employee ID is required'
    }),

  aadhaarNumber: Joi.string()
    .pattern(/^[0-9]{12}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Aadhaar number must be exactly 12 digits'
    }),

  panNumber: Joi.string()
    .pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    .optional()
    .messages({
      'string.pattern.base': 'PAN number must be in format: ABCDE1234F'
    }),

  nationality: Joi.string()
    .trim()
    .max(50)
    .default('Indian')
    .optional(),

  maritalStatus: Joi.string()
    .valid('single', 'married', 'divorced', 'widowed')
    .optional(),

  profilePicture: Joi.string().uri().optional()
});

const contactInfoSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),

  phoneNumber: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone number must be exactly 10 digits',
      'any.required': 'Phone number is required'
    }),

  alternatePhone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Alternate phone number must be exactly 10 digits'
    }),

  emergencyContact: Joi.object({
    name: Joi.string().trim().max(100).optional(),
    relationship: Joi.string().trim().max(50).optional(),
    phoneNumber: Joi.string().pattern(/^[0-9]{10}$/).optional()
  }).optional()
});

const addressSchema = Joi.object({
  street: Joi.string()
    .trim()
    .max(200)
    .required()
    .messages({
      'string.max': 'Street address cannot exceed 200 characters',
      'any.required': 'Street address is required'
    }),

  city: Joi.string()
    .trim()
    .max(100)
    .required()
    .messages({
      'string.max': 'City name cannot exceed 100 characters',
      'any.required': 'City is required'
    }),

  district: Joi.string()
    .trim()
    .max(100)
    .required()
    .messages({
      'string.max': 'District name cannot exceed 100 characters',
      'any.required': 'District is required'
    }),

  state: Joi.string()
    .trim()
    .max(100)
    .required()
    .messages({
      'string.max': 'State name cannot exceed 100 characters',
      'any.required': 'State is required'
    }),

  pincode: Joi.string()
    .pattern(/^[0-9]{6}$/)
    .required()
    .messages({
      'string.pattern.base': 'Pincode must be exactly 6 digits',
      'any.required': 'Pincode is required'
    }),

  landmark: Joi.string()
    .trim()
    .max(200)
    .optional()
    .messages({
      'string.max': 'Landmark cannot exceed 200 characters'
    }),

  addressType: Joi.string()
    .valid('permanent', 'current')
    .default('permanent')
    .optional()
});

const roleInfoSchema = Joi.object({
  role: Joi.string()
    .valid('admin', 'health_official')
    .required()
    .messages({
      'any.only': 'Role must be one of: admin, health_official',
      'any.required': 'Role is required'
    }),

  department: Joi.string()
    .trim()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Department name cannot exceed 100 characters'
    }),

  permissions: Joi.array()
    .items(Joi.string())
    .optional()
    .default([]),

  status: Joi.string()
    .valid('active', 'inactive', 'suspended')
    .default('active')
    .optional(),

  isVerified: Joi.boolean()
    .default(false)
    .optional(),

  verificationNotes: Joi.string()
    .max(500)
    .optional()
});

const professionalInfoSchema = Joi.object({
  designation: Joi.string()
    .trim()
    .max(100)
    .required()
    .messages({
      'string.max': 'Designation cannot exceed 100 characters',
      'any.required': 'Designation is required'
    }),

  department: Joi.string()
    .trim()
    .max(100)
    .required()
    .messages({
      'string.max': 'Department cannot exceed 100 characters',
      'any.required': 'Department is required'
    }),

  organization: Joi.string()
    .trim()
    .max(200)
    .required()
    .messages({
      'string.max': 'Organization cannot exceed 200 characters',
      'any.required': 'Organization is required'
    }),

  joiningDate: Joi.date()
    .max('now')
    .required()
    .messages({
      'date.max': 'Joining date cannot be in the future',
      'any.required': 'Joining date is required'
    }),

  workLocation: Joi.string()
    .trim()
    .max(200)
    .optional()
    .messages({
      'string.max': 'Work location cannot exceed 200 characters'
    }),

  reportingManager: Joi.object({
    name: Joi.string().trim().max(100).optional(),
    designation: Joi.string().trim().max(100).optional(),
    email: Joi.string().email().optional(),
    phoneNumber: Joi.string().pattern(/^[0-9]{10}$/).optional()
  }).optional(),

  specializations: Joi.array()
    .items(Joi.string().max(100))
    .optional(),

  certifications: Joi.array()
    .items(Joi.object({
      name: Joi.string().max(100).required(),
      issuedBy: Joi.string().max(100).required(),
      issueDate: Joi.date().max('now').required(),
      expiryDate: Joi.date().min('now').optional(),
      certificateNumber: Joi.string().max(50).optional()
    }))
    .optional(),

  experience: Joi.object({
    totalYears: Joi.number().min(0).max(50).optional(),
    previousOrganizations: Joi.array().items(Joi.object({
      name: Joi.string().max(200).required(),
      designation: Joi.string().max(100).required(),
      duration: Joi.string().max(100).required(),
      responsibilities: Joi.array().items(Joi.string().max(200)).optional()
    })).optional()
  }).optional(),

  qualifications: Joi.array()
    .items(Joi.object({
      degree: Joi.string().max(100).required(),
      institution: Joi.string().max(200).required(),
      year: Joi.number().integer().min(1950).max(new Date().getFullYear()).required(),
      percentage: Joi.number().min(0).max(100).optional(),
      grade: Joi.string().max(10).optional()
    }))
    .optional()
});

/**
 * Create User Validation
 */
const createUserSchema = Joi.object({
  personalInfo: personalInfoSchema.required(),
  contactInfo: contactInfoSchema.required(),
  address: addressSchema.required(),
  roleInfo: roleInfoSchema.required(),
  professionalInfo: professionalInfoSchema.required(),
  
  password: Joi.string()
    .min(8)
    .max(100)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password cannot exceed 100 characters',
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
      'any.required': 'Password is required'
    })
});

/**
 * Update User Validation
 */
const updateUserSchema = Joi.object({
  personalInfo: personalInfoSchema.optional(),
  contactInfo: contactInfoSchema.optional(),
  address: addressSchema.optional(),
  roleInfo: roleInfoSchema.optional(),
  professionalInfo: professionalInfoSchema.optional(),
  
  newPassword: Joi.string()
    .min(8)
    .max(100)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .optional()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password cannot exceed 100 characters',
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
    })
}).min(1); // At least one field must be provided for update

/**
 * Profile Update Validation (for current user)
 */
const profileUpdateSchema = Joi.object({
  personalInfo: personalInfoSchema.fork([
    'employeeId' // Employee ID cannot be changed in profile update
  ], (schema) => schema.forbidden()).optional(),
  
  contactInfo: contactInfoSchema.optional(),
  address: addressSchema.optional(),
  
  professionalInfo: professionalInfoSchema.fork([
    'joiningDate', // Joining date cannot be changed in profile update
    'department', // Department cannot be changed in profile update
    'organization' // Organization cannot be changed in profile update
  ], (schema) => schema.forbidden()).optional()
}).min(1);

/**
 * User Search Validation
 */
const userSearchSchema = Joi.object({
  query: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Search query cannot be empty',
      'string.max': 'Search query cannot exceed 100 characters'
    }),

  role: Joi.string()
    .valid('admin', 'health_official', 'all')
    .default('all')
    .optional(),

  status: Joi.string()
    .valid('active', 'inactive', 'suspended', 'all')
    .default('all')
    .optional(),

  verified: Joi.boolean().optional(),

  state: Joi.string().trim().max(100).optional(),

  district: Joi.string().trim().max(100).optional(),

  department: Joi.string().trim().max(100).optional(),

  availability: Joi.string()
    .valid('available', 'assigned', 'all')
    .default('all')
    .optional(),

  sortBy: Joi.string()
    .valid('firstName', 'lastName', 'email', 'createdAt', 'designation')
    .default('firstName')
    .optional(),

  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('asc')
    .optional(),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(50)
    .optional()
});

/**
 * Status Update Validation
 */
const statusUpdateSchema = Joi.object({
  status: Joi.string()
    .valid('active', 'inactive', 'suspended')
    .required()
    .messages({
      'any.only': 'Status must be one of: active, inactive, suspended',
      'any.required': 'Status is required'
    }),

  reason: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Reason cannot exceed 500 characters'
    }),

  effectiveDate: Joi.date()
    .min('now')
    .optional()
    .messages({
      'date.min': 'Effective date cannot be in the past'
    }),

  notifyUser: Joi.boolean()
    .default(true)
    .optional()
});

/**
 * Role Update Validation
 */
const roleUpdateSchema = Joi.object({
  role: Joi.string()
    .valid('admin', 'health_official')
    .required()
    .messages({
      'any.only': 'Role must be one of: admin, health_official',
      'any.required': 'Role is required'
    }),

  department: Joi.string()
    .trim()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Department cannot exceed 100 characters'
    }),

  designation: Joi.string()
    .trim()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Designation cannot exceed 100 characters'
    }),

  organization: Joi.string()
    .trim()
    .max(200)
    .optional()
    .messages({
      'string.max': 'Organization cannot exceed 200 characters'
    }),

  permissions: Joi.array()
    .items(Joi.string())
    .optional(),

  reason: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Reason cannot exceed 500 characters'
    }),

  notifyUser: Joi.boolean()
    .default(true)
    .optional()
});

/**
 * Password Change Validation
 */
const passwordChangeSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Current password is required'
    }),

  newPassword: Joi.string()
    .min(8)
    .max(100)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.min': 'New password must be at least 8 characters long',
      'string.max': 'New password cannot exceed 100 characters',
      'string.pattern.base': 'New password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
      'any.required': 'New password is required'
    }),

  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Confirm password must match new password',
      'any.required': 'Confirm password is required'
    })
});

/**
 * Verify User Validation
 */
const verifyUserSchema = Joi.object({
  verificationNotes: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Verification notes cannot exceed 500 characters'
    }),

  additionalPermissions: Joi.array()
    .items(Joi.string())
    .optional()
});

// Validation middleware functions
export const validateCreateUser = validateRequest(createUserSchema);
export const validateUpdateUser = validateRequest(updateUserSchema);
export const validateProfileUpdate = validateRequest(profileUpdateSchema);
export const validateUserSearch = validateRequest(userSearchSchema);
export const validateStatusUpdate = validateRequest(statusUpdateSchema);
export const validateRoleUpdate = validateRequest(roleUpdateSchema);
export const validatePasswordChange = validateRequest(passwordChangeSchema);
export const validateVerifyUser = validateRequest(verifyUserSchema);

// Export schemas for potential reuse
export {
  createUserSchema,
  updateUserSchema,
  profileUpdateSchema,
  userSearchSchema,
  statusUpdateSchema,
  roleUpdateSchema,
  passwordChangeSchema,
  verifyUserSchema,
  personalInfoSchema,
  contactInfoSchema,
  addressSchema,
  roleInfoSchema,
  professionalInfoSchema
};