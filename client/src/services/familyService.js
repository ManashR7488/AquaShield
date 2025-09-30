import axiosInstance from '../config/axios';

/**
 * Family Service
 * Handles all family member-related API operations for users
 * All operations are scoped to the current user's family members
 */

/**
 * Get all family members for a user
 * @param {string} userId - User ID to filter family members
 * @param {Object} params - Query parameters for filtering and pagination
 * @param {number} params.page - Page number for pagination
 * @param {number} params.limit - Number of items per page
 * @param {string} params.search - Search term for filtering
 * @param {string} params.relationship - Filter by relationship type
 * @param {number} params.minAge - Filter by minimum age
 * @param {number} params.maxAge - Filter by maximum age
 * @param {string} params.sortBy - Field to sort by
 * @param {string} params.sortOrder - Sort order (asc/desc)
 * @returns {Promise<Object>} Response with family members data
 */
export const getFamilyMembers = async (userId, params = {}) => {
  try {
    const queryParams = {
      ...params
    };
    
    // Map client params to backend-supported params
    if (params.ageGroup) {
      // Convert ageGroup to minAge/maxAge based on common age groups
      const ageGroups = {
        'child': { minAge: 0, maxAge: 12 },
        'teen': { minAge: 13, maxAge: 17 },
        'adult': { minAge: 18, maxAge: 64 },
        'senior': { minAge: 65, maxAge: 120 }
      };
      if (ageGroups[params.ageGroup]) {
        queryParams.minAge = ageGroups[params.ageGroup].minAge;
        queryParams.maxAge = ageGroups[params.ageGroup].maxAge;
        delete queryParams.ageGroup;
      }
    }
    
    const response = await axiosInstance.get('/family-members', { params: queryParams });
    
    const { familyMembers, pagination } = response.data.data || {};
    return {
      success: true,
      data: familyMembers || [],
      pagination,
      total: pagination?.totalCount || 0,
      message: response.data.message || 'Family members fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching family members:', error);
    return {
      success: false,
      data: [],
      total: 0,
      message: error.response?.data?.message || 'Failed to fetch family members',
      error: error.response?.data?.message || 'Failed to fetch family members'
    };
  }
};

/**
 * Get family member by ID
 * @param {string} id - Family member ID
 * @returns {Promise<Object>} Response with family member data
 */
export const getFamilyMemberById = async (id) => {
  try {
    const response = await axiosInstance.get(`/family-members/${id}`);
    
    return {
      success: true,
      data: response.data.data?.familyMember || {},
      message: response.data.message || 'Family member fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching family member:', error);
    return {
      success: false,
      data: {},
      message: error.response?.data?.message || 'Failed to fetch family member',
      error: error.response?.data?.message || 'Failed to fetch family member'
    };
  }
};

/**
 * Add a new family member
 * @param {Object|FormData} familyData - Family member data (can be FormData for file uploads)
 * @param {string} familyData.name - Full name
 * @param {string} familyData.relationship - Relationship to user
 * @param {string} familyData.dateOfBirth - Date of birth
 * @param {string} familyData.gender - Gender
 * @param {Object} familyData.contact - Contact information
 * @param {Object} familyData.health - Health information
 * @param {Object} familyData.emergency - Emergency contact
 * @param {Array} familyData.documents - Identification documents
 * @returns {Promise<Object>} Response with created family member data
 */
export const addFamilyMember = async (familyData) => {
  try {
    const config = {};
    
    // Set content type for FormData
    if (familyData instanceof FormData) {
      config.headers = { 'Content-Type': 'multipart/form-data' };
    }
    
    const response = await axiosInstance.post('/family-members', familyData, config);
    
    return {
      success: true,
      data: response.data.data?.familyMember || {},
      message: response.data.message || 'Family member added successfully'
    };
  } catch (error) {
    console.error('Error adding family member:', error);
    return {
      success: false,
      data: {},
      message: error.response?.data?.message || 'Failed to add family member',
      error: error.response?.data?.message || 'Failed to add family member'
    };
  }
};

/**
 * Update family member
 * @param {string} id - Family member ID
 * @param {Object|FormData} familyData - Updated family member data
 * @returns {Promise<Object>} Response with updated family member data
 */
export const updateFamilyMember = async (id, familyData) => {
  try {
    const config = {};
    
    // Set content type for FormData
    if (familyData instanceof FormData) {
      config.headers = { 'Content-Type': 'multipart/form-data' };
    }
    
    const response = await axiosInstance.put(`/family-members/${id}`, familyData, config);
    
    return {
      success: true,
      data: response.data.data?.familyMember || {},
      message: response.data.message || 'Family member updated successfully'
    };
  } catch (error) {
    console.error('Error updating family member:', error);
    return {
      success: false,
      data: {},
      message: error.response?.data?.message || 'Failed to update family member',
      error: error.response?.data?.message || 'Failed to update family member'
    };
  }
};

/**
 * Delete family member
 * @param {string} id - Family member ID
 * @returns {Promise<Object>} Response with deletion status
 */
export const deleteFamilyMember = async (id) => {
  try {
    await axiosInstance.delete(`/family-members/${id}`);
    
    return {
      success: true,
      message: 'Family member deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting family member:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to delete family member',
      error: error.response?.data?.message || 'Failed to delete family member'
    };
  }
};

/**
 * Get family health summary for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Response with family health summary
 */
export const getFamilyHealthSummary = async (userId) => {
  try {
    const response = await axiosInstance.get(`/family-members/health-summary`);
    
    return {
      success: true,
      data: response.data.data?.summary || {},
      message: response.data.message || 'Family health summary fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching family health summary:', error);
    return {
      success: false,
      data: {},
      message: error.response?.data?.message || 'Failed to fetch family health summary',
      error: error.response?.data?.message || 'Failed to fetch family health summary'
    };
  }
};

/**
 * Link existing user as family member
 * @param {string} familyMemberId - Family member ID
 * @param {string} userId - User ID to link
 * @returns {Promise<Object>} Response with linking status
 */
export const linkExistingUser = async (familyMemberId, userId) => {
  try {
    const response = await axiosInstance.post(`/family-members/${familyMemberId}/link`, { linkedUserId: userId });
    
    return {
      success: true,
      data: response.data.data || {},
      message: response.data.message || 'User linked successfully'
    };
  } catch (error) {
    console.error('Error linking user:', error);
    return {
      success: false,
      data: {},
      message: error.response?.data?.message || 'Failed to link user',
      error: error.response?.data?.message || 'Failed to link user'
    };
  }
};

/**
 * Get family health records for a specific family member
 * @param {string} familyMemberId - Family member ID
 * @returns {Promise<Object>} Response with health records
 */
export const getFamilyHealthRecords = async (familyMemberId) => {
  try {
    const response = await axiosInstance.get(`/family-members/${familyMemberId}/health-records`);
    
    return {
      success: true,
      data: response.data.data?.healthRecords || [],
      message: response.data.message || 'Health records fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching family health records:', error);
    return {
      success: false,
      data: [],
      message: error.response?.data?.message || 'Failed to fetch health records',
      error: error.response?.data?.message || 'Failed to fetch health records'
    };
  }
};

/**
 * Get family vaccinations for a specific family member
 * @param {string} familyMemberId - Family member ID
 * @returns {Promise<Object>} Response with vaccination records
 */
export const getFamilyVaccinations = async (familyMemberId) => {
  try {
    const response = await axiosInstance.get(`/family-members/${familyMemberId}/vaccinations`);
    
    return {
      success: true,
      data: response.data.data?.vaccinations || [],
      message: response.data.message || 'Vaccinations fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching family vaccinations:', error);
    return {
      success: false,
      data: [],
      message: error.response?.data?.message || 'Failed to fetch vaccinations',
      error: error.response?.data?.message || 'Failed to fetch vaccinations'
    };
  }
};

/**
 * Get family members by relationship type
 * @param {string} relationship - Relationship type
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Response with filtered family members
 */
export const getFamilyMembersByRelationship = async (relationship, userId) => {
  try {
    return await getFamilyMembers(userId, { relationship });
  } catch (error) {
    console.error('Error fetching family members by relationship:', error);
    return {
      success: false,
      data: [],
      message: error.response?.data?.message || 'Failed to fetch family members by relationship',
      error: error.response?.data?.message || 'Failed to fetch family members by relationship'
    };
  }
};

// TODO: Backend endpoints need to be implemented:
// - GET /api/family-members
// - GET /api/family-members/:id
// - POST /api/family-members
// - PUT /api/family-members/:id
// - DELETE /api/family-members/:id
// - GET /api/family-members/health-summary/:userId
// - POST /api/family-members/:id/link
// - GET /api/family-members/:id/health-records
// - GET /api/family-members/:id/vaccinations

export default {
  getFamilyMembers,
  getFamilyMemberById,
  addFamilyMember,
  updateFamilyMember,
  deleteFamilyMember,
  getFamilyHealthSummary,
  linkExistingUser,
  getFamilyHealthRecords,
  getFamilyVaccinations,
  getFamilyMembersByRelationship
};