import express from 'express';
import {
  createObservation,
  getObservations,
  getObservationById,
  updateObservation,
  addFollowUp,
  resolveObservation,
  getObservationsByVillage,
  getObservationTrends,
  getCriticalObservations,
  generateObservationReport
} from '../controllers/healthObservation.controller.js';
import validationSchemas from '../validation/index.js';
import { validateBody, validateQuery, validateParams } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * Health Observation Management Routes
 */

// Create new health observation
router.post('/', 
  authorize(['asha_worker', 'health_official', 'admin']),
  validateBody(validationSchemas.healthObservation.create),
  asyncHandler(createObservation)
);

// Get all health observations (with filtering)
router.get('/',
  authorize(['asha_worker', 'volunteer', 'health_official', 'admin']),
  asyncHandler(getObservations)
);

// Get health observation by ID
router.get('/:id',
  authorize(['asha_worker', 'volunteer', 'health_official', 'admin']),
  asyncHandler(getObservationById)
);

// Update health observation
router.put('/:id',
  authorize(['asha_worker', 'health_official', 'admin']),
  validateBody(validationSchemas.healthObservation.update),
  asyncHandler(updateObservation)
);

/**
 * Follow-up Management
 */

// Add follow-up to observation
router.post('/:id/follow-up',
  authorize(['asha_worker', 'health_official', 'admin']),
  validateBody(validationSchemas.healthObservation.addFollowUp),
  asyncHandler(addFollowUp)
);

// Resolve observation
router.put('/:id/resolve',
  authorize(['asha_worker', 'health_official', 'admin']),
  asyncHandler(resolveObservation)
);

/**
 * Village and Geographic Routes
 */

// Get observations by village
router.get('/village/:villageId',
  authorize(['asha_worker', 'volunteer', 'health_official', 'admin']),
  asyncHandler(getObservationsByVillage)
);

// Get observation trends
router.get('/trends',
  authorize(['health_official', 'admin']),
  asyncHandler(getObservationTrends)
);

// Get observation trends for specific village
router.get('/trends/:villageId',
  authorize(['health_official', 'admin']),
  (req, res) => {
    // Add villageId to query and delegate to getObservationTrends
    req.query.villageId = req.params.villageId;
    getObservationTrends(req, res);
  }
);

// Get health trends for specific village
router.get('/health-trends/:villageId',
  authorize(['health_official', 'admin']),
  (req, res) => {
    // Add villageId to query and delegate to getObservationTrends
    req.query.villageId = req.params.villageId;
    req.query.healthTrends = 'true';
    getObservationTrends(req, res);
  }
);

// Get temporal trends (legacy endpoint for existing clients)
router.get('/trends/temporal',
  authorize(['health_official', 'admin']),
  asyncHandler(getObservationTrends)
);

// Delete observation
router.delete('/:id',
  authorize(['asha_worker', 'health_official', 'admin']),
  (req, res) => {
    // For now, return method not allowed - implement soft delete if needed
    res.status(405).json({
      success: false,
      message: 'Delete operation not implemented - use status update instead'
    });
  }
);

/**
 * Area and Geographic Routes (legacy support)
 */

// Get observations by area (legacy endpoint)
router.get('/area/:areaId',
  authorize(['asha_worker', 'volunteer', 'health_official', 'admin']),
  (req, res) => {
    // Delegate to getObservationsByVillage for now
    req.params.villageId = req.params.areaId;
    getObservationsByVillage(req, res);
  }
);

// Get observation patterns analysis (delegate to reports)
router.get('/patterns/analysis',
  authorize(['health_official', 'admin']),
  (req, res) => {
    // Delegate to generateObservationReport with pattern analysis flag
    req.query.analysisType = 'patterns';
    generateObservationReport(req, res);
  }
);

// Calculate health metrics (delegate to reports)
router.get('/metrics/calculate',
  authorize(['health_official', 'admin']),
  (req, res) => {
    // Delegate to generateObservationReport with metrics flag
    req.query.analysisType = 'metrics';
    generateObservationReport(req, res);
  }
);

/**
 * Reports and Analytics Routes
 */

// Generate observation report
router.get('/reports',
  authorize(['health_official', 'admin']),
  asyncHandler(generateObservationReport)
);

// Generate comprehensive health report (legacy endpoint)
router.get('/reports/comprehensive',
  authorize(['health_official', 'admin']),
  (req, res) => {
    // Delegate to generateObservationReport with comprehensive flag
    req.query.reportType = 'comprehensive';
    generateObservationReport(req, res);
  }
);

// Perform outbreak detection (delegate to reports)
router.get('/outbreak/detect',
  authorize(['health_official', 'admin']),
  (req, res) => {
    // Delegate to generateObservationReport with outbreak detection flag
    req.query.analysisType = 'outbreak';
    generateObservationReport(req, res);
  }
);

/**
 * Alert Routes
 */

// Get critical observations
router.get('/alerts/critical',
  authorize(['asha_worker', 'health_official', 'admin']),
  asyncHandler(getCriticalObservations)
);

export default router;