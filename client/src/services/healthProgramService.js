import axiosInstance from '../config/axios';

/**
 * Health Program Service
 * Handles all health program-related API operations for health officers
 * All operations are scoped to the health officer's assigned district
 */

/**
 * Get all health programs for a specific district with optional filtering and pagination
 * @param {string} districtId - District ID to filter health programs
 * @param {Object} params - Query parameters for filtering, pagination, and sorting
 * @param {number} params.page - Page number for pagination (default: 1)
 * @param {number} params.limit - Number of items per page (default: 10)
 * @param {string} params.search - Search term for program name or description
 * @param {string} params.type - Filter by program type (vaccination, health_screening, awareness, water_quality)
 * @param {string} params.status - Filter by status (active, completed, paused, planned)
 * @param {string} params.targetDemographic - Filter by target demographic
 * @param {string} params.sortBy - Field to sort by (name, createdAt, startDate, endDate, status)
 * @param {string} params.sortOrder - Sort order (asc, desc)
 * @returns {Promise<Object>} Response with health programs data, pagination info, and metadata
 */
export const getAllHealthPrograms = async (districtId, params = {}) => {
  try {
    const queryParams = new URLSearchParams({
      district: districtId,
      ...params
    });
    
    const response = await axiosInstance.get(`/api/health-programs?${queryParams}`);
    
    return {
      success: true,
      data: response.data.programs || [],
      pagination: response.data.pagination || {},
      stats: response.data.stats || {},
      message: 'Health programs fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching health programs:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch health programs',
      data: []
    };
  }
};

/**
 * Get a single health program by ID
 * @param {string} id - Health program ID
 * @returns {Promise<Object>} Response with health program data
 */
export const getHealthProgramById = async (id) => {
  try {
    const response = await axiosInstance.get(`/api/health-programs/${id}`);
    
    return {
      success: true,
      data: response.data.program,
      message: 'Health program fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching health program:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch health program',
      data: null
    };
  }
};

/**
 * Create a new health program
 * @param {Object} programData - Health program data to create
 * @param {string} programData.name - Program name
 * @param {string} programData.description - Program description
 * @param {string} programData.type - Program type (vaccination, health_screening, awareness, water_quality)
 * @param {string} programData.districtId - District ID
 * @param {Object} programData.targetDemographics - Target demographics info
 * @param {Array} programData.assignedBlocks - Array of block IDs
 * @param {Date} programData.startDate - Program start date
 * @param {Date} programData.endDate - Program end date
 * @param {number} programData.budgetAllocation - Budget allocation
 * @param {Object} programData.successMetrics - Success metrics definition
 * @returns {Promise<Object>} Response with created health program data
 */
export const createHealthProgram = async (programData) => {
  try {
    const response = await axiosInstance.post('/api/health-programs', programData);
    
    return {
      success: true,
      data: response.data.program,
      message: 'Health program created successfully'
    };
  } catch (error) {
    console.error('Error creating health program:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to create health program'
    };
  }
};

/**
 * Update an existing health program
 * @param {string} id - Health program ID to update
 * @param {Object} programData - Updated health program data
 * @returns {Promise<Object>} Response with updated health program data
 */
export const updateHealthProgram = async (id, programData) => {
  try {
    const response = await axiosInstance.put(`/api/health-programs/${id}`, programData);
    
    return {
      success: true,
      data: response.data.program,
      message: 'Health program updated successfully'
    };
  } catch (error) {
    console.error('Error updating health program:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to update health program'
    };
  }
};

/**
 * Delete a health program
 * @param {string} id - Health program ID to delete
 * @returns {Promise<Object>} Response with deletion status
 */
export const deleteHealthProgram = async (id) => {
  try {
    await axiosInstance.delete(`/api/health-programs/${id}`);
    
    return {
      success: true,
      message: 'Health program deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting health program:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to delete health program'
    };
  }
};

/**
 * Get health program statistics and analytics
 * @param {string} id - Health program ID
 * @returns {Promise<Object>} Response with program statistics
 */
export const getHealthProgramStats = async (id) => {
  try {
    const response = await axiosInstance.get(`/api/health-programs/${id}/stats`);
    
    return {
      success: true,
      data: response.data.stats,
      message: 'Health program statistics fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching health program stats:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch health program statistics',
      data: {}
    };
  }
};

/**
 * Assign health program to additional blocks
 * @param {string} programId - Health program ID
 * @param {Array} blockIds - Array of block IDs to assign
 * @returns {Promise<Object>} Response with assignment status
 */
export const assignProgramToBlocks = async (programId, blockIds) => {
  try {
    const response = await axiosInstance.post(`/api/health-programs/${programId}/assign-blocks`, {
      blockIds
    });
    
    return {
      success: true,
      data: response.data,
      message: 'Health program assigned to blocks successfully'
    };
  } catch (error) {
    console.error('Error assigning program to blocks:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to assign program to blocks'
    };
  }
};

/**
 * Get participants of a specific health program
 * @param {string} programId - Health program ID
 * @param {Object} params - Query parameters for filtering
 * @returns {Promise<Object>} Response with participants data
 */
export const getProgramParticipants = async (programId, params = {}) => {
  try {
    const queryParams = new URLSearchParams(params);
    const response = await axiosInstance.get(`/api/health-programs/${programId}/participants?${queryParams}`);
    
    return {
      success: true,
      data: response.data.participants || [],
      pagination: response.data.pagination || {},
      message: 'Program participants fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching program participants:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch program participants',
      data: []
    };
  }
};

/**
 * Update health program status
 * @param {string} id - Health program ID
 * @param {string} status - New status (active, completed, paused, planned)
 * @returns {Promise<Object>} Response with updated status
 */
export const updateProgramStatus = async (id, status) => {
  try {
    const response = await axiosInstance.patch(`/api/health-programs/${id}/status`, { status });
    
    return {
      success: true,
      data: response.data.program,
      message: 'Health program status updated successfully'
    };
  } catch (error) {
    console.error('Error updating program status:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to update program status'
    };
  }
};

/**
 * Generate health program report
 * @param {string} programId - Health program ID
 * @param {Object} params - Report parameters
 * @param {string} params.reportType - Type of report (summary, detailed, progress)
 * @param {Date} params.startDate - Report start date
 * @param {Date} params.endDate - Report end date
 * @param {Array} params.blocks - Specific blocks to include in report
 * @returns {Promise<Object>} Response with generated report
 */
export const generateProgramReport = async (programId, params = {}) => {
  try {
    const response = await axiosInstance.post(`/api/health-programs/${programId}/reports`, params);
    
    return {
      success: true,
      data: response.data.report,
      message: 'Health program report generated successfully'
    };
  } catch (error) {
    console.error('Error generating program report:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to generate program report'
    };
  }
};

/**
 * Get health programs by type for a specific district
 * @param {string} type - Program type (vaccination, health_screening, awareness, water_quality)
 * @param {string} districtId - District ID
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>} Response with filtered programs
 */
export const getProgramsByType = async (type, districtId, params = {}) => {
  try {
    const queryParams = new URLSearchParams({
      type,
      district: districtId,
      ...params
    });
    
    const response = await axiosInstance.get(`/api/health-programs/by-type?${queryParams}`);
    
    return {
      success: true,
      data: response.data.programs || [],
      message: 'Programs by type fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching programs by type:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch programs by type',
      data: []
    };
  }
};

/**
 * Get active health programs summary for dashboard
 * @param {string} districtId - District ID
 * @returns {Promise<Object>} Response with active programs summary
 */
export const getActiveProgramsSummary = async (districtId) => {
  try {
    const response = await axiosInstance.get(`/api/districts/${districtId}/health-programs/summary`);
    
    return {
      success: true,
      data: response.data.summary,
      message: 'Active programs summary fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching active programs summary:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch programs summary',
      data: {
        totalPrograms: 0,
        activePrograms: 0,
        totalParticipants: 0,
        completionRate: 0
      }
    };
  }
};

/**
 * Add participants to a health program
 * @param {string} programId - Health program ID
 * @param {Array} participants - Array of participant data
 * @returns {Promise<Object>} Response with added participants
 */
export const addProgramParticipants = async (programId, participants) => {
  try {
    const response = await axiosInstance.post(`/api/health-programs/${programId}/add-participants`, {
      participants
    });
    
    return {
      success: true,
      data: response.data,
      message: 'Participants added successfully'
    };
  } catch (error) {
    console.error('Error adding participants:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to add participants'
    };
  }
};

/**
 * Get program performance metrics
 * @param {string} programId - Health program ID
 * @param {Object} params - Metrics parameters
 * @returns {Promise<Object>} Response with performance metrics
 */
export const getProgramMetrics = async (programId, params = {}) => {
  try {
    const queryParams = new URLSearchParams(params);
    const response = await axiosInstance.get(`/api/health-programs/${programId}/metrics?${queryParams}`);
    
    return {
      success: true,
      data: response.data.metrics,
      message: 'Program metrics fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching program metrics:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch program metrics',
      data: {}
    };
  }
};

/**
 * Update program budget allocation
 * @param {string} programId - Health program ID
 * @param {number} newBudget - New budget allocation
 * @param {string} reason - Reason for budget change
 * @returns {Promise<Object>} Response with updated budget
 */
export const updateProgramBudget = async (programId, newBudget, reason) => {
  try {
    const response = await axiosInstance.patch(`/api/health-programs/${programId}/budget`, {
      budgetAllocation: newBudget,
      reason
    });
    
    return {
      success: true,
      data: response.data.program,
      message: 'Program budget updated successfully'
    };
  } catch (error) {
    console.error('Error updating program budget:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to update program budget'
    };
  }
};

// TODO: Backend endpoints need to be implemented
// - GET /api/health-programs - Get all health programs with district filtering
// - GET /api/health-programs/:id - Get single health program
// - POST /api/health-programs - Create new health program
// - PUT /api/health-programs/:id - Update health program
// - DELETE /api/health-programs/:id - Delete health program
// - GET /api/health-programs/:id/stats - Get program statistics
// - POST /api/health-programs/:id/assign-blocks - Assign program to blocks
// - GET /api/health-programs/:id/participants - Get program participants
// - PATCH /api/health-programs/:id/status - Update program status
// - POST /api/health-programs/:id/reports - Generate program report
// - GET /api/health-programs/by-type - Get programs by type
// - GET /api/districts/:id/health-programs/summary - Get district programs summary
// - POST /api/health-programs/:id/add-participants - Add participants
// - GET /api/health-programs/:id/metrics - Get program metrics
// - PATCH /api/health-programs/:id/budget - Update program budget

export default {
  getAllHealthPrograms,
  getHealthProgramById,
  createHealthProgram,
  updateHealthProgram,
  deleteHealthProgram,
  getHealthProgramStats,
  assignProgramToBlocks,
  getProgramParticipants,
  updateProgramStatus,
  generateProgramReport,
  getProgramsByType,
  getActiveProgramsSummary,
  addProgramParticipants,
  getProgramMetrics,
  updateProgramBudget
};