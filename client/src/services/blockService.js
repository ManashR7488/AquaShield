import axiosInstance from '../config/axios';

/**
 * Block Service
 * Handles all block-related API operations for health officers
 * All operations are scoped to the health officer's assigned district
 */

/**
 * Get all blocks for a specific district with optional filtering and pagination
 * @param {string} districtId - District ID to filter blocks
 * @param {Object} params - Query parameters for filtering, pagination, and sorting
 * @param {number} params.page - Page number for pagination (default: 1)
 * @param {number} params.limit - Number of items per page (default: 10)
 * @param {string} params.search - Search term for block name or ID
 * @param {string} params.status - Filter by block status (active, inactive, suspended)
 * @param {string} params.blockOfficer - Filter by assigned block officer ID
 * @param {string} params.sortBy - Field to sort by (name, createdAt, updatedAt, status)
 * @param {string} params.sortOrder - Sort order (asc, desc)
 * @returns {Promise<Object>} Response with blocks data, pagination info, and metadata
 */
export const getAllBlocks = async (districtId, params = {}) => {
  try {
    const queryParams = new URLSearchParams({
      district: districtId,
      ...params
    });
    
    const response = await axiosInstance.get(`/api/blocks?${queryParams}`);
    
    return {
      success: true,
      data: response.data.blocks || [],
      pagination: response.data.pagination || {},
      stats: response.data.stats || {},
      message: 'Blocks fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching blocks:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch blocks',
      data: []
    };
  }
};

/**
 * Get a single block by ID
 * @param {string} id - Block ID
 * @returns {Promise<Object>} Response with block data
 */
export const getBlockById = async (id) => {
  try {
    const response = await axiosInstance.get(`/api/blocks/${id}`);
    
    return {
      success: true,
      data: response.data.block,
      message: 'Block fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching block:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch block',
      data: null
    };
  }
};

/**
 * Create a new block
 * @param {Object} blockData - Block data to create
 * @param {string} blockData.name - Block name
 * @param {string} blockData.districtId - District ID
 * @param {string} blockData.blockOfficerId - Assigned block officer ID
 * @param {Object} blockData.geographicBoundaries - Coordinates and area info
 * @param {Object} blockData.demographics - Population and household data
 * @param {Object} blockData.healthInfrastructure - PHCs and sub-centers info
 * @param {Object} blockData.villageRegistration - Village token settings
 * @returns {Promise<Object>} Response with created block data
 */
export const createBlock = async (blockData) => {
  try {
    const response = await axiosInstance.post('/api/blocks', blockData);
    
    return {
      success: true,
      data: response.data.block,
      message: 'Block created successfully'
    };
  } catch (error) {
    console.error('Error creating block:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to create block'
    };
  }
};

/**
 * Update an existing block
 * @param {string} id - Block ID to update
 * @param {Object} blockData - Updated block data
 * @returns {Promise<Object>} Response with updated block data
 */
export const updateBlock = async (id, blockData) => {
  try {
    const response = await axiosInstance.put(`/api/blocks/${id}`, blockData);
    
    return {
      success: true,
      data: response.data.block,
      message: 'Block updated successfully'
    };
  } catch (error) {
    console.error('Error updating block:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to update block'
    };
  }
};

/**
 * Delete a block
 * @param {string} id - Block ID to delete
 * @returns {Promise<Object>} Response with deletion status
 */
export const deleteBlock = async (id) => {
  try {
    await axiosInstance.delete(`/api/blocks/${id}`);
    
    return {
      success: true,
      message: 'Block deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting block:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to delete block'
    };
  }
};

/**
 * Generate a village token for a specific block
 * @param {string} blockId - Block ID
 * @param {Object} villageData - Village data for token generation
 * @param {string} villageData.villageName - Name of the village
 * @param {number} villageData.population - Village population
 * @param {Object} villageData.coordinates - Village coordinates
 * @returns {Promise<Object>} Response with generated token data
 */
export const generateVillageToken = async (blockId, villageData) => {
  try {
    const response = await axiosInstance.post(`/api/blocks/${blockId}/village-tokens`, villageData);
    
    return {
      success: true,
      data: response.data.token,
      message: 'Village token generated successfully'
    };
  } catch (error) {
    console.error('Error generating village token:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to generate village token'
    };
  }
};

/**
 * Assign a block officer to a block
 * @param {string} blockId - Block ID
 * @param {string} userId - User ID of the officer to assign
 * @returns {Promise<Object>} Response with assignment status
 */
export const assignBlockOfficer = async (blockId, userId) => {
  try {
    const response = await axiosInstance.post(`/api/blocks/${blockId}/assign-officer`, {
      blockOfficerId: userId
    });
    
    return {
      success: true,
      data: response.data,
      message: 'Block officer assigned successfully'
    };
  } catch (error) {
    console.error('Error assigning block officer:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to assign block officer'
    };
  }
};

/**
 * Get all staff assigned to a specific block
 * @param {string} blockId - Block ID
 * @param {Object} params - Query parameters for filtering
 * @returns {Promise<Object>} Response with staff data
 */
export const getBlockStaff = async (blockId, params = {}) => {
  try {
    const queryParams = new URLSearchParams(params);
    const response = await axiosInstance.get(`/api/blocks/${blockId}/staff?${queryParams}`);
    
    return {
      success: true,
      data: response.data.staff || [],
      message: 'Block staff fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching block staff:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch block staff',
      data: []
    };
  }
};

/**
 * Assign staff (ASHA workers, volunteers) to a block
 * @param {string} blockId - Block ID
 * @param {Object} staffData - Staff assignment data
 * @param {string} staffData.staffId - Staff member ID
 * @param {string} staffData.role - Role assignment (asha_worker, volunteer)
 * @param {Array} staffData.villageIds - Array of village IDs to assign
 * @param {Date} staffData.startDate - Assignment start date
 * @param {Array} staffData.responsibilities - List of responsibilities
 * @returns {Promise<Object>} Response with assignment status
 */
export const assignStaffToBlock = async (blockId, staffData) => {
  try {
    const response = await axiosInstance.post(`/api/blocks/${blockId}/assign-staff`, staffData);
    
    return {
      success: true,
      data: response.data,
      message: 'Staff assigned to block successfully'
    };
  } catch (error) {
    console.error('Error assigning staff to block:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to assign staff to block'
    };
  }
};

/**
 * Remove staff from a block assignment
 * @param {string} blockId - Block ID
 * @param {string} staffId - Staff ID to remove
 * @returns {Promise<Object>} Response with removal status
 */
export const removeStaffFromBlock = async (blockId, staffId) => {
  try {
    const response = await axiosInstance.delete(`/api/blocks/${blockId}/staff/${staffId}`);
    
    return {
      success: true,
      data: response.data,
      message: 'Staff removed from block successfully'
    };
  } catch (error) {
    console.error('Error removing staff from block:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to remove staff from block'
    };
  }
};

/**
 * Get all villages within a specific block
 * @param {string} blockId - Block ID
 * @param {Object} params - Query parameters for filtering
 * @returns {Promise<Object>} Response with villages data
 */
export const getBlockVillages = async (blockId, params = {}) => {
  try {
    const queryParams = new URLSearchParams(params);
    const response = await axiosInstance.get(`/api/blocks/${blockId}/villages?${queryParams}`);
    
    return {
      success: true,
      data: response.data.villages || [],
      pagination: response.data.pagination || {},
      message: 'Block villages fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching block villages:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch block villages',
      data: []
    };
  }
};

/**
 * Update block status (active, inactive, suspended)
 * @param {string} blockId - Block ID
 * @param {string} status - New status
 * @returns {Promise<Object>} Response with updated status
 */
export const updateBlockStatus = async (blockId, status) => {
  try {
    const response = await axiosInstance.patch(`/api/blocks/${blockId}/status`, { status });
    
    return {
      success: true,
      data: response.data.block,
      message: 'Block status updated successfully'
    };
  } catch (error) {
    console.error('Error updating block status:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to update block status'
    };
  }
};

/**
 * Get block statistics and analytics
 * @param {string} blockId - Block ID
 * @returns {Promise<Object>} Response with block statistics
 */
export const getBlockStats = async (blockId) => {
  try {
    const response = await axiosInstance.get(`/api/blocks/${blockId}/stats`);
    
    return {
      success: true,
      data: response.data.stats,
      message: 'Block statistics fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching block stats:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch block statistics',
      data: {}
    };
  }
};

/**
 * Get blocks summary for a district (for dashboard cards)
 * @param {string} districtId - District ID
 * @returns {Promise<Object>} Response with blocks summary
 */
export const getDistrictBlocksSummary = async (districtId) => {
  try {
    const response = await axiosInstance.get(`/api/districts/${districtId}/blocks/summary`);
    
    return {
      success: true,
      data: response.data.summary,
      message: 'District blocks summary fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching district blocks summary:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch blocks summary',
      data: {
        totalBlocks: 0,
        activeBlocks: 0,
        totalVillages: 0,
        totalStaff: 0
      }
    };
  }
};

// TODO: Backend endpoints need to be implemented
// - GET /api/blocks - Get all blocks with district filtering
// - GET /api/blocks/:id - Get single block
// - POST /api/blocks - Create new block
// - PUT /api/blocks/:id - Update block
// - DELETE /api/blocks/:id - Delete block
// - POST /api/blocks/:id/village-tokens - Generate village token
// - POST /api/blocks/:id/assign-officer - Assign block officer
// - GET /api/blocks/:id/staff - Get block staff
// - POST /api/blocks/:id/assign-staff - Assign staff to block
// - GET /api/blocks/:id/villages - Get block villages
// - PATCH /api/blocks/:id/status - Update block status
// - GET /api/blocks/:id/stats - Get block statistics
// - GET /api/districts/:id/blocks/summary - Get district blocks summary

export default {
  getAllBlocks,
  getBlockById,
  createBlock,
  updateBlock,
  deleteBlock,
  generateVillageToken,
  assignBlockOfficer,
  getBlockStaff,
  assignStaffToBlock,
  removeStaffFromBlock,
  getBlockVillages,
  updateBlockStatus,
  getBlockStats,
  getDistrictBlocksSummary
};