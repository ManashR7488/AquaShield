import express from 'express';
const router = express.Router();
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validateBody, validateQuery, validateParams } from '../middleware/validate.js';
import {
  createHealthReportSchema,
  updateHealthReportSchema,
  queryHealthReportsSchema,
  healthReportParamsSchema
} from '../validation/healthReport.validation.js';

import {
  createReport,
  getReports,
  getReportById,
  updateReport,
  reviewReport,
  escalateReport,
  deleteReport,
  getReportsByVillage,
  getReportsByReporter,
  getReportsByPatient,
  getCriticalReports,
  getReportsByCategory,
  getRecentReports,
  getReportStats,
  exportReports,
  getPendingReports,
  getReportStatistics,
  generateHealthDashboard,
  generateEpidemiologicalReport,
  calculateHealthMetrics
} from '../controllers/healthReport.controller.js';

/**
 * Health Report Routes
 * Base path: /api/health-reports
 */

/**
 * @route   POST /api/health-reports
 * @desc    Create new health report
 * @access  ASHA Workers, Health Officials, Admin
 */
router.post(
  '/',
  authenticate,
  authorize(['asha_worker', 'health_official', 'admin']),
  validateBody(createHealthReportSchema),
  createReport
);

/**
 * @route   GET /api/health-reports
 * @desc    Get health reports with filtering and pagination
 * @access  All authenticated users (with role-based filtering)
 */
router.get(
  '/',
  authenticate,
  validateQuery(queryHealthReportsSchema),
  getReports
);

/**
 * @route   GET /api/health-reports/:id
 * @desc    Get single health report
 * @access  All authenticated users (with role-based access)
 */
router.get(
  '/:id',
  authenticate,
  validateParams(healthReportParamsSchema),
  getReportById
);

/**
 * @route   PUT /api/health-reports/:id
 * @desc    Update health report
 * @access  Report creator, Health Officials, Admin
 */
router.put(
  '/:id',
  authenticate,
  validateParams(healthReportParamsSchema),
  validateBody(updateHealthReportSchema),
  updateReport
);

/**
 * @route   PUT /api/health-reports/:id/review
 * @desc    Review health report
 * @access  Health Officials, Admin
 */
router.put(
  '/:id/review',
  authenticate,
  authorize(['health_official', 'admin']),
  validateParams(healthReportParamsSchema),
  reviewReport
);

/**
 * @route   PUT /api/health-reports/:id/escalate
 * @desc    Escalate health report
 * @access  Health Officials, Admin
 */
router.put(
  '/:id/escalate',
  authenticate,
  authorize(['health_official', 'admin']),
  validateParams(healthReportParamsSchema),
  escalateReport
);

/**
 * @route   DELETE /api/health-reports/:id
 * @desc    Delete health report (soft delete)
 * @access  Health Officials, Admin
 */
router.delete(
  '/:id',
  authenticate,
  authorize(['health_official', 'admin']),
  validateParams(healthReportParamsSchema),
  deleteReport
);

/**
 * @route   GET /api/health-reports/village/:villageId
 * @desc    Get health reports for specific village
 * @access  All authenticated users
 */
router.get(
  '/village/:villageId',
  authenticate,
  getReportsByVillage
);

/**
 * @route   GET /api/health-reports/reporter/:reporterId
 * @desc    Get health reports by specific reporter
 * @access  Reporters can see their own reports, Health Officials and Admin see all
 */
router.get(
  '/reporter/:reporterId',
  authenticate,
  getReportsByReporter
);

/**
 * @route   GET /api/health-reports/patient/:patientId
 * @desc    Get health reports for specific patient
 * @access  Assigned ASHA workers, Health Officials, Admin
 */
router.get(
  '/patient/:patientId',
  authenticate,
  getReportsByPatient
);

/**
 * @route   GET /api/health-reports/severity/critical
 * @desc    Get all critical health reports
 * @access  Health Officials, Admin
 */
router.get(
  '/severity/critical',
  authenticate,
  authorize(['health_official', 'admin']),
  getCriticalReports
);

/**
 * @route   GET /api/health-reports/category/:category
 * @desc    Get health reports by category
 * @access  All authenticated users
 */
router.get(
  '/category/:category',
  authenticate,
  getReportsByCategory
);

/**
 * @route   GET /api/health-reports/recent/:days
 * @desc    Get recent health reports within specified days
 * @access  All authenticated users
 */
router.get(
  '/recent/:days',
  authenticate,
  getRecentReports
);

/**
 * @route   GET /api/health-reports/stats/summary
 * @desc    Get health report statistics
 * @access  Health Officials, Admin
 */
router.get(
  '/stats/summary',
  authenticate,
  authorize(['health_official', 'admin']),
  getReportStats
);

/**
 * @route   GET /api/health-reports/pending
 * @desc    Get pending health reports
 * @access  Health Officials, Admin
 */
router.get(
  '/pending',
  authenticate,
  authorize(['health_official', 'admin']),
  validateQuery(queryHealthReportsSchema),
  getPendingReports
);

/**
 * @route   GET /api/health-reports/statistics
 * @desc    Get detailed health report statistics
 * @access  Health Officials, Admin
 */
router.get(
  '/statistics',
  authenticate,
  authorize(['health_official', 'admin']),
  validateQuery(queryHealthReportsSchema),
  getReportStatistics
);

/**
 * @route   GET /api/health-reports/export/csv
 * @desc    Export health reports as CSV
 * @access  Health Officials, Admin
 */
router.get(
  '/export/csv',
  authenticate,
  authorize(['health_official', 'admin']),
  exportReports
);

/**
 * @route   GET /api/health-reports/dashboard
 * @desc    Generate comprehensive health dashboard
 * @access  Health Officials, Admin
 */
router.get(
  '/dashboard',
  authenticate,
  authorize(['health_official', 'admin']),
  generateHealthDashboard
);

/**
 * @route   GET /api/health-reports/epidemiology
 * @desc    Generate epidemiological analysis report
 * @access  Health Officials, Admin
 */
router.get(
  '/epidemiology',
  authenticate,
  authorize(['health_official', 'admin']),
  generateEpidemiologicalReport
);

/**
 * @route   GET /api/health-reports/metrics
 * @desc    Calculate comprehensive health metrics and KPIs
 * @access  Health Officials, Admin
 */
router.get(
  '/metrics',
  authenticate,
  authorize(['health_official', 'admin']),
  calculateHealthMetrics
);

export default router;