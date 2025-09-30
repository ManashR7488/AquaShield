import mongoose from 'mongoose';
import { Counter } from './counter.model.js';

const personalHealthRecordSchema = new mongoose.Schema(
  {
    recordId: {
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
    familyMemberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FamilyMember',
      index: true,
    },
    // Record Classification
    recordType: {
      type: String,
      enum: ['vital_signs', 'medical_history', 'symptoms', 'medications', 'allergies', 'lab_results', 'vaccination', 'appointment'],
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['routine', 'emergency', 'chronic_care', 'preventive', 'diagnostic'],
      default: 'routine',
    },
    // Basic Record Information
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    recordDate: {
      type: Date,
      required: true,
      index: true,
    },
    // Vital Signs Data
    vitalSigns: {
      bloodPressure: {
        systolic: {
          type: Number,
          min: 50,
          max: 300,
        },
        diastolic: {
          type: Number,
          min: 30,
          max: 200,
        },
        unit: {
          type: String,
          default: 'mmHg',
        },
      },
      heartRate: {
        value: {
          type: Number,
          min: 30,
          max: 250,
        },
        unit: {
          type: String,
          default: 'bpm',
        },
      },
      temperature: {
        value: {
          type: Number,
          min: 90,
          max: 115,
        },
        unit: {
          type: String,
          enum: ['Fahrenheit', 'Celsius'],
          default: 'Fahrenheit',
        },
      },
      weight: {
        value: {
          type: Number,
          min: 0.5,
          max: 1000,
        },
        unit: {
          type: String,
          enum: ['kg', 'lbs'],
          default: 'kg',
        },
      },
      height: {
        value: {
          type: Number,
          min: 30,
          max: 300,
        },
        unit: {
          type: String,
          enum: ['cm', 'inches'],
          default: 'cm',
        },
      },
      bmi: {
        type: Number,
        min: 10,
        max: 80,
      },
      oxygenSaturation: {
        value: {
          type: Number,
          min: 70,
          max: 100,
        },
        unit: {
          type: String,
          default: '%',
        },
      },
      respiratoryRate: {
        value: {
          type: Number,
          min: 8,
          max: 60,
        },
        unit: {
          type: String,
          default: 'breaths/min',
        },
      },
    },
    // Symptoms Data
    symptoms: {
      primarySymptoms: [String],
      severity: {
        type: String,
        enum: ['mild', 'moderate', 'severe', 'critical'],
      },
      duration: {
        value: Number,
        unit: {
          type: String,
          enum: ['minutes', 'hours', 'days', 'weeks', 'months'],
        },
      },
      onset: {
        type: String,
        enum: ['sudden', 'gradual'],
      },
      triggers: [String],
      associatedSymptoms: [String],
      painScale: {
        type: Number,
        min: 0,
        max: 10,
      },
    },
    // Medical History Data
    medicalHistory: {
      condition: String,
      diagnosis: String,
      treatmentPlan: String,
      medications: [String],
      procedures: [String],
      outcome: {
        type: String,
        enum: ['resolved', 'ongoing', 'improved', 'worsened'],
      },
      followUpRequired: Boolean,
      followUpDate: Date,
    },
    // Medication Data
    medication: {
      name: {
        type: String,
        required: function() { return this.recordType === 'medications'; },
      },
      dosage: String,
      frequency: String,
      route: {
        type: String,
        enum: ['oral', 'topical', 'injection', 'inhalation', 'other'],
      },
      startDate: Date,
      endDate: Date,
      prescribedBy: String,
      indication: String,
      sideEffects: [String],
      adherence: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor'],
      },
    },
    // Allergy Data
    allergy: {
      allergen: {
        type: String,
        required: function() { return this.recordType === 'allergies'; },
      },
      allergenType: {
        type: String,
        enum: ['food', 'medication', 'environmental', 'other'],
      },
      reaction: String,
      severity: {
        type: String,
        enum: ['mild', 'moderate', 'severe', 'life-threatening'],
      },
      onsetTime: String,
      treatment: String,
    },
    // Lab Results Data
    labResults: {
      testName: {
        type: String,
        required: function() { return this.recordType === 'lab_results'; },
      },
      testType: String,
      results: [{
        parameter: String,
        value: String,
        unit: String,
        referenceRange: String,
        status: {
          type: String,
          enum: ['normal', 'abnormal', 'critical'],
        },
      }],
      interpretation: String,
      orderedBy: String,
      labName: String,
    },
    // Vaccination Data
    vaccination: {
      vaccineName: {
        type: String,
        required: function() { return this.recordType === 'vaccination'; },
      },
      manufacturer: String,
      lotNumber: String,
      doseNumber: Number,
      site: String,
      route: String,
      nextDueDate: Date,
      adverseReactions: [String],
    },
    // Healthcare Provider Information
    healthcareProvider: {
      name: String,
      specialization: String,
      hospital: String,
      contactInfo: {
        phone: String,
        email: String,
      },
      licenseNumber: String,
    },
    // Supporting Documents
    attachments: [{
      fileName: String,
      fileType: String,
      fileSize: Number,
      uploadDate: Date,
      url: String,
      description: String,
    }],
    // Record Status and Metadata
    status: {
      type: String,
      enum: ['active', 'archived', 'deleted'],
      default: 'active',
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    confidential: {
      type: Boolean,
      default: false,
    },
    // Tags and Search
    tags: [String],
    keywords: [String],
    // Analytics and Trends
    trendData: {
      isPartOfTrend: {
        type: Boolean,
        default: false,
      },
      trendDirection: {
        type: String,
        enum: ['improving', 'stable', 'worsening'],
      },
      baselineValue: Number,
      targetValue: Number,
    },
    // Notifications and Reminders
    reminders: [{
      type: {
        type: String,
        enum: ['medication', 'followup', 'test', 'appointment'],
      },
      date: Date,
      message: String,
      completed: {
        type: Boolean,
        default: false,
      },
    }],
    // Privacy and Sharing
    shareSettings: {
      shareWithFamily: {
        type: Boolean,
        default: true,
      },
      shareWithDoctors: {
        type: Boolean,
        default: true,
      },
      emergencyAccess: {
        type: Boolean,
        default: true,
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

// Virtual for record owner (either user or family member)
personalHealthRecordSchema.virtual('recordOwner').get(function () {
  return this.familyMemberId ? 'family_member' : 'user';
});

// Virtual for calculated BMI
personalHealthRecordSchema.virtual('calculatedBMI').get(function () {
  if (this.vitalSigns?.weight?.value && this.vitalSigns?.height?.value) {
    let weight = this.vitalSigns.weight.value;
    let height = this.vitalSigns.height.value;
    
    // Convert to metric if needed
    if (this.vitalSigns.weight.unit === 'lbs') {
      weight = weight * 0.453592;
    }
    if (this.vitalSigns.height.unit === 'inches') {
      height = height * 2.54;
    }
    
    // Calculate BMI (kg/m²)
    const heightInMeters = height / 100;
    return Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10;
  }
  return this.vitalSigns?.bmi || null;
});

// Pre-save middleware
personalHealthRecordSchema.pre('save', async function (next) {
  try {
    // Generate recordId if not exists
    if (!this.recordId) {
      const counter = await Counter.findByIdAndUpdate(
        'personalHealthRecord',
        { $inc: { sequence: 1 } },
        { new: true, upsert: true }
      );
      this.recordId = `PHR-USR-${counter.sequence.toString().padStart(4, '0')}`;
    }

    // Calculate BMI if height and weight are provided
    if (this.vitalSigns?.weight?.value && this.vitalSigns?.height?.value) {
      this.vitalSigns.bmi = this.calculatedBMI;
    }

    // Auto-generate keywords for search
    const keywords = [];
    if (this.title) keywords.push(...this.title.toLowerCase().split(' '));
    if (this.description) keywords.push(...this.description.toLowerCase().split(' '));
    if (this.recordType) keywords.push(this.recordType);
    if (this.symptoms?.primarySymptoms) keywords.push(...this.symptoms.primarySymptoms.map(s => s.toLowerCase()));
    
    this.keywords = [...new Set(keywords.filter(k => k.length > 2))];

    next();
  } catch (error) {
    next(error);
  }
});

// Indexes for efficient querying
personalHealthRecordSchema.index({ userId: 1, recordType: 1 });
personalHealthRecordSchema.index({ userId: 1, recordDate: -1 });
personalHealthRecordSchema.index({ familyMemberId: 1, recordType: 1 });
personalHealthRecordSchema.index({ recordType: 1, status: 1 });
personalHealthRecordSchema.index({ tags: 1 });
personalHealthRecordSchema.index({ keywords: 1 });
personalHealthRecordSchema.index({ 'symptoms.severity': 1 });
personalHealthRecordSchema.index({ priority: 1, status: 1 });

// Static methods
personalHealthRecordSchema.statics.findByUser = function (userId, options = {}) {
  const filter = { userId, status: options.status || 'active' };
  if (options.recordType) filter.recordType = options.recordType;
  if (options.startDate) filter.recordDate = { $gte: new Date(options.startDate) };
  if (options.endDate) filter.recordDate = { ...filter.recordDate, $lte: new Date(options.endDate) };
  
  return this.find(filter)
    .populate('familyMemberId', 'firstName lastName relationship')
    .sort({ recordDate: -1 });
};

personalHealthRecordSchema.statics.findByType = function (userId, recordType) {
  return this.find({ userId, recordType, status: 'active' })
    .populate('familyMemberId', 'firstName lastName relationship')
    .sort({ recordDate: -1 });
};

personalHealthRecordSchema.statics.getHealthTrends = function (userId, recordType, timeframe = '6months') {
  const startDate = new Date();
  switch (timeframe) {
    case '1month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case '3months':
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case '6months':
      startDate.setMonth(startDate.getMonth() - 6);
      break;
    case '1year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate.setMonth(startDate.getMonth() - 6);
  }

  return this.find({
    userId,
    recordType,
    recordDate: { $gte: startDate },
    status: 'active'
  }).sort({ recordDate: 1 });
};

personalHealthRecordSchema.statics.getRecordStats = function (userId) {
  return this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId), status: 'active' } },
    {
      $group: {
        _id: '$recordType',
        count: { $sum: 1 },
        lastRecordDate: { $max: '$recordDate' },
        avgPriority: { $avg: { $cond: [
          { $eq: ['$priority', 'low'] }, 1,
          { $cond: [
            { $eq: ['$priority', 'normal'] }, 2,
            { $cond: [
              { $eq: ['$priority', 'high'] }, 3,
              4
            ]}
          ]}
        ]}}
      }
    },
    {
      $project: {
        recordType: '$_id',
        count: 1,
        lastRecordDate: 1,
        avgPriority: { $round: ['$avgPriority', 2] }
      }
    }
  ]);
};

// Instance methods
personalHealthRecordSchema.methods.addAttachment = function (attachmentData) {
  this.attachments.push({
    ...attachmentData,
    uploadDate: new Date()
  });
  return this.save();
};

personalHealthRecordSchema.methods.addReminder = function (reminderData) {
  this.reminders.push(reminderData);
  return this.save();
};

personalHealthRecordSchema.methods.updateTrendData = function (trendData) {
  this.trendData = { ...this.trendData, ...trendData };
  return this.save();
};

personalHealthRecordSchema.methods.archive = function () {
  this.status = 'archived';
  return this.save();
};

export const PersonalHealthRecord = mongoose.model('PersonalHealthRecord', personalHealthRecordSchema);