import mongoose from 'mongoose';
import { getNextSequence } from './counter.model.js';

const { Schema } = mongoose;

// Health Report Schema for comprehensive reporting system
const healthReportSchema = new Schema({
  // Report Identification
  reportId: {
    type: String,
    unique: true,
    required: true,
    match: /^HRP-VLG-\d{4}$/,
    uppercase: true
  },

  // Reporter Information
  reporter: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  reporterRole: {
    type: String,
    required: true,
    enum: ['asha_worker', 'anm', 'medical_officer', 'health_supervisor', 'volunteer', 'block_coordinator', 'district_coordinator'],
    lowercase: true
  },

  submissionDate: {
    type: Date,
    default: Date.now,
    required: true
  },

  // Report Categorization
  reportType: {
    type: String,
    required: true,
    enum: [
      'disease_outbreak',
      'routine_health_survey',
      'emergency_health_alert',
      'water_quality_concern',
      'infrastructure_issue',
      'community_health_observation',
      'maternal_health_concern',
      'child_health_issue',
      'vaccination_adverse_event',
      'nutrition_assessment',
      'environmental_hazard'
    ],
    lowercase: true
  },

  // Report Details
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },

  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },

  affectedPopulation: {
    estimatedCount: {
      type: Number,
      min: 0
    },
    demographics: {
      children: { type: Number, min: 0, default: 0 },
      adults: { type: Number, min: 0, default: 0 },
      elderly: { type: Number, min: 0, default: 0 },
      pregnant: { type: Number, min: 0, default: 0 }
    },
    vulnerableGroups: [String] // 'children', 'elderly', 'pregnant_women', 'chronic_patients'
  },

  geographicScope: {
    scopeType: {
      type: String,
      enum: ['household', 'hamlet', 'village', 'multiple_villages', 'block', 'district'],
      required: true,
      lowercase: true
    },
    specificArea: {
      type: String,
      trim: true
    },
    affectedRadius: {
      type: Number, // in kilometers
      min: 0
    }
  },

  severityAssessment: {
    level: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical', 'emergency'],
      required: true,
      lowercase: true
    },
    riskFactors: [String],
    immediateActionRequired: {
      type: Boolean,
      default: false
    }
  },

  // Supporting Evidence
  supportingEvidence: {
    photos: [{
      url: String,
      description: String,
      uploadDate: { type: Date, default: Date.now }
    }],
    documents: [{
      url: String,
      filename: String,
      fileType: String,
      uploadDate: { type: Date, default: Date.now }
    }],
    labResults: [{
      testType: String,
      result: String,
      testDate: Date,
      labName: String
    }]
  },

  // Workflow Management
  submissionStatus: {
    type: String,
    enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'action_taken'],
    default: 'submitted',
    required: true,
    lowercase: true
  },

  // Review Chain
  reviewChain: [{
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewDate: Date,
    reviewComments: String,
    reviewDecision: {
      type: String,
      enum: ['approved', 'rejected', 'needs_more_info', 'escalated'],
      lowercase: true
    }
  }],

  // Escalation Tracking
  escalation: {
    isEscalated: {
      type: Boolean,
      default: false
    },
    escalatedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    escalationReason: String,
    escalationDate: Date,
    escalationLevel: {
      type: String,
      enum: ['block', 'district', 'state', 'national'],
      lowercase: true
    }
  },

  // Resolution Status
  resolution: {
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'resolved', 'closed'],
      default: 'pending',
      required: true,
      lowercase: true
    },
    actionsTaken: [String],
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    resolutionDate: Date,
    resolutionComments: String,
    followUpRequired: {
      type: Boolean,
      default: false
    }
  },

  // Location Context
  location: {
    village: {
      type: Schema.Types.ObjectId,
      ref: 'Village',
      required: true
    },
    specificLocation: {
      type: String,
      trim: true
    },
    gpsCoordinates: {
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
    }
  },

  // Temporal Information
  incidentDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(v) {
        return v <= new Date();
      },
      message: 'Incident date cannot be in the future'
    }
  },

  followUpDates: [{
    scheduledDate: Date,
    actualDate: Date,
    followUpType: String,
    completionStatus: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending'
    }
  }],

  // Priority Management
  priority: {
    level: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent', 'emergency'],
      default: 'medium',
      required: true,
      lowercase: true
    },
    autoEscalation: {
      enabled: {
        type: Boolean,
        default: true
      },
      escalationRules: [{
        condition: String, // 'time_based', 'no_response', 'severity_increase'
        threshold: Number, // hours for time-based rules
        action: String
      }]
    }
  },

  // System Fields
  isActive: {
    type: Boolean,
    default: true
  },

  metadata: {
    submissionSource: {
      type: String,
      enum: ['mobile_app', 'web_portal', 'sms', 'phone_call', 'field_visit'],
      default: 'mobile_app'
    },
    reportingTool: String,
    dataQuality: {
      completeness: {
        type: Number,
        min: 0,
        max: 100
      },
      accuracy: {
        type: String,
        enum: ['high', 'medium', 'low'],
        default: 'medium'
      }
    }
  }
}, {
  timestamps: true,
  collection: 'healthReports',
  suppressReservedKeysWarning: true
});

// Generate unique reportId before saving
healthReportSchema.pre('save', async function(next) {
  if (this.isNew) {
    const sequence = await getNextSequence('healthReport');
    this.reportId = `HRP-VLG-${sequence.toString().padStart(4, '0')}`;
  }
  next();
});

// Middleware for automatic priority escalation
healthReportSchema.pre('save', function(next) {
  // Auto-escalate based on severity and report type
  if (this.severityAssessment.level === 'emergency' || 
      this.reportType === 'disease_outbreak' ||
      this.severityAssessment.immediateActionRequired) {
    this.priority.level = 'emergency';
    this.escalation.isEscalated = true;
  }
  
  next();
});

// Virtual for days since submission
healthReportSchema.virtual('daysSinceSubmission').get(function() {
  const now = new Date();
  const submissionDate = new Date(this.submissionDate);
  return Math.floor((now - submissionDate) / (1000 * 60 * 60 * 24));
});

// Virtual for resolution time
healthReportSchema.virtual('resolutionTime').get(function() {
  if (this.resolution.resolutionDate) {
    const resolutionDate = new Date(this.resolution.resolutionDate);
    const submissionDate = new Date(this.submissionDate);
    return Math.floor((resolutionDate - submissionDate) / (1000 * 60 * 60 * 24));
  }
  return null;
});

// Virtual for completion percentage
healthReportSchema.virtual('completionPercentage').get(function() {
  let completedFields = 0;
  let totalFields = 10; // Base required fields

  // Check completion of various sections
  if (this.description && this.description.length > 50) completedFields++;
  if (this.affectedPopulation?.estimatedCount > 0) completedFields++;
  if (this.geographicScope?.specificArea) completedFields++;
  if (this.severityAssessment?.riskFactors?.length > 0) completedFields++;
  if (this.supportingEvidence?.photos?.length > 0 || this.supportingEvidence?.documents?.length > 0) completedFields++;
  if (this.location?.gpsCoordinates?.latitude && this.location?.gpsCoordinates?.longitude) completedFields++;
  if (this.incidentDate) completedFields++;
  if (this.reviewChain?.length > 0) completedFields++;
  if (this.resolution?.actionsTaken?.length > 0) completedFields++;
  if (this.metadata?.dataQuality?.completeness) completedFields++;

  return Math.round((completedFields / totalFields) * 100);
});

// Instance method to escalate report
healthReportSchema.methods.escalateReport = function(escalatedTo, reason, level) {
  this.escalation.isEscalated = true;
  this.escalation.escalatedTo = escalatedTo;
  this.escalation.escalationReason = reason;
  this.escalation.escalationDate = new Date();
  this.escalation.escalationLevel = level;
  this.priority.level = 'urgent';
  
  return this.save();
};

// Instance method to add review
healthReportSchema.methods.addReview = function(reviewedBy, comments, decision) {
  this.reviewChain.push({
    reviewedBy: reviewedBy,
    reviewDate: new Date(),
    reviewComments: comments,
    reviewDecision: decision
  });
  
  // Update status based on review decision
  if (decision === 'approved') {
    this.submissionStatus = 'approved';
  } else if (decision === 'rejected') {
    this.submissionStatus = 'rejected';
  } else if (decision === 'escalated') {
    this.submissionStatus = 'under_review';
    this.escalation.isEscalated = true;
  }
  
  return this.save();
};

// Instance method to resolve report
healthReportSchema.methods.resolveReport = function(resolvedBy, comments, actionsTaken) {
  this.resolution.status = 'resolved';
  this.resolution.resolvedBy = resolvedBy;
  this.resolution.resolutionDate = new Date();
  this.resolution.resolutionComments = comments;
  this.resolution.actionsTaken = actionsTaken || [];
  this.submissionStatus = 'action_taken';
  
  return this.save();
};

// Static method to get reports by priority
healthReportSchema.statics.getReportsByPriority = function(priority, limit = 50) {
  return this.find({ 
    'priority.level': priority,
    isActive: true 
  })
  .populate('reporter', 'personalInfo.firstName personalInfo.lastName roleInfo.role authentication.phone')
  .populate('location.village', 'name block district')
  .sort({ submissionDate: -1 })
  .limit(limit);
};

// Static method to get pending reports
healthReportSchema.statics.getPendingReports = function(reporterId = null) {
  const query = {
    'resolution.status': { $in: ['pending', 'in_progress'] },
    isActive: true
  };
  
  if (reporterId) {
    query.reporter = reporterId;
  }
  
  return this.find(query)
    .populate('reporter', 'personalInfo.firstName personalInfo.lastName roleInfo.role authentication.phone')
    .populate('location.village', 'name block district')
    .sort({ priority: 1, submissionDate: 1 });
};

// Static method to get reports requiring escalation
healthReportSchema.statics.getReportsRequiringEscalation = function() {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  return this.find({
    $or: [
      { 'priority.level': 'emergency', 'escalation.isEscalated': false },
      { 
        'priority.level': 'urgent',
        submissionDate: { $lt: twentyFourHoursAgo },
        'escalation.isEscalated': false 
      }
    ],
    'resolution.status': { $in: ['pending', 'in_progress'] },
    isActive: true
  })
  .populate('reporter', 'personalInfo.firstName personalInfo.lastName roleInfo.role authentication.phone')
  .populate('location.village', 'name block district');
};

// Static method to get reports by location
healthReportSchema.statics.getReportsByLocation = function(villageId, days = 30) {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return this.find({
    'location.village': villageId,
    submissionDate: { $gte: cutoffDate },
    isActive: true
  })
  .populate('reporter', 'personalInfo.firstName personalInfo.lastName roleInfo.role')
  .sort({ submissionDate: -1 });
};

// Static method to get summary statistics
healthReportSchema.statics.getSummaryStats = function(filters = {}) {
  const matchStage = { isActive: true, ...filters };
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalReports: { $sum: 1 },
        pendingReports: {
          $sum: {
            $cond: [
              { $in: ['$resolution.status', ['pending', 'in_progress']] },
              1,
              0
            ]
          }
        },
        emergencyReports: {
          $sum: {
            $cond: [{ $eq: ['$priority.level', 'emergency'] }, 1, 0]
          }
        },
        escalatedReports: {
          $sum: {
            $cond: ['$escalation.isEscalated', 1, 0]
          }
        },
        avgResolutionTime: {
          $avg: {
            $cond: [
              { $ne: ['$resolution.resolutionDate', null] },
              {
                $divide: [
                  { $subtract: ['$resolution.resolutionDate', '$submissionDate'] },
                  1000 * 60 * 60 * 24 // Convert to days
                ]
              },
              null
            ]
          }
        }
      }
    }
  ]);
};

// Indexes for efficient querying
healthReportSchema.index({ reporter: 1, submissionDate: -1 });
healthReportSchema.index({ reportType: 1, 'priority.level': 1 });
healthReportSchema.index({ 'location.village': 1, submissionDate: -1 });
healthReportSchema.index({ 'resolution.status': 1, 'priority.level': 1 });
healthReportSchema.index({ 'escalation.isEscalated': 1, submissionDate: 1 });
healthReportSchema.index({ submissionDate: -1 });
healthReportSchema.index({ incidentDate: -1 });
healthReportSchema.index({ isActive: 1, submissionStatus: 1 });

// Compound indexes for complex queries
healthReportSchema.index({ 
  'priority.level': 1, 
  'resolution.status': 1, 
  submissionDate: -1 
});

healthReportSchema.index({ 
  reportType: 1, 
  'location.village': 1, 
  submissionDate: -1 
});

healthReportSchema.index({ 
  'severityAssessment.level': 1, 
  'escalation.isEscalated': 1 
});

export default mongoose.model('HealthReport', healthReportSchema);