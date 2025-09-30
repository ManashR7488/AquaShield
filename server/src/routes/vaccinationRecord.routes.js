import express from 'express';
import {
  createRecord,
  getRecords,
  getRecordById,
  updateRecord,
  recordAdverseReaction,
  getRecordsByPatient,
  getVaccinationStats,
  getDueVaccinations,
  deleteRecord,
  generateVaccinationSchedule,
  validateDoseSequence,
  getAdvancedCoverageAnalysis,
  generateVaccinationReminders
} from '../controllers/vaccinationRecord.controller.js';
import validationSchemas from '../validation/index.js';
import { validateBody, validateQuery, validateParams } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * Vaccination Record Management Routes
 */

// Create new vaccination record
router.post('/', 
  authorize(['asha_worker', 'health_official', 'admin']),
  validateBody(validationSchemas.vaccinationRecord.create),
  asyncHandler(createRecord)
);

// Get all vaccination records (with filtering)
router.get('/',
  authorize(['asha_worker', 'health_official', 'admin']),
  asyncHandler(getRecords)
);

// Get vaccination record by ID
router.get('/:id',
  authorize(['asha_worker', 'health_official', 'admin']),
  asyncHandler(getRecordById)
);

// Update vaccination record
router.put('/:id',
  authorize(['asha_worker', 'health_official', 'admin']),
  validateBody(validationSchemas.vaccinationRecord.update),
  asyncHandler(updateRecord)
);

// Delete vaccination record (soft delete)
router.delete('/:id',
  authorize(['admin']),
  asyncHandler(deleteRecord)
);

/**
 * Patient-specific Routes
 */

// Get vaccination records by patient ID
router.get('/patient/:patientId',
  authorize(['asha_worker', 'health_official', 'admin']),
  asyncHandler(getRecordsByPatient)
);

// Generate vaccination schedule for patient
router.get('/schedule/:patientId',
  authorize(['asha_worker', 'health_official', 'admin']),
  asyncHandler(generateVaccinationSchedule)
);

/**
 * Adverse Reactions
 */

// Record adverse reaction
router.post('/:id/adverse-reaction',
  authorize(['asha_worker', 'health_official', 'admin']),
  validateBody(validationSchemas.vaccinationRecord.adverseReaction),
  asyncHandler(recordAdverseReaction)
);

/**
 * Dose Management Routes
 */

// Validate dose sequence before administration
router.post('/validate-dose',
  authorize(['asha_worker', 'health_official', 'admin']),
  validateBody(validationSchemas.vaccinationRecord.doseValidation),
  asyncHandler(validateDoseSequence)
);

// Get due vaccinations
router.get('/due/upcoming',
  authorize(['asha_worker', 'health_official', 'admin']),
  asyncHandler(getDueVaccinations)
);

// Generate vaccination reminders
router.get('/reminders',
  authorize(['asha_worker', 'health_official', 'admin']),
  asyncHandler(generateVaccinationReminders)
);

// Generate vaccination reminders (alias for client compatibility)
router.get('/reminders/generate',
  authorize(['asha_worker', 'health_official', 'admin']),
  asyncHandler(generateVaccinationReminders)
);

/**
 * Scheduling and Administration Routes
 */

// Create vaccination schedule
router.post('/schedule',
  authorize(['asha_worker', 'health_official', 'admin']),
  validateBody(validationSchemas.vaccinationRecord.create),
  asyncHandler(generateVaccinationSchedule)
);

// Complete/administer vaccination
router.put('/:id/complete',
  authorize(['asha_worker', 'health_official', 'admin']),
  validateBody(validationSchemas.vaccinationRecord.update),
  asyncHandler(updateRecord)
);

// Get vaccinations by type
router.get('/by-type/:type',
  authorize(['asha_worker', 'health_official', 'admin']),
  asyncHandler(getRecords)
);

// Get overdue vaccinations (alias for due/upcoming)
router.get('/overdue',
  authorize(['asha_worker', 'health_official', 'admin']),
  asyncHandler(getDueVaccinations)
);

// Get vaccination report
router.get('/report',
  authorize(['health_official', 'admin']),
  asyncHandler(getVaccinationStats)
);

/**
 * Statistics and Analytics Routes
 */

// Get vaccination coverage statistics
router.get('/stats/coverage',
  authorize(['health_official', 'admin']),
  asyncHandler(getVaccinationStats)
);

// Advanced coverage analysis
router.get('/coverage/analysis',
  authorize(['health_official', 'admin']),
  asyncHandler(getAdvancedCoverageAnalysis)
);

// Advanced coverage analysis (alias for client compatibility)
router.get('/coverage/analyze',
  authorize(['health_official', 'admin']),
  asyncHandler(getAdvancedCoverageAnalysis)
);

export default router;