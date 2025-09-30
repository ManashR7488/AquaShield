import mongoose from 'mongoose';
import { getNextSequence } from './counter.model.js';

const diseaseRecordSchema = new mongoose.Schema({
  // Record Identification
  recordId: {
    type: String,
    unique: true,
    required: true,
    match: /^DSR-VLG-\d{4}$/,
    uppercase: true
  },
  
  // Patient Reference
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PatientRecord',
    required: true
  },
  
  // Disease Information
  diseaseInfo: {
    diseaseName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    diseaseCode: {
      type: String,
      trim: true,
      uppercase: true,
      validate: {
        validator: function(v) {
          return /^[A-Z]\d{2}(\.\d{1,2})?$/.test(v);
        },
        message: 'Disease code must follow ICD-10 format (e.g., A09.0)'
      }
    },
    classification: {
      type: String,
      required: true,
      enum: [
        'communicable',
        'non_communicable',
        'vector_borne',
        'water_borne',
        'food_borne',
        'airborne',
        'zoonotic',
        'occupational',
        'environmental',
        'genetic',
        'unknown'
      ],
      lowercase: true
    },
    severityLevel: {
      type: String,
      required: true,
      enum: ['mild', 'moderate', 'severe', 'critical', 'fatal'],
      default: 'mild',
      lowercase: true
    },
    diseaseCategory: {
      type: String,
      enum: [
        'respiratory',
        'gastrointestinal',
        'neurological',
        'cardiovascular',
        'dermatological',
        'ophthalmological',
        'musculoskeletal',
        'endocrine',
        'reproductive',
        'urinary',
        'hematological',
        'immunological',
        'psychiatric',
        'oncological',
        'other'
      ],
      lowercase: true
    }
  },
  
  // Case Details
  caseDetails: {
    caseNumber: {
      type: String,
      unique: true,
      sparse: true
    },
    reportingDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    onsetDate: {
      type: Date,
      required: true,
      validate: {
        validator: function(v) {
          return v <= new Date();
        },
        message: 'Onset date cannot be in the future'
      }
    },
    diagnosisDate: {
      type: Date,
      validate: {
        validator: function(v) {
          return !v || v >= this.caseDetails.onsetDate;
        },
        message: 'Diagnosis date cannot be before onset date'
      }
    },
    caseStatus: {
      type: String,
      enum: ['suspected', 'probable', 'confirmed', 'ruled_out', 'under_investigation'],
      default: 'suspected',
      lowercase: true
    }
  },
  
  // Symptom Tracking
  symptoms: [{
    symptomName: {
      type: String,
      required: true,
      trim: true
    },
    onsetDate: {
      type: Date,
      required: true
    },
    duration: {
      value: Number,
      unit: { type: String, enum: ['hours', 'days', 'weeks', 'months'], default: 'days' }
    },
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe'],
      default: 'mild',
      lowercase: true
    },
    frequency: {
      type: String,
      enum: ['constant', 'intermittent', 'occasional', 'rare'],
      default: 'intermittent',
      lowercase: true
    },
    progressionNotes: String,
    resolved: {
      type: Boolean,
      default: false
    },
    resolutionDate: Date
  }],
  
  // Diagnosis Information
  diagnosis: {
    preliminaryDiagnosis: {
      type: String,
      required: true,
      trim: true
    },
    confirmedDiagnosis: {
      type: String,
      trim: true
    },
    diagnosticMethod: {
      type: String,
      enum: [
        'clinical_examination',
        'laboratory_test',
        'imaging',
        'biopsy',
        'culture',
        'serology',
        'pcr',
        'rapid_test',
        'autopsy',
        'other'
      ],
      lowercase: true
    },
    confirmingAuthority: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    labResults: [{
      testName: String,
      result: String,
      normalRange: String,
      testDate: Date,
      labName: String,
      reportNumber: String
    }],
    differentialDiagnosis: [String]
  },
  
  // Treatment Tracking
  treatment: {
    medicationsPrescribed: [{
      medicationName: {
        type: String,
        required: true
      },
      dosage: String,
      frequency: String,
      duration: String,
      prescribedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      prescriptionDate: {
        type: Date,
        default: Date.now
      },
      compliance: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor', 'unknown'],
        default: 'unknown'
      }
    }],
    treatmentPlan: {
      type: String,
      maxlength: 1000
    },
    treatmentResponse: {
      type: String,
      enum: ['excellent', 'good', 'partial', 'no_response', 'adverse_reaction'],
      lowercase: true
    },
    hospitalization: {
      required: Boolean,
      admissionDate: Date,
      dischargeDate: Date,
      hospital: String,
      ward: String,
      complications: [String]
    },
    recoveryStatus: {
      type: String,
      enum: ['recovering', 'recovered', 'stable', 'deteriorating', 'deceased'],
      default: 'stable',
      lowercase: true
    },
    recoveryDate: Date
  },
  
  // Epidemiological Data
  epidemiology: {
    transmissionMode: {
      type: String,
      enum: [
        'direct_contact',
        'droplet',
        'airborne',
        'vector_borne',
        'food_borne',
        'water_borne',
        'sexual',
        'vertical',
        'unknown'
      ],
      lowercase: true
    },
    suspectedSource: {
      sourceType: {
        type: String,
        enum: ['person', 'animal', 'environment', 'food', 'water', 'unknown']
      },
      sourceDetails: String,
      exposureDate: Date,
      exposureLocation: String
    },
    contactTracing: {
      contactsIdentified: {
        type: Number,
        min: 0,
        default: 0
      },
      contactsScreened: {
        type: Number,
        min: 0,
        default: 0
      },
      secondaryCases: {
        type: Number,
        min: 0,
        default: 0
      },
      contacts: [{
        name: String,
        relationship: String,
        contactType: { type: String, enum: ['household', 'close', 'casual'] },
        lastContact: Date,
        screeningDate: Date,
        screeningResult: { type: String, enum: ['negative', 'positive', 'pending'] },
        quarantineStatus: { type: String, enum: ['required', 'voluntary', 'not_required'] }
      }]
    },
    isolationStatus: {
      required: Boolean,
      startDate: Date,
      endDate: Date,
      location: { type: String, enum: ['home', 'hospital', 'isolation_center'] },
      compliance: { type: String, enum: ['excellent', 'good', 'fair', 'poor'] }
    },
    travelHistory: [{
      destination: String,
      departureDate: Date,
      returnDate: Date,
      modeOfTransport: String,
      purpose: String
    }]
  },
  
  // Outbreak Tracking
  outbreakInfo: {
    isPartOfOutbreak: {
      type: Boolean,
      default: false
    },
    outbreakId: {
      type: String,
      sparse: true,
      validate: {
        validator: function(v) {
          return !v || /^OUT-\d{4}-\d{3}$/.test(v);
        },
        message: 'Outbreak ID must follow format OUT-YYYY-XXX'
      }
    },
    caseNumberInOutbreak: Number,
    investigationStatus: {
      type: String,
      enum: ['not_started', 'ongoing', 'completed', 'suspended'],
      default: 'not_started'
    },
    epidemiologicalLink: {
      type: String,
      enum: ['confirmed', 'probable', 'possible', 'none'],
      default: 'none'
    }
  },
  
  // Geographic Context
  location: {
    exposureLocation: {
      village: String,
      block: String,
      district: String,
      state: String,
      coordinates: {
        latitude: { type: Number, min: -90, max: 90 },
        longitude: { type: Number, min: -180, max: 180 }
      }
    },
    residenceAtOnset: {
      address: String,
      village: String,
      pincode: String,
      coordinates: {
        latitude: { type: Number, min: -90, max: 90 },
        longitude: { type: Number, min: -180, max: 180 }
      }
    }
  },
  
  // Environmental Factors
  environmentalFactors: {
    waterSource: {
      type: String,
      enum: ['piped_water', 'well', 'borehole', 'spring', 'river', 'pond', 'tank', 'other']
    },
    sanitationFacility: {
      type: String,
      enum: ['flush_toilet', 'pit_latrine', 'composting_toilet', 'open_defecation', 'other']
    },
    wasteDisposal: {
      type: String,
      enum: ['municipal_collection', 'burning', 'burial', 'composting', 'open_dumping', 'other']
    },
    housingConditions: {
      type: String,
      enum: ['good', 'fair', 'poor', 'overcrowded']
    },
    vectorPresence: {
      mosquitoes: Boolean,
      flies: Boolean,
      rodents: Boolean,
      other: [String]
    },
    seasonalFactors: {
      season: { type: String, enum: ['summer', 'monsoon', 'winter', 'post_monsoon'] },
      climateConditions: [String]
    }
  },
  
  // Reporting and Investigation
  reporting: {
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reportingFacility: {
      name: String,
      type: { type: String, enum: ['primary_health_center', 'community_health_center', 'district_hospital', 'private_clinic', 'home'] },
      address: String
    },
    investigatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    investigationDate: Date,
    investigationFindings: String,
    recommendedActions: [String],
    followUpRequired: {
      type: Boolean,
      default: true
    },
    nextFollowUpDate: Date
  },
  
  // Laboratory Information
  laboratory: {
    specimenCollected: {
      type: Boolean,
      default: false
    },
    specimens: [{
      specimenType: {
        type: String,
        enum: ['blood', 'urine', 'stool', 'sputum', 'csf', 'swab', 'tissue', 'other']
      },
      collectionDate: Date,
      collectedBy: String,
      labName: String,
      labNumber: String,
      testRequested: [String],
      results: [{
        test: String,
        result: String,
        interpretation: String,
        resultDate: Date
      }]
    }]
  },
  
  // Outcome
  outcome: {
    finalOutcome: {
      type: String,
      enum: ['recovered', 'died', 'chronic', 'disability', 'lost_to_followup', 'ongoing'],
      lowercase: true
    },
    dateOfOutcome: Date,
    causeOfDeath: String,
    placeOfDeath: {
      type: String,
      enum: ['home', 'hospital', 'transit', 'other']
    },
    complications: [String],
    sequelae: [String]
  },
  
  // Additional Information
  notes: {
    type: String,
    maxlength: 2000
  },
  
  attachments: [{
    type: {
      type: String,
      enum: ['lab_report', 'image', 'document', 'other']
    },
    url: String,
    description: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Data Quality
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
    validationStatus: {
      type: String,
      enum: ['pending', 'validated', 'needs_revision'],
      default: 'pending'
    }
  },
  
  // Administrative
  isActive: {
    type: Boolean,
    default: true
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
  
  deletedAt: Date,
  
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
diseaseRecordSchema.index({ patientId: 1, 'caseDetails.reportingDate': -1 });
diseaseRecordSchema.index({ 'diseaseInfo.diseaseName': 1, 'caseDetails.reportingDate': -1 });
diseaseRecordSchema.index({ 'diseaseInfo.classification': 1 });
diseaseRecordSchema.index({ 'caseDetails.caseStatus': 1 });
diseaseRecordSchema.index({ 'reporting.reportedBy': 1 });
diseaseRecordSchema.index({ 'caseDetails.onsetDate': -1 });
diseaseRecordSchema.index({ 'treatment.recoveryStatus': 1 });

// Compound indexes
diseaseRecordSchema.index({ 
  'diseaseInfo.classification': 1, 
  'caseDetails.onsetDate': -1,
  'location.exposureLocation.district': 1 
});

// Virtual for disease duration
diseaseRecordSchema.virtual('diseaseDuration').get(function() {
  if (this.treatment.recoveryDate) {
    return Math.floor((this.treatment.recoveryDate - this.caseDetails.onsetDate) / (1000 * 60 * 60 * 24));
  }
  return Math.floor((Date.now() - this.caseDetails.onsetDate) / (1000 * 60 * 60 * 24));
});

// Virtual for days since onset
diseaseRecordSchema.virtual('daysSinceOnset').get(function() {
  return Math.floor((Date.now() - this.caseDetails.onsetDate) / (1000 * 60 * 60 * 24));
});

// Virtual for case age
diseaseRecordSchema.virtual('caseAge').get(function() {
  return Math.floor((Date.now() - this.caseDetails.reportingDate) / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to generate recordId and caseNumber
diseaseRecordSchema.pre('save', async function(next) {
  if (this.isNew) {
    if (!this.recordId) {
      const seq = await getNextSequence('DSR-VLG');
      this.recordId = `DSR-VLG-${String(seq).padStart(4, '0')}`;
    }
    
    if (!this.caseDetails.caseNumber) {
      const today = new Date();
      const year = today.getFullYear();
      const caseKey = `CASE-${year}`;
      const seq = await getNextSequence(caseKey);
      this.caseDetails.caseNumber = `CASE-${year}-${String(seq).padStart(4, '0')}`;
    }
  }
  next();
});

// Pre-save middleware to calculate data completeness
diseaseRecordSchema.pre('save', function(next) {
  if (this.isNew || this.isModified()) {
    this.calculateDataCompleteness();
  }
  next();
});

// Method to calculate data completeness
diseaseRecordSchema.methods.calculateDataCompleteness = function() {
  const requiredFields = [
    'diseaseInfo.diseaseName',
    'diseaseInfo.classification',
    'diseaseInfo.severityLevel',
    'caseDetails.onsetDate',
    'caseDetails.caseStatus',
    'diagnosis.preliminaryDiagnosis'
  ];
  
  const optionalFields = [
    'diseaseInfo.diseaseCode',
    'diseaseInfo.diseaseCategory',
    'diagnosis.confirmedDiagnosis',
    'treatment.treatmentPlan',
    'epidemiology.transmissionMode',
    'symptoms.length',
    'treatment.medicationsPrescribed.length'
  ];
  
  let completedRequired = 0;
  let completedOptional = 0;
  
  // Check required fields
  requiredFields.forEach(field => {
    const value = this.get(field);
    if (value !== null && value !== undefined && value !== '') {
      completedRequired++;
    }
  });
  
  // Check optional fields
  optionalFields.forEach(field => {
    const value = this.get(field);
    if (value !== null && value !== undefined && value !== '' && value !== 0) {
      completedOptional++;
    }
  });
  
  // Calculate percentage (required fields weighted more heavily)
  const requiredWeight = 0.7;
  const optionalWeight = 0.3;
  
  const requiredScore = (completedRequired / requiredFields.length) * requiredWeight;
  const optionalScore = (completedOptional / optionalFields.length) * optionalWeight;
  
  this.dataQuality.completeness = Math.round((requiredScore + optionalScore) * 100);
};

// Static method to get disease trends
diseaseRecordSchema.statics.getDiseaseTrends = function(filters = {}, days = 30) {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  const matchQuery = {
    'caseDetails.onsetDate': { $gte: cutoffDate },
    isActive: true,
    ...filters
  };
  
  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: {
          disease: '$diseaseInfo.diseaseName',
          classification: '$diseaseInfo.classification'
        },
        count: { $sum: 1 },
        severeCases: {
          $sum: {
            $cond: [
              { $in: ['$diseaseInfo.severityLevel', ['severe', 'critical']] },
              1,
              0
            ]
          }
        },
        latestCase: { $max: '$caseDetails.onsetDate' }
      }
    },
    {
      $sort: { count: -1, latestCase: -1 }
    }
  ]);
};

// Static method to get outbreak cases
diseaseRecordSchema.statics.getOutbreakCases = function(outbreakId) {
  return this.find({
    'outbreakInfo.outbreakId': outbreakId,
    isActive: true
  })
  .populate('patientId', 'personalInfo location')
  .populate('reporting.reportedBy', 'name role')
  .sort({ 'caseDetails.reportingDate': -1 });
};

export default mongoose.model('DiseaseRecord', diseaseRecordSchema);