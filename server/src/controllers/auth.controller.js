import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/user.model.js';
import { generateTokenPair, setTokenCookies, clearTokenCookies, verifyRefreshToken, generateAccessToken } from '../utils/jwt.js';
import { successResponse, errorResponse, createdResponse } from '../utils/responseHelper.js';
import { preprocessPhoneNumber } from '../validation/auth.validation.js';
import { log, warn, error, maskEmail, maskId } from '../utils/logger.js';

/**
 * Authentication Controller
 * Handles user registration, login, logout, and token management with secure JWT + cookie implementation
 */

// Helper function for role-based hierarchy
const getHierarchyLevel = (role) => {
  const hierarchyMap = {
    admin: 'national',
    health_official: 'district',
    asha_worker: 'village',
    volunteer: 'village',
    community_member: 'village',
    user: 'village'
  };
  return hierarchyMap[role] || 'village';
};

// Helper function to mask phone numbers for logging
const maskPhone = (phone) => {
  if (!phone) return 'undefined';
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length >= 10) {
    return cleanPhone.substring(0, 2) + '***' + cleanPhone.substring(cleanPhone.length - 2);
  }
  return '***';
};

// Helper function for role-based permissions
/**
 * Get default permissions for a role
 * @param {string} role - User role
 * @returns {Array} Default permissions array
 */
const getDefaultPermissions = (role) => {
  const permissions = {
    admin: ['all'],
    health_official: ['read', 'write', 'report', 'analyze'],
    asha_worker: ['read', 'write', 'report'],
    volunteer: ['read', 'write'],
    community_member: ['read'],
    user: ['read']
  };

  return permissions[role] || ['read'];
};

/**
 * User Registration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
// Update signup function to handle minimal data
export const signup = async (req, res) => {
  try {
    // Enhanced logging for signup request
    log('🔄 Auth: Signup request received', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });

    log('📋 Auth: Request data structure:', {
      personalInfo: req.body.personalInfo,
      authentication: { 
        email: maskEmail(req.body.authentication?.email),
        phone: req.body.authentication?.phone ? maskPhone(req.body.authentication.phone) : 'undefined',
        username: req.body.authentication?.username,
        password: '[HIDDEN]' 
      },
      roleInfo: req.body.roleInfo,
      contactInfo: req.body.contactInfo,
      hasPreferences: !!req.body.preferences,
      termsAccepted: req.body.termsAccepted,
      privacyPolicyAccepted: req.body.privacyPolicyAccepted
    });

    // Validate database connection
    if (mongoose.connection.readyState !== 1) {
      error('💥 Auth: Database connection not available');
      return errorResponse(res, 'Database connection error. Please try again later.', 503);
    }

    const {
      personalInfo,
      authentication,
      roleInfo,
      contactInfo,
      preferences,
      termsAccepted,
      privacyPolicyAccepted
    } = req.body;

    // Enhanced validation of required sections
    const missingFields = [];
    if (!personalInfo) missingFields.push('personalInfo');
    if (!authentication) missingFields.push('authentication');
    if (!roleInfo) missingFields.push('roleInfo'); 
    if (!contactInfo) missingFields.push('contactInfo');
    
    if (missingFields.length > 0) {
      error('❌ Auth: Missing required sections:', missingFields);
      return errorResponse(res, `Missing required information sections: ${missingFields.join(', ')}`, 400, {
        missingFields,
        expectedSections: ['personalInfo', 'authentication', 'roleInfo', 'contactInfo']
      });
    }

    // Validate required fields within sections
    const requiredFieldsValidation = [];
    
    if (!personalInfo.firstName?.trim()) requiredFieldsValidation.push('personalInfo.firstName');
    if (!personalInfo.lastName?.trim()) requiredFieldsValidation.push('personalInfo.lastName');
    if (!authentication.email?.trim()) requiredFieldsValidation.push('authentication.email');
    if (!authentication.phone?.trim()) requiredFieldsValidation.push('authentication.phone');
    if (!authentication.username?.trim()) requiredFieldsValidation.push('authentication.username');
    if (!authentication.password) requiredFieldsValidation.push('authentication.password');
    if (!roleInfo.role) requiredFieldsValidation.push('roleInfo.role');
    if (!contactInfo.address?.city?.trim()) requiredFieldsValidation.push('contactInfo.address.city');
    if (!contactInfo.address?.state?.trim()) requiredFieldsValidation.push('contactInfo.address.state');
    
    if (requiredFieldsValidation.length > 0) {
      error('❌ Auth: Missing required fields:', requiredFieldsValidation);
      return errorResponse(res, 'Required fields are missing or empty', 400, {
        missingFields: requiredFieldsValidation
      });
    }

    // Preprocess phone numbers
    const processedAuthentication = {
      ...authentication,
      phone: preprocessPhoneNumber(authentication.phone)
    };

    // Enhanced duplicate user checking with detailed logging
    log('🔍 Auth: Checking for existing users with:', {
      email: maskEmail(processedAuthentication.email),
      phone: maskPhone(processedAuthentication.phone),
      username: processedAuthentication.username
    });

    const existingUser = await User.findOne({
      $or: [
        { 'authentication.email': processedAuthentication.email },
        { 'authentication.phone': processedAuthentication.phone },
        { 'authentication.username': processedAuthentication.username }
      ]
    });

    if (existingUser) {
      const conflicts = [];
      if (existingUser.authentication.email === processedAuthentication.email) {
        conflicts.push({ field: 'email', message: 'Email already registered. Please use a different email or try logging in.' });
      }
      if (existingUser.authentication.phone === processedAuthentication.phone) {
        conflicts.push({ field: 'phone', message: 'Phone number already registered. Please use a different number or try logging in.' });
      }
      if (existingUser.authentication.username === processedAuthentication.username) {
        conflicts.push({ field: 'username', message: 'Username already taken. Please choose a different username.' });
      }
      
      warn('⚠️ Auth: User registration blocked - duplicate data:', {
        conflicts: conflicts.map(c => c.field),
        existingUserId: maskId(existingUser._id)
      });
      
      return errorResponse(res, 'User already exists', 409, [{ conflicts }]);
    }

    log('✅ Auth: No existing user found, proceeding with registration');

    // Validate terms acceptance
    if (!termsAccepted || !privacyPolicyAccepted) {
      return errorResponse(res, 'Terms and privacy policy must be accepted', 400);
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(processedAuthentication.password, saltRounds);

    // Create user data with minimal structure
    const userData = {
      personalInfo: {
        firstName: personalInfo.firstName,
        lastName: personalInfo.lastName,
        // dateOfBirth and gender are optional
        ...(personalInfo.dateOfBirth && { dateOfBirth: personalInfo.dateOfBirth }),
        ...(personalInfo.gender && { gender: personalInfo.gender }),
        age: personalInfo.dateOfBirth ? 
          Math.floor((new Date() - new Date(personalInfo.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : 
          null
      },
      authentication: {
        ...processedAuthentication,
        password: hashedPassword,
        isEmailVerified: false,
        isPhoneVerified: false,
        loginAttempts: 0,
        accountLocked: false
      },
      roleInfo: {
        ...roleInfo,
        permissions: getDefaultPermissions(roleInfo.role),
        hierarchy: {
          hierarchyLevel: getHierarchyLevel(roleInfo.role)
        }
      },
      contactInfo: {
        address: {
          city: contactInfo.address.city,
          state: contactInfo.address.state,
          country: contactInfo.address.country || 'India',
          // street and pincode are optional
          ...(contactInfo.address.street && { street: contactInfo.address.street }),
          ...(contactInfo.address.pincode && { pincode: contactInfo.address.pincode })
        },
        // emergencyContact is optional
        ...(contactInfo.emergencyContact && {
          emergencyContact: {
            name: contactInfo.emergencyContact.name,
            phone: preprocessPhoneNumber(contactInfo.emergencyContact.phone),
            relationship: contactInfo.emergencyContact.relationship
          }
        })
      },
      preferences: {
        language: 'en',
        notifications: {
          email: true,
          sms: true,
          push: true,
          whatsapp: false
        },
        privacy: {
          profileVisibility: 'private',
          dataSharing: preferences?.privacy?.dataSharing || false,
          analyticsOptIn: false
        },
        ...preferences
      },
      verification: {
        isVerified: false,
        verificationMethod: 'pending'
      },
      status: 'active', // Set to active immediately for minimal signup
      termsAccepted: termsAccepted,
      privacyPolicyAccepted: privacyPolicyAccepted,
      termsAcceptedAt: new Date(),
      privacyPolicyAcceptedAt: new Date()
    };

    // Create and save user with enhanced error handling
    log('🏗️ Auth: Creating new user in database');
    
    const user = new User(userData);
    
    try {
      await user.save();
      log('✅ Auth: User created successfully:', {
        userId: maskId(user._id),
        email: maskEmail(user.authentication.email),
        role: user.roleInfo.role,
        profileCompletion: user.profileCompletion?.completionPercentage || 0
      });
    } catch (saveError) {
      error('💥 Auth: Failed to save user to database:', {
        error: saveError.message,
        code: saveError.code,
        keyPattern: saveError.keyPattern
      });
      
      // Handle specific database errors
      if (saveError.code === 11000) {
        const duplicateField = Object.keys(saveError.keyPattern)[0];
        return errorResponse(res, 'Duplicate data detected', 409, [{ 
          conflicts: [{ 
            field: duplicateField.split('.').pop(), 
            message: `This ${duplicateField.split('.').pop()} is already registered` 
          }] 
        }]);
      }
      
      return errorResponse(res, 'Failed to create user account. Please try again.', 500);
    }

    // Generate JWT tokens
    const { accessToken, refreshToken } = generateTokenPair(user._id, user.roleInfo.role);

    // Set HTTP-only cookies
    setTokenCookies(res, accessToken, refreshToken);

    // Return user data
    const userResponse = {
      id: user._id,
      userId: user._id,
      personalInfo: user.personalInfo,
      roleInfo: user.roleInfo,
      authentication: {
        email: user.authentication.email,
        phone: user.authentication.phone,
        username: user.authentication.username,
        isEmailVerified: user.authentication.isEmailVerified,
        isPhoneVerified: user.authentication.isPhoneVerified
      },
      status: user.status,
      contactInfo: user.contactInfo,
      preferences: user.preferences,
      profileCompletion: user.profileCompletion
    };

    return createdResponse(res, userResponse, 'Account created successfully! Complete your profile to unlock all features.');

  } catch (err) {
    // Enhanced error logging for signup failures
    error('💥 Auth: Signup failed with error:', {
      message: err.message,
      name: err.name,
      code: err.code,
      keyPattern: err.keyPattern,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
    
    // Handle Mongoose validation errors with detailed field mapping
    if (err.name === 'ValidationError') {
      const validationErrors = [];
      Object.keys(err.errors).forEach(key => {
        validationErrors.push({
          field: key,
          message: err.errors[key].message,
          value: err.errors[key].value
        });
      });
      
      warn('⚠️ Auth: Validation errors detected:', validationErrors.map(e => e.field));
      return errorResponse(res, 'Validation failed', 400, validationErrors);
    }
    
    // Handle duplicate key errors with enhanced conflict detection
    if (err.code === 11000) {
      const duplicateField = Object.keys(err.keyPattern)[0];
      const fieldName = duplicateField.split('.').pop(); // Get the last part for nested fields
      
      warn('⚠️ Auth: Duplicate key error:', { field: fieldName });
      return errorResponse(res, 'User already exists', 409, [{ 
        conflicts: [{ 
          field: fieldName, 
          message: `This ${fieldName} is already registered. Please use a different ${fieldName} or try logging in.` 
        }] 
      }]);
    }
    
    // Handle network/database connection errors
    if (err.name === 'MongoNetworkError' || err.name === 'MongooseServerSelectionError') {
      error('🔌 Auth: Database connection error during signup');
      return errorResponse(res, 'Database connection error. Please try again later.', 503);
    }
    
    // Handle timeout errors
    if (err.name === 'MongooseTimeout' || err.code === 'ETIMEOUT') {
      error('⏰ Auth: Database timeout during signup');
      return errorResponse(res, 'Request timeout. Please try again.', 408);
    }
    
    // Generic server error
    error('🚨 Auth: Unexpected signup error:', err.message);
    return errorResponse(res, 'Registration failed. Please try again later.', 500, 
      process.env.NODE_ENV === 'development' ? { error: err.message } : undefined
    );
  }
};

/**
 * User Login
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const login = async (req, res) => {
  try {
    log('🔐 Login attempt for:', maskEmail(req.body.identifier));
    
    const { identifier, password, rememberMe = false } = req.body;

    // Detect and normalize phone numbers for consistent lookup
    let normalizedIdentifier = identifier;
    const phonePattern = /^(\+91)?[6-9]\d{9}$/;
    if (phonePattern.test(identifier.replace(/\s+/g, ''))) {
      normalizedIdentifier = preprocessPhoneNumber(identifier);
    }

    // Find user by email, phone, or username
    const user = await User.findOne({
      $or: [
        { 'authentication.email': identifier },
        { 'authentication.phone': normalizedIdentifier },
        { 'authentication.username': identifier }
      ]
    });

    if (!user) {
      log('❌ User not found for identifier:', maskEmail(identifier));
      return errorResponse(res, 'Invalid credentials', 401);
    }
    
    log('👤 User found:', {
      userId: maskId(user.userId),
      email: maskEmail(user.authentication.email),
      role: user.roleInfo.role,
      status: user.status
    });

    // Check if account is locked
    if (user.authentication.accountLocked) {
      log('🔒 Account is locked for user:', maskEmail(user.authentication.email));
      return errorResponse(res, 'Account is locked. Please contact support.', 423);
    }

    // Check account status
    if (user.status === 'suspended') {
      log('🚫 Account is suspended for user:', maskEmail(user.authentication.email));
      return errorResponse(res, 'Account is suspended. Contact administrator.', 403);
    }

    if (user.status === 'inactive') {
      log('🚫 Account is inactive for user:', maskEmail(user.authentication.email));
      return errorResponse(res, 'Account is inactive', 403);
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.authentication.password);
    
    if (!isPasswordValid) {
      log('❌ Invalid password for user:', maskEmail(user.authentication.email));
      
      // Increment login attempts
      user.authentication.loginAttempts = (user.authentication.loginAttempts || 0) + 1;
      
      // Lock account after 5 failed attempts
      if (user.authentication.loginAttempts >= 5) {
        user.authentication.accountLocked = true;
        log('🔒 Account locked due to too many failed attempts:', maskEmail(user.authentication.email));
      }
      
      await user.save();
      return errorResponse(res, 'Invalid credentials', 401);
    }

    // Reset login attempts on successful login
    user.authentication.loginAttempts = 0;
    user.authentication.lastLogin = new Date();
    await user.save();
    
    log('✅ Password verified for user:', maskEmail(user.authentication.email));
    
    // Generate JWT tokens
    const accessExpiry = rememberMe ? '30d' : '1d';
    const refreshExpiry = rememberMe ? '30d' : '7d';
    const { accessToken, refreshToken } = generateTokenPair(user._id, user.roleInfo.role, accessExpiry, refreshExpiry);
    
    log('🎫 JWT tokens generated for user:', maskEmail(user.authentication.email));
    
    // Set HTTP-only cookies
    setTokenCookies(res, accessToken, refreshToken, rememberMe);

    // Return user data without sensitive information
    const userResponse = {
      id: user._id,
      userId: user.userId,
      personalInfo: {
        firstName: user.personalInfo.firstName,
        lastName: user.personalInfo.lastName,
        dateOfBirth: user.personalInfo.dateOfBirth,
        gender: user.personalInfo.gender,
        age: user.personalInfo.age,
        profilePhoto: user.personalInfo.profilePhoto
      },
      roleInfo: {
        role: user.roleInfo.role,
        permissions: user.roleInfo.permissions,
        hierarchy: user.roleInfo.hierarchy,
        assignedVillages: user.roleInfo.assignedVillages,
        assignedBlock: user.roleInfo.assignedBlock
      },
      authentication: {
        email: user.authentication.email,
        phone: user.authentication.phone,
        username: user.authentication.username,
        isEmailVerified: user.authentication.isEmailVerified,
        isPhoneVerified: user.authentication.isPhoneVerified,
        lastLogin: user.authentication.lastLogin
      },
      status: user.status,
      contactInfo: {
        address: user.contactInfo.address,
        emergencyContact: user.contactInfo.emergencyContact
      },
      preferences: user.preferences,
      professionalInfo: user.professionalInfo,
      profileCompletion: user.profileCompletion
    };
    
    log('✅ Login successful for user:', {
      userId: maskId(userResponse.userId),
      role: userResponse.roleInfo.role,
      email: maskEmail(userResponse.authentication.email)
    });

    return successResponse(res, userResponse, 'Login successful');

  } catch (error) {
    error('❌ Login error:', error);
    return errorResponse(res, 'Login failed', 500, error.message);
  }
};

/**
 * User Logout
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const logout = async (req, res) => {
  try {
    // Clear authentication cookies
    clearTokenCookies(res);

    // Optional: Add token to blacklist if implementing token blacklisting
    // await blacklistToken(req.cookies.refreshToken);

    return successResponse(res, null, 'Logout successful');

  } catch (error) {
    error('Logout error:', error);
    return errorResponse(res, 'Logout failed', 500, error.message);
  }
};

/**
 * Refresh Access Token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return errorResponse(res, 'Refresh token not found', 401);
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    // Find user
    const user = await User.findById(decoded.userId);
    if (!user || user.status !== 'active') {
      clearTokenCookies(res);
      return errorResponse(res, 'Invalid refresh token', 401);
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user._id, user.roleInfo.role);

    // Update access token cookie
    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    return successResponse(res, null, 'Token refreshed successfully');

  } catch (error) {
    error('Token refresh error:', error);
    clearTokenCookies(res);
    return errorResponse(res, 'Token refresh failed', 401);
  }
};

/**
 * Get Current User Profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
/**
 * Get current user information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getCurrentUser = async (req, res) => {
  try {
    log('👤 Getting current user info for:', maskEmail(req.user?.authentication?.email));
    
    const user = req.user;
    if (!user) {
      log('❌ No user found in request');
      return errorResponse(res, 'User not found', 404);
    }
    
    // Return user data without sensitive information
    const userResponse = {
      id: user._id,
      userId: user.userId,
      personalInfo: {
        firstName: user.personalInfo.firstName,
        lastName: user.personalInfo.lastName,
        dateOfBirth: user.personalInfo.dateOfBirth,
        gender: user.personalInfo.gender,
        age: user.personalInfo.age,
        profilePhoto: user.personalInfo.profilePhoto
      },
      roleInfo: {
        role: user.roleInfo.role,
        permissions: user.roleInfo.permissions,
        hierarchy: user.roleInfo.hierarchy,
        assignedVillages: user.roleInfo.assignedVillages,
        assignedBlock: user.roleInfo.assignedBlock
      },
      authentication: {
        email: user.authentication.email,
        phone: user.authentication.phone,
        username: user.authentication.username,
        isEmailVerified: user.authentication.isEmailVerified,
        isPhoneVerified: user.authentication.isPhoneVerified,
        lastLogin: user.authentication.lastLogin
      },
      status: user.status,
      contactInfo: {
        address: user.contactInfo.address,
        emergencyContact: user.contactInfo.emergencyContact
      },
      preferences: user.preferences,
      professionalInfo: user.professionalInfo,
      profileCompletion: user.profileCompletion,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    
    log('✅ Current user data retrieved:', {
      userId: maskId(userResponse.userId),
      role: userResponse.roleInfo.role,
      email: maskEmail(userResponse.authentication.email)
    });
    
    return successResponse(res, userResponse, 'User information retrieved successfully');
    
  } catch (error) {
    error('❌ Get current user error:', error);
    return errorResponse(res, 'Failed to get user information', 500, error.message);
  }
};

/**
 * Change Password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.authentication.password);
    if (!isCurrentPasswordValid) {
      return errorResponse(res, 'Current password is incorrect', 400);
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    user.authentication.password = hashedNewPassword;
    user.authentication.passwordLastChanged = new Date();
    user.metadata.updatedAt = new Date();
    await user.save();

    // Clear all cookies to force re-login
    clearTokenCookies(res);

    return successResponse(res, null, 'Password changed successfully. Please login again.');

  } catch (error) {
    error('Change password error:', error);
    return errorResponse(res, 'Password change failed', 500, error.message);
  }
};

/**
 * Verify Email
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    
    // In a real implementation, you would verify the email token
    // For now, we'll implement basic email verification
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return errorResponse(res, 'Invalid verification token', 400);
    }

    user.authentication.isEmailVerified = true;
    user.authentication.emailVerifiedAt = new Date();
    user.metadata.updatedAt = new Date();
    await user.save();

    return successResponse(res, null, 'Email verified successfully');

  } catch (error) {
    error('Email verification error:', error);
    return errorResponse(res, 'Email verification failed', 400, error.message);
  }
};

/**
 * Verify Phone
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const verifyPhone = async (req, res) => {
  try {
    const { otp } = req.body;
    const user = req.user;

    // In a real implementation, you would verify the OTP
    // For now, we'll implement basic phone verification
    
    if (!otp || otp.length !== 6) {
      return errorResponse(res, 'Invalid OTP', 400);
    }

    user.authentication.isPhoneVerified = true;
    user.authentication.phoneVerifiedAt = new Date();
    user.metadata.updatedAt = new Date();
    await user.save();

    return successResponse(res, null, 'Phone verified successfully');

  } catch (error) {
    error('Phone verification error:', error);
    return errorResponse(res, 'Phone verification failed', 400, error.message);
  }
};

/**
 * Update User Profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateProfile = async (req, res) => {
  try {
    const user = req.user;
    const updateData = req.body;
    
    log('Profile update request for user:', maskEmail(user.authentication.email));
    
    // Create safe subset for logging (avoid sensitive data)
    const safeUpdateData = {
      hasPersonalInfo: !!updateData.personalInfo,
      hasContactInfo: !!updateData.contactInfo,
      hasPreferences: !!updateData.preferences,
      hasProfessionalInfo: !!updateData.professionalInfo,
      fieldsCount: Object.keys(updateData).length
    };
    log('Update data:', safeUpdateData);
    
    // Update user fields
    if (updateData.personalInfo) {
      Object.assign(user.personalInfo, updateData.personalInfo);
      
      // Recalculate age if dateOfBirth is updated
      if (updateData.personalInfo.dateOfBirth) {
        user.personalInfo.age = Math.floor(
          (new Date() - new Date(updateData.personalInfo.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)
        );
      }
    }
    
    if (updateData.contactInfo) {
      if (updateData.contactInfo.address) {
        Object.assign(user.contactInfo.address, updateData.contactInfo.address);
      }
      if (updateData.contactInfo.emergencyContact) {
        // Preprocess emergency contact phone
        if (updateData.contactInfo.emergencyContact.phone) {
          updateData.contactInfo.emergencyContact.phone = 
            preprocessPhoneNumber(updateData.contactInfo.emergencyContact.phone);
        }
        user.contactInfo.emergencyContact = updateData.contactInfo.emergencyContact;
      }
    }
    
    if (updateData.professionalInfo) {
      user.professionalInfo = { ...user.professionalInfo, ...updateData.professionalInfo };
    }
    
    if (updateData.preferences) {
      Object.assign(user.preferences, updateData.preferences);
    }
    
    // Save updated user
    await user.save();
    
    // Return updated user data
    const userResponse = {
      id: user._id,
      userId: user.userId,
      personalInfo: user.personalInfo,
      roleInfo: user.roleInfo,
      authentication: {
        email: user.authentication.email,
        phone: user.authentication.phone,
        username: user.authentication.username,
        isEmailVerified: user.authentication.isEmailVerified,
        isPhoneVerified: user.authentication.isPhoneVerified
      },
      status: user.status,
      contactInfo: user.contactInfo,
      preferences: user.preferences,
      professionalInfo: user.professionalInfo,
      profileCompletion: user.profileCompletion
    };
    
    return successResponse(res, userResponse, 'Profile updated successfully');
    
  } catch (error) {
    error('Profile update error:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      Object.keys(error.errors).forEach(key => {
        validationErrors[key] = error.errors[key].message;
      });
      return errorResponse(res, 'Validation failed', 400, { validationErrors });
    }
    
    return errorResponse(res, 'Profile update failed', 500, error.message);
  }
};

