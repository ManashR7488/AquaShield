import express from 'express';
const router = express.Router();
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validateBody, validateQuery, validateParams } from '../middleware/validate.js';
import {
  createWaterQualityTestSchema,
  updateWaterQualityTestSchema,
  queryWaterQualityTestsSchema
} from '../validation/waterQualityTest.validation.js';

import {
  createTest,
  getTests,
  getTestById,
  updateTest,
  deleteTest,
  getTestsByVillage,
  getContaminationTrends,
  scheduleFollowUpTest
} from '../controllers/waterQualityTest.controller.js';

/**
 * Water Quality Test Routes
 * Base path: /api/water-quality-tests
 */

/**
 * @route   POST /api/water-quality-tests
 * @desc    Create new water quality test
 * @access  ASHA Workers, Health Officials, Admin
 */
router.post(
  '/',
  authenticate,
  authorize(['asha_worker', 'health_official', 'admin']),
  validateBody(createWaterQualityTestSchema),
  createTest
);

/**
 * @route   GET /api/water-quality-tests
 * @desc    Get water quality tests with filtering and pagination
 * @access  All authenticated users
 */
router.get(
  '/',
  authenticate,
  validateQuery(queryWaterQualityTestsSchema),
  getTests
);

/**
 * @route   GET /api/water-quality-tests/:id
 * @desc    Get single water quality test
 * @access  All authenticated users
 */
router.get(
  '/:id',
  authenticate,
  getTestById
);

/**
 * @route   PUT /api/water-quality-tests/:id
 * @desc    Update water quality test
 * @access  Test creator, Health Officials, Admin
 */
router.put(
  '/:id',
  authenticate,
  validateBody(updateWaterQualityTestSchema),
  updateTest
);

/**
 * @route   DELETE /api/water-quality-tests/:id
 * @desc    Delete water quality test (soft delete)
 * @access  Admin only
 */
router.delete(
  '/:id',
  authenticate,
  authorize(['admin']),
  deleteTest
);

/**
 * @route   GET /api/water-quality-tests/village/:villageId
 * @desc    Get water quality tests for specific village
 * @access  All authenticated users
 */
router.get(
  '/village/:villageId',
  authenticate,
  validateQuery(queryWaterQualityTestsSchema),
  getTestsByVillage
);

/**
 * @route   GET /api/water-quality-tests/history/:sourceId
 * @desc    Get water test history for specific source
 * @access  All authenticated users
 */
router.get(
  '/history/:sourceId',
  authenticate,
  (req, res) => {
    // Delegate to getTests with source filter
    req.query.waterSourceId = req.params.sourceId;
    getTests(req, res);
  }
);

/**
 * @route   PUT /api/water-quality-tests/:id/results
 * @desc    Submit test results for specific test
 * @access  ASHA Workers, Health Officials, Admin
 */
router.put(
  '/:id/results',
  authenticate,
  authorize(['asha_worker', 'health_official', 'admin']),
  validateBody(updateWaterQualityTestSchema),
  updateTest
);

/**
 * @route   GET /api/water-quality-tests/source/:sourceId/results
 * @desc    Get test results by source ID
 * @access  All authenticated users
 */
router.get(
  '/source/:sourceId/results',
  authenticate,
  (req, res) => {
    // Delegate to getTests with source filter
    req.query.waterSourceId = req.params.sourceId;
    getTests(req, res);
  }
);

/**
 * @route   GET /api/water-quality-tests/alerts/:villageId
 * @desc    Get contamination alerts for village
 * @access  All authenticated users
 */
router.get(
  '/alerts/:villageId',
  authenticate,
  (req, res) => {
    // Delegate to getTestsByVillage with alert filter
    req.query.alertsOnly = 'true';
    req.params.villageId = req.params.villageId;
    getTestsByVillage(req, res);
  }
);

/**
 * @route   GET /api/water-quality-tests/report/:villageId
 * @desc    Generate water quality report for village
 * @access  Health Officials, Admin
 */
router.get(
  '/report/:villageId',
  authenticate,
  authorize(['health_official', 'admin']),
  (req, res) => {
    // Delegate to getTestsByVillage with report format
    req.query.format = 'report';
    req.params.villageId = req.params.villageId;
    getTestsByVillage(req, res);
  }
);

/**
 * @route   GET /api/water-quality-tests/contamination/trends/:villageId
 * @desc    Get contamination trends analysis for specific village
 * @access  Health Officials, Admin
 */
router.get(
  '/contamination/trends/:villageId',
  authenticate,
  authorize(['health_official', 'admin']),
  (req, res) => {
    // Delegate to getContaminationTrends with village filter
    req.query.villageId = req.params.villageId;
    getContaminationTrends(req, res);
  }
);

/**
 * @route   POST /api/water-quality-tests/:id/follow-up
 * @desc    Schedule follow-up test
 * @access  ASHA Workers, Health Officials, Admin
 */
router.post(
  '/:id/follow-up',
  authenticate,
  authorize(['asha_worker', 'health_official', 'admin']),
  scheduleFollowUpTest
);

export default router;