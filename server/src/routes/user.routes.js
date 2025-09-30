import express from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  verifyUser,
  updateUserRole,
  searchUsers,
  getUserStats,
  getProfile,
  updateProfile,
  changePassword
} from '../controllers/user.controller.js';
import auth from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import {
  validateCreateUser,
  validateUpdateUser,
  validateUserSearch,
  validateStatusUpdate,
  validateRoleUpdate,
  validateProfileUpdate,
  validatePasswordChange,
  validateVerifyUser
} from '../validation/user.validation.js';

const router = express.Router();

// Apply authentication to all routes
router.use(auth);

/**
 * Profile Management Routes (Available to all authenticated users)
 */

// GET /api/users/profile - Get current user profile
router.get('/profile', getProfile);

// PUT /api/users/profile - Update current user profile
router.put(
  '/profile',
  validateProfileUpdate,
  updateProfile
);

// PATCH /api/users/change-password - Change password
router.patch(
  '/change-password',
  validatePasswordChange,
  changePassword
);

/**
 * User Management Routes (Admin access required unless specified)
 */

// GET /api/users - Get all users with pagination (Admin only)
router.get(
  '/',
  authorize(['admin']),
  getUsers
);

// POST /api/users - Create new user (Admin only)
router.post(
  '/',
  authorize(['admin']),
  validateCreateUser,
  createUser
);

// POST /api/users/search - Search users (Admin full access, Health Officials limited)
router.post(
  '/search',
  authorize(['admin', 'health_official']),
  validateUserSearch,
  searchUsers
);

// GET /api/users/stats - Get user statistics (Admin only)
router.get(
  '/stats',
  authorize(['admin']),
  getUserStats
);

// GET /api/users/:id - Get single user by ID (Admin or own profile)
router.get('/:id', getUserById);

// PUT /api/users/:id - Update user (Admin or own profile)
router.put(
  '/:id',
  validateUpdateUser,
  updateUser
);

// DELETE /api/users/:id - Delete user (Admin only)
router.delete(
  '/:id',
  authorize(['admin']),
  deleteUser
);

/**
 * User Status & Role Management Routes (Admin only)
 */

// PATCH /api/users/:id/status - Update user status (Admin only)
router.patch(
  '/:id/status',
  authorize(['admin']),
  validateStatusUpdate,
  updateUserStatus
);

// PATCH /api/users/:id/verify - Verify user (Admin only)
router.patch(
  '/:id/verify',
  authorize(['admin']),
  validateVerifyUser,
  verifyUser
);

// PATCH /api/users/:id/role - Update user role (Admin only)
router.patch(
  '/:id/role',
  authorize(['admin']),
  validateRoleUpdate,
  updateUserRole
);

export default router;