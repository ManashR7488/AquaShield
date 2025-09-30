import crypto from 'crypto';
import District from '../models/district.model.js';

/**
 * Generates a secure random token for block registration
 * Format: BLOCK-YYYYMMDD-XXXXXXXXXXXXXXXX (32 characters total)
 */
export const generateBlockToken = async () => {
  try {
    const currentDate = new Date();
    const dateStr = currentDate.toISOString().slice(0, 10).replace(/-/g, '');
    
    let token;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 100;
    
    while (!isUnique && attempts < maxAttempts) {
      // Generate 16 random characters (alphanumeric uppercase)
      const randomPart = crypto.randomBytes(8).toString('hex').toUpperCase();
      token = `BLOCK-${dateStr}-${randomPart}`;
      
      // Check if token already exists
      const existingToken = await District.findOne({
        'blockRegistration.registrationTokens.token': token
      });
      
      if (!existingToken) {
        isUnique = true;
      }
      
      attempts++;
    }
    
    if (!isUnique) {
      throw new Error('Unable to generate unique token after maximum attempts');
    }
    
    return token;
    
  } catch (error) {
    throw new Error(`Error generating block token: ${error.message}`);
  }
};

/**
 * Generates a secure API key for external integrations
 * Format: API-YYYYMMDD-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX (48 characters total)
 */
export const generateApiKey = () => {
  try {
    const currentDate = new Date();
    const dateStr = currentDate.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Generate 32 random characters
    const randomPart = crypto.randomBytes(16).toString('hex').toUpperCase();
    
    return `API-${dateStr}-${randomPart}`;
    
  } catch (error) {
    throw new Error(`Error generating API key: ${error.message}`);
  }
};

/**
 * Generates a password reset token
 * Format: RST-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX (36 characters total)
 */
export const generatePasswordResetToken = () => {
  try {
    // Generate 32 random characters
    const randomPart = crypto.randomBytes(16).toString('hex').toUpperCase();
    
    return `RST-${randomPart}`;
    
  } catch (error) {
    throw new Error(`Error generating password reset token: ${error.message}`);
  }
};

/**
 * Generates an email verification token
 * Format: VRF-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX (36 characters total)
 */
export const generateEmailVerificationToken = () => {
  try {
    // Generate 32 random characters
    const randomPart = crypto.randomBytes(16).toString('hex').toUpperCase();
    
    return `VRF-${randomPart}`;
    
  } catch (error) {
    throw new Error(`Error generating email verification token: ${error.message}`);
  }
};

/**
 * Generates a session token
 * Format: SES-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX (36 characters total)
 */
export const generateSessionToken = () => {
  try {
    // Generate 32 random characters
    const randomPart = crypto.randomBytes(16).toString('hex').toUpperCase();
    
    return `SES-${randomPart}`;
    
  } catch (error) {
    throw new Error(`Error generating session token: ${error.message}`);
  }
};

/**
 * Generates a temporary access token
 * Format: TMP-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX (36 characters total)
 */
export const generateTempAccessToken = () => {
  try {
    // Generate 32 random characters
    const randomPart = crypto.randomBytes(16).toString('hex').toUpperCase();
    
    return `TMP-${randomPart}`;
    
  } catch (error) {
    throw new Error(`Error generating temporary access token: ${error.message}`);
  }
};

/**
 * Generates an invitation token for user registration
 * Format: INV-YYYYMMDD-XXXXXXXXXXXXXXXX (32 characters total)
 */
export const generateInvitationToken = () => {
  try {
    const currentDate = new Date();
    const dateStr = currentDate.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Generate 16 random characters
    const randomPart = crypto.randomBytes(8).toString('hex').toUpperCase();
    
    return `INV-${dateStr}-${randomPart}`;
    
  } catch (error) {
    throw new Error(`Error generating invitation token: ${error.message}`);
  }
};

/**
 * Generates a file upload token
 * Format: UPL-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX (36 characters total)
 */
export const generateUploadToken = () => {
  try {
    // Generate 32 random characters
    const randomPart = crypto.randomBytes(16).toString('hex').toUpperCase();
    
    return `UPL-${randomPart}`;
    
  } catch (error) {
    throw new Error(`Error generating upload token: ${error.message}`);
  }
};

/**
 * Generates an OTP (One Time Password)
 * Returns a 6-digit numeric OTP
 */
export const generateOTP = () => {
  try {
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp.toString();
    
  } catch (error) {
    throw new Error(`Error generating OTP: ${error.message}`);
  }
};

/**
 * Generates an alphanumeric OTP
 * Returns an 8-character alphanumeric OTP
 */
export const generateAlphanumericOTP = () => {
  try {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let otp = '';
    
    for (let i = 0; i < 8; i++) {
      otp += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return otp;
    
  } catch (error) {
    throw new Error(`Error generating alphanumeric OTP: ${error.message}`);
  }
};

/**
 * Generates a secure random string of specified length
 */
export const generateSecureRandomString = (length = 32) => {
  try {
    const bytes = Math.ceil(length / 2);
    const randomString = crypto.randomBytes(bytes).toString('hex').toUpperCase();
    
    return randomString.substring(0, length);
    
  } catch (error) {
    throw new Error(`Error generating secure random string: ${error.message}`);
  }
};

/**
 * Validates block registration token format
 */
export const validateBlockToken = (token) => {
  const pattern = /^BLOCK-\d{8}-[A-F0-9]{16}$/;
  return pattern.test(token);
};

/**
 * Validates API key format
 */
export const validateApiKey = (apiKey) => {
  const pattern = /^API-\d{8}-[A-F0-9]{32}$/;
  return pattern.test(apiKey);
};

/**
 * Validates password reset token format
 */
export const validatePasswordResetToken = (token) => {
  const pattern = /^RST-[A-F0-9]{32}$/;
  return pattern.test(token);
};

/**
 * Validates email verification token format
 */
export const validateEmailVerificationToken = (token) => {
  const pattern = /^VRF-[A-F0-9]{32}$/;
  return pattern.test(token);
};

/**
 * Validates OTP format (6 digits)
 */
export const validateOTP = (otp) => {
  const pattern = /^\d{6}$/;
  return pattern.test(otp);
};

/**
 * Validates alphanumeric OTP format (8 characters)
 */
export const validateAlphanumericOTP = (otp) => {
  const pattern = /^[A-Z0-9]{8}$/;
  return pattern.test(otp);
};

/**
 * Extracts date from token if it contains date information
 */
export const extractDateFromToken = (token) => {
  try {
    const parts = token.split('-');
    
    if (parts.length >= 2 && parts[1].length === 8) {
      const dateStr = parts[1];
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      
      return new Date(`${year}-${month}-${day}`);
    }
    
    return null;
    
  } catch (error) {
    return null;
  }
};

/**
 * Generates multiple tokens of the same type
 */
export const generateBatchTokens = async (type, count) => {
  const tokens = [];
  
  for (let i = 0; i < count; i++) {
    let token;
    
    switch (type) {
      case 'block':
        token = await generateBlockToken();
        break;
      case 'api':
        token = generateApiKey();
        break;
      case 'reset':
        token = generatePasswordResetToken();
        break;
      case 'verification':
        token = generateEmailVerificationToken();
        break;
      case 'invitation':
        token = generateInvitationToken();
        break;
      case 'upload':
        token = generateUploadToken();
        break;
      case 'otp':
        token = generateOTP();
        break;
      case 'alphanumeric-otp':
        token = generateAlphanumericOTP();
        break;
      default:
        throw new Error(`Invalid token type: ${type}`);
    }
    
    tokens.push(token);
    
    // Small delay for block tokens to ensure uniqueness
    if (type === 'block') {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
  
  return tokens;
};

/**
 * Checks if a token has expired based on its embedded date and validity period
 */
export const isTokenExpired = (token, validityDays) => {
  try {
    const tokenDate = extractDateFromToken(token);
    
    if (!tokenDate) {
      // If no date in token, assume it's valid for now
      return false;
    }
    
    const currentDate = new Date();
    const expiryDate = new Date(tokenDate);
    expiryDate.setDate(expiryDate.getDate() + validityDays);
    
    return currentDate > expiryDate;
    
  } catch (error) {
    return true; // Assume expired if error in parsing
  }
};

/**
 * Generates a hash of a token for secure storage
 */
export const hashToken = (token) => {
  try {
    return crypto.createHash('sha256').update(token).digest('hex');
  } catch (error) {
    throw new Error(`Error hashing token: ${error.message}`);
  }
};

/**
 * Verifies a token against its hash
 */
export const verifyTokenHash = (token, hash) => {
  try {
    const tokenHash = hashToken(token);
    return tokenHash === hash;
  } catch (error) {
    return false;
  }
};

/**
 * Generates token with custom prefix and length
 */
export const generateCustomToken = (prefix, length = 16) => {
  try {
    if (!prefix || prefix.length > 10) {
      throw new Error('Prefix must be provided and not exceed 10 characters');
    }
    
    if (length < 8 || length > 64) {
      throw new Error('Length must be between 8 and 64 characters');
    }
    
    const randomPart = generateSecureRandomString(length);
    
    return `${prefix.toUpperCase()}-${randomPart}`;
    
  } catch (error) {
    throw new Error(`Error generating custom token: ${error.message}`);
  }
};

export default {
  generateBlockToken,
  generateApiKey,
  generatePasswordResetToken,
  generateEmailVerificationToken,
  generateSessionToken,
  generateTempAccessToken,
  generateInvitationToken,
  generateUploadToken,
  generateOTP,
  generateAlphanumericOTP,
  generateSecureRandomString,
  validateBlockToken,
  validateApiKey,
  validatePasswordResetToken,
  validateEmailVerificationToken,
  validateOTP,
  validateAlphanumericOTP,
  extractDateFromToken,
  generateBatchTokens,
  isTokenExpired,
  hashToken,
  verifyTokenHash,
  generateCustomToken
};