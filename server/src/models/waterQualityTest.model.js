import mongoose from 'mongoose';
import { getNextSequence } from './counter.model.js';

const waterQualityTestSchema = new mongoose.Schema({
  // Test Identification
  testId: {
    type: String,
    unique: true,
    required: true,
    match: /^WQT-VLG-\d{4}$/,
    uppercase: true
  },
  
  // Water Source Reference
  waterSourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    validate: {
      validator: async function(v) {
        // Validate that the water source exists in the referenced village
        const Village = mongoose.model('Village');
        const village = await Village.findOne({
          _id: this.villageId,
          'infrastructure.waterSources._id': v
        });
        return !!village;
      },
      message: 'Water source must exist in the referenced village'
    }
  },
  
  // Village Reference
  villageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Village',
    required: true
  },
  
  // Test Details
  testDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  testType: {
    type: String,
    required: true,
    enum: ['routine', 'follow_up', 'complaint_based', 'outbreak_investigation', 'seasonal_monitoring'],
    lowercase: true
  },
  
  testingMethod: {
    type: String,
    required: true,
    enum: ['field_test_kit', 'laboratory_analysis', 'rapid_test', 'comprehensive_analysis'],
    lowercase: true
  },
  
  conductedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Test Parameters - Physical
  physicalParameters: {
    turbidity: {
      value: { type: Number, min: 0 },
      unit: { type: String, default: 'NTU' },
      threshold: { type: Number, default: 1 },
      status: { type: String, enum: ['safe', 'borderline', 'unsafe'], default: 'safe' }
    },
    color: {
      value: { type: String },
      status: { type: String, enum: ['colorless', 'slight_color', 'colored'], default: 'colorless' }
    },
    odor: {
      value: { type: String },
      status: { type: String, enum: ['odorless', 'slight_odor', 'strong_odor'], default: 'odorless' }
    },
    temperature: {
      value: { type: Number },
      unit: { type: String, default: 'C' }
    }
  },
  
  // Test Parameters - Chemical
  chemicalParameters: {
    pH: {
      value: { type: Number, min: 0, max: 14 },
      threshold: {
        type: {
          minValue: { type: Number, default: 6.5 },
          maxValue: { type: Number, default: 8.5 }
        }
      },
      status: { type: String, enum: ['safe', 'acidic', 'alkaline'], default: 'safe' }
    },
    chlorine: {
      value: { type: Number, min: 0 },
      unit: { type: String, default: 'mg/L' },
      threshold: { type: Number, default: 0.2 },
      status: { type: String, enum: ['adequate', 'insufficient', 'excessive'], default: 'adequate' }
    },
    fluoride: {
      value: { type: Number, min: 0 },
      unit: { type: String, default: 'mg/L' },
      threshold: {
        type: {
          minValue: { type: Number, default: 0.5 },
          maxValue: { type: Number, default: 1.5 }
        }
      },
      status: { type: String, enum: ['safe', 'deficient', 'excessive'], default: 'safe' }
    },
    nitrates: {
      value: { type: Number, min: 0 },
      unit: { type: String, default: 'mg/L' },
      threshold: { type: Number, default: 45 },
      status: { type: String, enum: ['safe', 'elevated', 'dangerous'], default: 'safe' }
    },
    heavyMetals: {
      arsenic: {
        value: { type: Number, min: 0 },
        unit: { type: String, default: 'µg/L' },
        threshold: { type: Number, default: 10 },
        status: { type: String, enum: ['safe', 'unsafe'], default: 'safe' }
      },
      lead: {
        value: { type: Number, min: 0 },
        unit: { type: String, default: 'µg/L' },
        threshold: { type: Number, default: 10 },
        status: { type: String, enum: ['safe', 'unsafe'], default: 'safe' }
      },
      mercury: {
        value: { type: Number, min: 0 },
        unit: { type: String, default: 'µg/L' },
        threshold: { type: Number, default: 6 },
        status: { type: String, enum: ['safe', 'unsafe'], default: 'safe' }
      }
    }
  },
  
  // Test Parameters - Biological
  biologicalParameters: {
    eColi: {
      value: { type: Number, min: 0 },
      unit: { type: String, default: 'CFU/100mL' },
      threshold: { type: Number, default: 0 },
      status: { type: String, enum: ['safe', 'contaminated'], default: 'safe' }
    },
    coliformBacteria: {
      value: { type: Number, min: 0 },
      unit: { type: String, default: 'CFU/100mL' },
      threshold: { type: Number, default: 0 },
      status: { type: String, enum: ['safe', 'contaminated'], default: 'safe' }
    },
    totalBacterialCount: {
      value: { type: Number, min: 0 },
      unit: { type: String, default: 'CFU/mL' },
      threshold: { type: Number, default: 100 },
      status: { type: String, enum: ['acceptable', 'elevated', 'dangerous'], default: 'acceptable' }
    }
  },
  
  // Test Results
  testResults: {
    overallStatus: {
      type: String,
      required: true,
      enum: ['safe', 'contaminated', 'needs_treatment', 'unsafe'],
      lowercase: true
    },
    contaminationLevel: {
      type: String,
      enum: ['none', 'low', 'medium', 'high', 'critical'],
      default: 'none',
      lowercase: true
    },
    contaminationTypes: [{
      type: String,
      enum: ['biological', 'chemical', 'physical', 'radiological'],
      lowercase: true
    }],
    riskAssessment: {
      type: String,
      enum: ['no_risk', 'low_risk', 'medium_risk', 'high_risk', 'immediate_action_required'],
      default: 'no_risk',
      lowercase: true
    }
  },
  
  // Location and Context
  location: {
    coordinates: {
      latitude: { type: Number, min: -90, max: 90 },
      longitude: { type: Number, min: -180, max: 180 }
    },
    altitude: { type: Number },
    accuracy: { type: Number, default: 10 }
  },
  
  weatherConditions: {
    temperature: { type: Number },
    humidity: { type: Number, min: 0, max: 100 },
    rainfall: { type: String, enum: ['none', 'light', 'moderate', 'heavy'], default: 'none' },
    recentWeatherEvents: [String]
  },
  
  seasonalFactors: {
    season: {
      type: String,
      enum: ['summer', 'monsoon', 'winter', 'post_monsoon'],
      lowercase: true
    },
    waterLevel: {
      type: String,
      enum: ['very_low', 'low', 'normal', 'high', 'very_high'],
      default: 'normal',
      lowercase: true
    },
    usage_intensity: {
      type: String,
      enum: ['low', 'medium', 'high', 'peak'],
      default: 'medium',
      lowercase: true
    }
  },
  
  // Remediation Tracking
  remediation: {
    recommendedActions: [{
      action: String,
      priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], lowercase: true },
      timeline: String,
      responsible: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],
    actionsTaken: [{
      action: String,
      dateTaken: { type: Date, default: Date.now },
      takenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      effectiveness: { type: String, enum: ['pending', 'effective', 'partially_effective', 'ineffective'], default: 'pending' },
      notes: String
    }],
    followUpRequired: {
      type: Boolean,
      default: false
    },
    nextTestDue: {
      type: Date,
      validate: {
        validator: function(v) {
          return v > this.testDate;
        },
        message: 'Next test due date must be after test date'
      }
    }
  },
  
  // Quality Assurance
  qualityAssurance: {
    testingEquipment: {
      equipmentId: String,
      equipmentType: String,
      calibrationStatus: { type: String, enum: ['calibrated', 'needs_calibration', 'overdue'], default: 'calibrated' },
      lastCalibration: Date,
      nextCalibration: Date
    },
    sampleCollection: {
      collectionMethod: { type: String, enum: ['grab_sample', 'composite_sample'], default: 'grab_sample' },
      collectionTime: { type: Date, default: Date.now },
      storageConditions: String,
      preservatives: [String],
      chainOfCustody: [{
        transferredTo: String,
        transferTime: Date,
        condition: String
      }]
    },
    labDetails: {
      labName: String,
      analysisDate: Date,
      analystName: String,
      certificationNumber: String,
      reportNumber: String
    }
  },
  
  // Additional Information
  notes: {
    type: String,
    maxlength: 1000
  },
  
  images: [{
    url: String,
    caption: String,
    timestamp: { type: Date, default: Date.now }
  }],
  
  reportGenerated: {
    type: Boolean,
    default: false
  },
  
  reportUrl: String,
  
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
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
waterQualityTestSchema.index({ villageId: 1, testDate: -1 });
waterQualityTestSchema.index({ sourceId: 1, testDate: -1 });
waterQualityTestSchema.index({ 'testResults.overallStatus': 1 });
waterQualityTestSchema.index({ 'testResults.contaminationLevel': 1 });
waterQualityTestSchema.index({ conductedBy: 1, testDate: -1 });
waterQualityTestSchema.index({ 'remediation.nextTestDue': 1 });
waterQualityTestSchema.index({ testType: 1, testDate: -1 });

// Virtual for days since test
waterQualityTestSchema.virtual('daysSinceTest').get(function() {
  return Math.floor((Date.now() - this.testDate) / (1000 * 60 * 60 * 24));
});

// Virtual for contamination score
waterQualityTestSchema.virtual('contaminationScore').get(function() {
  const levels = { none: 0, low: 1, medium: 2, high: 3, critical: 4 };
  return levels[this.testResults.contaminationLevel] || 0;
});

// Pre-save middleware to generate testId
waterQualityTestSchema.pre('save', async function(next) {
  if (this.isNew && !this.testId) {
    const seq = await getNextSequence('WQT-VLG');
    this.testId = `WQT-VLG-${String(seq).padStart(4, '0')}`;
  }
  next();
});

// Pre-save middleware to calculate overall status
waterQualityTestSchema.pre('save', function(next) {
  const dirty = ['physicalParameters','chemicalParameters','biologicalParameters'].some(p => this.isModified(p));
  if (this.isNew || dirty) {
    this.calculateOverallStatus();
  }
  next();
});

// Method to calculate overall status
waterQualityTestSchema.methods.calculateOverallStatus = function() {
  let hasContamination = false;
  let contaminationLevel = 'none';
  const contaminationTypes = [];
  
  // Check biological parameters
  if (this.biologicalParameters.eColi?.status === 'contaminated' || 
      this.biologicalParameters.coliformBacteria?.status === 'contaminated') {
    hasContamination = true;
    contaminationTypes.push('biological');
    if (contaminationLevel === 'none') contaminationLevel = 'high';
  }
  
  // Check chemical parameters
  if (this.chemicalParameters.heavyMetals?.arsenic?.status === 'unsafe' ||
      this.chemicalParameters.heavyMetals?.lead?.status === 'unsafe' ||
      this.chemicalParameters.heavyMetals?.mercury?.status === 'unsafe') {
    hasContamination = true;
    contaminationTypes.push('chemical');
    contaminationLevel = 'critical';
  }
  
  // Check other chemical parameters
  if (this.chemicalParameters.nitrates?.status === 'dangerous' ||
      this.chemicalParameters.fluoride?.status === 'excessive') {
    hasContamination = true;
    contaminationTypes.push('chemical');
    if (contaminationLevel === 'none') contaminationLevel = 'medium';
  }
  
  // Check physical parameters
  if (this.physicalParameters.turbidity?.status === 'unsafe') {
    hasContamination = true;
    contaminationTypes.push('physical');
    if (contaminationLevel === 'none') contaminationLevel = 'low';
  }
  
  // Set overall status
  this.testResults.overallStatus = hasContamination ? 'contaminated' : 'safe';
  this.testResults.contaminationLevel = contaminationLevel;
  this.testResults.contaminationTypes = contaminationTypes;
  
  // Set risk assessment
  if (contaminationLevel === 'critical') {
    this.testResults.riskAssessment = 'immediate_action_required';
  } else if (contaminationLevel === 'high') {
    this.testResults.riskAssessment = 'high_risk';
  } else if (contaminationLevel === 'medium') {
    this.testResults.riskAssessment = 'medium_risk';
  } else if (contaminationLevel === 'low') {
    this.testResults.riskAssessment = 'low_risk';
  } else {
    this.testResults.riskAssessment = 'no_risk';
  }
};

// Helper method to populate water source details
waterQualityTestSchema.methods.populateWaterSource = async function() {
  const Village = mongoose.model('Village');
  const village = await Village.findById(this.villageId);
  if (village) {
    const waterSource = village.infrastructure.waterSources.id(this.waterSourceId);
    return waterSource;
  }
  return null;
};

// Static method to find tests by water source
waterQualityTestSchema.statics.findByWaterSource = function(villageId, waterSourceId) {
  return this.find({ 
    villageId: villageId,
    waterSourceId: waterSourceId 
  }).sort({ testDate: -1 });
};

// Static method to get contamination trends
waterQualityTestSchema.statics.getContaminationTrends = function(villageId, days = 30) {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        villageId: mongoose.Types.ObjectId(villageId),
        testDate: { $gte: cutoffDate }
      }
    },
    {
      $group: {
        _id: '$testResults.contaminationLevel',
        count: { $sum: 1 },
        latestTest: { $max: '$testDate' }
      }
    },
    {
      $sort: { latestTest: -1 }
    }
  ]);
};

export default mongoose.model('WaterQualityTest', waterQualityTestSchema);