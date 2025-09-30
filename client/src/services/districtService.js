import axios from '../config/axios.js';

/**
 * District Service Module
 * Handles all district-related API operations including CRUD operations,
 * pagination, filtering, and district-specific functionality.
 */

/**
 * Get all districts with optional pagination, filtering, and sorting
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 10)
 * @param {string} params.search - Search term for district name
 * @param {string} params.state - Filter by state
 * @param {string} params.status - Filter by status (active, inactive)
 * @param {string} params.sortBy - Field to sort by (default: 'createdAt')
 * @param {string} params.sortOrder - Sort order ('asc' or 'desc', default: 'desc')
 * @returns {Promise<Object>} Response with districts data and pagination info
 */
export const getAllDistricts = async (params = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      state = '',
      status = '',
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
    if (state) queryParams.append('state', state);
    if (status) queryParams.append('status', status);

    // TODO: Backend endpoint needs to be implemented at /districts
    const response = await axios.get(`/districts?${queryParams.toString()}`);
    
    return {
      success: true,
      data: response.data.districts || [],
      pagination: response.data.pagination || {
        currentPage: page,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: limit
      },
      message: 'Districts fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching districts:', error);
    return {
      success: false,
      data: [],
      pagination: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 },
      message: error.response?.data?.message || 'Failed to fetch districts'
    };
  }
};

/**
 * Get a single district by ID
 * @param {string} id - District ID
 * @returns {Promise<Object>} Response with district data
 */
export const getDistrictById = async (id) => {
  try {
    if (!id) {
      throw new Error('District ID is required');
    }

    // TODO: Backend endpoint needs to be implemented at /api/districts/:id
    const response = await axios.get(`/districts/${id}`);
    
    return {
      success: true,
      data: response.data.district || null,
      message: 'District fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching district:', error);
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || 'Failed to fetch district'
    };
  }
};

/**
 * Create a new district
 * @param {Object} districtData - District information
 * @param {string} districtData.name - District name
 * @param {string} districtData.state - State name
 * @param {string} districtData.code - District code
 * @param {string} districtData.districtOfficer - District officer user ID
 * @param {Object} districtData.demographics - Population and demographic data
 * @param {Object} districtData.healthInfrastructure - Health facility counts
 * @param {string} districtData.status - District status
 * @returns {Promise<Object>} Response with created district data
 */
export const createDistrict = async (districtData) => {
  try {
    if (!districtData || !districtData.name || !districtData.state || !districtData.code) {
      throw new Error('Required district fields are missing');
    }

    // TODO: Backend endpoint needs to be implemented at /api/districts
    const response = await axios.post('/districts', districtData);
    
    return {
      success: true,
      data: response.data.district || null,
      message: 'District created successfully'
    };
  } catch (error) {
    console.error('Error creating district:', error);
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || 'Failed to create district'
    };
  }
};

/**
 * Update an existing district
 * @param {string} id - District ID
 * @param {Object} districtData - Updated district information
 * @returns {Promise<Object>} Response with updated district data
 */
export const updateDistrict = async (id, districtData) => {
  try {
    if (!id) {
      throw new Error('District ID is required');
    }
    
    if (!districtData) {
      throw new Error('District data is required');
    }

    // TODO: Backend endpoint needs to be implemented at /api/districts/:id
    const response = await axios.put(`/districts/${id}`, districtData);
    
    return {
      success: true,
      data: response.data.district || null,
      message: 'District updated successfully'
    };
  } catch (error) {
    console.error('Error updating district:', error);
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || 'Failed to update district'
    };
  }
};

/**
 * Delete a district
 * @param {string} id - District ID
 * @returns {Promise<Object>} Response with deletion confirmation
 */
export const deleteDistrict = async (id) => {
  try {
    if (!id) {
      throw new Error('District ID is required');
    }

    // TODO: Backend endpoint needs to be implemented at /api/districts/:id
    const response = await axios.delete(`/districts/${id}`);
    
    return {
      success: true,
      data: null,
      message: 'District deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting district:', error);
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || 'Failed to delete district'
    };
  }
};

/**
 * Generate a new block registration token for a district
 * @param {string} districtId - District ID
 * @param {string} blockName - Block name
 * @param {Object} options - Additional options
 * @param {Date} options.expiryDate - Token expiry date
 * @param {number} options.maxUses - Maximum number of uses
 * @returns {Promise<Object>} Response with generated token
 */
export const generateBlockToken = async (districtId, blockName, options = {}) => {
  try {
    if (!districtId || !blockName) {
      throw new Error('District ID and block name are required');
    }

    const tokenData = {
      blockName,
      expiryDate: options.expiryDate,
      maxUses: options.maxUses || 1
    };

    // TODO: Backend endpoint needs to be implemented at /api/districts/:id/blocks/token
    const response = await axios.post(`/districts/${districtId}/blocks/token`, tokenData);
    
    return {
      success: true,
      data: response.data.token || null,
      message: 'Block token generated successfully'
    };
  } catch (error) {
    console.error('Error generating block token:', error);
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || 'Failed to generate block token'
    };
  }
};

/**
 * Get all blocks for a specific district
 * @param {string} districtId - District ID
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 * @param {string} params.search - Search term for block name
 * @param {string} params.status - Filter by block status
 * @returns {Promise<Object>} Response with district blocks data
 */
export const getDistrictBlocks = async (districtId, params = {}) => {
  try {
    if (!districtId) {
      throw new Error('District ID is required');
    }

    const {
      page = 1,
      limit = 10,
      search = '',
      status = ''
    } = params;

    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    if (search) queryParams.append('search', search);
    if (status) queryParams.append('status', status);

    // TODO: Backend endpoint needs to be implemented at /api/districts/:id/blocks
    const response = await axios.get(`/districts/${districtId}/blocks?${queryParams.toString()}`);
    
    return {
      success: true,
      data: response.data.blocks || [],
      pagination: response.data.pagination || {
        currentPage: page,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: limit
      },
      message: 'District blocks fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching district blocks:', error);
    return {
      success: false,
      data: [],
      pagination: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 },
      message: error.response?.data?.message || 'Failed to fetch district blocks'
    };
  }
};

/**
 * Get district statistics and summary data
 * @param {string} districtId - District ID
 * @returns {Promise<Object>} Response with district statistics
 */
export const getDistrictStats = async (districtId) => {
  try {
    if (!districtId) {
      throw new Error('District ID is required');
    }

    // TODO: Backend endpoint needs to be implemented at /api/districts/:id/stats
    const response = await axios.get(`/districts/${districtId}/stats`);
    
    return {
      success: true,
      data: response.data.stats || {},
      message: 'District statistics fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching district statistics:', error);
    return {
      success: false,
      data: {},
      message: error.response?.data?.message || 'Failed to fetch district statistics'
    };
  }
};

/**
 * Update district status (activate/deactivate)
 * @param {string} id - District ID
 * @param {string} status - New status ('active' or 'inactive')
 * @returns {Promise<Object>} Response with updated district
 */
export const updateDistrictStatus = async (id, status) => {
  try {
    if (!id || !status) {
      throw new Error('District ID and status are required');
    }

    if (!['active', 'inactive'].includes(status)) {
      throw new Error('Invalid status. Must be "active" or "inactive"');
    }

    // TODO: Backend endpoint needs to be implemented at /api/districts/:id/status
    const response = await axios.patch(`/districts/${id}/status`, { status });
    
    return {
      success: true,
      data: response.data.district || null,
      message: `District ${status === 'active' ? 'activated' : 'deactivated'} successfully`
    };
  } catch (error) {
    console.error('Error updating district status:', error);
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || 'Failed to update district status'
    };
  }
};

/**
 * Search districts by various criteria
 * @param {Object} searchCriteria - Search parameters
 * @param {string} searchCriteria.query - General search query
 * @param {string} searchCriteria.state - Filter by state
 * @param {string} searchCriteria.districtOfficer - Filter by district officer
 * @param {Object} searchCriteria.demographics - Demographic filters
 * @returns {Promise<Object>} Response with matching districts
 */
export const searchDistricts = async (searchCriteria) => {
  try {
    // TODO: Backend endpoint needs to be implemented at /api/districts/search
    const response = await axios.post('/districts/search', searchCriteria);
    
    return {
      success: true,
      data: response.data.districts || [],
      message: 'Districts search completed successfully'
    };
  } catch (error) {
    console.error('Error searching districts:', error);
    return {
      success: false,
      data: [],
      message: error.response?.data?.message || 'Failed to search districts'
    };
  }
};

export default {
  getAllDistricts,
  getDistrictById,
  createDistrict,
  updateDistrict,
  deleteDistrict,
  generateBlockToken,
  getDistrictBlocks,
  getDistrictStats,
  updateDistrictStatus,
  searchDistricts
};