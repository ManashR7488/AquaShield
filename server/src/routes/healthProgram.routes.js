import express from 'express';
const router = express.Router();
import Joi from 'joi';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validateBody, validateQuery, validateParams } from '../middleware/validate.js';
import {
  createHealthProgramSchema,
  updateHealthProgramSchema,
  queryHealthProgramsSchema,
  healthProgramParamsSchema
} from '../validation/healthProgram.validation.js';

import {
  createProgram,
  getPrograms,
  getProgramById,
  updateProgram,
  deleteProgram,
  enrollPatient,
  unenrollPatient,
  getEnrollmentsByProgram,
  getProgramsByVillage,
  getProgramStats
} from '../controllers/healthProgram.controller.js';

/**
 * Health Program Routes
 * Base path: /api/health-programs
 */

/**
 * @route   POST /api/health-programs
 * @desc    Create new health program
 * @access  Health Officials, Admin
 */
router.post(
  '/',
  authenticate,
  authorize(['health_official', 'admin']),
  validateBody(createHealthProgramSchema),
  createProgram
);

/**
 * @route   GET /api/health-programs
 * @desc    Get health programs with filtering and pagination
 * @access  All authenticated users
 */
router.get(
  '/',
  authenticate,
  validateQuery(queryHealthProgramsSchema),
  getPrograms
);

/**
 * @route   GET /api/health-programs/:id
 * @desc    Get single health program
 * @access  All authenticated users
 */
router.get(
  '/:id',
  authenticate,
  validateParams(healthProgramParamsSchema),
  getProgramById
);

/**
 * @route   PUT /api/health-programs/:id
 * @desc    Update health program
 * @access  Health Officials, Admin
 */
router.put(
  '/:id',
  authenticate,
  authorize(['health_official', 'admin']),
  validateParams(healthProgramParamsSchema),
  validateBody(updateHealthProgramSchema),
  updateProgram
);

/**
 * @route   DELETE /api/health-programs/:id
 * @desc    Delete health program (soft delete)
 * @access  Admin only
 */
router.delete(
  '/:id',
  authenticate,
  authorize(['admin']),
  validateParams(healthProgramParamsSchema),
  deleteProgram
);

/**
 * @route   POST /api/health-programs/:id/enroll
 * @desc    Enroll patient in health program
 * @access  ASHA Workers, Health Officials, Admin
 */
router.post(
  '/:id/enroll',
  authenticate,
  authorize(['asha_worker', 'health_official', 'admin']),
  validateParams(healthProgramParamsSchema),
  enrollPatient
);

/**
 * @route   DELETE /api/health-programs/:id/enroll/:patientId
 * @desc    Unenroll patient from health program
 * @access  ASHA Workers, Health Officials, Admin
 */
router.delete(
  '/:id/enroll/:patientId',
  authenticate,
  authorize(['asha_worker', 'health_official', 'admin']),
  validateParams(healthProgramParamsSchema),
  unenrollPatient
);

/**
 * @route   GET /api/health-programs/:id/enrollments
 * @desc    Get program enrollments
 * @access  Health Officials, Admin
 */
router.get(
  '/:id/enrollments',
  authenticate,
  authorize(['health_official', 'admin']),
  validateParams(healthProgramParamsSchema),
  getEnrollmentsByProgram
);

/**
 * @route   GET /api/health-programs/village/:villageId
 * @desc    Get programs available for specific village
 * @access  All authenticated users
 */
router.get(
  '/village/:villageId',
  authenticate,
  validateParams(Joi.object({ villageId: Joi.string().required() })),
  getProgramsByVillage
);

/**
 * @route   GET /api/health-programs/stats/summary
 * @desc    Get health program statistics
 * @access  Health Officials, Admin
 */
router.get(
  '/stats/summary',
  authenticate,
  authorize(['health_official', 'admin']),
  getProgramStats
);

export default router;