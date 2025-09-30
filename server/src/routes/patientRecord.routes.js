import express from 'express';
import Joi from 'joi';
const router = express.Router();
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validateBody, validateQuery, validateParams } from '../middleware/validate.js';
import validationSchemas from '../validation/index.js';

import {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  linkFamilyMember,
  transferPatient,
  deactivatePatient,
  getPatientsByVillage,
  getAshaWorkerPatients,
  getPatientHealthSummary,
  getFamilyMembers
} from '../controllers/patientRecord.controller.js';

// Import vaccination schedule function
import { generateVaccinationSchedule } from '../controllers/vaccinationRecord.controller.js';

/**
 * Patient Record Routes
 * Base path: /api/patients
 */

/**
 * @route   POST /api/patients
 * @desc    Register new patient
 * @access  ASHA Workers, Health Officials, Admin
 */
router.post(
  '/',
  authenticate,
  authorize(['asha_worker', 'health_official', 'admin']),
  validateBody(validationSchemas.patientRecord.create),
  createPatient
);

/**
 * @route   GET /api/patients
 * @desc    Get patients with filtering and pagination
 * @access  All authenticated users (with role-based filtering)
 */
router.get(
  '/',
  authenticate,
  getPatients
);

/**
 * @route   GET /api/patients/:id
 * @desc    Get single patient
 * @access  Assigned ASHA workers, Health Officials, Admin
 */
router.get(
  '/:id',
  authenticate,
  getPatientById
);

/**
 * @route   PUT /api/patients/:id
 * @desc    Update patient record
 * @access  Assigned ASHA workers, Health Officials, Admin
 */
router.put(
  '/:id',
  authenticate,
  validateBody(validationSchemas.patientRecord.update),
  updatePatient
);

/**
 * @route   PUT /api/patients/:id/family
 * @desc    Link family member to patient
 * @access  Assigned ASHA workers, Health Officials, Admin
 */
router.put(
  '/:id/family',
  authenticate,
  linkFamilyMember
);

/**
 * @route   PUT /api/patients/:id/transfer
 * @desc    Transfer patient to new ASHA worker
 * @access  Health Officials, Admin
 */
router.put(
  '/:id/transfer',
  authenticate,
  authorize(['health_official', 'admin']),
  transferPatient
);

/**
 * @route   DELETE /api/patients/:id
 * @desc    Deactivate patient record (soft delete)
 * @access  Admin only
 */
router.delete(
  '/:id',
  authenticate,
  authorize(['admin']),
  deactivatePatient
);

/**
 * @route   GET /api/patients/village/:villageId
 * @desc    Get patients by village
 * @access  All authenticated users
 */
router.get(
  '/village/:villageId',
  authenticate,
  getPatientsByVillage
);

/**
 * @route   GET /api/patients/asha/:ashaWorkerId
 * @desc    Get ASHA worker's assigned patients
 * @access  ASHA workers (own patients), Health Officials, Admin
 */
router.get(
  '/asha/:ashaWorkerId',
  authenticate,
  getAshaWorkerPatients
);

/**
 * @route   GET /api/patients/:id/health-summary
 * @desc    Get patient health summary
 * @access  Assigned ASHA workers, Health Officials, Admin
 */
router.get(
  '/:id/health-summary',
  authenticate,
  getPatientHealthSummary
);

/**
 * @route   GET /api/patients/:id/vaccination-schedule
 * @desc    Get patient vaccination schedule
 * @access  ASHA workers, Health Officials, Admin
 */
router.get(
  '/:id/vaccination-schedule',
  authenticate,
  authorize(['asha_worker', 'health_official', 'admin']),
  validateParams(Joi.object({ id: validationSchemas.common.objectIdSchema })),
  (req, res) => {
    // Map :id to :patientId for the vaccination controller
    req.params.patientId = req.params.id;
    return generateVaccinationSchedule(req, res);
  }
);

/**
 * @route   GET /api/patients/:id/family
 * @desc    Get patient's family members
 * @access  Assigned ASHA workers, Health Officials, Admin
 */
router.get(
  '/:id/family',
  authenticate,
  getFamilyMembers
);

/**
 * @route   GET /api/patients/:id/history
 * @desc    Get patient's health history
 * @access  Assigned ASHA workers, Health Officials, Admin
 */
router.get(
  '/:id/history',
  authenticate,
  (req, res) => {
    // Delegate to getPatientHealthSummary for now
    getPatientHealthSummary(req, res);
  }
);

/**
 * @route   POST /api/patients/:id/health-records
 * @desc    Add health record to patient
 * @access  Assigned ASHA workers, Health Officials, Admin
 */
router.post(
  '/:id/health-records',
  authenticate,
  authorize(['asha_worker', 'health_official', 'admin']),
  validateBody(validationSchemas.patientRecord.healthRecord || validationSchemas.patientRecord.update),
  (req, res) => {
    // For now, return not implemented - this would require a separate health records system
    res.status(501).json({
      success: false,
      message: 'Health records endpoint not yet implemented - use specific record types (vaccination, observation, etc.)'
    });
  }
);

/**
 * @route   GET /api/villages/:id/patient-stats
 * @desc    Get patient statistics for village
 * @access  Health Officials, Admin
 */
router.get(
  '/villages/:id/patient-stats',
  authenticate,
  authorize(['health_official', 'admin']),
  (req, res) => {
    // Delegate to getPatientsByVillage with stats flag
    req.query.statsOnly = 'true';
    req.params.villageId = req.params.id;
    getPatientsByVillage(req, res);
  }
);

export default router;