import express from 'express';
import {
  createRecord,
  getRecords,
  getRecordById,
  updateRecord,
  addFollowUp,
  getRecordsByPatient,
  getOutbreakAnalysis,
  deleteRecord,
  performAdvancedOutbreakDetection,
  performEpidemiologicalInvestigation,
  generateSurveillanceReport,
  performContactTracing
} from '../controllers/diseaseRecord.controller.js';
import validationSchemas from '../validation/index.js';
import { validateBody, validateQuery, validateParams } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * Disease Record Management Routes
 */

// Create new disease record
router.post('/', 
  authorize(['asha_worker', 'health_official', 'admin']),
  validateBody(validationSchemas.diseaseRecord.create),
  asyncHandler(createRecord)
);

// Get all disease records (with filtering)
router.get('/',
  authorize(['asha_worker', 'volunteer', 'health_official', 'admin']),
  asyncHandler(getRecords)
);

// Get disease record by ID
router.get('/:id',
  authorize(['asha_worker', 'volunteer', 'health_official', 'admin']),
  asyncHandler(getRecordById)
);

// Update disease record
router.put('/:id',
  authorize(['asha_worker', 'health_official', 'admin']),
  validateBody(validationSchemas.diseaseRecord.update),
  asyncHandler(updateRecord)
);

// Delete disease record (soft delete)
router.delete('/:id',
  authorize(['admin']),
  asyncHandler(deleteRecord)
);

/**
 * Patient-specific Routes
 */

// Get disease records by patient ID
router.get('/patient/:patientId',
  authorize(['asha_worker', 'health_official', 'admin']),
  asyncHandler(getRecordsByPatient)
);

/**
 * Follow-up Management
 */

// Add follow-up to disease record
router.post('/:id/follow-up',
  authorize(['asha_worker', 'health_official', 'admin']),
  validateBody(validationSchemas.diseaseRecord.addFollowUp),
  asyncHandler(addFollowUp)
);

/**
 * Investigation and Analysis Routes
 */

// Perform epidemiological investigation
router.post('/:id/investigate',
  authorize(['health_official', 'admin']),
  validateBody(validationSchemas.diseaseRecord.investigation),
  asyncHandler(performEpidemiologicalInvestigation)
);

// Perform contact tracing
router.get('/:id/contact-trace',
  authorize(['asha_worker', 'health_official', 'admin']),
  validateQuery(validationSchemas.diseaseRecord.contactTracing),
  asyncHandler(performContactTracing)
);

/**
 * Outbreak Detection and Analysis Routes
 */

// Basic outbreak analysis
router.get('/outbreak/analysis',
  authorize(['health_official', 'admin']),
  asyncHandler(getOutbreakAnalysis)
);

// Advanced outbreak detection with statistical analysis
router.get('/outbreak-detection/advanced',
  authorize(['health_official', 'admin']),
  asyncHandler(performAdvancedOutbreakDetection)
);

/**
 * Surveillance and Reporting Routes
 */

// Generate disease surveillance report
router.get('/surveillance/report',
  authorize(['health_official', 'admin']),
  asyncHandler(generateSurveillanceReport)
);

export default router;