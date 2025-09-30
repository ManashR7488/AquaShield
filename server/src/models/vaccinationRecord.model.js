import mongoose from 'mongoose';
import { getNextSequence } from './counter.model.js';

const vaccinationRecordSchema = new mongoose.Schema({
  // Vaccination Identification
  vaccinationId: {
    type: String,
    unique: true,
    required: true,
    match: /^VAC-PAT-\d{6}$/,
    uppercase: true
  },
  
  // Patient Reference
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PatientRecord',
    required: true
  },
  
  // Vaccine Information
  vaccineInfo: {
    vaccineName: {
      type: String,
      required: true,
      trim: true,
      enum: [
        // Routine Immunization Schedule
        'BCG', 'Hepatitis B', 'OPV', 'DPT', 'Pentavalent', 'Rotavirus', 'PCV',
        'IPV', 'MMR', 'JE', 'Typhoid', 'HPV', 'TT', 'Td',
        // Special Vaccines
        'Meningococcal', 'Pneumococcal', 'Varicella', 'Influenza',
        // COVID-19 Vaccines
        'Covishield', 'Covaxin', 'Sputnik V', 'Corbevax', 'Covovax',
        // Other
        'Other'
      ]
    },
    vaccineCode: {
      type: String,
      uppercase: true,
      trim: true
    },
    manufacturer: {
      type: String,
      trim: true
    },
    batchNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    expiryDate: {
      type: Date,
      required: true,
      validate: {
        validator: function(v) {
          // For historical records, validate against administration date
          // For future/scheduled vaccines, validate against scheduled date
          const referenceDate = this.administration?.administeredDate || this.schedule?.scheduledDate || new Date();
          return v > referenceDate;
        },
        message: 'Vaccine must not be expired at time of administration/scheduling'
      }
    },
    vialNumber: {
      type: String,
      trim: true
    },
    dosesPerVial: {
      type: Number,
      min: 1,
      default: 1
    }
  },
  
  // Schedule Information
  schedule: {
    scheduledDate: {
      type: Date,
      required: true
    },
    dueDate: {
      type: Date,
      required: true
    },
    vaccinationType: {
      type: String,
      required: true,
      enum: ['routine', 'catch_up', 'outbreak_response', 'campaign', 'travel', 'occupational'],
      default: 'routine',
      lowercase: true
    },
    targetAgeGroup: {
      minAge: {
        value: Number,
        unit: { type: String, enum: ['days', 'weeks', 'months', 'years'], default: 'months' }
      },
      maxAge: {
        value: Number,
        unit: { type: String, enum: ['days', 'weeks', 'months', 'years'], default: 'months' }
      },
      ageAtVaccination: {
        value: Number,
        unit: { type: String, enum: ['days', 'weeks', 'months', 'years'], default: 'months' }
      }
    },
    priorityLevel: {
      type: String,
      enum: ['routine', 'high', 'urgent', 'emergency'],
      default: 'routine',
      lowercase: true
    },
    sessionType: {
      type: String,
      enum: ['fixed', 'outreach', 'mobile', 'campaign', 'school_based'],
      lowercase: true
    }
  },
  
  // Administration Details
  administration: {
    isAdministered: {
      type: Boolean,
      default: false
    },
    administeredDate: {
      type: Date,
      validate: {
        validator: function(v) {
          return !this.administration.isAdministered || (v && v <= new Date());
        },
        message: 'Administration date cannot be in the future'
      }
    },
    administeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      validate: {
        validator: function(v) {
          return !this.administration.isAdministered || v;
        },
        message: 'Administrator is required when vaccine is administered'
      }
    },
    administrationSite: {
      type: String,
      enum: [
        'left_arm_deltoid',
        'right_arm_deltoid',
        'left_thigh_anterolateral',
        'right_thigh_anterolateral',
        'oral',
        'nasal',
        'other'
      ],
      lowercase: true
    },
    route: {
      type: String,
      enum: ['intramuscular', 'subcutaneous', 'intradermal', 'oral', 'nasal', 'other'],
      lowercase: true
    },
    doseNumber: {
      type: Number,
      min: 1,
      required: true
    },
    totalDosesInSeries: {
      type: Number,
      min: 1,
      required: true
    },
    isSeriesComplete: {
      type: Boolean,
      default: false
    },
    intervalSinceLastDose: {
      value: Number,
      unit: { type: String, enum: ['days', 'weeks', 'months'], default: 'weeks' }
    }
  },
  
  // Vaccine Storage and Handling
  storage: {
    temperatureAtAdministration: {
      type: Number,
      validate: {
        validator: function(v) {
          return v >= 2 && v <= 8;
        },
        message: 'Vaccine storage temperature should be between 2-8°C'
      }
    },
    temperatureMonitoring: {
      type: String,
      enum: ['continuous', 'periodic', 'not_monitored'],
      default: 'periodic'
    },
    coldChainMaintained: {
      type: Boolean,
      default: true
    },
    vvmStatus: {
      type: String,
      enum: ['stage_1', 'stage_2', 'stage_3', 'stage_4', 'discard'],
      description: 'Vaccine Vial Monitor status'
    },
    diluent: {
      used: Boolean,
      batchNumber: String,
      expiryDate: Date,
      mixingTime: Date
    }
  },
  
  // Coverage and Campaign Information
  coverage: {
    vaccinationCampaignId: {
      type: String,
      sparse: true,
      validate: {
        validator: function(v) {
          return !v || /^CAMP-\d{4}-\d{3}$/.test(v);
        },
        message: 'Campaign ID must follow format CAMP-YYYY-XXX'
      }
    },
    targetPopulation: {
      type: Number,
      min: 0
    },
    coverageArea: {
      villages: [String],
      blocks: [String],
      districts: [String]
    },
    session: {
      sessionId: String,
      sessionDate: Date,
      venue: String,
      teamLeader: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      teamMembers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }]
    }
  },
  
  // Adverse Events Following Immunization (AEFI)
  aefi: {
    hasAdverseEvent: {
      type: Boolean,
      default: false
    },
    events: [{
      eventType: {
        type: String,
        enum: [
          'local_reaction',
          'fever',
          'allergic_reaction',
          'anaphylaxis',
          'seizure',
          'persistent_crying',
          'hypotonic_hyporesponsive',
          'abscess',
          'lymphadenitis',
          'other'
        ]
      },
      severity: {
        type: String,
        enum: ['mild', 'moderate', 'severe', 'life_threatening'],
        default: 'mild'
      },
      onsetTime: {
        value: Number,
        unit: { type: String, enum: ['minutes', 'hours', 'days'], default: 'hours' }
      },
      duration: {
        value: Number,
        unit: { type: String, enum: ['minutes', 'hours', 'days'], default: 'hours' }
      },
      treatment: String,
      outcome: {
        type: String,
        enum: ['recovered', 'recovering', 'not_recovered', 'died', 'unknown']
      },
      reportedDate: Date,
      reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }],
    aefiReportNumber: {
      type: String,
      sparse: true
    },
    investigationRequired: {
      type: Boolean,
      default: false
    },
    investigationStatus: {
      type: String,
      enum: ['not_required', 'pending', 'ongoing', 'completed'],
      default: 'not_required'
    }
  },
  
  // Follow-up Information
  followUp: {
    nextDueDate: {
      type: Date,
      validate: {
        validator: function(v) {
          return !v || v > new Date();
        },
        message: 'Next due date must be in the future'
      }
    },
    nextVaccineDue: {
      type: String,
      trim: true
    },
    boosterRequired: {
      type: Boolean,
      default: false
    },
    boosterDueDate: Date,
    remindersSent: [{
      type: { type: String, enum: ['sms', 'call', 'whatsapp', 'in_person'] },
      sentDate: Date,
      sentBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      response: String
    }],
    defaulterStatus: {
      type: String,
      enum: ['not_defaulter', 'defaulter', 'dropout'],
      default: 'not_defaulter'
    },
    defaulterFollowUp: [{
      visitDate: Date,
      visitBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      finding: String,
      action: String,
      outcome: String
    }]
  },
  
  // Quality Assurance
  qualityAssurance: {
    dataValidated: {
      type: Boolean,
      default: false
    },
    validatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    validationDate: Date,
    discrepancies: [String],
    correctionsMade: [{
      field: String,
      oldValue: String,
      newValue: String,
      correctedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      correctionDate: Date,
      reason: String
    }],
    auditTrail: [{
      action: String,
      performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      timestamp: Date,
      details: String
    }]
  },
  
  // Facility and Location
  facility: {
    vaccinationFacility: {
      name: String,
      type: {
        type: String,
        enum: [
          'primary_health_center',
          'sub_center',
          'community_health_center',
          'district_hospital',
          'private_clinic',
          'school',
          'anganwadi',
          'outreach_site',
          'home'
        ]
      },
      address: String,
      inCharge: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    location: {
      village: String,
      block: String,
      district: String,
      state: String,
      coordinates: {
        latitude: { type: Number, min: -90, max: 90 },
        longitude: { type: Number, min: -180, max: 180 }
      }
    }
  },
  
  // Consent and Documentation
  consent: {
    consentObtained: {
      type: Boolean,
      required: true
    },
    consentGivenBy: {
      type: String,
      enum: ['self', 'parent', 'guardian', 'spouse', 'other'],
      required: true
    },
    consentDate: {
      type: Date,
      default: Date.now
    },
    informationProvided: {
      benefitsExplained: Boolean,
      risksExplained: Boolean,
      alternativesDiscussed: Boolean,
      questionAnswered: Boolean
    },
    documentedConsent: {
      type: Boolean,
      default: false
    },
    consentFormNumber: String
  },
  
  // Contraindications and Precautions
  contraindications: {
    hasContraindications: {
      type: Boolean,
      default: false
    },
    contraindicationsList: [{
      type: String,
      enum: [
        'severe_illness',
        'immunocompromised',
        'pregnancy',
        'allergy_to_vaccine_component',
        'previous_adverse_reaction',
        'recent_blood_transfusion',
        'other'
      ]
    }],
    precautionsTaken: [String],
    specialConsiderations: String
  },
  
  // Wastage and Logistics
  wastage: {
    vaccineWastage: {
      type: Boolean,
      default: false
    },
    wastageReason: {
      type: String,
      enum: [
        'vial_breakage',
        'vvm_stage_3_4',
        'freeze_exposure',
        'contamination',
        'expiry',
        'label_missing',
        'other'
      ]
    },
    wastageQuantity: {
      vials: Number,
      doses: Number
    },
    wastageReportedTo: String,
    wastageReportDate: Date
  },
  
  // Additional Information
  notes: {
    type: String,
    maxlength: 1000
  },
  
  images: [{
    type: {
      type: String,
      enum: ['vaccination_card', 'certificate', 'adverse_event', 'other']
    },
    url: String,
    description: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Certificate Information
  certificate: {
    certificateGenerated: {
      type: Boolean,
      default: false
    },
    certificateNumber: String,
    qrCode: String,
    digitalSignature: String,
    issuedDate: Date,
    downloadUrl: String
  },
  
  // Integration with External Systems
  externalSystems: {
    cowinRegistration: {
      registered: Boolean,
      cowinId: String,
      beneficiaryId: String
    },
    statePortal: {
      synced: Boolean,
      stateId: String,
      lastSyncDate: Date
    },
    rtis: {
      uploaded: Boolean,
      rtisId: String,
      uploadDate: Date
    }
  },
  
  // Administrative
  isActive: {
    type: Boolean,
    default: true
  },
  
  isCancelled: {
    type: Boolean,
    default: false
  },
  
  cancellationReason: String,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  cancellationDate: Date,
  
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
vaccinationRecordSchema.index({ patientId: 1, 'schedule.scheduledDate': -1 });
vaccinationRecordSchema.index({ 'vaccineInfo.vaccineName': 1, 'administration.administeredDate': -1 });
vaccinationRecordSchema.index({ 'administration.isAdministered': 1, 'schedule.dueDate': 1 });
vaccinationRecordSchema.index({ 'followUp.defaulterStatus': 1 });
vaccinationRecordSchema.index({ 'administration.administeredBy': 1, 'administration.administeredDate': -1 });

// Compound indexes
vaccinationRecordSchema.index({
  'vaccineInfo.vaccineName': 1,
  'administration.doseNumber': 1,
  patientId: 1
});

vaccinationRecordSchema.index({
  'schedule.vaccinationType': 1,
  'administration.isAdministered': 1,
  'schedule.dueDate': -1
});

// Virtual for vaccination status
vaccinationRecordSchema.virtual('vaccinationStatus').get(function() {
  if (!this.administration.isAdministered) {
    const dueDate = new Date(this.schedule.dueDate);
    const today = new Date();
    
    if (today > dueDate) {
      const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
      if (daysOverdue > 30) return 'dropout';
      if (daysOverdue > 7) return 'defaulter';
      return 'overdue';
    } else {
      return 'scheduled';
    }
  }
  
  return 'completed';
});

// Virtual for days since administration or days until due
vaccinationRecordSchema.virtual('daysSinceOrUntil').get(function() {
  const today = new Date();
  
  if (this.administration.isAdministered) {
    const adminDate = new Date(this.administration.administeredDate);
    return Math.floor((today - adminDate) / (1000 * 60 * 60 * 24));
  } else {
    const dueDate = new Date(this.schedule.dueDate);
    return Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));
  }
});

// Pre-save middleware to generate vaccinationId
vaccinationRecordSchema.pre('save', async function(next) {
  if (this.isNew && !this.vaccinationId) {
    const seq = await getNextSequence('VAC-PAT');
    this.vaccinationId = `VAC-PAT-${String(seq).padStart(6, '0')}`;
  }
  next();
});

// Pre-save middleware to update series completion status
vaccinationRecordSchema.pre('save', function(next) {
  if (this.administration.isAdministered) {
    this.administration.isSeriesComplete = 
      this.administration.doseNumber === this.administration.totalDosesInSeries;
  }
  next();
});

// Pre-validate middleware to set defaulter status (runs on every validation)
vaccinationRecordSchema.pre('validate', function(next) {
  if (!this.administration.isAdministered && this.schedule.dueDate) {
    const today = new Date();
    const dueDate = new Date(this.schedule.dueDate);
    const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
    
    if (daysOverdue > 30) {
      this.followUp.defaulterStatus = 'dropout';
    } else if (daysOverdue > 7) {
      this.followUp.defaulterStatus = 'defaulter';
    } else {
      this.followUp.defaulterStatus = 'not_defaulter';
    }
  }
  next();
});

// Static method to bulk refresh defaulter statuses
vaccinationRecordSchema.statics.refreshDefaulterStatuses = async function() {
  const today = new Date();
  
  // Update not defaulters to defaulters
  await this.updateMany(
    {
      'administration.isAdministered': false,
      'schedule.dueDate': { $lte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) },
      'schedule.dueDate': { $gt: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000) },
      'followUp.defaulterStatus': 'not_defaulter'
    },
    { $set: { 'followUp.defaulterStatus': 'defaulter' } }
  );
  
  // Update defaulters to dropouts
  await this.updateMany(
    {
      'administration.isAdministered': false,
      'schedule.dueDate': { $lte: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000) },
      'followUp.defaulterStatus': { $in: ['not_defaulter', 'defaulter'] }
    },
    { $set: { 'followUp.defaulterStatus': 'dropout' } }
  );
};

// Method to mark as administered
vaccinationRecordSchema.methods.markAsAdministered = function(adminDetails) {
  this.administration.isAdministered = true;
  this.administration.administeredDate = adminDetails.administeredDate || new Date();
  this.administration.administeredBy = adminDetails.administeredBy;
  this.administration.administrationSite = adminDetails.administrationSite;
  this.administration.route = adminDetails.route;
  
  // Reset defaulter status
  this.followUp.defaulterStatus = 'not_defaulter';
  
  // Calculate next due date if part of series
  if (!this.administration.isSeriesComplete) {
    this.calculateNextDueDate();
  }
  
  return this.save();
};

// Method to calculate next due date
vaccinationRecordSchema.methods.calculateNextDueDate = function() {
  const vaccineSchedules = {
    'DPT': { interval: 4, unit: 'weeks' },
    'OPV': { interval: 4, unit: 'weeks' },
    'Pentavalent': { interval: 4, unit: 'weeks' },
    'MMR': { interval: 9, unit: 'months' },
    'TT': { interval: 4, unit: 'weeks' }
  };
  
  const schedule = vaccineSchedules[this.vaccineInfo.vaccineName];
  if (schedule && !this.administration.isSeriesComplete) {
    const nextDate = new Date(this.administration.administeredDate);
    
    if (schedule.unit === 'weeks') {
      nextDate.setDate(nextDate.getDate() + (schedule.interval * 7));
    } else if (schedule.unit === 'months') {
      nextDate.setMonth(nextDate.getMonth() + schedule.interval);
    }
    
    this.followUp.nextDueDate = nextDate;
  }
};

// Static method to get vaccination coverage
vaccinationRecordSchema.statics.getVaccinationCoverage = function(filters = {}) {
  const matchQuery = {
    isActive: true,
    isCancelled: false,
    ...filters
  };
  
  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: {
          vaccine: '$vaccineInfo.vaccineName',
          dose: '$administration.doseNumber'
        },
        totalScheduled: { $sum: 1 },
        totalAdministered: {
          $sum: { $cond: ['$administration.isAdministered', 1, 0] }
        },
        totalDefaulters: {
          $sum: { $cond: [{ $eq: ['$followUp.defaulterStatus', 'defaulter'] }, 1, 0] }
        },
        totalDropouts: {
          $sum: { $cond: [{ $eq: ['$followUp.defaulterStatus', 'dropout'] }, 1, 0] }
        }
      }
    },
    {
      $project: {
        _id: 1,
        totalScheduled: 1,
        totalAdministered: 1,
        totalDefaulters: 1,
        totalDropouts: 1,
        coveragePercentage: {
          $round: [
            { $multiply: [{ $divide: ['$totalAdministered', '$totalScheduled'] }, 100] },
            2
          ]
        }
      }
    },
    { $sort: { '_id.vaccine': 1, '_id.dose': 1 } }
  ]);
};

// Static method to get AEFI summary
vaccinationRecordSchema.statics.getAEFISummary = function(filters = {}) {
  const matchQuery = {
    'aefi.hasAdverseEvent': true,
    isActive: true,
    ...filters
  };
  
  return this.aggregate([
    { $match: matchQuery },
    { $unwind: '$aefi.events' },
    {
      $group: {
        _id: {
          vaccine: '$vaccineInfo.vaccineName',
          eventType: '$aefi.events.eventType',
          severity: '$aefi.events.severity'
        },
        count: { $sum: 1 },
        recoveredCount: {
          $sum: { $cond: [{ $eq: ['$aefi.events.outcome', 'recovered'] }, 1, 0] }
        }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

export default mongoose.model('VaccinationRecord', vaccinationRecordSchema);