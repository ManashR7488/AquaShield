import mongoose from 'mongoose';
import { getNextSequence } from './counter.model.js';

const { Schema } = mongoose;

// Alert System Schema for real-time notifications and alerts
const alertSystemSchema = new Schema({
  // Alert Identification
  alertId: {
    type: String,
    unique: true,
    required: true,
    match: /^ALT-SYS-\d{4}$/,
    uppercase: true
  },

  // Alert Source
  source: {
    triggeredBy: {
      type: String,
      enum: ['user', 'system', 'automated_process', 'external_system'],
      required: true,
      lowercase: true
    },
    sourceId: {
      type: Schema.Types.ObjectId,
      refPath: 'source.sourceModel'
    },
    sourceModel: {
      type: String,
      enum: ['User', 'HealthReport', 'WaterQualityTest', 'PatientRecord', 'VaccinationRecord', 'HealthProgram']
    },
    triggerDate: {
      type: Date,
      default: Date.now,
      required: true
    }
  },

  // Alert Categorization
  alertType: {
    type: String,
    required: true,
    enum: [
      'health_emergency',
      'disease_outbreak_notification',
      'water_contamination_warning',
      'vaccination_reminder',
      'appointment_notification',
      'system_alert',
      'administrative_notification',
      'program_update',
      'compliance_alert',
      'infrastructure_alert',
      'weather_alert',
      'supply_chain_alert'
    ],
    lowercase: true
  },

  // Alert Details
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 150
  },

  messageContent: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },

  alertLevel: {
    type: String,
    enum: ['info', 'warning', 'critical', 'emergency'],
    required: true,
    lowercase: true
  },

  // Affected Areas
  affectedAreas: {
    villages: [{
      type: Schema.Types.ObjectId,
      ref: 'Village'
    }],
    blocks: [{
      type: Schema.Types.ObjectId,
      ref: 'Block'
    }],
    districts: [{
      type: Schema.Types.ObjectId,
      ref: 'District'
    }],
    radius: {
      centerCoordinates: {
        latitude: Number,
        longitude: Number
      },
      radiusKm: Number
    }
  },

  // Target Audience
  targetAudience: {
    audienceType: {
      type: String,
      enum: ['individual_users', 'role_based_groups', 'geographic_areas', 'all_users', 'custom_list'],
      required: true,
      lowercase: true
    },
    specificUsers: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    roles: [{
      type: String,
      enum: ['asha_worker', 'anm', 'medical_officer', 'health_supervisor', 'block_coordinator', 'district_coordinator', 'volunteer']
    }],
    customCriteria: {
      age: { min: Number, max: Number },
      gender: String,
      location: String,
      healthConditions: [String]
    }
  },

  // Expiration Settings
  expiration: {
    expiresAt: Date,
    autoArchive: {
      type: Boolean,
      default: true
    },
    archiveAfterDays: {
      type: Number,
      default: 30,
      min: 1
    }
  },

  // Delivery Management
  delivery: {
    channels: [{
      type: String,
      enum: ['sms', 'email', 'push_notification', 'whatsapp', 'voice_call', 'in_app_notification'],
      required: true
    }],
    
    deliveryStatus: {
      totalRecipients: {
        type: Number,
        default: 0
      },
      sent: {
        type: Number,
        default: 0
      },
      delivered: {
        type: Number,
        default: 0
      },
      read: {
        type: Number,
        default: 0
      },
      failed: {
        type: Number,
        default: 0
      }
    },

    deliveryAttempts: [{
      attemptNumber: Number,
      attemptDate: { type: Date, default: Date.now },
      channel: String,
      recipientCount: Number,
      successCount: Number,
      failureCount: Number,
      errors: [String]
    }],

    scheduling: {
      isScheduled: {
        type: Boolean,
        default: false
      },
      scheduledFor: Date,
      timezone: {
        type: String,
        default: 'Asia/Kolkata'
      },
      recurring: {
        enabled: Boolean,
        interval: {
          type: String,
          enum: ['daily', 'weekly', 'monthly', 'custom']
        },
        customInterval: {
          value: Number,
          unit: String // 'hours', 'days', 'weeks'
        },
        endDate: Date
      }
    }
  },

  // Recipient Management
  recipients: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    deliveryChannels: [String],
    deliveryPreferences: {
      preferredChannel: String,
      doNotDisturb: {
        enabled: Boolean,
        startTime: String, // HH:MM
        endTime: String    // HH:MM
      },
      frequency: {
        type: String,
        enum: ['immediate', 'batched', 'daily_summary'],
        default: 'immediate'
      }
    },
    deliveryStatus: [{
      channel: String,
      status: {
        type: String,
        enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
        default: 'pending'
      },
      timestamp: { type: Date, default: Date.now },
      errorMessage: String
    }]
  }],

  // Escalation Mechanisms
  escalation: {
    escalationRules: [{
      condition: {
        type: String,
        enum: ['time_based', 'acknowledgment_based', 'severity_based', 'delivery_failure'],
        required: true
      },
      threshold: Number, // hours for time-based, percentage for acknowledgment-based
      action: {
        type: String,
        enum: ['escalate_to_supervisor', 'increase_alert_level', 'add_recipients', 'change_delivery_method'],
        required: true
      },
      escalateTo: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
      }]
    }],

    escalationChain: [{
      level: Number,
      recipients: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
      }],
      escalatedAt: Date,
      escalatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      escalationReason: String
    }],

    finalEscalation: {
      recipients: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
      }],
      escalatedAt: Date
    }
  },

  // Acknowledgment Tracking
  acknowledgments: [{
    acknowledgedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    acknowledgmentTime: {
      type: Date,
      default: Date.now
    },
    responseActions: [String],
    comments: String,
    location: {
      latitude: Number,
      longitude: Number
    }
  }],

  // Auto-escalation Timers
  autoEscalation: {
    enabled: {
      type: Boolean,
      default: true
    },
    timers: [{
      timerName: String,
      startTime: { type: Date, default: Date.now },
      triggerTime: Date,
      isActive: { type: Boolean, default: true },
      action: String
    }]
  },

  // Alert Status
  status: {
    type: String,
    enum: ['active', 'acknowledged', 'resolved', 'expired', 'cancelled', 'archived'],
    default: 'active',
    required: true,
    lowercase: true
  },

  // Priority and Urgency
  priority: {
    level: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent', 'emergency'],
      required: true,
      lowercase: true
    },
    autoEscalate: {
      type: Boolean,
      default: true
    }
  },

  // Metadata
  metadata: {
    category: String,
    tags: [String],
    relatedAlerts: [{
      type: Schema.Types.ObjectId,
      ref: 'AlertSystem'
    }],
    externalReference: String,
    customFields: Schema.Types.Mixed
  },

  // Resolution tracking
  resolution: {
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'resolved', 'dismissed'],
      default: 'pending'
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date,
    resolutionComments: String,
    resolutionType: {
      type: String,
      enum: ['system_auto', 'manual_intervention', 'escalation_resolved', 'false_alarm']
    },
    actionsTaken: [String],
    followUpRequired: {
      type: Boolean,
      default: false
    }
  },

  // System Fields
  isActive: {
    type: Boolean,
    default: true
  },

  // Analytics
  analytics: {
    viewCount: {
      type: Number,
      default: 0
    },
    responseRate: Number, // percentage
    averageResponseTime: Number, // in minutes
    effectivenessRating: {
      type: Number,
      min: 1,
      max: 5
    }
  }
}, {
  timestamps: true,
  collection: 'alertSystems',
  suppressReservedKeysWarning: true
});

// Generate unique alertId before saving
alertSystemSchema.pre('save', async function(next) {
  if (this.isNew) {
    const sequence = await getNextSequence('alertSystem');
    this.alertId = `ALT-SYS-${sequence.toString().padStart(4, '0')}`;
  }
  next();
});

// Middleware for auto-escalation setup
alertSystemSchema.pre('save', function(next) {
  // Set up auto-escalation timers based on alert level
  if (this.isNew && this.autoEscalation.enabled) {
    const escalationTimes = {
      emergency: 15, // 15 minutes
      critical: 30,  // 30 minutes
      warning: 60,   // 1 hour
      info: 240      // 4 hours
    };

    const minutes = escalationTimes[this.alertLevel] || 60;
    this.autoEscalation.timers.push({
      timerName: 'initial_escalation',
      triggerTime: new Date(Date.now() + minutes * 60 * 1000),
      action: 'escalate_to_supervisor'
    });
  }
  next();
});

// Virtual for time since creation
alertSystemSchema.virtual('timeSinceCreation').get(function() {
  const now = new Date();
  const created = new Date(this.createdAt);
  return Math.floor((now - created) / (1000 * 60)); // in minutes
});

// Virtual for acknowledgment rate
alertSystemSchema.virtual('acknowledgmentRate').get(function() {
  if (!this.recipients?.length) return 0;
  return Math.round((this.acknowledgments?.length || 0) / this.recipients.length * 100);
});

// Virtual for delivery success rate
alertSystemSchema.virtual('deliverySuccessRate').get(function() {
  const total = this.delivery?.deliveryStatus?.totalRecipients || 0;
  if (total === 0) return 0;
  const delivered = this.delivery?.deliveryStatus?.delivered || 0;
  return Math.round((delivered / total) * 100);
});

// Instance method to acknowledge alert
alertSystemSchema.methods.acknowledgeAlert = function(userId, responseActions, comments, location) {
  this.acknowledgments.push({
    acknowledgedBy: userId,
    acknowledgmentTime: new Date(),
    responseActions: responseActions || [],
    comments: comments,
    location: location
  });

  // Update status if sufficient acknowledgments received
  const recipientsLength = this.recipients?.length || 0;
  const acknowledgmentThreshold = Math.ceil(recipientsLength * 0.5); // 50% threshold
  if ((this.acknowledgments?.length || 0) >= acknowledgmentThreshold) {
    this.status = 'acknowledged';
  }

  return this.save();
};

// Instance method to escalate alert
alertSystemSchema.methods.escalateAlert = function(escalatedBy, escalateTo, reason) {
  if (!this.escalation) this.escalation = { escalationChain: [] };
  if (!this.escalation.escalationChain) this.escalation.escalationChain = [];
  
  const currentLevel = this.escalation.escalationChain.length + 1;
  
  this.escalation.escalationChain.push({
    level: currentLevel,
    recipients: Array.isArray(escalateTo) ? escalateTo : [escalateTo],
    escalatedAt: new Date(),
    escalatedBy: escalatedBy,
    escalationReason: reason
  });

  // Add escalated recipients
  const newRecipients = (Array.isArray(escalateTo) ? escalateTo : [escalateTo]).map(userId => ({
    userId: userId,
    deliveryChannels: ['sms', 'email', 'push_notification']
  }));
  
  if (!this.recipients) this.recipients = [];
  if (!this.delivery) this.delivery = { deliveryStatus: {} };
  if (!this.delivery.deliveryStatus) this.delivery.deliveryStatus = {};
  
  this.recipients.push(...newRecipients);

  // Increase priority if not already at maximum
  const priorityLevels = ['low', 'medium', 'high', 'urgent', 'emergency'];
  const currentIndex = priorityLevels.indexOf(this.priority.level);
  if (currentIndex < priorityLevels.length - 1) {
    this.priority.level = priorityLevels[currentIndex + 1];
  }

  return this.save();
};

// Instance method to resolve alert
alertSystemSchema.methods.resolveAlert = function(resolvedBy, resolutionComments, resolutionType = 'manual_intervention') {
  this.status = 'resolved';
  if (!this.resolution) this.resolution = {};
  this.resolution.status = 'resolved';
  this.resolution.resolvedBy = resolvedBy;
  this.resolution.resolutionComments = resolutionComments;
  this.resolution.resolvedAt = new Date();
  this.resolution.resolutionType = resolutionType;
  
  // Deactivate auto-escalation timers
  if (this.autoEscalation?.timers) {
    this.autoEscalation.timers.forEach(timer => {
      timer.isActive = false;
    });
  }

  return this.save();
};

// Instance method to update delivery status
alertSystemSchema.methods.updateDeliveryStatus = function(recipientId, channel, status, errorMessage) {
  if (!this.recipients?.length) return this.save();
  
  const recipient = this.recipients.find(r => r.userId.toString() === recipientId.toString());
  if (recipient) {
    // Ensure deliveryStatus array exists
    if (!recipient.deliveryStatus) recipient.deliveryStatus = [];
    
    const existingStatus = recipient.deliveryStatus.find(ds => ds.channel === channel);
    if (existingStatus) {
      existingStatus.status = status;
      existingStatus.timestamp = new Date();
      existingStatus.errorMessage = errorMessage;
    } else {
      recipient.deliveryStatus.push({
        channel: channel,
        status: status,
        timestamp: new Date(),
        errorMessage: errorMessage
      });
    }

    // Update overall delivery statistics
    this.updateDeliveryStatistics();
  }

  return this.save();
};

// Instance method to update delivery statistics
alertSystemSchema.methods.updateDeliveryStatistics = function() {
  let sent = 0, delivered = 0, read = 0, failed = 0;

  if (this.recipients?.length) {
    this.recipients.forEach(recipient => {
      if (recipient.deliveryStatus?.length) {
        recipient.deliveryStatus.forEach(status => {
          switch (status.status) {
            case 'sent': sent++; break;
            case 'delivered': delivered++; break;
            case 'read': read++; break;
            case 'failed': failed++; break;
          }
        });
      }
    });
  }

  // Ensure delivery structure exists
  if (!this.delivery) this.delivery = {};
  if (!this.delivery.deliveryStatus) this.delivery.deliveryStatus = {};

  this.delivery.deliveryStatus.sent = sent;
  this.delivery.deliveryStatus.delivered = delivered;
  this.delivery.deliveryStatus.read = read;
  this.delivery.deliveryStatus.failed = failed;

  // Calculate analytics
  const recipientsLength = this.recipients?.length || 0;
  if (recipientsLength > 0) {
    if (!this.analytics) this.analytics = {};
    this.analytics.responseRate = Math.round(((this.acknowledgments?.length || 0) / recipientsLength) * 100);
  }
};

// Static method to get active alerts for user
alertSystemSchema.statics.getActiveAlertsForUser = function(userId, limit = 20) {
  return this.find({
    'recipients.userId': userId,
    status: { $in: ['active', 'acknowledged'] },
    isActive: true,
    $or: [
      { 'expiration.expiresAt': { $gt: new Date() } },
      { 'expiration.expiresAt': null }
    ]
  })
  .populate('source.sourceId')
  .sort({ 'priority.level': 1, createdAt: -1 })
  .limit(limit);
};

// Static method to get alerts requiring escalation
alertSystemSchema.statics.getAlertsRequiringEscalation = function() {
  const now = new Date();
  
  return this.find({
    status: 'active',
    isActive: true,
    'autoEscalation.enabled': true,
    'autoEscalation.timers': {
      $elemMatch: {
        isActive: true,
        triggerTime: { $lte: now }
      }
    }
  })
  .populate('recipients.userId', 'personalInfo.firstName personalInfo.lastName roleInfo.role authentication.phone')
  .sort({ 'priority.level': 1, createdAt: 1 });
};

// Static method to get alerts by type and area
alertSystemSchema.statics.getAlertsByTypeAndArea = function(alertType, areaType, areaId, days = 7) {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const query = {
    alertType: alertType,
    createdAt: { $gte: cutoffDate },
    isActive: true
  };

  // Add area filter based on type
  if (areaType === 'village') {
    query['affectedAreas.villages'] = areaId;
  } else if (areaType === 'block') {
    query['affectedAreas.blocks'] = areaId;
  } else if (areaType === 'district') {
    query['affectedAreas.districts'] = areaId;
  }

  return this.find(query)
    .populate('source.sourceId')
    .sort({ createdAt: -1 });
};

// Static method to get delivery statistics
alertSystemSchema.statics.getDeliveryStatistics = function(days = 30) {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: cutoffDate },
        isActive: true
      }
    },
    {
      $group: {
        _id: '$alertType',
        totalAlerts: { $sum: 1 },
        averageDeliveryRate: { $avg: '$analytics.responseRate' },
        totalRecipients: { $sum: '$delivery.deliveryStatus.totalRecipients' },
        totalDelivered: { $sum: '$delivery.deliveryStatus.delivered' },
        totalFailed: { $sum: '$delivery.deliveryStatus.failed' }
      }
    },
    {
      $addFields: {
        successRate: {
          $cond: [
            { $gt: ['$totalRecipients', 0] },
            { $multiply: [{ $divide: ['$totalDelivered', '$totalRecipients'] }, 100] },
            0
          ]
        }
      }
    }
  ]);
};

// Static method to archive expired alerts
alertSystemSchema.statics.archiveExpiredAlerts = function() {
  const now = new Date();
  
  return this.updateMany(
    {
      'expiration.expiresAt': { $lt: now },
      'expiration.autoArchive': true,
      status: { $ne: 'archived' }
    },
    {
      $set: { status: 'archived' }
    }
  );
};

// Indexes for efficient querying
alertSystemSchema.index({ 'recipients.userId': 1, status: 1, createdAt: -1 });
alertSystemSchema.index({ alertType: 1, 'priority.level': 1 });
alertSystemSchema.index({ status: 1, 'autoEscalation.enabled': 1 });
alertSystemSchema.index({ 'affectedAreas.villages': 1, createdAt: -1 });
alertSystemSchema.index({ 'affectedAreas.blocks': 1, createdAt: -1 });
alertSystemSchema.index({ 'affectedAreas.districts': 1, createdAt: -1 });
alertSystemSchema.index({ 'source.sourceId': 1, 'source.sourceModel': 1 });
alertSystemSchema.index({ 'expiration.expiresAt': 1, 'expiration.autoArchive': 1 });
alertSystemSchema.index({ isActive: 1, status: 1 });

// Pre-save hook to synchronize totalRecipients with recipients array length
alertSystemSchema.pre('save', function(next) {
  if (this.recipients && Array.isArray(this.recipients)) {
    if (!this.delivery) this.delivery = { deliveryStatus: {} };
    if (!this.delivery.deliveryStatus) this.delivery.deliveryStatus = {};
    this.delivery.deliveryStatus.totalRecipients = this.recipients.length;
  }
  next();
});

// Compound indexes for complex queries
alertSystemSchema.index({ 
  'priority.level': 1, 
  status: 1, 
  createdAt: -1 
});

alertSystemSchema.index({ 
  alertType: 1, 
  'affectedAreas.villages': 1, 
  createdAt: -1 
});

alertSystemSchema.index({ 
  'autoEscalation.enabled': 1, 
  'autoEscalation.timers.isActive': 1, 
  'autoEscalation.timers.triggerTime': 1 
});

export default mongoose.model('AlertSystem', alertSystemSchema);