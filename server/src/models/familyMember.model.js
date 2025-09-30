import mongoose from 'mongoose';
import { Counter } from './counter.model.js';

const familyMemberSchema = new mongoose.Schema(
  {
    familyMemberId: {
      type: String,
      unique: true,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Personal Information
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    middleName: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    age: {
      type: Number,
      min: 0,
      max: 150,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: true,
    },
    profilePhoto: {
      type: String,
      trim: true,
    },
    relationship: {
      type: String,
      enum: ['spouse', 'child', 'parent', 'sibling', 'grandparent', 'grandchild', 'other'],
      required: true,
    },
    // Contact Information
    phone: {
      type: String,
      trim: true,
      match: /^[6-9]\d{9}$/,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: {
        type: String,
        match: /^\d{6}$/,
      },
      country: {
        type: String,
        default: 'India',
      },
    },
    // Health Profile
    healthProfile: {
      bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      },
      allergies: [{
        allergen: String,
        severity: {
          type: String,
          enum: ['mild', 'moderate', 'severe'],
        },
        reaction: String,
      }],
      chronicConditions: [String],
      currentMedications: [{
        medication: String,
        dosage: String,
        frequency: String,
        startDate: Date,
        prescribedBy: String,
      }],
      medicalHistory: [{
        condition: String,
        diagnosis: String,
        treatment: String,
        date: Date,
        healthcare_provider: String,
      }],
      emergencyMedicalInfo: {
        emergencyContact: {
          name: String,
          relationship: String,
          phone: String,
        },
        medicalConditions: [String],
        medications: [String],
        doctorContact: {
          name: String,
          phone: String,
          hospital: String,
        },
      },
    },
    // Identification Documents
    identificationDocs: {
      aadhar: {
        number: {
          type: String,
          match: /^\d{12}$/,
        },
        verified: {
          type: Boolean,
          default: false,
        },
      },
      healthId: String,
      otherIds: [{
        type: String,
        number: String,
        issuedBy: String,
      }],
    },
    // Insurance Information
    insurance: {
      provider: String,
      policyNumber: String,
      validUntil: Date,
      coverage: String,
    },
    // User Linking (if family member is also a registered user)
    linkedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    isLinkedUser: {
      type: Boolean,
      default: false,
    },
    // Family Household Information
    household: {
      isHouseholdHead: {
        type: Boolean,
        default: false,
      },
      householdId: String,
      familySize: Number,
    },
    // Status and Preferences
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    preferences: {
      notifications: {
        type: Boolean,
        default: true,
      },
      privacyLevel: {
        type: String,
        enum: ['public', 'family', 'private'],
        default: 'family',
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    suppressReservedKeysWarning: true,
  }
);

// Virtual for full name
familyMemberSchema.virtual('fullName').get(function () {
  if (this.middleName) {
    return `${this.firstName} ${this.middleName} ${this.lastName}`;
  }
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for age calculation
familyMemberSchema.virtual('calculatedAge').get(function () {
  if (this.dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
  return this.age;
});

// Pre-save middleware to generate familyMemberId and calculate age
familyMemberSchema.pre('save', async function (next) {
  try {
    // Generate familyMemberId if not exists
    if (!this.familyMemberId) {
      const counter = await Counter.findByIdAndUpdate(
        'familyMember',
        { $inc: { sequence: 1 } },
        { new: true, upsert: true }
      );
      this.familyMemberId = `FAM-USR-${counter.sequence.toString().padStart(4, '0')}`;
    }

    // Calculate and update age
    if (this.dateOfBirth) {
      this.age = this.calculatedAge;
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Indexes for efficient querying
familyMemberSchema.index({ userId: 1, relationship: 1 });
familyMemberSchema.index({ userId: 1, age: 1 });
familyMemberSchema.index({ userId: 1, 'healthProfile.bloodGroup': 1 });
familyMemberSchema.index({ userId: 1, status: 1 });
familyMemberSchema.index({ 'household.householdId': 1 });

// Static methods
familyMemberSchema.statics.findByUser = function (userId) {
  return this.find({ userId, status: 'active' }).populate('linkedUserId', 'firstName lastName email');
};

familyMemberSchema.statics.findByRelationship = function (userId, relationship) {
  return this.find({ userId, relationship, status: 'active' }).populate('linkedUserId', 'firstName lastName email');
};

familyMemberSchema.statics.findByAge = function (userId, minAge, maxAge) {
  return this.find({
    userId,
    age: { $gte: minAge, $lte: maxAge },
    status: 'active'
  }).populate('linkedUserId', 'firstName lastName email');
};

familyMemberSchema.statics.getHealthSummary = function (userId) {
  return this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId), status: 'active' } },
    {
      $group: {
        _id: null,
        totalMembers: { $sum: 1 },
        avgAge: { $avg: '$age' },
        bloodGroups: { $push: '$healthProfile.bloodGroup' },
        chronicConditions: { $push: '$healthProfile.chronicConditions' },
        relationships: { $push: '$relationship' }
      }
    }
  ]);
};

// Instance methods
familyMemberSchema.methods.linkToUser = function (userId) {
  this.linkedUserId = userId;
  this.isLinkedUser = true;
  return this.save();
};

familyMemberSchema.methods.unlinkFromUser = function () {
  this.linkedUserId = undefined;
  this.isLinkedUser = false;
  return this.save();
};

familyMemberSchema.methods.updateHealthProfile = function (healthData) {
  this.healthProfile = { ...this.healthProfile, ...healthData };
  return this.save();
};

export const FamilyMember = mongoose.model('FamilyMember', familyMemberSchema);