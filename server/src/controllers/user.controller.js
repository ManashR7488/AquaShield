import User from '../models/user.model.js';
import District from '../models/district.model.js';
import Block from '../models/block.model.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  successResponse,
  createdResponse,
  updatedResponse,
  notFoundResponse,
  paginatedResponse
} from '../utils/responseHelper.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/**
 * @desc Get all users with pagination and filtering
 * @route GET /api/users
 * @access Admin only
 */
export const getUsers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    role,
    status = 'all',
    sortBy = 'createdAt',
    sortOrder = 'desc',
    state,
    district,
    verified
  } = req.query;

  // Build filter
  const filter = {};

  if (status !== 'all') {
    filter['roleInfo.status'] = status;
  }

  if (role && role !== 'all') {
    filter['roleInfo.role'] = role;
  }

  if (verified !== undefined) {
    filter['roleInfo.isVerified'] = verified === 'true';
  }

  if (search) {
    filter.$or = [
      { 'personalInfo.firstName': { $regex: search, $options: 'i' } },
      { 'personalInfo.lastName': { $regex: search, $options: 'i' } },
      { 'contactInfo.email': { $regex: search, $options: 'i' } },
      { 'contactInfo.phoneNumber': { $regex: search, $options: 'i' } },
      { 'personalInfo.employeeId': { $regex: search, $options: 'i' } }
    ];
  }

  if (state) {
    filter['address.state'] = state;
  }

  if (district) {
    filter['address.district'] = district;
  }

  // Build sort
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Execute query with pagination
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort,
    select: '-password', // Exclude password field
    populate: [
      {
        path: 'createdBy',
        select: 'personalInfo.firstName personalInfo.lastName'
      }
    ]
  };

  const users = await User.paginate(filter, options);

  const pagination = {
    totalDocs: users.totalDocs,
    limit: users.limit,
    totalPages: users.totalPages,
    page: users.page,
    pagingCounter: users.pagingCounter,
    hasPrevPage: users.hasPrevPage,
    hasNextPage: users.hasNextPage,
    prevPage: users.prevPage,
    nextPage: users.nextPage
  };

  paginatedResponse(res, users.docs, pagination, 'Users retrieved successfully');
});

/**
 * @desc Get single user by ID
 * @route GET /api/users/:id
 * @access Admin, Own profile
 */
export const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if user is accessing their own profile or is admin
  if (req.user.roleInfo.role !== 'admin' && req.user._id.toString() !== id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only view your own profile.'
    });
  }

  const user = await User.findById(id)
    .select('-password')
    .populate('createdBy', 'personalInfo.firstName personalInfo.lastName')
    .populate('updatedBy', 'personalInfo.firstName personalInfo.lastName');

  if (!user) {
    return notFoundResponse(res, 'User not found');
  }

  // Get additional statistics for health officials
  if (user.roleInfo.role === 'health_official') {
    // Check if user is a district officer
    const districtAsOfficer = await District.findOne({
      'districtOfficer.userId': user._id,
      status: 'active'
    }).select('name state districtId');

    // Check if user is a block officer
    const blockAsOfficer = await Block.findOne({
      'blockOfficer.userId': user._id,
      status: 'active'
    }).select('name blockId').populate('districtId', 'name state');

    const userWithStats = {
      ...user.toObject(),
      assignments: {
        districtOfficer: districtAsOfficer,
        blockOfficer: blockAsOfficer
      }
    };

    return successResponse(res, userWithStats, 'User retrieved successfully');
  }

  successResponse(res, user, 'User retrieved successfully');
});

/**
 * @desc Create new user
 * @route POST /api/users
 * @access Admin only
 */
export const createUser = asyncHandler(async (req, res) => {
  const {
    personalInfo,
    contactInfo,
    address,
    roleInfo,
    professionalInfo,
    password
  } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [
      { 'contactInfo.email': contactInfo.email },
      { 'contactInfo.phoneNumber': contactInfo.phoneNumber },
      { 'personalInfo.employeeId': personalInfo.employeeId }
    ]
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User with this email, phone number, or employee ID already exists'
    });
  }

  // Hash password
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user object
  const userData = {
    personalInfo,
    contactInfo,
    address,
    roleInfo: {
      ...roleInfo,
      isVerified: false,
      status: 'active'
    },
    professionalInfo,
    password: hashedPassword,
    createdBy: req.user._id
  };

  const user = await User.create(userData);

  // Remove password from response
  const userResponse = user.toObject();
  delete userResponse.password;

  createdResponse(res, userResponse, 'User created successfully');
});

/**
 * @desc Update user
 * @route PUT /api/users/:id
 * @access Admin, Own profile
 */
export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = { ...req.body };

  // Check permissions
  if (req.user.roleInfo.role !== 'admin' && req.user._id.toString() !== id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only update your own profile.'
    });
  }

  // Prevent updating sensitive fields for non-admin users
  if (req.user.roleInfo.role !== 'admin') {
    delete updateData.roleInfo;
    delete updateData.createdBy;
    delete updateData.createdAt;
  }

  // Prevent updating critical fields
  delete updateData.password;
  delete updateData._id;
  delete updateData.__v;

  updateData.updatedBy = req.user._id;

  // Hash new password if provided
  if (updateData.newPassword) {
    const salt = await bcrypt.genSalt(12);
    updateData.password = await bcrypt.hash(updateData.newPassword, salt);
    delete updateData.newPassword;
  }

  const user = await User.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  )
    .select('-password')
    .populate('updatedBy', 'personalInfo.firstName personalInfo.lastName');

  if (!user) {
    return notFoundResponse(res, 'User not found');
  }

  updatedResponse(res, user, 'User updated successfully');
});

/**
 * @desc Delete user (soft delete)
 * @route DELETE /api/users/:id
 * @access Admin only
 */
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if user is assigned as district or block officer
  const districtAssignment = await District.findOne({
    'districtOfficer.userId': id,
    status: 'active'
  });

  const blockAssignment = await Block.findOne({
    'blockOfficer.userId': id,
    status: 'active'
  });

  if (districtAssignment || blockAssignment) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete user. User is currently assigned as district or block officer.',
      assignments: {
        district: districtAssignment?.name,
        block: blockAssignment?.name
      }
    });
  }

  const user = await User.findByIdAndUpdate(
    id,
    { 
      'roleInfo.status': 'inactive',
      updatedBy: req.user._id
    },
    { new: true }
  ).select('-password');

  if (!user) {
    return notFoundResponse(res, 'User not found');
  }

  successResponse(res, user, 'User deactivated successfully');
});

/**
 * @desc Update user status
 * @route PATCH /api/users/:id/status
 * @access Admin only
 */
export const updateUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  const user = await User.findByIdAndUpdate(
    id,
    { 
      'roleInfo.status': status,
      updatedBy: req.user._id,
      ...(reason && { statusUpdateReason: reason })
    },
    { new: true }
  ).select('-password');

  if (!user) {
    return notFoundResponse(res, 'User not found');
  }

  successResponse(res, user, `User status updated to ${status}`);
});

/**
 * @desc Verify user
 * @route PATCH /api/users/:id/verify
 * @access Admin only
 */
export const verifyUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { verificationNotes } = req.body;

  const user = await User.findByIdAndUpdate(
    id,
    { 
      'roleInfo.isVerified': true,
      'roleInfo.verifiedBy': req.user._id,
      'roleInfo.verifiedAt': new Date(),
      ...(verificationNotes && { 'roleInfo.verificationNotes': verificationNotes }),
      updatedBy: req.user._id
    },
    { new: true }
  ).select('-password');

  if (!user) {
    return notFoundResponse(res, 'User not found');
  }

  successResponse(res, user, 'User verified successfully');
});

/**
 * @desc Update user role
 * @route PATCH /api/users/:id/role
 * @access Admin only
 */
export const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role, department, designation, organization } = req.body;

  // Check if user has any active assignments that might conflict with new role
  if (role !== 'health_official') {
    const districtAssignment = await District.findOne({
      'districtOfficer.userId': id,
      status: 'active'
    });

    const blockAssignment = await Block.findOne({
      'blockOfficer.userId': id,
      status: 'active'
    });

    if (districtAssignment || blockAssignment) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change role. User has active assignments as district or block officer.',
        assignments: {
          district: districtAssignment?.name,
          block: blockAssignment?.name
        }
      });
    }
  }

  const updateData = {
    'roleInfo.role': role,
    updatedBy: req.user._id
  };

  // Update professional info if provided
  if (department) updateData['professionalInfo.department'] = department;
  if (designation) updateData['professionalInfo.designation'] = designation;
  if (organization) updateData['professionalInfo.organization'] = organization;

  const user = await User.findByIdAndUpdate(
    id,
    updateData,
    { new: true }
  ).select('-password');

  if (!user) {
    return notFoundResponse(res, 'User not found');
  }

  successResponse(res, user, 'User role updated successfully');
});

/**
 * @desc Search users
 * @route POST /api/users/search
 * @access Admin, Health Officials (limited access)
 */
export const searchUsers = asyncHandler(async (req, res) => {
  const {
    query,
    role,
    status,
    state,
    district,
    department,
    verified,
    availability
  } = req.body;

  // Build filter based on user role
  const filter = {};

  // Non-admin users have limited access
  if (req.user.roleInfo.role !== 'admin') {
    filter['roleInfo.role'] = { $in: ['health_official'] };
    filter['roleInfo.status'] = 'active';
    filter['roleInfo.isVerified'] = true;
  }

  // Text search
  if (query) {
    filter.$or = [
      { 'personalInfo.firstName': { $regex: query, $options: 'i' } },
      { 'personalInfo.lastName': { $regex: query, $options: 'i' } },
      { 'contactInfo.email': { $regex: query, $options: 'i' } },
      { 'personalInfo.employeeId': { $regex: query, $options: 'i' } }
    ];
  }

  // Additional filters for admin users
  if (req.user.roleInfo.role === 'admin') {
    if (role) filter['roleInfo.role'] = role;
    if (status) filter['roleInfo.status'] = status;
    if (verified !== undefined) filter['roleInfo.isVerified'] = verified;
  }

  if (state) filter['address.state'] = state;
  if (district) filter['address.district'] = district;
  if (department) filter['professionalInfo.department'] = department;

  // Handle availability filter (users not assigned as officers)
  if (availability === 'available') {
    // Find users who are not assigned as district or block officers
    const assignedUserIds = [];
    
    const districtOfficers = await District.find(
      { 'districtOfficer.userId': { $exists: true } },
      { 'districtOfficer.userId': 1 }
    );
    
    const blockOfficers = await Block.find(
      { 'blockOfficer.userId': { $exists: true } },
      { 'blockOfficer.userId': 1 }
    );

    districtOfficers.forEach(d => assignedUserIds.push(d.districtOfficer.userId));
    blockOfficers.forEach(b => assignedUserIds.push(b.blockOfficer.userId));

    filter._id = { $nin: assignedUserIds };
  }

  const users = await User.find(filter)
    .select('-password')
    .populate('createdBy', 'personalInfo.firstName personalInfo.lastName')
    .sort({ 'personalInfo.firstName': 1 })
    .limit(100);

  successResponse(res, users, 'Search results retrieved successfully');
});

/**
 * @desc Get user statistics
 * @route GET /api/users/stats
 * @access Admin only
 */
export const getUserStats = asyncHandler(async (req, res) => {
  const stats = await User.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: {
          $sum: { $cond: [{ $eq: ['$roleInfo.status', 'active'] }, 1, 0] }
        },
        verifiedUsers: {
          $sum: { $cond: ['$roleInfo.isVerified', 1, 0] }
        },
        adminUsers: {
          $sum: { $cond: [{ $eq: ['$roleInfo.role', 'admin'] }, 1, 0] }
        },
        healthOfficials: {
          $sum: { $cond: [{ $eq: ['$roleInfo.role', 'health_official'] }, 1, 0] }
        }
      }
    }
  ]);

  // Get role distribution
  const roleStats = await User.aggregate([
    {
      $group: {
        _id: '$roleInfo.role',
        count: { $sum: 1 },
        active: {
          $sum: { $cond: [{ $eq: ['$roleInfo.status', 'active'] }, 1, 0] }
        },
        verified: {
          $sum: { $cond: ['$roleInfo.isVerified', 1, 0] }
        }
      }
    }
  ]);

  // Get department distribution
  const departmentStats = await User.aggregate([
    {
      $match: { 'professionalInfo.department': { $exists: true } }
    },
    {
      $group: {
        _id: '$professionalInfo.department',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  // Get state distribution
  const stateStats = await User.aggregate([
    {
      $group: {
        _id: '$address.state',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  const response = {
    overview: stats[0] || {
      totalUsers: 0,
      activeUsers: 0,
      verifiedUsers: 0,
      adminUsers: 0,
      healthOfficials: 0
    },
    byRole: roleStats,
    byDepartment: departmentStats,
    byState: stateStats
  };

  successResponse(res, response, 'User statistics retrieved successfully');
});

/**
 * @desc Get user profile (current user)
 * @route GET /api/users/profile
 * @access All authenticated users
 */
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select('-password')
    .populate('createdBy', 'personalInfo.firstName personalInfo.lastName');

  if (!user) {
    return notFoundResponse(res, 'User not found');
  }

  // Get user assignments
  const assignments = {};

  // Check if user is a district officer
  const districtAssignment = await District.findOne({
    'districtOfficer.userId': user._id,
    status: 'active'
  }).select('name state districtId');

  if (districtAssignment) {
    assignments.districtOfficer = districtAssignment;
  }

  // Check if user is a block officer
  const blockAssignment = await Block.findOne({
    'blockOfficer.userId': user._id,
    status: 'active'
  }).select('name blockId').populate('districtId', 'name state');

  if (blockAssignment) {
    assignments.blockOfficer = blockAssignment;
  }

  const profileData = {
    ...user.toObject(),
    assignments
  };

  successResponse(res, profileData, 'Profile retrieved successfully');
});

/**
 * @desc Update user profile (current user)
 * @route PUT /api/users/profile
 * @access All authenticated users
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const updateData = { ...req.body };

  // Prevent updating sensitive fields
  delete updateData.roleInfo;
  delete updateData.password;
  delete updateData.createdBy;
  delete updateData.createdAt;
  delete updateData._id;
  delete updateData.__v;

  updateData.updatedBy = req.user._id;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updateData,
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    return notFoundResponse(res, 'User not found');
  }

  updatedResponse(res, user, 'Profile updated successfully');
});

/**
 * @desc Change password
 * @route PATCH /api/users/change-password
 * @access All authenticated users
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    return notFoundResponse(res, 'User not found');
  }

  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Hash new password
  const salt = await bcrypt.genSalt(12);
  const hashedNewPassword = await bcrypt.hash(newPassword, salt);

  user.password = hashedNewPassword;
  user.updatedBy = req.user._id;
  await user.save();

  successResponse(res, null, 'Password changed successfully');
});