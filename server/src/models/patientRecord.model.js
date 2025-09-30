import mongoose from 'mongoose';
import { getNextSequence } from './counter.model.js';

const patientRecordSchema = new mongoose.Schema({
  // Patient Identification
  patientId: {
    type: String,
    unique: true,
    required: true,
    match: /^PAT-VLG-\d{4}$/,
    uppercase: true
  },
  
  // Personal Information
  personalInfo: {
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    middleName: {
      type: String,
      trim: true,
      maxlength: 50
    },
    dateOfBirth: {
      type: Date,
      required: true,
      validate: {
        validator: function(v) {
          return v <= new Date();
        },
        message: 'Date of birth cannot be in the future'
      }
    },
    age: {
      years: Number,
      months: Number,
      calculated: {
        type: Date,
        default: Date.now
      }
    },
    gender: {
      type: String,
      required: true,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
      lowercase: true
    },
    maritalStatus: {
      type: String,
      enum: ['single', 'married', 'divorced', 'widowed', 'separated', 'unknown'],
      default: 'unknown',
      lowercase: true
    },
    religion: {
      type: String,
      enum: ['hindu', 'muslim', 'christian', 'sikh', 'buddhist', 'jain', 'other', 'prefer_not_to_say'],
      lowercase: true
    },
    caste: {
      category: {
        type: String,
        enum: ['general', 'obc', 'sc', 'st', 'ews', 'other'],
        lowercase: true
      },
      subcaste: String
    },
    nationality: {
      type: String,
      default: 'indian',
      lowercase: true
    },
    languages: [{
      language: String,
      proficiency: { type: String, enum: ['native', 'fluent', 'conversational', 'basic'] }
    }]
  },
  
  // Contact Information
  contactInfo: {
    mobileNumber: {
      primary: {
        type: String,
        required: true,
        match: /^[6-9]\d{9}$/
      },
      secondary: {
        type: String,
        match: /^[6-9]\d{9}$/
      }
    },
    email: {
      type: String,
      lowercase: true,
      validate: {
        validator: function(v) {
          return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Please enter a valid email address'
      }
    },
    emergencyContacts: [{
      name: {
        type: String,
        required: true
      },
      relationship: {
        type: String,
        enum: ['spouse', 'parent', 'child', 'sibling', 'relative', 'friend', 'neighbor', 'other'],
        required: true
      },
      phoneNumber: {
        type: String,
        required: true,
        match: /^[6-9]\d{9}$/
      },
      address: String,
      isPrimary: {
        type: Boolean,
        default: false
      }
    }]
  },
  
  // Family Structure
  familyInfo: {
    headOfHousehold: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PatientRecord'
    },
    relationshipToHead: {
      type: String,
      enum: ['self', 'spouse', 'child', 'parent', 'sibling', 'grandparent', 'grandchild', 'other'],
      default: 'self'
    },
    familyMembers: [{
      memberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PatientRecord'
      },
      relationship: {
        type: String,
        enum: ['spouse', 'child', 'parent', 'sibling', 'grandparent', 'grandchild', 'other'],
        required: true
      },
      isDependent: {
        type: Boolean,
        default: false
      },
      livesInSameHousehold: {
        type: Boolean,
        default: true
      }
    }],
    householdSize: {
      type: Number,
      min: 1,
      default: 1
    },
    householdIncome: {
      amount: Number,
      frequency: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
      source: [String],
      belowPovertyLine: Boolean
    },
    familyType: {
      type: String,
      enum: ['nuclear', 'joint', 'extended', 'single_parent', 'other'],
      default: 'nuclear'
    }
  },
  
  // Health Profile
  healthProfile: {
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'],
      default: 'unknown',
      uppercase: true
    },
    rhFactor: {
      type: String,
      enum: ['positive', 'negative', 'unknown'],
      default: 'unknown'
    },
    allergies: [{
      allergen: {
        type: String,
        required: true
      },
      type: {
        type: String,
        enum: ['food', 'medication', 'environmental', 'contact', 'other']
      },
      severity: {
        type: String,
        enum: ['mild', 'moderate', 'severe', 'life_threatening'],
        default: 'mild'
      },
      reactions: [String],
      diagnosedDate: Date,
      notes: String
    }],
    chronicConditions: [{
      condition: {
        type: String,
        required: true
      },
      icdCode: String,
      diagnosedDate: Date,
      severity: {
        type: String,
        enum: ['mild', 'moderate', 'severe'],
        default: 'moderate'
      },
      status: {
        type: String,
        enum: ['active', 'inactive', 'resolved', 'managed'],
        default: 'active'
      },
      medications: [String],
      lastReviewDate: Date,
      managingPhysician: String
    }],
    currentMedications: [{
      medicationName: {
        type: String,
        required: true
      },
      dosage: String,
      frequency: String,
      prescribedBy: String,
      prescriptionDate: Date,
      startDate: Date,
      endDate: Date,
      isActive: {
        type: Boolean,
        default: true
      },
      indication: String,
      sideEffects: [String]
    }],
    medicalHistory: [{
      condition: String,
      diagnosisDate: Date,
      treatment: String,
      outcome: String,
      hospitalizations: [{
        hospital: String,
        admissionDate: Date,
        dischargeDate: Date,
        reason: String,
        procedures: [String]
      }]
    }],
    surgicalHistory: [{
      procedure: String,
      date: Date,
      surgeon: String,
      hospital: String,
      complications: String,
      outcome: String
    }],
    immunizationStatus: {
      isUpToDate: Boolean,
      lastUpdated: Date,
      pendingVaccinations: [String],
      contraindications: [String]
    },
    riskFactors: [{
      factor: {
        type: String,
        enum: [
          'smoking',
          'alcohol_consumption',
          'drug_use',
          'obesity',
          'hypertension',
          'diabetes',
          'family_history',
          'occupational_hazard',
          'environmental_exposure',
          'sedentary_lifestyle',
          'poor_diet',
          'stress',
          'other'
        ]
      },
      severity: {
        type: String,
        enum: ['low', 'moderate', 'high'],
        default: 'moderate'
      },
      duration: String,
      notes: String,
      interventions: [String]
    }],
    vitalSigns: {
      lastRecorded: Date,
      height: {
        value: Number,
        unit: { type: String, default: 'cm' }
      },
      weight: {
        value: Number,
        unit: { type: String, default: 'kg' }
      },
      bmi: Number,
      bloodPressure: {
        systolic: Number,
        diastolic: Number,
        recordedDate: Date
      },
      heartRate: {
        value: Number,
        recordedDate: Date
      },
      temperature: {
        value: Number,
        unit: { type: String, default: 'C' },
        recordedDate: Date
      }
    }
  },
  
  // Location Information
  location: {
    villageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Village',
      required: true
    },
    address: {
      houseNumber: String,
      streetName: String,
      landmark: String,
      pincode: {
        type: String,
        match: /^[1-9][0-9]{5}$/
      },
      coordinates: {
        latitude: { type: Number, min: -90, max: 90 },
        longitude: { type: Number, min: -180, max: 180 },
        accuracy: Number
      }
    },
    residenceType: {
      type: String,
      enum: ['pucca', 'semi_pucca', 'kutcha', 'temporary', 'other'],
      lowercase: true
    },
    residenceOwnership: {
      type: String,
      enum: ['owned', 'rented', 'family_owned', 'government_quarters', 'other'],
      lowercase: true
    },
    migrationStatus: {
      isMigrant: Boolean,
      originVillage: String,
      originDistrict: String,
      originState: String,
      migrationDate: Date,
      migrationReason: String,
      isPermanent: Boolean
    }
  },
  
  // Socioeconomic Information
  socioeconomic: {
    education: {
      level: {
        type: String,
        enum: [
          'illiterate',
          'literate_no_formal',
          'primary',
          'secondary',
          'higher_secondary',
          'graduate',
          'post_graduate',
          'professional',
          'other'
        ],
        lowercase: true
      },
      yearsOfEducation: Number,
      currentlyStudying: Boolean,
      schoolName: String,
      specialNeeds: Boolean,
      dropoutReason: String
    },
    occupation: {
      primary: {
        type: String,
        enum: [
          'agriculture',
          'daily_wage_labor',
          'skilled_labor',
          'business_trade',
          'government_service',
          'private_service',
          'domestic_work',
          'student',
          'retired',
          'unemployed',
          'homemaker',
          'other'
        ],
        lowercase: true
      },
      secondary: String,
      workplace: String,
      workExposures: [String],
      income: {
        amount: Number,
        frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'], default: 'monthly' }
      },
      isEmployed: Boolean,
      employmentType: {
        type: String,
        enum: ['permanent', 'temporary', 'contract', 'seasonal', 'self_employed']
      }
    },
    economicStatus: {
      rationCardType: {
        type: String,
        enum: ['apl', 'bpl', 'aay', 'phh', 'none'],
        uppercase: true
      },
      bankAccount: {
        hasAccount: Boolean,
        bankName: String,
        accountType: String,
        isJanDhan: Boolean
      },
      assets: {
        land: { value: Number, unit: String },
        livestock: [String],
        vehicle: [String],
        appliances: [String]
      }
    }
  },
  
  // Registration Details
  registration: {
    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    registrationDate: {
      type: Date,
      default: Date.now
    },
    registrationMethod: {
      type: String,
      enum: ['door_to_door', 'facility_visit', 'camp', 'self_registration', 'referral'],
      default: 'door_to_door'
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected', 'needs_update'],
      default: 'pending'
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verificationDate: Date,
    verificationNotes: String,
    documentStatus: {
      aadharVerified: Boolean,
      aadharNumber: {
        type: String,
        match: /^[2-9]{1}[0-9]{3}[0-9]{4}[0-9]{4}$/
      },
      rationCardVerified: Boolean,
      rationCardNumber: String,
      voterIdVerified: Boolean,
      voterIdNumber: String,
      otherDocuments: [{
        type: String,
        number: String,
        verified: Boolean
      }]
    }
  },
  
  // Health ID and Schemes
  healthIds: {
    abhaNumber: {
      type: String,
      match: /^[0-9]{2}-[0-9]{4}-[0-9]{4}-[0-9]{4}$/
    },
    abhaAddress: String,
    healthIdNumber: String,
    familyHealthId: String,
    stateHealthId: String,
    districtHealthId: String
  },
  
  // Insurance and Benefits
  insurance: {
    schemes: [{
      schemeName: {
        type: String,
        enum: [
          'ayushman_bharat',
          'rashtriya_swasthya_bima_yojana',
          'state_health_insurance',
          'private_insurance',
          'employer_insurance',
          'other'
        ]
      },
      beneficiaryId: String,
      enrollmentDate: Date,
      expiryDate: Date,
      familyCoverage: Boolean,
      coverageAmount: Number,
      isActive: Boolean,
      cardNumber: String
    }],
    beneficiaryStatus: {
      isPmjayBeneficiary: Boolean,
      isStateSchemeBeneficiary: Boolean,
      beneficiaryCategory: String,
      vulnerableGroup: Boolean,
      priorityCategory: String
    }
  },
  
  // Care Management
  careManagement: {
    assignedAshaWorker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignmentDate: Date,
    primaryCareProvider: String,
    lastCheckupDate: Date,
    nextAppointment: {
      date: Date,
      purpose: String,
      provider: String,
      facility: String
    },
    carePlan: {
      type: String,
      maxlength: 1000
    },
    followUpSchedule: [{
      type: {
        type: String,
        enum: ['routine', 'chronic_disease', 'vaccination', 'antenatal', 'postnatal', 'other']
      },
      frequency: String,
      nextDue: Date,
      priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
      }
    }],
    riskAssessment: {
      overallRisk: {
        type: String,
        enum: ['low', 'moderate', 'high', 'very_high'],
        default: 'low'
      },
      riskFactors: [String],
      lastAssessmentDate: Date,
      assessedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }
  },
  
  // Special Programs
  specialPrograms: {
    maternalHealth: {
      isPregnant: Boolean,
      pregnancyDetails: {
        lmp: Date,
        edd: Date,
        gravida: Number,
        para: Number,
        abortions: Number,
        livingChildren: Number,
        isHighRisk: Boolean,
        riskFactors: [String],
        antenatalCareProvider: String
      },
      childbirthHistory: [{
        deliveryDate: Date,
        deliveryType: String,
        birthWeight: Number,
        complications: [String],
        outcome: String
      }]
    },
    childHealth: {
      isChild: Boolean,
      childDetails: {
        birthWeight: Number,
        birthLength: Number,
        gestationalAge: Number,
        deliveryType: String,
        complications: [String],
        feedingType: String,
        developmentalMilestones: [{
          milestone: String,
          expectedAge: Number,
          achievedAge: Number,
          status: String
        }],
        growthMonitoring: [{
          date: Date,
          weight: Number,
          height: Number,
          headCircumference: Number,
          nutritionalStatus: String
        }]
      }
    },
    elderlyCare: {
      isElderly: Boolean,
      elderlyDetails: {
        functionalStatus: String,
        cognitiveStatus: String,
        mobilityStatus: String,
        caregiverSupport: String,
        specialNeeds: [String]
      }
    }
  },
  
  // Communication Preferences
  communication: {
    preferredLanguage: {
      type: String,
      default: 'hindi'
    },
    preferredContactMethod: {
      type: String,
      enum: ['phone', 'sms', 'whatsapp', 'in_person', 'family_contact'],
      default: 'phone'
    },
    bestTimeToContact: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'anytime'],
      default: 'anytime'
    },
    consentForCommunication: {
      sms: Boolean,
      phone: Boolean,
      whatsapp: Boolean,
      email: Boolean
    },
    dataSharingConsent: {
      healthDepartment: Boolean,
      researchPurposes: Boolean,
      qualityImprovement: Boolean,
      consentDate: Date,
      consentWithdrawn: Boolean,
      withdrawalDate: Date
    }
  },
  
  // Additional Information
  notes: {
    type: String,
    maxlength: 2000
  },
  
  tags: [String],
  
  // Data Management
  dataQuality: {
    completeness: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    lastValidation: Date,
    validatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    duplicateChecked: Boolean,
    duplicateCheckDate: Date
  },
  
  // Administrative
  isActive: {
    type: Boolean,
    default: true
  },
  
  isDeceased: {
    type: Boolean,
    default: false
  },
  
  deathDetails: {
    dateOfDeath: Date,
    placeOfDeath: String,
    causeOfDeath: String,
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  suppressReservedKeysWarning: true
});

// Indexes for performance
patientRecordSchema.index({ 'personalInfo.firstName': 1, 'personalInfo.lastName': 1 });
patientRecordSchema.index({ 'contactInfo.mobileNumber.primary': 1 });
patientRecordSchema.index({ 'location.villageId': 1 });
patientRecordSchema.index({ 'careManagement.assignedAshaWorker': 1 });
patientRecordSchema.index({ 'registration.registeredBy': 1, 'registration.registrationDate': -1 });
patientRecordSchema.index({ 'healthIds.abhaNumber': 1 });
patientRecordSchema.index({ 'personalInfo.dateOfBirth': 1 });
patientRecordSchema.index({ 'personalInfo.gender': 1, 'personalInfo.dateOfBirth': 1 });

// Compound indexes
patientRecordSchema.index({
  'location.villageId': 1,
  'personalInfo.gender': 1,
  'registration.registrationDate': -1
});

// Virtual for full name
patientRecordSchema.virtual('fullName').get(function() {
  const { firstName, middleName, lastName } = this.personalInfo;
  return [firstName, middleName, lastName].filter(Boolean).join(' ');
});

// Virtual for current age
patientRecordSchema.virtual('currentAge').get(function() {
  const birthDate = new Date(this.personalInfo.dateOfBirth);
  const today = new Date();
  const ageInMilliseconds = today - birthDate;
  const ageInDays = Math.floor(ageInMilliseconds / (1000 * 60 * 60 * 24));
  const years = Math.floor(ageInDays / 365.25);
  const months = Math.floor((ageInDays % 365.25) / 30.44);
  
  return { years, months, days: ageInDays };
});

// Virtual for age category
patientRecordSchema.virtual('ageCategory').get(function() {
  const age = this.currentAge.years;
  
  if (age < 1) return 'infant';
  if (age < 5) return 'child';
  if (age < 18) return 'adolescent';
  if (age < 60) return 'adult';
  return 'elderly';
});

// Pre-save middleware to generate patientId
patientRecordSchema.pre('save', async function(next) {
  if (this.isNew && !this.patientId) {
    const seq = await getNextSequence('PAT-VLG');
    this.patientId = `PAT-VLG-${String(seq).padStart(4, '0')}`;
  }
  next();
});

// Pre-save middleware to calculate age
patientRecordSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('personalInfo.dateOfBirth')) {
    const age = this.currentAge;
    this.personalInfo.age = {
      years: age.years,
      months: age.months,
      calculated: new Date()
    };
  }
  next();
});

// Pre-save middleware to calculate data completeness
patientRecordSchema.pre('save', function(next) {
  if (this.isNew || this.isModified()) {
    this.calculateDataCompleteness();
  }
  next();
});

// Method to calculate data completeness
patientRecordSchema.methods.calculateDataCompleteness = function() {
  const requiredFields = [
    'personalInfo.firstName',
    'personalInfo.lastName',
    'personalInfo.dateOfBirth',
    'personalInfo.gender',
    'contactInfo.mobileNumber.primary',
    'location.villageId'
  ];
  
  const importantOptionalFields = [
    'personalInfo.maritalStatus',
    'contactInfo.emergencyContacts.length',
    'healthProfile.bloodGroup',
    'socioeconomic.education.level',
    'socioeconomic.occupation.primary',
    'careManagement.assignedAshaWorker',
    'healthIds.abhaNumber'
  ];
  
  let completed = 0;
  const totalFields = requiredFields.length + importantOptionalFields.length;
  
  // Check required fields
  requiredFields.forEach(field => {
    const value = this.get(field);
    if (value !== null && value !== undefined && value !== '') {
      completed++;
    }
  });
  
  // Check important optional fields
  importantOptionalFields.forEach(field => {
    const value = this.get(field);
    if (value !== null && value !== undefined && value !== '' && value !== 0) {
      completed++;
    }
  });
  
  this.dataQuality.completeness = Math.round((completed / totalFields) * 100);
};

// Static method to get village demographics
patientRecordSchema.statics.getVillageDemographics = function(villageId) {
  return this.aggregate([
    {
      $match: {
        'location.villageId': mongoose.Types.ObjectId(villageId),
        isActive: true,
        isDeceased: false
      }
    },
    {
      $group: {
        _id: null,
        totalPopulation: { $sum: 1 },
        maleCount: {
          $sum: { $cond: [{ $eq: ['$personalInfo.gender', 'male'] }, 1, 0] }
        },
        femaleCount: {
          $sum: { $cond: [{ $eq: ['$personalInfo.gender', 'female'] }, 1, 0] }
        },
        children: {
          $sum: {
            $cond: [
              { $lt: ['$personalInfo.age.years', 18] },
              1,
              0
            ]
          }
        },
        adults: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gte: ['$personalInfo.age.years', 18] },
                  { $lt: ['$personalInfo.age.years', 60] }
                ]
              },
              1,
              0
            ]
          }
        },
        elderly: {
          $sum: {
            $cond: [
              { $gte: ['$personalInfo.age.years', 60] },
              1,
              0
            ]
          }
        }
      }
    }
  ]);
};

// Static method to get patients by ASHA worker
patientRecordSchema.statics.getPatientsByAshaWorker = function(ashaWorkerId) {
  return this.find({
    'careManagement.assignedAshaWorker': ashaWorkerId,
    isActive: true,
    isDeceased: false
  })
  .select('personalInfo contactInfo location careManagement')
  .populate('location.villageId', 'villageName')
  .sort({ 'personalInfo.firstName': 1 });
};

export default mongoose.model('PatientRecord', patientRecordSchema);