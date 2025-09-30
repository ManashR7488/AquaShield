import express from 'express';
import {
  createObservation,
  getObservations,
  getObservationById,
  updateObservation,
  escalateObservation,
  addFollowUp,
  getObservationsByArea,
  getObservationPatterns,
  generateCommunityReport
} from '../controllers/communityObservation.controller.js';
import CommunityObservation from '../models/communityObservation.model.js';
import { successResponse, errorResponse } from '../utils/responseHelper.js';
import validationSchemas from '../validation/index.js';
import { validateBody, validateQuery, validateParams } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * Community Observation Management Routes
 */

// Create new community observation
router.post('/', 
  authorize(['volunteer', 'asha_worker', 'health_official', 'admin']),
  validateBody(validationSchemas.communityObservation.create),
  asyncHandler(createObservation)
);

// Get all community observations (with filtering)
router.get('/',
  authorize(['volunteer', 'asha_worker', 'health_official', 'admin']),
  asyncHandler(getObservations)
);

// Get community observation by ID
router.get('/:id',
  authorize(['volunteer', 'asha_worker', 'health_official', 'admin']),
  asyncHandler(getObservationById)
);

// Update community observation
router.put('/:id',
  authorize(['volunteer', 'asha_worker', 'health_official', 'admin']),
  validateBody(validationSchemas.communityObservation.update),
  asyncHandler(updateObservation)
);

/**
 * Escalation Management
 */

// Escalate observation to higher authority
router.post('/:id/escalate',
  authorize(['volunteer', 'asha_worker', 'health_official', 'admin']),
  validateBody(validationSchemas.communityObservation.escalate),
  asyncHandler(escalateObservation)
);

/**
 * Follow-up Management
 */

// Add follow-up to observation
router.post('/:id/follow-up',
  authorize(['asha_worker', 'health_official', 'admin']),
  validateBody(validationSchemas.communityObservation.addFollowUp),
  asyncHandler(addFollowUp)
);

/**
 * Area and Geographic Routes
 */

// Get observations by area
router.get('/area/:areaId',
  authorize(['volunteer', 'asha_worker', 'health_official', 'admin']),
  asyncHandler(getObservationsByArea)
);

/**
 * Analysis and Reporting Routes
 */

// Get observation patterns analysis
router.get('/patterns/analysis',
  authorize(['asha_worker', 'health_official', 'admin']),
  asyncHandler(getObservationPatterns)
);

// Generate community report
router.get('/reports/community',
  authorize(['asha_worker', 'health_official', 'admin']),
  asyncHandler(generateCommunityReport)
);

/**
 * Statistics Routes
 */

// Get community observation statistics by village
router.get('/stats/:villageId',
  authorize(['asha_worker', 'health_official', 'admin']),
  asyncHandler(async (req, res) => {
    try {
      const { villageId } = req.params;
      
      // Get community observation statistics for the village
      const stats = await CommunityObservation.aggregate([
        { $match: { 'location.villageId': villageId } },
        {
          $group: {
            _id: null,
            totalObservations: { $sum: 1 },
            byType: {
              $push: {
                type: '$observationType',
                severity: '$severity',
                status: '$status'
              }
            },
            bySeverity: {
              $addToSet: '$severity'
            },
            byStatus: {
              $addToSet: '$status'
            },
            affectedPopulation: {
              $sum: { $ifNull: ['$affectedPopulation', 0] }
            }
          }
        },
        {
          $project: {
            _id: 0,
            totalObservations: 1,
            affectedPopulation: 1,
            typeStats: {
              $arrayToObject: {
                $map: {
                  input: { $setUnion: [{ $map: { input: '$byType', as: 'item', in: '$$item.type' } }] },
                  as: 'type',
                  in: {
                    k: '$$type',
                    v: {
                      count: {
                        $size: {
                          $filter: {
                            input: '$byType',
                            cond: { $eq: ['$$this.type', '$$type'] }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            severityStats: {
              $arrayToObject: {
                $map: {
                  input: '$bySeverity',
                  as: 'severity',
                  in: {
                    k: '$$severity',
                    v: {
                      count: {
                        $size: {
                          $filter: {
                            input: '$byType',
                            cond: { $eq: ['$$this.severity', '$$severity'] }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            statusStats: {
              $arrayToObject: {
                $map: {
                  input: '$byStatus',
                  as: 'status',
                  in: {
                    k: '$$status',
                    v: {
                      count: {
                        $size: {
                          $filter: {
                            input: '$byType',
                            cond: { $eq: ['$$this.status', '$$status'] }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      ]);

      const result = stats[0] || {
        totalObservations: 0,
        affectedPopulation: 0,
        typeStats: {},
        severityStats: {},
        statusStats: {}
      };

      return successResponse(res, {
        villageId,
        stats: result,
        message: 'Community observation statistics retrieved successfully'
      });

    } catch (error) {
      console.error('Error fetching community observation stats:', error);
      return errorResponse(res, 'Failed to fetch community observation statistics', 500);
    }
  })
);

export default router;