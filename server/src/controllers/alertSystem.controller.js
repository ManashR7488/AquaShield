import mongoose from 'mongoose';
import AlertSystem from '../models/alertSystem.model.js';
import { 
  sendBatchNotifications,
  handleAlertSystemIntegration 
} from '../utils/notificationService.js';
import { 
  successResponse, 
  createdResponse, 
  updatedResponse, 
  deletedResponse, 
  notFoundResponse, 
  paginatedResponse,
  getPaginationData 
} from '../utils/responseHelper.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * Alert System Controller
 * Notification management with multi-channel delivery
 */

/**
 * Create new alert
 * POST /api/alerts
 */
const createAlert = asyncHandler(async (req, res) => {
  const alertData = {
    ...req.body,
    source: {
      triggeredBy: 'user',
      sourceId: req.user._id,
      sourceModel: 'User',
      triggerDate: new Date()
    },
    createdBy: req.user._id
  };

  // Generate unique alert ID
  const alertCount = await AlertSystem.countDocuments();
  alertData.alertId = `ALT-SYS-${String(alertCount + 1).padStart(4, '0')}`;

  // Set default delivery status
  alertData.delivery.deliveryStatus = {
    totalRecipients: 0,
    sent: 0,
    delivered: 0,
    read: 0,
    failed: 0,
    acknowledged: 0
  };

  const alert = new AlertSystem(alertData);
  await alert.save();

  // Determine recipients based on targeting criteria
  const recipients = await determineRecipients(alertData.recipients);
  
  // Add recipients to alert
  alert.recipients = recipients.map(user => ({
    userId: user._id,
    deliveryChannels: alertData.delivery.channels,
    deliveryStatus: {
      sent: false,
      delivered: false,
      read: false,
      acknowledged: false
    }
  }));

  // Update total recipients count (handled by pre-save hook)
  await alert.save();

  // Trigger immediate notification delivery if not scheduled for later
  const now = new Date();
  const scheduledFor = alertData.delivery.scheduledFor ? new Date(alertData.delivery.scheduledFor) : now;
  
  if (scheduledFor <= now) {
    try {
      await handleAlertSystemIntegration(alert._id);
    } catch (deliveryError) {
      console.error('Failed to deliver alert immediately:', deliveryError);
      // Don't fail the creation, just log the error
    }
  }

  // Populate for response
  await alert.populate([
    { path: 'createdBy', select: 'personalInfo.firstName personalInfo.lastName roleInfo.role' },
    { path: 'recipients.userId', select: 'personalInfo.firstName personalInfo.lastName roleInfo.role' }
  ]);

  return createdResponse(res, alert, 'Alert created successfully');
});

/**
 * Get alerts with filtering and pagination
 * GET /api/alerts
 */
const getAlerts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    alertType,
    status,
    alertLevel,
    priorityLevel,
    recipientId,
    recipientRole,
    villageId,
    blockId,
    districtId,
    dateFrom,
    dateTo,
    requiresAcknowledgment,
    acknowledged,
    escalated,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build filter object
  const filter = {};
  
  if (alertType) filter.alertType = alertType;
  if (status) filter.status = status;
  if (alertLevel) filter.alertLevel = alertLevel;
  if (priorityLevel) filter['priority.level'] = priorityLevel;

  // Recipient filters
  if (recipientId) filter['recipients.userId'] = recipientId;

  // Geographic filters
  if (villageId) filter['affectedAreas.villages'] = villageId;
  if (blockId) filter['affectedAreas.blocks'] = blockId;
  if (districtId) filter['affectedAreas.districts'] = districtId;

  // Date filters
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }

  // Boolean filters
  if (requiresAcknowledgment !== undefined) {
    filter['delivery.requiresAcknowledgment'] = requiresAcknowledgment === 'true';
  }
  if (acknowledged !== undefined) {
    filter['recipients.deliveryStatus.acknowledged'] = acknowledged === 'true';
  }
  if (escalated !== undefined) {
    filter['autoEscalation.triggered'] = escalated === 'true';
  }

  // Text search
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { messageContent: { $regex: search, $options: 'i' } }
    ];
  }

  // Role-based access control
  const userRole = req.user.roleInfo.role;
  if (!['admin', 'health_official'].includes(userRole)) {
    // Non-admin users see only alerts they created or are recipients of
    filter.$or = [
      { createdBy: req.user._id },
      { 'recipients.userId': req.user._id }
    ];
  }

  // Calculate pagination
  const total = await AlertSystem.countDocuments(filter);
  const paginationData = getPaginationData(page, limit, total);

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // Execute query
  const alerts = await AlertSystem.find(filter)
    .populate([
      { path: 'createdBy', select: 'personalInfo.firstName personalInfo.lastName roleInfo.role' },
      { path: 'recipients.userId', select: 'personalInfo.firstName personalInfo.lastName roleInfo.role' },
      { path: 'source.sourceId', select: 'title name' }
    ])
    .sort(sort)
    .skip(paginationData.skip)
    .limit(paginationData.itemsPerPage);

  return paginatedResponse(res, alerts, paginationData, 'Alerts retrieved successfully');
});

/**
 * Get single alert by ID
 * GET /api/alerts/:id
 */
const getAlertById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const alert = await AlertSystem.findById(id)
    .populate([
      { path: 'createdBy', select: 'personalInfo.firstName personalInfo.lastName roleInfo.role authentication.phone' },
      { path: 'recipients.userId', select: 'personalInfo.firstName personalInfo.lastName roleInfo.role authentication.phone authentication.email' },
      { path: 'source.sourceId' },
      { path: 'autoEscalation.escalationLevels.escalatedTo', select: 'personalInfo.firstName personalInfo.lastName' }
    ]);

  if (!alert) {
    return notFoundResponse(res, 'Alert not found');
  }

  // Check authorization
  const userRole = req.user.roleInfo.role;
  const isCreator = alert.createdBy._id.toString() === req.user._id.toString();
  const isRecipient = alert.recipients.some(r => r.userId._id.toString() === req.user._id.toString());
  
  if (!['admin', 'health_official'].includes(userRole) && !isCreator && !isRecipient) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only view alerts you created or are recipient of.'
    });
  }

  return successResponse(res, alert, 'Alert retrieved successfully');
});

/**
 * Update alert status
 * PUT /api/alerts/:id
 */
const updateAlertStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  const alert = await AlertSystem.findById(id);
  
  if (!alert) {
    return notFoundResponse(res, 'Alert not found');
  }

  // Only admin can update alerts
  if (req.user.roleInfo.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only administrators can update alerts.'
    });
  }

  // Update status
  const previousStatus = alert.status;
  alert.status = status;
  
  // Add to status history
  if (!alert.statusHistory) alert.statusHistory = [];
  alert.statusHistory.push({
    status: status,
    changedBy: req.user._id,
    changedAt: new Date(),
    reason: reason
  });

  await alert.save();

  return updatedResponse(res, alert, `Alert status updated to ${status}`);
});

/**
 * Acknowledge alert
 * PUT /api/alerts/:id/acknowledge
 */
const acknowledgeAlert = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { acknowledgmentNotes, actionsTaken } = req.body;

  const alert = await AlertSystem.findById(id);
  
  if (!alert) {
    return notFoundResponse(res, 'Alert not found');
  }

  // Find user in recipients
  const recipientIndex = alert.recipients.findIndex(
    r => r.userId.toString() === req.user._id.toString()
  );

  if (recipientIndex === -1) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You are not a recipient of this alert.'
    });
  }

  // Update recipient acknowledgment
  alert.recipients[recipientIndex].deliveryStatus.acknowledged = true;
  alert.recipients[recipientIndex].acknowledgmentDate = new Date();
  alert.recipients[recipientIndex].acknowledgmentNotes = acknowledgmentNotes;
  alert.recipients[recipientIndex].actionsTaken = actionsTaken || [];

  // Update delivery status counts
  alert.delivery.deliveryStatus.acknowledged = alert.recipients.filter(
    r => r.deliveryStatus.acknowledged
  ).length;

  await alert.save();

  return updatedResponse(res, alert, 'Alert acknowledged successfully');
});

/**
 * Escalate alert
 * PUT /api/alerts/:id/escalate
 */
const escalateAlert = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { escalationLevel, escalateTo, escalationReason, additionalMessage, urgencyIncrease } = req.body;

  const alert = await AlertSystem.findById(id);
  
  if (!alert) {
    return notFoundResponse(res, 'Alert not found');
  }

  // Only admin and health officials can escalate
  if (!['admin', 'health_official'].includes(req.user.roleInfo.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only administrators and health officials can escalate alerts.'
    });
  }

  // Use the model's escalateAlert method
  await alert.escalateAlert([escalateTo.userIds || escalateTo], req.user._id);

  // Add escalation to history
  if (!alert.escalationHistory) alert.escalationHistory = [];
  alert.escalationHistory.push({
    escalatedBy: req.user._id,
    escalatedAt: new Date(),
    escalationLevel: escalationLevel,
    escalationReason: escalationReason,
    additionalMessage: additionalMessage
  });

  // Increase urgency if requested
  if (urgencyIncrease) {
    const priorityLevels = ['low', 'medium', 'high', 'urgent', 'emergency'];
    const currentIndex = priorityLevels.indexOf(alert.priority.level);
    if (currentIndex < priorityLevels.length - 1) {
      alert.priority.level = priorityLevels[currentIndex + 1];
    }
  }

  await alert.save();

  return updatedResponse(res, alert, 'Alert escalated successfully');
});

/**
 * Send bulk alerts
 * POST /api/alerts/bulk
 */
const sendBulkAlert = asyncHandler(async (req, res) => {
  const { alerts, batchSettings } = req.body;

  // Only admin can send bulk alerts
  if (req.user.roleInfo.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only administrators can send bulk alerts.'
    });
  }

  const results = [];
  const { delayBetweenAlerts = 0, stopOnFirstFailure = false } = batchSettings || {};

  for (let i = 0; i < alerts.length; i++) {
    try {
      // Add common fields
      const alertData = {
        ...alerts[i],
        source: {
          triggeredBy: 'user',
          sourceId: req.user._id,
          sourceModel: 'User',
          triggerDate: new Date()
        },
        createdBy: req.user._id
      };

      // Generate unique alert ID
      const alertCount = await AlertSystem.countDocuments();
      alertData.alertId = `ALT-SYS-${String(alertCount + i + 1).padStart(4, '0')}`;

      const alert = new AlertSystem(alertData);
      await alert.save();

      results.push({
        success: true,
        alertId: alert.alertId,
        id: alert._id
      });

      // Delay between alerts if specified
      if (delayBetweenAlerts > 0 && i < alerts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenAlerts * 1000));
      }

    } catch (error) {
      results.push({
        success: false,
        error: error.message,
        alertIndex: i
      });

      if (stopOnFirstFailure) {
        break;
      }
    }
  }

  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;

  return successResponse(res, {
    results,
    summary: {
      total: alerts.length,
      successful: successCount,
      failed: failureCount
    }
  }, `Bulk alert operation completed. ${successCount} successful, ${failureCount} failed.`);
});

/**
 * Get user alerts
 * GET /api/alerts/user/:userId
 */
const getUserAlerts = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 10, status, acknowledged } = req.query;

  // Users can only view their own alerts unless admin
  if (userId !== req.user._id.toString() && req.user.roleInfo.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only view your own alerts.'
    });
  }

  const filter = {
    'recipients.userId': userId
  };

  if (status) filter.status = status;
  if (acknowledged !== undefined) {
    filter['recipients.deliveryStatus.acknowledged'] = acknowledged === 'true';
  }

  const total = await AlertSystem.countDocuments(filter);
  const paginationData = getPaginationData(page, limit, total);

  const alerts = await AlertSystem.find(filter)
    .populate([
      { path: 'createdBy', select: 'personalInfo.firstName personalInfo.lastName roleInfo.role' }
    ])
    .sort({ createdAt: -1 })
    .skip(paginationData.skip)
    .limit(paginationData.itemsPerPage);

  return paginatedResponse(res, alerts, paginationData, 'User alerts retrieved successfully');
});

/**
 * Get active alerts for current user
 * GET /api/alerts/active
 */
const getActiveAlerts = asyncHandler(async (req, res) => {
  const filter = {
    'recipients.userId': req.user._id,
    status: 'active',
    $or: [
      { 'delivery.expiresAt': { $exists: false } },
      { 'delivery.expiresAt': { $gt: new Date() } }
    ]
  };

  const alerts = await AlertSystem.find(filter)
    .populate([
      { path: 'createdBy', select: 'personalInfo.firstName personalInfo.lastName roleInfo.role' }
    ])
    .sort({ 'priority.level': -1, createdAt: -1 })
    .limit(50); // Limit active alerts to reasonable number

  return successResponse(res, alerts, 'Active alerts retrieved successfully');
});

/**
 * Helper function to determine recipients based on targeting criteria
 */
const determineRecipients = async (recipientCriteria) => {
  const User = mongoose.model('User');
  let recipients = [];

  switch (recipientCriteria.targetingType) {
    case 'individual':
      recipients = await User.find({
        _id: { $in: recipientCriteria.userIds }
      }).select('personalInfo roleInfo authentication deviceInfo preferences');
      break;

    case 'role_based':
      recipients = await User.find({
        'roleInfo.role': { $in: recipientCriteria.roles },
        isActive: true
      }).select('personalInfo roleInfo authentication deviceInfo preferences');
      break;

    case 'geographic':
      const geoFilter = {
        isActive: true
      };
      
      if (recipientCriteria.geographic.includeRoles) {
        geoFilter['roleInfo.role'] = { $in: recipientCriteria.geographic.includeRoles };
      }

      // Add geographic filtering based on user's assigned areas
      // This would need to be implemented based on your user model structure
      recipients = await User.find(geoFilter)
        .select('personalInfo roleInfo authentication deviceInfo preferences');
      break;

    case 'custom':
      const customFilter = { isActive: true };
      
      if (recipientCriteria.customFilters.gender) {
        customFilter['personalInfo.gender'] = recipientCriteria.customFilters.gender;
      }
      
      recipients = await User.find(customFilter)
        .select('personalInfo roleInfo authentication deviceInfo preferences');
      break;

    default:
      recipients = [];
  }

  return recipients;
};

export {
  createAlert,
  getAlerts,
  getAlertById,
  updateAlertStatus,
  acknowledgeAlert,
  escalateAlert,
  sendBulkAlert,
  getUserAlerts,
  getActiveAlerts
};