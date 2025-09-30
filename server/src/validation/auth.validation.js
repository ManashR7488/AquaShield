import Joi from 'joi';

/**
 * Authentication Validation Schemas
 * Joi validation schemas for all authentication-related endpoints
 */

// Phone number preprocessing function
const preprocessPhoneNumber = (phone) => {
  if (!phone) return phone;
  
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // If it's a 10-digit number starting with 6-9, add +91
  if (/^[6-9]\d{9}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }
  
  // If it already has +91, ensure it's properly formatted
  if (cleaned.startsWith('+91') && cleaned.length === 13) {
    return cleaned;
  }
  
  return cleaned;
};

// Minimal Personal Info Schema for Signup
const minimalPersonalInfoSchema = Joi.object({
  firstName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .required()
    .messages({
      'string.pattern.base': 'First name must contain only letters and spaces'
    }),
  
  lastName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .required()
    .messages({
      'string.pattern.base': 'Last name must contain only letters and spaces'
    }),
  
  // Optional fields for minimal signup
  dateOfBirth: Joi.date()
    .max('now')
    .iso()
    .optional()
    .messages({
      'date.max': 'Date of birth cannot be in the future'
    }),
  
  gender: Joi.string()
    .valid('male', 'female', 'other', 'prefer_not_to_say')
    .optional(),
  
  profilePhoto: Joi.string()
    .uri()
    .optional()
    .allow('')
});

// Personal info schema (original for full signup reference)
const personalInfoSchema = Joi.object({
  firstName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .required()
    .messages({
      'string.pattern.base': 'First name must contain only letters and spaces'
    }),
  
  lastName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .required()
    .messages({
      'string.pattern.base': 'Last name must contain only letters and spaces'
    }),
  
  dateOfBirth: Joi.date()
    .max('now')
    .iso()
    .required()
    .messages({
      'date.max': 'Date of birth cannot be in the future'
    }),
  
  gender: Joi.string()
    .valid('male', 'female', 'other', 'prefer_not_to_say')
    .required(),
  
  profilePhoto: Joi.string()
    .uri()
    .optional()
    .allow('')
});

// Authentication schema for signup
const authenticationSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: true } })
    .lowercase()
    .trim()
    .max(255)
    .required()
    .messages({
      'any.required': 'Email address is required',
      'string.empty': 'Email address cannot be empty',
      'string.email': 'Please provide a valid email address',
      'string.max': 'Email address must be no more than 255 characters'
    }),
  
  phone: Joi.string()
    .required()
    .messages({
      'any.required': 'Phone number is required',
      'string.empty': 'Phone number cannot be empty'
    })
    .custom((value, helpers) => {
      // Preprocess phone number to remove spaces and special characters
      const cleaned = value.replace(/[^\d+]/g, '');
      
      // Validate cleaned phone number format
      if (!/^(\+91[6-9]\d{9}|[6-9]\d{9})$/.test(cleaned)) {
        return helpers.error('string.pattern.base');
      }
      
      // Normalize to +91 format
      if (cleaned.length === 10 && /^[6-9]\d{9}$/.test(cleaned)) {
        return `+91${cleaned}`;
      }
      
      return cleaned;
    }, 'Phone number normalization')
    .messages({
      'string.pattern.base': 'Please provide a valid Indian phone number (10 digits starting with 6-9, with or without +91)'
    }),
  
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .lowercase()
    .trim()
    .required()
    .messages({
      'any.required': 'Username is required',
      'string.empty': 'Username cannot be empty',
      'string.alphanum': 'Username must contain only letters and numbers',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username must be no more than 30 characters long'
    }),
  
  password: Joi.string()
    .min(8)
    .max(128)
    .required()
    .messages({
      'any.required': 'Password is required',
      'string.empty': 'Password cannot be empty',
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must be no more than 128 characters long'
    })
    .custom((value, helpers) => {
      // Enhanced password validation with specific error messages
      const requirements = {
        minLength: value.length >= 8,
        hasLowercase: /[a-z]/.test(value),
        hasUppercase: /[A-Z]/.test(value),
        hasNumber: /\d/.test(value),
        hasSpecialChar: /[@$!%*?&]/.test(value),
        validCharsOnly: /^[A-Za-z\d@$!%*?&]+$/.test(value)
      };
      
      const failedRequirements = [];
      if (!requirements.minLength) failedRequirements.push('at least 8 characters');
      if (!requirements.hasLowercase) failedRequirements.push('one lowercase letter');
      if (!requirements.hasUppercase) failedRequirements.push('one uppercase letter');
      if (!requirements.hasNumber) failedRequirements.push('one number');
      if (!requirements.hasSpecialChar) failedRequirements.push('one special character (@$!%*?&)');
      if (!requirements.validCharsOnly) failedRequirements.push('only allowed characters (letters, numbers, @$!%*?&)');
      
      if (failedRequirements.length > 0) {
        return helpers.error('password.requirements', { requirements: failedRequirements });
      }
      
      return value;
    }, 'Password requirements validation')
    .messages({
      'password.requirements': 'Password must contain {{#requirements}}'
    })
});

// Valid user roles
const validUserRoles = ['admin', 'health_official', 'asha_worker', 'volunteer', 'community_member', 'user'];

// Role info schema
const roleInfoSchema = Joi.object({
  role: Joi.string()
    .required()
    .valid(...validUserRoles)
    .messages({
      'any.required': 'Role selection is required',
      'string.empty': 'Role cannot be empty',
      'any.only': `Role must be one of: ${validUserRoles.join(', ')}`
    }),
  
  department: Joi.string()
    .trim()
    .max(100)
    .optional()
    .allow(''),
  
  designation: Joi.string()
    .trim()
    .max(100)
    .optional()
    .allow(''),
  
  employeeId: Joi.string()
    .trim()
    .max(50)
    .optional()
    .allow(''),
  
  licenseNumber: Joi.string()
    .trim()
    .max(50)
    .optional()
    .allow('')
});

// Minimal Contact Info Schema for Signup
// Valid Indian states for validation
const validIndianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  // Union Territories
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Lakshadweep', 'Puducherry', 'Jammu and Kashmir', 'Ladakh'
];

const minimalContactInfoSchema = Joi.object({
  address: Joi.object({
    city: Joi.string()
      .trim()
      .min(2)
      .max(100)
      .required()
      .messages({
        'any.required': 'City is required',
        'string.empty': 'City cannot be empty',
        'string.min': 'City name must be at least 2 characters',
        'string.max': 'City name must be no more than 100 characters'
      }),
    
    state: Joi.string()
      .trim()
      .required()
      .valid(...validIndianStates)
      .messages({
        'any.required': 'State is required',
        'string.empty': 'State cannot be empty', 
        'any.only': 'Please select a valid Indian state'
      }),
    
    street: Joi.string().trim().max(200).optional().allow(''),
    pincode: Joi.string()
      .pattern(/^\d{6}$/)
      .optional()
      .allow('')
      .messages({
        'string.pattern.base': 'Pincode must be exactly 6 digits'
      }),
    country: Joi.string().trim().max(100).default('India')
  }).required(),
  
  // Emergency contact is completely optional for signup
  emergencyContact: Joi.object({
    name: Joi.string().trim().min(2).max(100).optional().allow(''),
    phone: Joi.string()
      .pattern(/^(\+91[6-9]\d{9}|[6-9]\d{9})$/)
      .optional()
      .allow('')
      .messages({
        'string.pattern.base': 'Please provide a valid Indian phone number for emergency contact'
      })
      .custom((value, helpers) => {
        if (value && value.length === 10 && /^[6-9]\d{9}$/.test(value)) {
          return `+91${value}`;
        }
        return value;
      }),
    relationship: Joi.string().trim().max(50).optional().allow('')
  }).optional()
});

// Contact info schema (original for full signup reference)
const contactInfoSchema = Joi.object({
  address: Joi.object({
    street: Joi.string().trim().max(200).required(),
    city: Joi.string().trim().max(100).required(),
    state: Joi.string().trim().max(100).required(),
    pincode: Joi.string().pattern(/^\d{6}$/).required().messages({
      'string.pattern.base': 'Pincode must be 6 digits'
    }),
    country: Joi.string().trim().max(100).default('India')
  }).required(),
  
  emergencyContact: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    phone: Joi.string()
      .pattern(/^(\+91[6-9]\d{9}|[6-9]\d{9})$/)
      .required()
      .messages({
        'string.pattern.base': 'Please provide a valid Indian phone number for emergency contact'
      })
      .custom((value, helpers) => {
        if (value.length === 10 && /^[6-9]\d{9}$/.test(value)) {
          return `+91${value}`;
        }
        return value;
      }),
    relationship: Joi.string().trim().max(50).required()
  }).required()
});

// Preferences schema
const preferencesSchema = Joi.object({
  language: Joi.string()
    .valid('en', 'hi', 'bn', 'te', 'ta', 'ml', 'kn', 'gu', 'mr', 'or')
    .default('en'),
  
  notifications: Joi.object({
    email: Joi.boolean().default(true),
    sms: Joi.boolean().default(true),
    push: Joi.boolean().default(true),
    whatsapp: Joi.boolean().default(false)
  }).default(),
  
  privacy: Joi.object({
    profileVisibility: Joi.string().valid('public', 'private', 'contacts_only').default('private'),
    dataSharing: Joi.boolean().default(false),
    analyticsOptIn: Joi.boolean().default(false)
  }).default()
});

/**
 * Minimal User Signup Validation Schema
 * Only collects essential fields for registration
 */
export const minimalSignupSchema = Joi.object({
  personalInfo: minimalPersonalInfoSchema.required(),
  authentication: authenticationSchema.required(), // Keep full auth requirements
  roleInfo: roleInfoSchema.required(), // Keep role requirements
  contactInfo: minimalContactInfoSchema.required(), // Minimal contact info
  preferences: preferencesSchema.optional(),
  termsAccepted: Joi.boolean().valid(true).required().messages({
    'any.only': 'You must accept the terms and conditions'
  }),
  privacyPolicyAccepted: Joi.boolean().valid(true).required().messages({
    'any.only': 'You must accept the privacy policy'
  })
});

/**
 * Profile Update Validation Schema
 * For updating profile after initial signup
 */
export const profileUpdateSchema = Joi.object({
  personalInfo: Joi.object({
    firstName: Joi.string()
      .trim()
      .min(2)
      .max(50)
      .pattern(/^[a-zA-Z\s]+$/)
      .optional(),
    
    lastName: Joi.string()
      .trim()
      .min(2)
      .max(50)
      .pattern(/^[a-zA-Z\s]+$/)
      .optional(),
    
    dateOfBirth: Joi.date()
      .max('now')
      .iso()
      .optional(),
    
    gender: Joi.string()
      .valid('male', 'female', 'other', 'prefer_not_to_say')
      .optional(),
    
    profilePhoto: Joi.string()
      .uri()
      .optional()
      .allow('')
  }).optional(),
  
  contactInfo: Joi.object({
    address: Joi.object({
      street: Joi.string().trim().max(200).optional(),
      city: Joi.string().trim().max(100).optional(),
      state: Joi.string().trim().max(100).optional(),
      pincode: Joi.string().pattern(/^\d{6}$/).optional(),
      country: Joi.string().trim().max(100).optional()
    }).optional(),
    
    emergencyContact: Joi.object({
      name: Joi.string().trim().min(2).max(100).optional(),
      phone: Joi.string()
        .pattern(/^(\+91[6-9]\d{9}|[6-9]\d{9})$/)
        .optional()
        .messages({
          'string.pattern.base': 'Please provide a valid Indian phone number'
        })
        .custom((value, helpers) => {
          if (value && value.length === 10 && /^[6-9]\d{9}$/.test(value)) {
            return `+91${value}`;
          }
          return value;
        }),
      relationship: Joi.string().trim().max(50).optional()
    }).optional()
  }).optional(),
  
  preferences: preferencesSchema.optional(),
  
  professionalInfo: Joi.object({
    qualification: Joi.string().trim().max(200).optional(),
    experience: Joi.number().min(0).max(50).optional(),
    certification: Joi.array().items(Joi.string().trim().max(100)).optional(),
    specialization: Joi.array().items(Joi.string().trim().max(100)).optional(),
    languages: Joi.array().items(Joi.string().trim().max(50)).optional()
  }).optional()
});

// Keep the original signupSchema as fullSignupSchema for reference
export const fullSignupSchema = Joi.object({
  personalInfo: personalInfoSchema.required(),
  authentication: authenticationSchema.required(),
  roleInfo: roleInfoSchema.required(),
  contactInfo: contactInfoSchema.required(),
  preferences: preferencesSchema.optional(),
  termsAccepted: Joi.boolean().valid(true).required().messages({
    'any.only': 'You must accept the terms and conditions'
  }),
  privacyPolicyAccepted: Joi.boolean().valid(true).required().messages({
    'any.only': 'You must accept the privacy policy'
  })
});

// Export minimalSignupSchema as the default signupSchema
export { minimalSignupSchema as signupSchema };

/**
 * User Login Validation Schema
 */
export const loginSchema = Joi.object({
  identifier: Joi.string()
    .trim()
    .required()
    .messages({
      'string.empty': 'Email, phone, or username is required'
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Password is required'
    }),
  
  rememberMe: Joi.boolean().optional().default(false)
});

/**
 * Change Password Validation Schema
 */
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'string.empty': 'Current password is required'
    }),
  
  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }),
  
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Password confirmation does not match new password'
    })
});

/**
 * Email Verification Validation Schema
 */
export const verifyEmailSchema = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'string.empty': 'Verification token is required'
    })
});

/**
 * Phone Verification Validation Schema
 */
export const verifyPhoneSchema = Joi.object({
  otp: Joi.string()
    .length(6)
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      'string.length': 'OTP must be 6 digits',
      'string.pattern.base': 'OTP must contain only numbers'
    })
});

/**
 * Forgot Password Validation Schema
 */
export const forgotPasswordSchema = Joi.object({
  identifier: Joi.string()
    .trim()
    .required()
    .messages({
      'string.empty': 'Email, phone, or username is required'
    })
});

/**
 * Reset Password Validation Schema
 */
export const resetPasswordSchema = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'string.empty': 'Reset token is required'
    }),
  
  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }),
  
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Password confirmation does not match new password'
    })
});



/**
 * Resend Verification Email Schema
 */
export const resendVerificationSchema = Joi.object({
  email: Joi.string()
    .email()
    .lowercase()
    .trim()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address'
    })
});

/**
 * Send Phone OTP Schema
 */
export const sendPhoneOTPSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^(\+91[6-9]\d{9}|[6-9]\d{9})$/)
    .required()
    .messages({
      'string.pattern.base': 'Please provide a valid Indian phone number'
    })
    .custom((value, helpers) => {
      if (value.length === 10 && /^[6-9]\d{9}$/.test(value)) {
        return `+91${value}`;
      }
      return value;
    })
});

/**
 * Export phone preprocessing function
 */
export { preprocessPhoneNumber };