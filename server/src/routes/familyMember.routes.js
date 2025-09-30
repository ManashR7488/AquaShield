import express from 'express';
import {
  getFamilyMembers,
  createFamilyMember,
  getFamilyMemberById,
  updateFamilyMember,
  deleteFamilyMember,
  linkExistingUser,
  getFamilyHealthSummary,
  getFamilyMembersByRelationship,
  updateFamilyMemberHealthProfile,
  getFamilyMembersByAge
} from '../controllers/familyMember.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import validate  from '../middleware/validate.js';
import {
  createFamilyMemberSchema,
  updateFamilyMemberSchema,
  linkUserSchema,
  queryFamilyMembersSchema,
  familyMemberIdSchema,
  updateHealthProfileSchema
} from '../validation/familyMember.validation.js';

const router = express.Router();

// Apply authentication and user authorization to all routes
router.use(authenticate);
router.use(authorize(['user']));

/**
 * @route   GET /api/family-members
 * @desc    Get all family members for the current user
 * @access  Private (User only)
 */
router.get('/', validate(queryFamilyMembersSchema, 'query'), getFamilyMembers);

/**
 * @route   POST /api/family-members
 * @desc    Create a new family member
 * @access  Private (User only)
 */
router.post('/', validate(createFamilyMemberSchema), createFamilyMember);

/**
 * @route   GET /api/family-members/health-summary
 * @desc    Get family health summary for the current user
 * @access  Private (User only)
 */
router.get('/health-summary', getFamilyHealthSummary);

/**
 * @route   GET /api/family-members/by-age
 * @desc    Get family members by age range
 * @access  Private (User only)
 */
router.get('/by-age', getFamilyMembersByAge);

/**
 * @route   GET /api/family-members/relationship/:relationship
 * @desc    Get family members by relationship type
 * @access  Private (User only)
 */
router.get('/relationship/:relationship', getFamilyMembersByRelationship);

/**
 * @route   GET /api/family-members/:id
 * @desc    Get a specific family member by ID
 * @access  Private (User only)
 */
router.get('/:id', validate(familyMemberIdSchema, 'params'), getFamilyMemberById);

/**
 * @route   PUT /api/family-members/:id
 * @desc    Update a family member
 * @access  Private (User only)
 */
router.put('/:id', 
  validate(familyMemberIdSchema, 'params'),
  validate(updateFamilyMemberSchema),
  updateFamilyMember
);

/**
 * @route   DELETE /api/family-members/:id
 * @desc    Delete a family member (soft delete)
 * @access  Private (User only)
 */
router.delete('/:id', validate(familyMemberIdSchema, 'params'), deleteFamilyMember);

/**
 * @route   POST /api/family-members/:id/link
 * @desc    Link an existing user to a family member
 * @access  Private (User only)
 */
router.post('/:id/link', 
  validate(familyMemberIdSchema, 'params'),
  validate(linkUserSchema),
  linkExistingUser
);

/**
 * @route   PUT /api/family-members/:id/health-profile
 * @desc    Update family member health profile
 * @access  Private (User only)
 */
router.put('/:id/health-profile', 
  validate(familyMemberIdSchema, 'params'),
  validate(updateHealthProfileSchema),
  updateFamilyMemberHealthProfile
);

/**
 * @route   GET /api/family-members/:id/health-records
 * @desc    Get health records for a specific family member
 * @access  Private (User only)
 */
router.get('/:id/health-records', validate(familyMemberIdSchema, 'params'), async (req, res) => {
  try {
    // This endpoint will be implemented when PersonalHealthRecord is created
    // For now, return a placeholder response
    res.status(501).json({
      success: false,
      message: 'Health records endpoint will be available after personal health record implementation',
      data: {
        healthRecords: [],
        message: 'Feature coming soon'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/family-members/:id/vaccinations
 * @desc    Get vaccination records for a specific family member
 * @access  Private (User only)
 */
router.get('/:id/vaccinations', validate(familyMemberIdSchema, 'params'), async (req, res) => {
  try {
    // This endpoint will be implemented when vaccination tracking is added
    // For now, return a placeholder response
    res.status(501).json({
      success: false,
      message: 'Vaccination records endpoint will be available after vaccination tracking implementation',
      data: {
        vaccinations: [],
        message: 'Feature coming soon'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;