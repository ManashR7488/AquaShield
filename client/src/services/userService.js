import axios from '../config/axios.js';

/**
 * User Service Module
 * Handles all user-related API operations including CRUD operations,
 * role-based filtering, user management, and authentication operations.
 */

/**
 * Get all users with optional pagination, filtering, and sorting
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 10)
 * @param {string} params.search - Search term for name, email, or phone
 * @param {string} params.role - Filter by user role
 * @param {string} params.status - Filter by account status
 * @param {string} params.districtId - Filter by assigned district
 * @param {string} params.blockId - Filter by assigned block
 * @param {string} params.verified - Filter by verification status
 * @param {string} params.sortBy - Field to sort by (default: 'createdAt')
 * @param {string} params.sortOrder - Sort order ('asc' or 'desc', default: 'desc')
 * @returns {Promise<Object>} Response with users data and pagination info
 */
export const getAllUsers = async (params = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      role = '',
      status = '',
      districtId = '',
      blockId = '',
      verified = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = params;

    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy,
      sortOrder
    });

    if (search) queryParams.append('search', search);
    if (role) queryParams.append('role', role);
    if (status) queryParams.append('status', status);
    if (districtId) queryParams.append('districtId', districtId);
    if (blockId) queryParams.append('blockId', blockId);
    if (verified) queryParams.append('verified', verified);

    // TODO: Backend endpoint needs to be implemented at /api/users
    const response = await axios.get(`/api/users?${queryParams.toString()}`);
    
    return {
      success: true,
      data: response.data.users || [],
      pagination: response.data.pagination || {
        currentPage: page,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: limit
      },
      message: 'Users fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching users:', error);
    return {
      success: false,
      data: [],
      pagination: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 },
      message: error.response?.data?.message || 'Failed to fetch users'
    };
  }
};

/**
 * Get a single user by ID
 * @param {string} id - User ID
 * @returns {Promise<Object>} Response with user data
 */
export const getUserById = async (id) => {
  try {
    if (!id) {
      throw new Error('User ID is required');
    }

    // TODO: Backend endpoint needs to be implemented at /api/users/:id
    const response = await axios.get(`/api/users/${id}`);
    
    return {
      success: true,
      data: response.data.user || null,
      message: 'User fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || 'Failed to fetch user'
    };
  }
};

/**
 * Create a new user
 * @param {Object} userData - User information
 * @param {string} userData.name - Full name
 * @param {string} userData.email - Email address
 * @param {string} userData.phone - Phone number
 * @param {string} userData.password - Password
 * @param {Object} userData.roleInfo - Role and hierarchy information
 * @param {Object} userData.personalInfo - Personal information
 * @param {Object} userData.contactInfo - Contact information
 * @returns {Promise<Object>} Response with created user data
 */
export const createUser = async (userData) => {
  try {
    if (!userData || !userData.name || !userData.email || !userData.phone) {
      throw new Error('Required user fields are missing');
    }

    // TODO: Backend endpoint needs to be implemented at /api/users
    const response = await axios.post('/api/users', userData);
    
    return {
      success: true,
      data: response.data.user || null,
      message: 'User created successfully'
    };
  } catch (error) {
    console.error('Error creating user:', error);
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || 'Failed to create user'
    };
  }
};

/**
 * Update an existing user
 * @param {string} id - User ID
 * @param {Object} userData - Updated user information
 * @returns {Promise<Object>} Response with updated user data
 */
export const updateUser = async (id, userData) => {
  try {
    if (!id) {
      throw new Error('User ID is required');
    }
    
    if (!userData) {
      throw new Error('User data is required');
    }

    // TODO: Backend endpoint needs to be implemented at /api/users/:id
    const response = await axios.put(`/api/users/${id}`, userData);
    
    return {
      success: true,
      data: response.data.user || null,
      message: 'User updated successfully'
    };
  } catch (error) {
    console.error('Error updating user:', error);
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || 'Failed to update user'
    };
  }
};

/**
 * Delete a user
 * @param {string} id - User ID
 * @returns {Promise<Object>} Response with deletion confirmation
 */
export const deleteUser = async (id) => {
  try {
    if (!id) {
      throw new Error('User ID is required');
    }

    // TODO: Backend endpoint needs to be implemented at /api/users/:id
    const response = await axios.delete(`/api/users/${id}`);
    
    return {
      success: true,
      data: null,
      message: 'User deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting user:', error);
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || 'Failed to delete user'
    };
  }
};

/**
 * Update user role and hierarchy information
 * @param {string} id - User ID
 * @param {Object} roleData - Role update information
 * @param {string} roleData.role - New user role
 * @param {string} roleData.districtId - Assigned district ID (optional)
 * @param {string} roleData.blockId - Assigned block ID (optional)
 * @param {string} roleData.villageId - Assigned village ID (optional)
 * @returns {Promise<Object>} Response with updated user data
 */
export const updateUserRole = async (id, roleData) => {
  try {
    if (!id || !roleData || !roleData.role) {
      throw new Error('User ID and role information are required');
    }

    // TODO: Backend endpoint needs to be implemented at /api/users/:id/role
    const response = await axios.patch(`/api/users/${id}/role`, roleData);
    
    return {
      success: true,
      data: response.data.user || null,
      message: 'User role updated successfully'
    };
  } catch (error) {
    console.error('Error updating user role:', error);
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || 'Failed to update user role'
    };
  }
};

/**
 * Verify a user account
 * @param {string} id - User ID
 * @param {Object} verificationData - Verification details
 * @param {boolean} verificationData.verified - Verification status
 * @param {string} verificationData.verifiedBy - ID of admin performing verification
 * @param {string} verificationData.verificationNotes - Optional verification notes
 * @returns {Promise<Object>} Response with updated user data
 */
export const verifyUser = async (id, verificationData = {}) => {
  try {
    if (!id) {
      throw new Error('User ID is required');
    }

    const data = {
      verified: true,
      verificationDate: new Date().toISOString(),
      ...verificationData
    };

    // TODO: Backend endpoint needs to be implemented at /api/users/:id/verify
    const response = await axios.patch(`/api/users/${id}/verify`, data);
    
    return {
      success: true,
      data: response.data.user || null,
      message: 'User verified successfully'
    };
  } catch (error) {
    console.error('Error verifying user:', error);
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || 'Failed to verify user'
    };
  }
};

/**
 * Suspend or activate a user account
 * @param {string} id - User ID
 * @param {Object} suspensionData - Suspension details
 * @param {boolean} suspensionData.suspended - Suspension status
 * @param {string} suspensionData.suspendedBy - ID of admin performing action
 * @param {string} suspensionData.suspensionReason - Reason for suspension
 * @param {Date} suspensionData.suspensionEndDate - End date for suspension
 * @returns {Promise<Object>} Response with updated user data
 */
export const suspendUser = async (id, suspensionData) => {
  try {
    if (!id || !suspensionData) {
      throw new Error('User ID and suspension data are required');
    }

    const data = {
      suspensionDate: new Date().toISOString(),
      ...suspensionData
    };

    // TODO: Backend endpoint needs to be implemented at /api/users/:id/suspend
    const response = await axios.patch(`/api/users/${id}/suspend`, data);
    
    return {
      success: true,
      data: response.data.user || null,
      message: suspensionData.suspended ? 'User suspended successfully' : 'User activated successfully'
    };
  } catch (error) {
    console.error('Error updating user suspension status:', error);
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || 'Failed to update user status'
    };
  }
};

/**
 * Get users by specific role
 * @param {string} role - User role to filter by
 * @param {Object} params - Additional query parameters
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 * @param {string} params.search - Search term
 * @param {string} params.status - Account status filter
 * @returns {Promise<Object>} Response with filtered users
 */
export const getUsersByRole = async (role, params = {}) => {
  try {
    if (!role) {
      throw new Error('Role is required');
    }

    const {
      page = 1,
      limit = 10,
      search = '',
      status = ''
    } = params;

    const queryParams = new URLSearchParams({
      role,
      page: page.toString(),
      limit: limit.toString()
    });

    if (search) queryParams.append('search', search);
    if (status) queryParams.append('status', status);

    // TODO: Backend endpoint needs to be implemented at /api/users/role/:role
    const response = await axios.get(`/api/users/role/${role}?${queryParams.toString()}`);
    
    return {
      success: true,
      data: response.data.users || [],
      pagination: response.data.pagination || {
        currentPage: page,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: limit
      },
      message: `Users with role ${role} fetched successfully`
    };
  } catch (error) {
    console.error('Error fetching users by role:', error);
    return {
      success: false,
      data: [],
      pagination: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 },
      message: error.response?.data?.message || 'Failed to fetch users by role'
    };
  }
};

/**
 * Get users by assigned district
 * @param {string} districtId - District ID
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>} Response with district users
 */
export const getUsersByDistrict = async (districtId, params = {}) => {
  try {
    if (!districtId) {
      throw new Error('District ID is required');
    }

    const {
      page = 1,
      limit = 10,
      search = '',
      role = ''
    } = params;

    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    if (search) queryParams.append('search', search);
    if (role) queryParams.append('role', role);

    // TODO: Backend endpoint needs to be implemented at /api/users/district/:districtId
    const response = await axios.get(`/api/users/district/${districtId}?${queryParams.toString()}`);
    
    return {
      success: true,
      data: response.data.users || [],
      pagination: response.data.pagination || {
        currentPage: page,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: limit
      },
      message: 'District users fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching users by district:', error);
    return {
      success: false,
      data: [],
      pagination: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 },
      message: error.response?.data?.message || 'Failed to fetch district users'
    };
  }
};

/**
 * Get user statistics and summary data
 * @param {Object} filters - Optional filters for statistics
 * @returns {Promise<Object>} Response with user statistics
 */
export const getUserStats = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });

    // TODO: Backend endpoint needs to be implemented at /api/users/stats
    const response = await axios.get(`/api/users/stats?${queryParams.toString()}`);
    
    return {
      success: true,
      data: response.data.stats || {},
      message: 'User statistics fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    return {
      success: false,
      data: {},
      message: error.response?.data?.message || 'Failed to fetch user statistics'
    };
  }
};

/**
 * Bulk update multiple users
 * @param {Array} userIds - Array of user IDs
 * @param {Object} updateData - Data to update for all users
 * @returns {Promise<Object>} Response with bulk update results
 */
export const bulkUpdateUsers = async (userIds, updateData) => {
  try {
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      throw new Error('User IDs array is required');
    }

    if (!updateData) {
      throw new Error('Update data is required');
    }

    const requestData = {
      userIds,
      updateData
    };

    // TODO: Backend endpoint needs to be implemented at /api/users/bulk-update
    const response = await axios.patch('/api/users/bulk-update', requestData);
    
    return {
      success: true,
      data: response.data.results || null,
      message: 'Users updated successfully'
    };
  } catch (error) {
    console.error('Error bulk updating users:', error);
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || 'Failed to update users'
    };
  }
};

/**
 * Search users by various criteria
 * @param {Object} searchCriteria - Search parameters
 * @param {string} searchCriteria.query - General search query
 * @param {string} searchCriteria.role - Filter by role
 * @param {string} searchCriteria.district - Filter by district
 * @param {Object} searchCriteria.dateRange - Date range filters
 * @returns {Promise<Object>} Response with matching users
 */
export const searchUsers = async (searchCriteria) => {
  try {
    // TODO: Backend endpoint needs to be implemented at /api/users/search
    const response = await axios.post('/api/users/search', searchCriteria);
    
    return {
      success: true,
      data: response.data.users || [],
      message: 'User search completed successfully'
    };
  } catch (error) {
    console.error('Error searching users:', error);
    return {
      success: false,
      data: [],
      message: error.response?.data?.message || 'Failed to search users'
    };
  }
};

/**
 * Reset user password (admin action)
 * @param {string} id - User ID
 * @param {Object} resetData - Password reset information
 * @param {string} resetData.newPassword - New password (optional, will be generated if not provided)
 * @param {boolean} resetData.requirePasswordChange - Require user to change password on next login
 * @returns {Promise<Object>} Response with password reset confirmation
 */
export const resetUserPassword = async (id, resetData = {}) => {
  try {
    if (!id) {
      throw new Error('User ID is required');
    }

    // TODO: Backend endpoint needs to be implemented at /api/users/:id/reset-password
    const response = await axios.post(`/api/users/${id}/reset-password`, resetData);
    
    return {
      success: true,
      data: response.data || null,
      message: 'User password reset successfully'
    };
  } catch (error) {
    console.error('Error resetting user password:', error);
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || 'Failed to reset user password'
    };
  }
};

export default {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserRole,
  verifyUser,
  suspendUser,
  getUsersByRole,
  getUsersByDistrict,
  getUserStats,
  bulkUpdateUsers,
  searchUsers,
  resetUserPassword
};