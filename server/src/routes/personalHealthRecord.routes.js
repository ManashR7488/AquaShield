import express from 'express';
import {
  getHealthRecords,
  createHealthRecord,
  getHealthRecordById,
  updateHealthRecord,
  deleteHealthRecord,
  createVitalSigns,
  createSymptomLog,
  createMedicalHistory,
  getRecordsByType,
  getHealthTrends,
  getHealthRecordStats,
  generateHealthReport
} from '../controllers/personalHealthRecord.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import  validate  from '../middleware/validate.js';
import {
  createHealthRecordSchema,
  updateHealthRecordSchema,
  queryHealthRecordsSchema,
  healthRecordIdSchema,
  createVitalSignsSchema,
  createSymptomLogSchema,
  createMedicalHistorySchema,
  healthTrendsSchema,
  generateHealthReportSchema
} from '../validation/personalHealthRecord.validation.js';

const router = express.Router();

// Apply authentication and user authorization to all routes
router.use(authenticate);
router.use(authorize(['user']));

/**
 * @route   GET /api/health-records
 * @desc    Get all health records for the current user
 * @access  Private (User only)
 */
router.get('/', validate(queryHealthRecordsSchema, 'query'), getHealthRecords);

/**
 * @route   POST /api/health-records
 * @desc    Create a new health record
 * @access  Private (User only)
 */
router.post('/', validate(createHealthRecordSchema), createHealthRecord);

/**
 * @route   GET /api/health-records/stats
 * @desc    Get health record statistics for the current user
 * @access  Private (User only)
 */
router.get('/stats', getHealthRecordStats);

/**
 * @route   GET /api/health-records/trends
 * @desc    Get health trends analysis
 * @access  Private (User only)
 */
router.get('/trends', validate(healthTrendsSchema, 'query'), getHealthTrends);

/**
 * @route   POST /api/health-records/vital-signs
 * @desc    Create a vital signs record
 * @access  Private (User only)
 */
router.post('/vital-signs', validate(createVitalSignsSchema), createVitalSigns);

/**
 * @route   POST /api/health-records/symptoms
 * @desc    Create a symptom log
 * @access  Private (User only)
 */
router.post('/symptoms', validate(createSymptomLogSchema), createSymptomLog);

/**
 * @route   POST /api/health-records/medical-history
 * @desc    Create a medical history record
 * @access  Private (User only)
 */
router.post('/medical-history', validate(createMedicalHistorySchema), createMedicalHistory);

/**
 * @route   GET /api/health-records/by-type/:type
 * @desc    Get health records by type
 * @access  Private (User only)
 */
router.get('/by-type/:type', getRecordsByType);

/**
 * @route   POST /api/health-records/generate-report
 * @desc    Generate health report
 * @access  Private (User only)
 */
router.post('/generate-report', validate(generateHealthReportSchema), generateHealthReport);

/**
 * @route   GET /api/health-records/:id
 * @desc    Get a specific health record by ID
 * @access  Private (User only)
 */
router.get('/:id', validate(healthRecordIdSchema, 'params'), getHealthRecordById);

/**
 * @route   PUT /api/health-records/:id
 * @desc    Update a health record
 * @access  Private (User only)
 */
router.put('/:id', 
  validate(healthRecordIdSchema, 'params'),
  validate(updateHealthRecordSchema),
  updateHealthRecord
);

/**
 * @route   DELETE /api/health-records/:id
 * @desc    Delete a health record (soft delete)
 * @access  Private (User only)
 */
router.delete('/:id', validate(healthRecordIdSchema, 'params'), deleteHealthRecord);

export default router;