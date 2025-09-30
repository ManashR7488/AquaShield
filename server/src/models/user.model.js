import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

const userSchema = new mongoose.Schema(
  {
    // Basic Information - Updated for minimal signup
    personalInfo: {
      firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        minlength: [2, 'First name must be at least 2 characters'],
        maxlength: [50, 'First name must be less than 50 characters'],
        match: [/^[a-zA-Z\s]+$/, 'First name must contain only letters and spaces']
      },
      lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        minlength: [2, 'Last name must be at least 2 characters'],
        maxlength: [50, 'Last name must be less than 50 characters'],
        match: [/^[a-zA-Z\s]+$/, 'Last name must contain only letters and spaces']
      },
      middleName: {
        type: String,
        trim: true,
        maxlength: [50, 'Middle name must be less than 50 characters']
      },
      localName: String, // name in local language
      dateOfBirth: {
        type: Date,
        // Made optional for minimal signup
        validate: {
          validator: function(value) {
            if (!value) return true; // Allow null/undefined
            return value <= new Date();
          },
          message: 'Date of birth cannot be in the future'
        }
      },
      age: {
        type: Number,
        min: [0, 'Age cannot be negative'],
        max: [120, 'Age cannot be more than 120']
      },
      gender: {
        type: String,
        // Made optional for minimal signup
        enum: {
          values: ['male', 'female', 'other', 'prefer_not_to_say'],
          message: 'Gender must be one of: male, female, other, prefer_not_to_say'
        }
      },
      profileImage: {
        type: String,
        validate: {
          validator: function(value) {
            if (!value) return true;
            return /^https?:\/\/.+/.test(value);
          },
          message: 'Profile image must be a valid URL'
        }
      },
      identityProof: {
        aadharNumber: String, // encrypted
        panNumber: String,
        voterIdNumber: String,
        rationCardNumber: String,
      },
    },

    // Authentication - Enhanced with proper validation and defaults
    authentication: {
      username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        lowercase: true,
        minlength: [3, 'Username must be at least 3 characters'],
        maxlength: [30, 'Username must be less than 30 characters'],
        match: [/^[a-zA-Z0-9]+$/, 'Username must contain only letters and numbers']
      },
      email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        maxlength: [255, 'Email must be less than 255 characters'],
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address']
      },
      phone: {
        type: String,
        required: [true, 'Phone number is required'],
        unique: true,
        trim: true,
        match: [/^\+91[6-9]\d{9}$/, 'Please provide a valid Indian phone number']
      }, // required, unique, primary contact
      alternatePhone: {
        type: String,
        trim: true,
        match: [/^\+91[6-9]\d{9}$/, 'Please provide a valid Indian phone number']
      },
      password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters']
      }, // hashed
      isPhoneVerified: {
        type: Boolean,
        default: false
      },
      isEmailVerified: {
        type: Boolean,
        default: false
      },
      lastLogin: Date,
      loginAttempts: {
        type: Number,
        default: 0,
        min: [0, 'Login attempts cannot be negative']
      },
      accountLocked: {
        type: Boolean,
        default: false
      },
      phoneVerifiedAt: Date,
      emailVerifiedAt: Date
    },

    // Role and Hierarchy - Enhanced with proper validation
    roleInfo: {
      role: {
        type: String,
        required: [true, 'User role is required'],
        enum: {
          values: ['admin', 'health_official', 'asha_worker', 'volunteer', 'community_member', 'user'],
          message: 'Role must be one of: admin, health_official, asha_worker, volunteer, community_member, user'
        },
        default: 'user'
      },
      subRole: {
        type: String,
        trim: true,
        maxlength: [100, 'Sub-role must be less than 100 characters']
      }, // 'district_officer', 'block_officer', 'village_leader', etc.
      permissions: {
        type: [String],
        default: ['read'] // Default permissions for all users
      },
      hierarchy: {
        districtId: ObjectId, // reference to District
        blockId: ObjectId, // reference to Block
        villageId: ObjectId, // reference to Village
        hierarchyLevel: String, // 'district', 'block', 'village'
      },
      workAssignment: {
        assignedBy: ObjectId, // who assigned this role
        assignedDate: Date,
        workArea: {
          type: String, // 'district', 'block', 'village', 'multi_village'
          coverage: [ObjectId], // references to assigned areas
        },
        supervisor: ObjectId, // immediate supervisor
        reportingTo: [ObjectId], // can report to multiple people
      },
    },

    // Contact and Address - Updated for minimal signup
    contactInfo: {
      address: {
        street: {
          type: String,
          // Made optional for minimal signup
          trim: true,
          maxlength: [200, 'Street address must be less than 200 characters']
        },
        city: {
          type: String,
          required: [true, 'City is required'], // Keep required for location context
          trim: true,
          maxlength: [100, 'City must be less than 100 characters']
        },
        state: {
          type: String,
          required: [true, 'State is required'], // Keep required for location context
          trim: true,
          maxlength: [100, 'State must be less than 100 characters']
        },
        pincode: {
          type: String,
          // Made optional for minimal signup
          match: [/^\d{6}$/, 'Pincode must be 6 digits']
        },
        country: {
          type: String,
          default: 'India',
          maxlength: [100, 'Country must be less than 100 characters']
        },
        coordinates: {
          latitude: {
            type: Number,
            min: [-90, 'Latitude must be between -90 and 90'],
            max: [90, 'Latitude must be between -90 and 90']
          },
          longitude: {
            type: Number,
            min: [-180, 'Longitude must be between -180 and 180'],
            max: [180, 'Longitude must be between -180 and 180']
          }
        }
      },
      emergencyContact: {
        name: {
          type: String,
          // Made optional for minimal signup
          trim: true,
          minlength: [2, 'Emergency contact name must be at least 2 characters'],
          maxlength: [100, 'Emergency contact name must be less than 100 characters']
        },
        phone: {
          type: String,
          // Made optional for minimal signup
          trim: true,
          match: [/^\+91[6-9]\d{9}$/, 'Emergency contact phone must be a valid Indian number with +91 prefix']
        },
        relationship: {
          type: String,
          // Made optional for minimal signup
          trim: true,
          maxlength: [50, 'Relationship must be less than 50 characters']
        }
      }
    },

    // Professional Information (for health workers)
    professionalInfo: {
      qualification: String,
      experience: Number, // years
      certification: [String],
      specialization: [String],
      languages: [String], // languages spoken
      trainingCompleted: [
        {
          program: String,
          completedDate: Date,
          certificate: String, // URL to certificate
        },
      ],
      performanceRating: Number, // 1-5
      workSchedule: {
        workingDays: [String], // ['monday', 'tuesday', ...]
        workingHours: String,
        availability: String, // '24x7', 'office_hours', 'on_call'
      },
    },

    // Device and Preferences
    deviceInfo: {
      deviceId: String,
      deviceType: String, // 'android', 'ios', 'web'
      appVersion: String,
      fcmToken: String, // for push notifications
      lastSyncTime: Date,
      offlineCapability: Boolean,
    },

    preferences: {
      language: String, // default: 'english'
      notifications: {
        sms: Boolean,
        email: Boolean,
        push: Boolean,
        whatsapp: Boolean,
        callAlerts: Boolean,
      },
      alertTypes: [String], // which types of alerts to receive
      reportingFrequency: String, // 'daily', 'weekly', 'monthly'
      dataUsageConsent: Boolean,
      privacySettings: {
        shareLocation: Boolean,
        sharePhone: Boolean,
        shareEmail: Boolean,
      },
    },

    // Verification and Status
    verification: {
      isVerified: Boolean,
      verifiedBy: ObjectId, // reference to supervising user
      verificationDate: Date,
      verificationMethod: String, // 'in_person', 'document', 'phone', 'reference'
      verificationNotes: String,
      backgroundCheck: Boolean,
    },

    // Add profile completion tracking
    profileCompletion: {
      completionPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      },
      missingFields: [{
        field: String,
        category: String, // 'personal', 'contact', 'professional', 'preferences'
        priority: {
          type: String,
          enum: ['high', 'medium', 'low'],
          default: 'medium'
        }
      }],
      lastUpdated: {
        type: Date,
        default: Date.now
      },
      remindersSent: {
        type: Number,
        default: 0
      },
      completedSections: [{
        type: String,
        enum: ['personal', 'contact', 'professional', 'preferences', 'verification']
      }]
    },

    status: {
      type: String,
      enum: {
        values: ['pending_verification', 'active', 'inactive', 'suspended', 'transferred'],
        message: 'Status must be one of: pending_verification, active, inactive, suspended, transferred'
      },
      default: 'active' // Default to active for minimal signup
    },
    createdBy: {
      type: ObjectId,
      ref: 'User'
    }, // who created this user account
    approvedBy: {
      type: ObjectId,
      ref: 'User'
    }, // who approved the registration
    
    // Terms acceptance tracking
    termsAccepted: {
      type: Boolean,
      required: [true, 'Terms and conditions must be accepted'],
      default: false
    },
    privacyPolicyAccepted: {
      type: Boolean,
      required: [true, 'Privacy policy must be accepted'],
      default: false 
    },
    termsAcceptedAt: Date,
    privacyPolicyAcceptedAt: Date
  },
  { 
    timestamps: true,
    suppressReservedKeysWarning: true
  }
);

// Add method to calculate profile completion
userSchema.methods.calculateProfileCompletion = function() {
  const fields = {
    // Essential fields (already completed in minimal signup)
    'personalInfo.firstName': { weight: 5, completed: !!this.personalInfo.firstName },
    'personalInfo.lastName': { weight: 5, completed: !!this.personalInfo.lastName },
    'authentication.email': { weight: 10, completed: !!this.authentication.email },
    'authentication.phone': { weight: 10, completed: !!this.authentication.phone },
    'roleInfo.role': { weight: 10, completed: !!this.roleInfo.role },
    'contactInfo.address.city': { weight: 5, completed: !!this.contactInfo.address.city },
    'contactInfo.address.state': { weight: 5, completed: !!this.contactInfo.address.state },
    
    // Optional fields for profile completion
    'personalInfo.dateOfBirth': { weight: 8, completed: !!this.personalInfo.dateOfBirth },
    'personalInfo.gender': { weight: 5, completed: !!this.personalInfo.gender },
    'contactInfo.address.street': { weight: 7, completed: !!this.contactInfo.address.street },
    'contactInfo.address.pincode': { weight: 5, completed: !!this.contactInfo.address.pincode },
    'contactInfo.emergencyContact.name': { weight: 8, completed: !!this.contactInfo.emergencyContact?.name },
    'contactInfo.emergencyContact.phone': { weight: 8, completed: !!this.contactInfo.emergencyContact?.phone },
    'contactInfo.emergencyContact.relationship': { weight: 5, completed: !!this.contactInfo.emergencyContact?.relationship },
    'authentication.isEmailVerified': { weight: 10, completed: !!this.authentication.isEmailVerified },
    'authentication.isPhoneVerified': { weight: 10, completed: !!this.authentication.isPhoneVerified }
  };
  
  const totalWeight = Object.values(fields).reduce((sum, field) => sum + field.weight, 0);
  const completedWeight = Object.values(fields)
    .filter(field => field.completed)
    .reduce((sum, field) => sum + field.weight, 0);
  
  const percentage = Math.round((completedWeight / totalWeight) * 100);
  
  // Update missing fields
  const missingFields = Object.entries(fields)
    .filter(([key, field]) => !field.completed)
    .map(([key, field]) => ({
      field: key,
      category: key.startsWith('personalInfo') ? 'personal' : 
               key.startsWith('contactInfo') ? 'contact' :
               key.startsWith('authentication') ? 'verification' : 'other',
      priority: field.weight >= 8 ? 'high' : field.weight >= 5 ? 'medium' : 'low'
    }));
  
  this.profileCompletion = {
    completionPercentage: percentage,
    missingFields,
    lastUpdated: new Date(),
    completedSections: this.getCompletedSections()
  };
  
  return percentage;
};

// Method to get completed sections
userSchema.methods.getCompletedSections = function() {
  const sections = [];
  
  // Personal section
  if (this.personalInfo.firstName && this.personalInfo.lastName && 
      this.personalInfo.dateOfBirth && this.personalInfo.gender) {
    sections.push('personal');
  }
  
  // Contact section
  if (this.contactInfo.address.street && this.contactInfo.address.pincode &&
      this.contactInfo.emergencyContact?.name && this.contactInfo.emergencyContact?.phone) {
    sections.push('contact');
  }
  
  // Professional section (for health workers)
  if (this.roleInfo.role !== 'user' && this.professionalInfo?.qualification) {
    sections.push('professional');
  }
  
  // Verification section
  if (this.authentication.isEmailVerified && this.authentication.isPhoneVerified) {
    sections.push('verification');
  }
  
  return sections;
};

// Pre-save middleware to calculate profile completion
userSchema.pre('save', function(next) {
  // Calculate profile completion on every save
  this.calculateProfileCompletion();
  next();
});

// Enhanced database indexes for better performance and uniqueness
userSchema.index({ 'authentication.email': 1 }, { unique: true });
userSchema.index({ 'authentication.phone': 1 }, { unique: true });
userSchema.index({ 'authentication.username': 1 }, { unique: true });

// Compound indexes for common queries
userSchema.index({ 'roleInfo.role': 1, status: 1 });
userSchema.index({ 'contactInfo.address.state': 1, 'contactInfo.address.city': 1 });
userSchema.index({ 'roleInfo.hierarchy.hierarchyLevel': 1, 'roleInfo.role': 1 });

// Text index for search functionality
userSchema.index({
  'personalInfo.firstName': 'text',
  'personalInfo.lastName': 'text',
  'authentication.email': 'text',
  'contactInfo.address.city': 'text'
});

// Sparse indexes for optional fields
userSchema.index({ 'authentication.lastLogin': 1 }, { sparse: true });
userSchema.index({ 'verification.verifiedAt': 1 }, { sparse: true });

export default mongoose.model("User", userSchema);
