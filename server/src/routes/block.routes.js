import express from 'express';
import {
  createBlock,
  registerBlock,
  getBlocks,
  getBlockById,
  updateBlock,
  deleteBlock,
  approveBlock,
  rejectBlock,
  assignBlockOfficer,
  removeBlockOfficer,
  getBlockStats,
  updateBlockStatus,
  searchBlocks,
  getBlockDashboard,
  getPendingApprovals
} from '../controllers/block.controller.js';
import auth  from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import {
  validateBlockRegistration,
  validateUpdateBlock,
  validateAssignBlockOfficer,
  validateApproveBlock,
  validateRejectBlock,
  validateStatusUpdate,
  validateBlockSearch
} from '../validation/block.validation.js';

const router = express.Router();

// Apply authentication to all routes
router.use(auth);

/**
 * Block Management Routes
 */

// GET /api/blocks - Get all blocks with pagination and filtering
router.get('/', getBlocks);

// POST /api/blocks - Create new block (Admin only)
router.post(
  '/',
  authorize(['admin']),
  validateBlockRegistration,
  createBlock
);

// POST /api/blocks/register - Register new block using token (Health Officials)
router.post(
  '/register',
  authorize(['health_official']),
  validateBlockRegistration,
  registerBlock
);

// POST /api/blocks/search - Advanced search (All authenticated users)
router.post(
  '/search',
  validateBlockSearch,
  searchBlocks
);

// GET /api/blocks/pending-approvals - Get pending approvals (District Officer, Admin)
router.get(
  '/pending-approvals',
  authorize(['admin', 'health_official'], { allowDistrictOfficer: true }),
  getPendingApprovals
);

// GET /api/blocks/:id - Get single block by ID
router.get('/:id', getBlockById);

// PUT /api/blocks/:id - Update block information
// Access: Block Officer, District Officer, Admin
router.put(
  '/:id',
  authorize(['admin', 'health_official'], { allowBlockOfficer: true, allowDistrictOfficer: true }),
  validateUpdateBlock,
  updateBlock
);

// DELETE /api/blocks/:id - Delete block (Admin, District Officer)
router.delete(
  '/:id',
  authorize(['admin', 'health_official'], { allowDistrictOfficer: true }),
  deleteBlock
);

// PATCH /api/blocks/:id/status - Update block status (Admin, District Officer)
router.patch(
  '/:id/status',
  authorize(['admin', 'health_official'], { allowDistrictOfficer: true }),
  validateStatusUpdate,
  updateBlockStatus
);

/**
 * Block Approval Routes
 */

// POST /api/blocks/:id/approve - Approve block registration (Admin, District Officer)
router.post(
  '/:id/approve',
  authorize(['admin', 'health_official'], { allowDistrictOfficer: true }),
  validateApproveBlock,
  approveBlock
);

// POST /api/blocks/:id/reject - Reject block registration (Admin, District Officer)
router.post(
  '/:id/reject',
  authorize(['admin', 'health_official'], { allowDistrictOfficer: true }),
  validateRejectBlock,
  rejectBlock
);

/**
 * Block Officer Management Routes
 */

// POST /api/blocks/:id/assign-officer - Assign block officer (Admin, District Officer)
router.post(
  '/:id/assign-officer',
  authorize(['admin', 'health_official'], { allowDistrictOfficer: true }),
  validateAssignBlockOfficer,
  assignBlockOfficer
);

// DELETE /api/blocks/:id/remove-officer - Remove block officer (Admin, District Officer)
router.delete(
  '/:id/remove-officer',
  authorize(['admin', 'health_official'], { allowDistrictOfficer: true }),
  removeBlockOfficer
);

/**
 * Block Analytics & Dashboard Routes
 */

// GET /api/blocks/:id/stats - Get block statistics
router.get('/:id/stats', getBlockStats);

// GET /api/blocks/:id/dashboard - Get block dashboard data
// Access: Block Officer, District Officer, Admin
router.get(
  '/:id/dashboard',
  authorize(['admin', 'health_official'], { allowBlockOfficer: true, allowDistrictOfficer: true }),
  getBlockDashboard
);

/**
 * Middleware to check block officer permissions
 * This middleware checks if the current user is the block officer for the requested block
 */
export const checkBlockOfficerPermission = async (req, res, next) => {
  try {
    const { id: blockId } = req.params;
    const userId = req.user._id;

    // Allow admin users to proceed without checking
    if (req.user.roleInfo.role === 'admin') {
      return next();
    }

    // Check if user is block officer for this block
    const Block = (await import('../models/block.model.js')).default;
    const block = await Block.findOne({
      _id: blockId,
      'blockOfficer.userId': userId
    });

    if (!block) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not the block officer for this block.'
      });
    }

    // Add block to request for use in controller
    req.block = block;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error checking block officer permissions'
    });
  }
};

/**
 * Middleware to check district officer permissions for block operations
 * This middleware checks if the current user is the district officer for the district containing the requested block
 */
export const checkDistrictOfficerForBlock = async (req, res, next) => {
  try {
    const { id: blockId } = req.params;
    const userId = req.user._id;

    // Allow admin users to proceed without checking
    if (req.user.roleInfo.role === 'admin') {
      return next();
    }

    // Get block with district information
    const Block = (await import('../models/block.model.js')).default;
    const District = (await import('../models/district.model.js')).default;
    
    const block = await Block.findById(blockId).populate('districtId');
    if (!block) {
      return res.status(404).json({
        success: false,
        message: 'Block not found'
      });
    }

    // Check if user is district officer for this block's district
    const district = await District.findOne({
      _id: block.districtId._id,
      'districtOfficer.userId': userId
    });

    if (!district) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not the district officer for this block\'s district.'
      });
    }

    // Add block and district to request for use in controller
    req.block = block;
    req.district = district;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error checking district officer permissions'
    });
  }
};

export default router;