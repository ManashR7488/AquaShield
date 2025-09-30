import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  signup,
  login,
  logout,
  refreshToken,
  getCurrentUser,
  changePassword,
  verifyEmail,
  verifyPhone,
  updateProfile // Add this import
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { successResponse, errorResponse } from '../utils/responseHelper.js';
import {
  signupSchema,
  loginSchema,
  changePasswordSchema,
  verifyEmailSchema,
  verifyPhoneSchema,
  profileUpdateSchema // Add this import
} from '../validation/auth.validation.js';

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth attempts per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const refreshLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Allow more refresh attempts
  message: {
    success: false,
    message: 'Too many refresh attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Authentication Routes
 * All routes for user authentication, registration, and account management
 */

// Public routes (no authentication required)

/**
 * POST /api/auth/signup
 * Register a new user
 */
router.post('/signup', validateBody(signupSchema), signup);

/**
 * POST /api/auth/login
 * Authenticate user and create session
 */
router.post('/login', validateBody(loginSchema), login);

/**
 * POST /api/auth/logout
 * Logout user and clear session cookies
 */
router.post('/logout', logout);

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', refreshToken);

/**
 * POST /api/auth/verify-email
 * Verify user email address
 */
router.post('/verify-email', validateBody(verifyEmailSchema), verifyEmail);

// Protected routes (authentication required)

/**
 * GET /api/auth/me
 * Get current authenticated user profile
 */
router.get('/me', authenticate, getCurrentUser);

/**
 * PUT /api/auth/change-password
 * Change user password
 */
router.put('/change-password', authenticate, validateBody(changePasswordSchema), changePassword);

/**
 * POST /api/auth/verify-phone
 * Verify user phone number with OTP
 */
router.post('/verify-phone', authenticate, validateBody(verifyPhoneSchema), verifyPhone);

// Add profile update route
/**
 * PUT /api/auth/profile
 * Update user profile information
 */
router.put('/profile', authenticate, validateBody(profileUpdateSchema), updateProfile);

// Add profile completion check route
/**
 * GET /api/auth/profile-completion
 * Get profile completion status
 */
router.get('/profile-completion', authenticate, (req, res) => {
  try {
    const user = req.user;
    const completionPercentage = user.calculateProfileCompletion();
    
    return successResponse(res, {
      completionPercentage,
      missingFields: user.profileCompletion.missingFields,
      completedSections: user.profileCompletion.completedSections
    }, 'Profile completion status retrieved');
  } catch (error) {
    return errorResponse(res, 'Failed to get profile completion status', 500);
  }
});

// Health check route for authentication service
/**
 * GET /api/auth/health
 * Health check for authentication service
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'Authentication service is running',
    timestamp: new Date().toISOString(),
    service: 'auth'
  });
});

export default router;