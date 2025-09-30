import express from 'express';
import {
  createDistrict,
  getDistricts,
  getDistrictById,
  updateDistrict,
  deleteDistrict,
  assignDistrictOfficer,
  removeDistrictOfficer,
  generateBlockToken,
  getBlockTokens,
  revokeBlockToken,
  validateBlockToken,
  getDistrictStats,
  getDistrictDashboard,
  getDistrictBlocks,
  updateDistrictStatus,
  searchDistricts
} from '../controllers/district.controller.js';
import auth  from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import {
  validateCreateDistrict,
  validateUpdateDistrict,
  validateAssignOfficer,
  validateGenerateToken,
  validateTokenValidation,
  validateStatusUpdate,
  validateDistrictSearch
} from '../validation/district.validation.js';

const router = express.Router();

// Apply authentication to all routes
router.use(auth);

/**
 * District Management Routes
 */

// GET /api/districts - Get all districts with pagination and filtering
router.get('/', getDistricts);

// POST /api/districts - Create new district (Admin only)
router.post(
  '/',
  authorize(['admin']),
  validateCreateDistrict,
  createDistrict
);

// POST /api/districts/search - Advanced search (All authenticated users)
router.post(
  '/search',
  validateDistrictSearch,
  searchDistricts
);

// POST /api/districts/validate-token - Validate block registration token (Health Officials)
router.post(
  '/validate-token',
  authorize(['admin', 'health_official']),
  validateTokenValidation,
  validateBlockToken
);

// GET /api/districts/:id - Get single district by ID
router.get('/:id', getDistrictById);

// PUT /api/districts/:id - Update district (Admin only)
router.put(
  '/:id',
  authorize(['admin']),
  validateUpdateDistrict,
  updateDistrict
);

// DELETE /api/districts/:id - Delete district (Admin only)
router.delete(
  '/:id',
  authorize(['admin']),
  deleteDistrict
);

// PATCH /api/districts/:id/status - Update district status (Admin only)
router.patch(
  '/:id/status',
  authorize(['admin']),
  validateStatusUpdate,
  updateDistrictStatus
);

/**
 * District Officer Management Routes
 */

// POST /api/districts/:id/assign-officer - Assign district officer (Admin only)
router.post(
  '/:id/assign-officer',
  authorize(['admin']),
  validateAssignOfficer,
  assignDistrictOfficer
);

// DELETE /api/districts/:id/remove-officer - Remove district officer (Admin only)
router.delete(
  '/:id/remove-officer',
  authorize(['admin']),
  removeDistrictOfficer
);

/**
 * Block Token Management Routes
 */

// POST /api/districts/:id/blocks/token - Generate block registration token
// Access: Admin or District Officer of this district
router.post(
  '/:id/blocks/token',
  authorize(['admin', 'health_official'], { allowDistrictOfficer: true }),
  validateGenerateToken,
  generateBlockToken
);

// GET /api/districts/:id/blocks/tokens - Get block tokens for district
// Access: Admin or District Officer of this district
router.get(
  '/:id/blocks/tokens',
  authorize(['admin', 'health_official'], { allowDistrictOfficer: true }),
  getBlockTokens
);

// DELETE /api/districts/:id/blocks/tokens/:tokenId - Revoke block token
// Access: Admin or District Officer of this district
router.delete(
  '/:id/blocks/tokens/:tokenId',
  authorize(['admin', 'health_official'], { allowDistrictOfficer: true }),
  revokeBlockToken
);

/**
 * District Analytics & Dashboard Routes
 */

// GET /api/districts/:id/stats - Get district statistics
// Access: Admin or Health Officials
router.get(
  '/:id/stats',
  authorize(['admin', 'health_official']),
  getDistrictStats
);

// GET /api/districts/:id/dashboard - Get district dashboard data
// Access: Admin or District Officer of this district
router.get(
  '/:id/dashboard',
  authorize(['admin', 'health_official'], { allowDistrictOfficer: true }),
  getDistrictDashboard
);

// GET /api/districts/:id/blocks - Get blocks for a district
router.get('/:id/blocks', getDistrictBlocks);

/**
 * Middleware to check district officer permissions
 * This middleware checks if the current user is the district officer for the requested district
 */
export const checkDistrictOfficerPermission = async (req, res, next) => {
  try {
    const { id: districtId } = req.params;
    const userId = req.user._id;

    // Allow admin users to proceed without checking
    if (req.user.roleInfo.role === 'admin') {
      return next();
    }

    // Check if user is district officer for this district
    const District = (await import('../models/district.model.js')).default;
    const district = await District.findOne({
      _id: districtId,
      'districtOfficer.userId': userId
    });

    if (!district) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not the district officer for this district.'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error checking district officer permissions'
    });
  }
};

export default router;