import jwt from 'jsonwebtoken';
import { log, warn, error, maskEmail, maskId } from './logger.js';

/**
 * JWT Utility Functions
 * Provides JWT token generation, validation, and cookie management for secure authentication
 */

const commonOpts = { 
  issuer: 'health-surveillance-system', 
  audience: 'health-surveillance-client' 
};

/**
 * Generate access token
 * @param {string} userId - User ID
 * @param {string} role - User role
 * @param {string} expiresIn - Token expiry (default: 15m)
 * @returns {string} JWT access token
 */
export const generateAccessToken = (userId, role, expiresIn = '15m') => {
  try {
    log('🎫 Generating access token for:', { userId: maskId(userId), role, expiresIn });
    
    const payload = {
      userId,
      role,
      type: 'access'
    };
    
    const token = jwt.sign(payload, process.env.JWT_SECRET, { ...commonOpts, expiresIn });
    log('✅ Access token generated successfully');
    
    return token;
  } catch (error) {
    error('❌ Access token generation failed:', error);
    throw error;
  }
};

/**
 * Generate refresh token
 * @param {string} userId - User ID
 * @param {string} role - User role
 * @param {string} expiresIn - Token expiry (default: 7d)
 * @returns {string} JWT refresh token
 */
export const generateRefreshToken = (userId, role, expiresIn = '7d') => {
  try {
    log('🎫 Generating refresh token for:', { userId: maskId(userId), role, expiresIn });
    
    const payload = {
      userId,
      role,
      type: 'refresh'
    };
    
    const token = jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, { ...commonOpts, expiresIn });
    log('✅ Refresh token generated successfully');
    
    return token;
  } catch (error) {
    error('❌ Refresh token generation failed:', error);
    throw error;
  }
};

/**
 * Generate both access and refresh tokens
 * @param {string} userId - User ID
 * @param {string} role - User role
 * @param {string} accessExpiresIn - Access token expiration (default: 15m)
 * @param {string} refreshExpiresIn - Refresh token expiration (default: 7d)
 * @returns {Object} Object containing both tokens
 */
export const generateTokenPair = (userId, role, accessExpiresIn = '15m', refreshExpiresIn = '7d') => {
  try {
    log('🎫 Generating token pair for:', { userId: maskId(userId), role, accessExpiresIn, refreshExpiresIn });
    
    const accessToken = generateAccessToken(userId, role, accessExpiresIn);
    const refreshToken = generateRefreshToken(userId, role, refreshExpiresIn);

    log('✅ Token pair generated successfully');
    
    return {
      accessToken,
      refreshToken
    };
  } catch (error) {
    error('❌ Token pair generation failed:', error);
    throw error;
  }
};

/**
 * Verify JWT access token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export const verifyAccessToken = (token) => {
  try {
    log('🔍 Verifying access token...');
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'health-surveillance-system',
      audience: 'health-surveillance-client'
    });

    if (decoded.type !== 'access') {
      error('❌ Invalid token type - expected access, got:', decoded.type);
      throw new Error('Invalid token type');
    }

    log('✅ Access token verified successfully:', { userId: maskId(decoded.userId), role: decoded.role });
    return decoded;
  } catch (error) {
    error('❌ Access token verification failed:', error.message);
    throw new Error(`Access token verification failed: ${error.message}`);
  }
};

/**
 * Verify JWT refresh token
 * @param {string} token - JWT refresh token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export const verifyRefreshToken = (token) => {
  try {
    log('🔍 Verifying refresh token...');
    
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
      issuer: 'health-surveillance-system',
      audience: 'health-surveillance-client'
    });

    if (decoded.type !== 'refresh') {
      error('❌ Invalid token type - expected refresh, got:', decoded.type);
      throw new Error('Invalid token type');
    }

    log('✅ Refresh token verified successfully:', { userId: maskId(decoded.userId) });
    return decoded;
  } catch (error) {
    error('❌ Refresh token verification failed:', error.message);
    throw new Error(`Refresh token verification failed: ${error.message}`);
  }
};

/**
 * Set authentication cookies in response
 * @param {Object} res - Express response object
 * @param {string} accessToken - JWT access token
 * @param {string} refreshToken - JWT refresh token
 * @param {boolean} rememberMe - Whether to use extended expiry
 */
export const setTokenCookies = (res, accessToken, refreshToken, rememberMe = false) => {
  try {
    log('🍪 Setting authentication cookies:', { rememberMe });
    
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieSecure = process.env.COOKIE_SECURE === 'true' || isProduction;
    const cookieSameSite = process.env.COOKIE_SAMESITE || (isProduction ? 'lax' : 'lax');
    const cookieDomain = process.env.COOKIE_DOMAIN || undefined;
    
    const baseCookieOptions = {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: cookieSameSite,
      path: '/',
      ...(cookieDomain && { domain: cookieDomain })
    };
    
    log('🍪 Cookie options:', baseCookieOptions);
    
    // Access token cookie (15 minutes)
    res.cookie('accessToken', accessToken, {
      ...baseCookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    // Refresh token cookie (7 days or 30 days for remember me)
    const refreshMaxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
    res.cookie('refreshToken', refreshToken, {
      ...baseCookieOptions,
      maxAge: refreshMaxAge,
    });

    // Authentication status cookie (for client-side auth checks)
    res.cookie('isAuthenticated', 'true', {
      ...baseCookieOptions,
      httpOnly: false, // Accessible to client-side JavaScript
      maxAge: refreshMaxAge,
    });
    
    log('✅ Authentication cookies set successfully');
  } catch (error) {
    error('❌ Failed to set authentication cookies:', error);
    throw error;
  }
};

/**
 * Clear authentication cookies from response
 * @param {Object} res - Express response object
 */
export const clearTokenCookies = (res) => {
  try {
    log('🍪 Clearing authentication cookies...');
    
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieSecure = process.env.COOKIE_SECURE === 'true' || isProduction;
    const cookieSameSite = process.env.COOKIE_SAMESITE || (isProduction ? 'lax' : 'lax');
    const cookieDomain = process.env.COOKIE_DOMAIN || undefined;
    
    const cookieOptions = {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: cookieSameSite,
      path: '/',
      ...(cookieDomain && { domain: cookieDomain })
    };

    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);
    res.clearCookie('isAuthenticated', {
      ...cookieOptions,
      httpOnly: false
    });
    
    log('✅ Authentication cookies cleared successfully');
  } catch (error) {
    error('❌ Failed to clear authentication cookies:', error);
    throw error;
  }
};

/**
 * Extract token from request cookies
 * @param {Object} req - Express request object
 * @returns {Object} Object containing access and refresh tokens
 */
export const extractTokensFromRequest = (req) => {
  try {
    log('🔍 Extracting tokens from request cookies...');
    
    const tokens = {
      accessToken: req.cookies?.accessToken,
      refreshToken: req.cookies?.refreshToken
    };
    
    log('🔍 Extracted tokens:', { 
      hasAccessToken: !!tokens.accessToken, 
      hasRefreshToken: !!tokens.refreshToken 
    });
    
    return tokens;
  } catch (error) {
    error('❌ Failed to extract tokens from request:', error);
    return {
      accessToken: null,
      refreshToken: null
    };
  }
};

/**
 * Get token expiry date
 * @param {string} token - JWT token
 * @returns {Date|null} Expiry date or null if invalid
 */
export const getTokenExpiry = (token) => {
  try {
    log('🔍 Getting token expiry...');
    
    const decoded = jwt.decode(token);
    if (decoded && decoded.exp) {
      const expiryDate = new Date(decoded.exp * 1000);
      log('✅ Token expiry retrieved:', expiryDate.toISOString());
      return expiryDate;
    }
    
    log('❌ No expiry found in token');
    return null;
  } catch (error) {
    error('❌ Failed to get token expiry:', error);
    return null;
  }
};

/**
 * Check if token is expired
 * @param {string} token - JWT token
 * @returns {boolean} True if expired, false otherwise
 */
export const isTokenExpired = (token) => {
  try {
    log('⏰ Checking if token is expired...');
    
    const expiry = getTokenExpiry(token);
    if (!expiry) {
      log('❌ Token has no expiry or is invalid - considering expired');
      return true;
    }
    
    const isExpired = Date.now() >= expiry.getTime();
    log('⏰ Token expiry check:', { isExpired, expiryTime: expiry.toISOString() });
    
    return isExpired;
  } catch (error) {
    error('❌ Failed to check token expiry:', error);
    return true;
  }
};

/**
 * Get token time to live in seconds
 * @param {string} token - JWT token
 * @returns {number} TTL in seconds, -1 if expired or invalid
 */
export const getTokenTTL = (token) => {
  try {
    log('⏰ Getting token TTL...');
    
    const expiry = getTokenExpiry(token);
    if (!expiry) {
      log('❌ No expiry found - TTL is -1');
      return -1;
    }
    
    const ttl = Math.floor((expiry.getTime() - Date.now()) / 1000);
    const result = ttl > 0 ? ttl : -1;
    
    log('⏰ Token TTL calculated:', { ttl, result });
    return result;
  } catch (error) {
    error('❌ Failed to get token TTL:', error);
    return -1;
  }
};

/**
 * Generate email verification token
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @returns {string} Email verification token
 */
export const generateEmailVerificationToken = (userId, email) => {
  const payload = {
    userId,
    email,
    type: 'email_verification',
    iat: Math.floor(Date.now() / 1000)
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '24h',
    issuer: 'health-surveillance-system',
    audience: 'health-surveillance-client'
  });
};

/**
 * Generate password reset token
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @returns {string} Password reset token
 */
export const generatePasswordResetToken = (userId, email) => {
  const payload = {
    userId,
    email,
    type: 'password_reset',
    iat: Math.floor(Date.now() / 1000)
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '1h',
    issuer: 'health-surveillance-system',
    audience: 'health-surveillance-client'
  });
};

/**
 * Verify email verification token
 * @param {string} token - Email verification token
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export const verifyEmailVerificationToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'health-surveillance-system',
      audience: 'health-surveillance-client'
    });

    if (decoded.type !== 'email_verification') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    throw new Error(`Email verification token verification failed: ${error.message}`);
  }
};

/**
 * Verify password reset token
 * @param {string} token - Password reset token
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export const verifyPasswordResetToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'health-surveillance-system',
      audience: 'health-surveillance-client'
    });

    if (decoded.type !== 'password_reset') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    throw new Error(`Password reset token verification failed: ${error.message}`);
  }
};