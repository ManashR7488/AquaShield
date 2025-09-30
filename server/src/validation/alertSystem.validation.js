import Joi from 'joi';

/**
 * Joi validation schemas for alert system operations
 */

// Common schemas for reuse
const deliveryChannelsSchema = Joi.array().items(
  Joi.string().valid('sms', 'email', 'push_notification', 'whatsapp', 'voice_call', 'in_app_notification')
).min(1).required();

const recipientTargetingSchema = Joi.object({
  targetingType: Joi.string().valid('individual', 'role_based', 'geographic', 'custom').required(),
  
  // Individual targeting
  userIds: Joi.when('targetingType', {
    is: 'individual',
    then: Joi.array().items(Joi.string()).min(1).required(),
    otherwise: Joi.array().items(Joi.string())
  }),

  // Role-based targeting
  roles: Joi.when('targetingType', {
    is: 'role_based',
    then: Joi.array().items(
      Joi.string().valid('admin', 'health_official', 'asha_worker', 'volunteer')
    ).min(1).required(),
    otherwise: Joi.array().items(Joi.string())
  }),

  // Geographic targeting
  geographic: Joi.when('targetingType', {
    is: 'geographic',
    then: Joi.object({
      areaType: Joi.string().valid('village', 'block', 'district', 'state').required(),
      areaIds: Joi.array().items(Joi.string()).min(1).required(),
      includeRoles: Joi.array().items(
        Joi.string().valid('admin', 'health_official', 'asha_worker', 'volunteer')
      )
    }).required(),
    otherwise: Joi.object()
  }),

  // Custom filters
  customFilters: Joi.when('targetingType', {
    is: 'custom',
    then: Joi.object({
      ageRange: Joi.object({
        min: Joi.number().min(0).max(120),
        max: Joi.number().min(0).max(120)
      }),
      gender: Joi.string().valid('male', 'female', 'other'),
      specializations: Joi.array().items(Joi.string())
    }),
    otherwise: Joi.object()
  })
});

const escalationRuleSchema = Joi.object({
  enabled: Joi.boolean().default(true),
  escalationLevels: Joi.array().items(
    Joi.object({
      level: Joi.number().min(1).max(5).required(),
      triggerAfterMinutes: Joi.number().min(5).max(1440).required(), // 5 min to 24 hours
      escalateTo: recipientTargetingSchema.required(),
      additionalChannels: Joi.array().items(
        Joi.string().valid('sms', 'email', 'push_notification', 'whatsapp', 'voice_call')
      ),
      requiresAcknowledgment: Joi.boolean().default(true)
    })
  ).min(1).max(3),
  
  maxEscalations: Joi.number().min(1).max(5).default(3),
  escalationMessage: Joi.string().max(300)
});

// Alert type specific validation
const healthEmergencyAlertSchema = Joi.object({
  emergencyType: Joi.string().valid(
    'disease_outbreak', 'natural_disaster', 'infrastructure_failure', 
    'contamination', 'medical_emergency'
  ).required(),
  severity: Joi.string().valid('moderate', 'severe', 'critical').required(),
  immediateActions: Joi.array().items(Joi.string().max(200)).min(1).required(),
  contactNumbers: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      number: Joi.string().pattern(/^[0-9+\-\s()]+$/).required(),
      role: Joi.string().required()
    })
  )
});

const diseaseOutbreakNotificationSchema = Joi.object({
  diseaseType: Joi.string().required(),
  affectedAreas: Joi.array().items(Joi.string()).min(1).required(),
  caseCount: Joi.number().min(1).required(),
  preventiveMeasures: Joi.array().items(Joi.string().max(200)).min(1).required(),
  reportingInstructions: Joi.string().max(500)
});

const vaccinationReminderSchema = Joi.object({
  vaccineType: Joi.string().required(),
  targetAgeGroup: Joi.string().required(),
  scheduledDate: Joi.date().greater('now').required(),
  venue: Joi.string().max(200).required(),
  timings: Joi.string().required(),
  documentsRequired: Joi.array().items(Joi.string())
});

const appointmentNotificationSchema = Joi.object({
  appointmentType: Joi.string().valid(
    'health_checkup', 'vaccination', 'consultation', 'follow_up'
  ).required(),
  appointmentDate: Joi.date().greater('now').required(),
  provider: Joi.string().required(),
  location: Joi.string().max(200).required(),
  instructions: Joi.string().max(500)
});

// Main validation schemas

/**
 * Schema for creating alerts
 */
const createAlertSchema = Joi.object({
  // Required basic information
  alertType: Joi.string().valid(
    'health_emergency',
    'disease_outbreak_notification', 
    'water_contamination_warning',
    'vaccination_reminder',
    'appointment_notification',
    'system_alert',
    'administrative_notification'
  ).required(),
  
  title: Joi.string().min(5).max(200).required(),
  messageContent: Joi.string().min(10).max(1000).required(),
  alertLevel: Joi.string().valid('info', 'warning', 'urgent', 'emergency').required(),

  // Priority and delivery
  priority: Joi.object({
    level: Joi.string().valid('low', 'medium', 'high', 'urgent', 'emergency').required(),
    justification: Joi.string().max(300)
  }).required(),

  delivery: Joi.object({
    channels: deliveryChannelsSchema,
    scheduledFor: Joi.date().min('now'),
    expiresAt: Joi.date().greater(Joi.ref('scheduledFor')).default(() => new Date(Date.now() + 24 * 60 * 60 * 1000)), // Default to 24 hours from now
    requiresAcknowledgment: Joi.boolean().default(false),
    acknowledgmentDeadline: Joi.when('requiresAcknowledgment', {
      is: true,
      then: Joi.date().greater('now').required(),
      otherwise: Joi.date()
    })
  }).required(),

  // Recipients
  recipients: recipientTargetingSchema.required(),

  // Alert type specific data
  healthEmergencyDetails: Joi.when('alertType', {
    is: 'health_emergency',
    then: healthEmergencyAlertSchema.required(),
    otherwise: healthEmergencyAlertSchema
  }),

  diseaseOutbreakDetails: Joi.when('alertType', {
    is: 'disease_outbreak_notification',
    then: diseaseOutbreakNotificationSchema.required(),
    otherwise: diseaseOutbreakNotificationSchema
  }),

  vaccinationDetails: Joi.when('alertType', {
    is: 'vaccination_reminder',
    then: vaccinationReminderSchema.required(),
    otherwise: vaccinationReminderSchema
  }),

  appointmentDetails: Joi.when('alertType', {
    is: 'appointment_notification',
    then: appointmentNotificationSchema.required(),
    otherwise: appointmentNotificationSchema
  }),

  // Escalation and follow-up
  autoEscalation: escalationRuleSchema,
  
  // Additional settings
  retrySettings: Joi.object({
    maxRetries: Joi.number().min(0).max(5).default(3),
    retryIntervalMinutes: Joi.number().min(5).max(60).default(15),
    retryOnChannels: Joi.array().items(
      Joi.string().valid('sms', 'email', 'push_notification', 'whatsapp', 'voice_call')
    )
  }),

  // Affected areas for geographic context
  affectedAreas: Joi.object({
    villages: Joi.array().items(Joi.string()),
    blocks: Joi.array().items(Joi.string()),
    districts: Joi.array().items(Joi.string())
  })
});

/**
 * Schema for updating alert status
 */
const updateAlertStatusSchema = Joi.object({
  status: Joi.string().valid('active', 'paused', 'cancelled', 'expired', 'resolved').required(),
  reason: Joi.string().min(10).max(300).required(),
  updatedBy: Joi.string().required()
});

/**
 * Schema for acknowledging alerts
 */
const acknowledgeAlertSchema = Joi.object({
  acknowledged: Joi.boolean().valid(true).required(),
  acknowledgedBy: Joi.string().required(),
  acknowledgmentNotes: Joi.string().max(500),
  actionsTaken: Joi.array().items(Joi.string().max(200))
});

/**
 * Schema for escalating alerts
 */
const escalateAlertSchema = Joi.object({
  escalationLevel: Joi.number().min(1).max(5).required(),
  escalateTo: recipientTargetingSchema.required(),
  escalationReason: Joi.string().min(10).max(300).required(),
  additionalMessage: Joi.string().max(500),
  urgencyIncrease: Joi.boolean().default(true)
});

/**
 * Schema for bulk alert creation
 */
const bulkAlertSchema = Joi.object({
  alerts: Joi.array().items(createAlertSchema).min(1).max(100).required(),
  batchSettings: Joi.object({
    delayBetweenAlerts: Joi.number().min(0).max(3600).default(0), // seconds
    stopOnFirstFailure: Joi.boolean().default(false),
    notifyOnCompletion: Joi.boolean().default(true)
  })
});

/**
 * Schema for querying alerts
 */
const queryAlertsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  
  // Filters
  alertType: Joi.string().valid(
    'health_emergency', 'disease_outbreak_notification', 'water_contamination_warning',
    'vaccination_reminder', 'appointment_notification', 'system_alert', 'administrative_notification'
  ),
  status: Joi.string().valid('draft', 'active', 'paused', 'delivered', 'cancelled', 'expired', 'resolved'),
  alertLevel: Joi.string().valid('info', 'warning', 'urgent', 'emergency'),
  priorityLevel: Joi.string().valid('low', 'medium', 'high', 'urgent', 'emergency'),
  
  // Recipient filters
  recipientId: Joi.string(),
  recipientRole: Joi.string().valid('admin', 'health_official', 'asha_worker', 'volunteer'),
  
  // Geographic filters
  villageId: Joi.string(),
  blockId: Joi.string(),
  districtId: Joi.string(),
  
  // Date filters
  dateFrom: Joi.date(),
  dateTo: Joi.date(),
  scheduledFrom: Joi.date(),
  scheduledTo: Joi.date(),
  
  // Status filters
  requiresAcknowledgment: Joi.boolean(),
  acknowledged: Joi.boolean(),
  escalated: Joi.boolean(),
  
  // Text search
  search: Joi.string().min(3).max(100),
  
  // Sorting
  sortBy: Joi.string().valid(
    'createdAt', 'scheduledFor', 'priority', 'alertLevel', 'status'
  ).default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

/**
 * Schema for updating delivery preferences
 */
const updateDeliveryPreferencesSchema = Joi.object({
  channels: deliveryChannelsSchema,
  scheduledFor: Joi.date().min('now'),
  expiresAt: Joi.date(),
  requiresAcknowledgment: Joi.boolean(),
  acknowledgmentDeadline: Joi.date()
});

/**
 * Schema for parameter validation (route params)
 */
const alertParamsSchema = Joi.object({
  id: Joi.string().required(),
  userId: Joi.string()
});

export {
  createAlertSchema,
  updateAlertStatusSchema,
  acknowledgeAlertSchema,
  escalateAlertSchema,
  bulkAlertSchema,
  queryAlertsSchema,
  updateDeliveryPreferencesSchema,
  alertParamsSchema
};