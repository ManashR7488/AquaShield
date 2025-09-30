import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { verifyAccessToken, verifyRefreshToken, generateAccessToken, clearTokenCookies } from '../utils/jwt.js';
import { errorResponse } from '../utils/responseHelper.js';
import { log, warn, error, maskEmail, maskId } from '../utils/logger.js';

/**
 * Authentication middleware
 * Verifies JWT tokens from cookies and attaches user to request
 */
export const authenticate = async (req, res, next) => {
  try {
    log('🔐 Auth Middleware: Checking authentication for:', req.method, req.path);
    
    // Extract access token from cookies
    let accessToken = req.cookies?.accessToken;
    log('🍪 Access token from cookies:', accessToken ? 'Found' : 'Not found');
    
    // Fallback to Authorization header for API compatibility
    if (!accessToken) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        accessToken = authHeader.substring(7);
        log('📋 Access token from header:', accessToken ? 'Found' : 'Not found');
      }
    }
    
    if (!accessToken) {
      log('❌ No access token found');
      return errorResponse(res, 'Access token required', 401);
    }

    // Verify access token
    let decoded;
    try {
      decoded = verifyAccessToken(accessToken);
      log('✅ Access token verified for user:', maskId(decoded.userId));
    } catch (tokenError) {
      log('⏰ Access token expired or invalid, trying refresh token...');
      
      // Try to refresh token using refresh token from cookies
      const refreshToken = req.cookies?.refreshToken;
      
      if (!refreshToken) {
        log('❌ No refresh token found');
        return errorResponse(res, 'Authentication required', 401);
      }
      
      try {
        const refreshDecoded = verifyRefreshToken(refreshToken);
        log('✅ Refresh token verified, generating new access token');
        
        // Generate new access token
        const newAccessToken = generateAccessToken(refreshDecoded.userId, refreshDecoded.role);
        
        // Set new access token cookie
        res.cookie('accessToken', newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 15 * 60 * 1000 // 15 minutes
        });
        
        decoded = { userId: refreshDecoded.userId, role: refreshDecoded.role };
        log('🔄 New access token generated and set');
      } catch (refreshError) {
        log('❌ Refresh token invalid or expired');
        return errorResponse(res, 'Authentication required', 401);
      }
    }

    // Fetch user from database
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      log('❌ User not found in database:', maskId(decoded.userId));
      return errorResponse(res, 'User not found', 401);
    }
    
    if (user.status === 'suspended' || user.status === 'deleted') {
      log('❌ User account is suspended or deleted:', maskEmail(user.authentication.email));
      return errorResponse(res, 'Account is suspended', 403);
    }
    
    log('✅ User authenticated successfully:', {
      userId: maskId(user.userId),
      email: maskEmail(user.authentication.email),
      role: user.roleInfo.role,
      status: user.status
    });
    
    // Attach user to request
    req.user = user;
    next();
    
  } catch (error) {
    error('❌ Auth middleware error:', error);
    return errorResponse(res, 'Authentication failed', 500, error.message);
  }
};

/**
 * Authorization middleware to check if user has required role
 * @param {string|string[]} allowedRoles - Single role or array of allowed roles
 * @returns {Function} Express middleware function
 */
export const authorize = (allowedRoles) => {
  return (req, res, next) => {
    try {
      const user = req.user;
      
      if (!user) {
        return errorResponse(res, 'User not authenticated.', 401);
      }

      const userRole = user.roleInfo?.role;
      
      if (!userRole) {
        return errorResponse(res, 'User role not defined.', 403);
      }

      // Admin has access to everything
      if (userRole === 'admin') {
        return next();
      }

      // Check if user role is in allowed roles
      const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      
      if (!rolesArray.includes(userRole)) {
        return errorResponse(res, 'Access denied. Insufficient permissions.', 403);
      }

      next();
    } catch (error) {
      error('Authorization middleware error:', error);
      return errorResponse(res, 'Authorization failed.', 500, error.message);
    }
  };
};

/**
 * Optional authentication middleware - doesn't fail if no token is provided
 * Useful for routes where authentication enhances functionality but isn't required
 */
export const optionalAuthenticate = async (req, res, next) => {
  try {
    const accessToken = req.cookies?.accessToken;
    
    if (!accessToken) {
      req.user = null;
      return next();
    }

    try {
      const decoded = verifyAccessToken(accessToken);
      const user = await User.findById(decoded.userId).select('-authentication.password');
      
      if (user && user.status === 'active') {
        req.user = user;
      } else {
        req.user = null;
      }
    } catch (jwtError) {
      // If token is invalid or expired, just continue without user
      req.user = null;
    }

    next();
  } catch (error) {
    error('Optional authentication middleware error:', error);
    req.user = null;
    next();
  }
};

// Default export for backward compatibility
export default authenticate;