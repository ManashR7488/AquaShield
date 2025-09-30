import express from 'express';
const router = express.Router();
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validateBody, validateQuery, validateParams } from '../middleware/validate.js';
import {
  createAlertSchema,
  updateAlertStatusSchema,
  queryAlertsSchema,
  bulkAlertSchema
} from '../validation/alertSystem.validation.js';

import {
  createAlert,
  getAlerts,
  getAlertById,
  updateAlertStatus,
  acknowledgeAlert,
  escalateAlert,
  sendBulkAlert,
  getUserAlerts,
  getActiveAlerts
} from '../controllers/alertSystem.controller.js';

/**
 * Alert System Routes
 * Base path: /api/alerts
 */

/**
 * @route   POST /api/alerts
 * @desc    Create new alert
 * @access  ASHA Workers, Health Officials, Admin
 */
router.post(
  '/',
  authenticate,
  authorize(['asha_worker', 'health_official', 'admin']),
  validateBody(createAlertSchema),
  createAlert
);

/**
 * @route   GET /api/alerts
 * @desc    Get alerts with filtering and pagination
 * @access  All authenticated users (with role-based filtering)
 */
router.get(
  '/',
  authenticate,
  validateQuery(queryAlertsSchema),
  getAlerts
);

/**
 * @route   GET /api/alerts/:id
 * @desc    Get single alert
 * @access  All authenticated users (with role-based access)
 */
router.get(
  '/:id',
  authenticate,
  getAlertById
);

/**
 * @route   PUT /api/alerts/:id/status
 * @desc    Update alert status
 * @access  Health Officials, Admin, or assigned recipients
 */
router.put(
  '/:id/status',
  authenticate,
  validateBody(updateAlertStatusSchema),
  updateAlertStatus
);

/**
 * @route   PUT /api/alerts/:id/acknowledge
 * @desc    Acknowledge alert
 * @access  Alert recipients
 */
router.put(
  '/:id/acknowledge',
  authenticate,
  acknowledgeAlert
);

/**
 * @route   PUT /api/alerts/:id/escalate
 * @desc    Escalate alert to higher authority
 * @access  Health Officials, Admin
 */
router.put(
  '/:id/escalate',
  authenticate,
  authorize(['health_official', 'admin']),
  escalateAlert
);

/**
 * @route   POST /api/alerts/bulk
 * @desc    Send bulk alerts
 * @access  Health Officials, Admin
 */
router.post(
  '/bulk',
  authenticate,
  authorize(['health_official', 'admin']),
  validateBody(bulkAlertSchema),
  sendBulkAlert
);

/**
 * @route   GET /api/alerts/user/my-alerts
 * @desc    Get current user's alerts
 * @access  All authenticated users
 */
router.get(
  '/user/my-alerts',
  authenticate,
  validateQuery(queryAlertsSchema),
  getUserAlerts
);

/**
 * @route   GET /api/alerts/status/active
 * @desc    Get active alerts
 * @access  All authenticated users (with role-based filtering)
 */
router.get(
  '/status/active',
  authenticate,
  validateQuery(queryAlertsSchema),
  getActiveAlerts
);

export default router;