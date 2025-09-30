import mongoose from 'mongoose';

const waterQualitySchema = new mongoose.Schema({
  location: {
    area: {
      type: String,
      required: true,
      trim: true
    },
    coordinates: {
      latitude: {
        type: Number,
        min: -90,
        max: 90
      },
      longitude: {
        type: Number,
        min: -180,
        max: 180
      }
    },
    address: {
      type: String,
      trim: true
    }
  },
  waterSource: {
    type: String,
    required: true,
    enum: [
      'borewell',
      'hand_pump',
      'public_tap',
      'well',
      'river',
      'pond',
      'tank',
      'other'
    ]
  },
  testingDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  testResults: {
    pH: {
      type: Number,
      required: true,
      min: 0,
      max: 14
    },
    turbidity: {
      type: Number,
      required: true,
      min: 0
    },
    chlorine: {
      type: Number,
      required: true,
      min: 0
    },
    bacteria: {
      type: Number,
      min: 0,
      default: 0
    },
    nitrates: {
      type: Number,
      min: 0
    },
    fluoride: {
      type: Number,
      min: 0
    },
    arsenic: {
      type: Number,
      min: 0
    },
    iron: {
      type: Number,
      min: 0
    },
    hardness: {
      type: Number,
      min: 0
    },
    tds: {
      type: Number,
      min: 0
    }
  },
  contaminationLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low'
  },
  safetyStatus: {
    type: String,
    enum: ['safe', 'caution', 'unsafe'],
    default: 'safe'
  },
  recommendations: [{
    type: String
  }],
  testedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  testingMethod: {
    type: String,
    required: true,
    enum: [
      'field_test_kit',
      'laboratory_analysis',
      'digital_meter',
      'colorimetric',
      'other'
    ]
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: {
    type: Date
  },
  attachments: [{
    filename: String,
    url: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
waterQualitySchema.index({ 'location.area': 1 });
waterQualitySchema.index({ waterSource: 1 });
waterQualitySchema.index({ testingDate: -1 });
waterQualitySchema.index({ safetyStatus: 1 });
waterQualitySchema.index({ contaminationLevel: 1 });
waterQualitySchema.index({ testedBy: 1 });

// Compound indexes
waterQualitySchema.index({ 'location.area': 1, testingDate: -1 });
waterQualitySchema.index({ waterSource: 1, safetyStatus: 1 });

const WaterQuality = mongoose.model('WaterQuality', waterQualitySchema);

export default WaterQuality;