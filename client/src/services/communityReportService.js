import axiosInstance from '../config/axios';

/**
 * Community Report Service
 * Handles all community reporting API operations for volunteers
 * All operations are scoped to the volunteer's assigned areas
 */

/**
 * Get all community reports for assigned areas
 * @param {Object} params - Query parameters for filtering and pagination
 * @param {Array|string} params.areaIds - Area IDs to filter reports (can be array or single ID)
 * @param {string} params.villageId - Village ID to filter reports (deprecated, use areaIds)
 * @param {number} params.page - Page number for pagination
 * @param {number} params.limit - Number of items per page
 * @param {string} params.search - Search term for filtering
 * @param {string} params.reportType - Filter by report type
 * @param {string} params.priority - Filter by priority level
 * @param {string} params.status - Filter by status
 * @param {string} params.sortBy - Field to sort by
 * @param {string} params.sortOrder - Sort order (asc/desc)
 * @returns {Promise<Object>} Response with community reports data
 */
export const getAllCommunityReports = async (params = {}) => {
  try {
    // Handle both new areaIds format and legacy villageId format
    const queryParams = { ...params };
    
    // Convert areaIds to comma-separated string if it's an array
    if (params.areaIds && Array.isArray(params.areaIds)) {
      queryParams.areaIds = params.areaIds.join(',');
    }
    
    // Support legacy villageId parameter
    if (params.villageId && !params.areaIds) {
      queryParams.areaIds = params.villageId;
      delete queryParams.villageId;
    }
    
    const response = await axiosInstance.get('/api/community-observations', { params: queryParams });
    
    return {
      success: true,
      data: response.data.data || response.data.reports || [],
      total: response.data.total || 0,
      pagination: response.data.pagination || {},
      message: response.data.message || 'Community reports fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching community reports:', error);
    return {
      success: false,
      data: [],
      total: 0,
      message: error.response?.data?.message || 'Failed to fetch community reports',
      error: error.response?.data?.message || 'Failed to fetch community reports'
    };
  }
};

/**
 * Get community report by ID
 * @param {string} id - Report ID
 * @returns {Promise<Object>} Response with report data
 */
export const getCommunityReportById = async (id) => {
  try {
    const response = await axiosInstance.get(`/api/community-observations/${id}`);
    
    return {
      success: true,
      data: response.data.data || response.data.report || {},
      message: response.data.message || 'Community report fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching community report:', error);
    return {
      success: false,
      data: {},
      message: error.response?.data?.message || 'Failed to fetch community report',
      error: error.response?.data?.message || 'Failed to fetch community report'
    };
  }
};

/**
 * Create a new community report
 * @param {Object|FormData} reportData - Community report data (can be FormData for file uploads)
 * @param {string} reportData.reportType - Type of report (infrastructure_issue, health_concern, safety_issue, environmental_problem, water_contamination)
 * @param {string} reportData.issueDescription - Description of the issue
 * @param {Object} reportData.location - Location details
 * @param {number} reportData.affectedPopulation - Number of people affected
 * @param {string} reportData.priority - Priority level (low, medium, high, urgent)
 * @param {Array} reportData.evidence - Evidence files/photos
 * @param {string} reportData.immediateActions - Actions taken immediately
 * @param {Object} reportData.contactInfo - Contact information for follow-up
 * @returns {Promise<Object>} Response with created report data
 */
export const createCommunityReport = async (reportData) => {
  try {
    const config = {};
    
    // Set content type for FormData
    if (reportData instanceof FormData) {
      config.headers = { 'Content-Type': 'multipart/form-data' };
    }
    
    const response = await axiosInstance.post('/api/community-observations', reportData, config);
    
    return {
      success: true,
      data: response.data.data || response.data.report || {},
      message: response.data.message || 'Community report created successfully'
    };
  } catch (error) {
    console.error('Error creating community report:', error);
    return {
      success: false,
      data: {},
      message: error.response?.data?.message || 'Failed to create community report',
      error: error.response?.data?.message || 'Failed to create community report'
    };
  }
};

/**
 * Update community report
 * @param {string} id - Report ID
 * @param {Object|FormData} reportData - Updated report data (can be FormData for file uploads)
 * @returns {Promise<Object>} Response with updated report data
 */
export const updateCommunityReport = async (id, reportData) => {
  try {
    const config = {};
    
    // Set content type for FormData
    if (reportData instanceof FormData) {
      config.headers = { 'Content-Type': 'multipart/form-data' };
    }
    
    const response = await axiosInstance.put(`/api/community-observations/${id}`, reportData, config);
    
    return {
      success: true,
      data: response.data.data || response.data.report || {},
      message: response.data.message || 'Community report updated successfully'
    };
  } catch (error) {
    console.error('Error updating community report:', error);
    return {
      success: false,
      data: {},
      message: error.response?.data?.message || 'Failed to update community report',
      error: error.response?.data?.message || 'Failed to update community report'
    };
  }
};

/**
 * Delete community report
 * @param {string} id - Report ID
 * @returns {Promise<Object>} Response with deletion status
 */
export const deleteCommunityReport = async (id) => {
  try {
    await axiosInstance.delete(`/api/community-observations/${id}`);
    
    return {
      success: true,
      message: 'Community report deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting community report:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to delete community report'
    };
  }
};

/**
 * Get community report statistics for a village
 * @param {string} villageId - Village ID
 * @returns {Promise<Object>} Response with report statistics
 */
export const getCommunityReportStats = async (villageId) => {
  try {
    const response = await axiosInstance.get(`/api/community-observations/stats/${villageId}`);
    
    return {
      success: true,
      data: response.data.stats || {},
      message: 'Community report stats fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching community report stats:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch community report stats'
    };
  }
};

/**
 * Create infrastructure issue report
 * @param {string} villageId - Village ID
 * @param {Object} issueData - Infrastructure issue data
 * @returns {Promise<Object>} Response with created report
 */
export const createInfrastructureIssue = async (villageId, issueData) => {
  try {
    const reportData = {
      ...issueData,
      reportType: 'infrastructure_issue',
      villageId
    };
    
    return await createCommunityReport(reportData);
  } catch (error) {
    console.error('Error creating infrastructure issue:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to create infrastructure issue'
    };
  }
};

/**
 * Create health concern report
 * @param {string} villageId - Village ID
 * @param {Object} healthData - Health concern data
 * @returns {Promise<Object>} Response with created report
 */
export const createHealthConcern = async (villageId, healthData) => {
  try {
    const reportData = {
      ...healthData,
      reportType: 'health_concern',
      villageId
    };
    
    return await createCommunityReport(reportData);
  } catch (error) {
    console.error('Error creating health concern:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to create health concern'
    };
  }
};

/**
 * Create safety issue report
 * @param {string} villageId - Village ID
 * @param {Object} safetyData - Safety issue data
 * @returns {Promise<Object>} Response with created report
 */
export const createSafetyIssue = async (villageId, safetyData) => {
  try {
    const reportData = {
      ...safetyData,
      reportType: 'safety_issue',
      villageId
    };
    
    return await createCommunityReport(reportData);
  } catch (error) {
    console.error('Error creating safety issue:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to create safety issue'
    };
  }
};

/**
 * Get reports by type for a village
 * @param {string} reportType - Type of report to filter
 * @param {string} villageId - Village ID
 * @returns {Promise<Object>} Response with filtered reports
 */
export const getReportsByType = async (reportType, villageId) => {
  try {
    return await getAllCommunityReports(villageId, { reportType });
  } catch (error) {
    console.error('Error fetching reports by type:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch reports by type'
    };
  }
};

/**
 * Submit urgent alert
 * @param {string} villageId - Village ID
 * @param {Object} alertData - Urgent alert data
 * @returns {Promise<Object>} Response with submitted alert
 */
export const submitUrgentAlert = async (villageId, alertData) => {
  try {
    const reportData = {
      ...alertData,
      priority: 'urgent',
      villageId
    };
    
    return await createCommunityReport(reportData);
  } catch (error) {
    console.error('Error submitting urgent alert:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to submit urgent alert'
    };
  }
};

/**
 * Escalate observation to higher authority
 * @param {string} observationId - Observation ID
 * @param {Object} escalationData - Escalation details
 * @returns {Promise<Object>} Response with escalation result
 */
export const escalateObservation = async (observationId, escalationData) => {
  try {
    const response = await axiosInstance.post(`/api/community-observations/${observationId}/escalate`, escalationData);
    
    return {
      success: true,
      data: response.data.observation,
      message: 'Observation escalated successfully'
    };
  } catch (error) {
    console.error('Error escalating observation:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to escalate observation'
    };
  }
};

/**
 * Add follow-up to community observation
 * @param {string} observationId - Observation ID
 * @param {Object} followUpData - Follow-up data
 * @returns {Promise<Object>} Response with updated observation
 */
export const addFollowUp = async (observationId, followUpData) => {
  try {
    const response = await axiosInstance.post(`/api/community-observations/${observationId}/follow-up`, followUpData);
    
    return {
      success: true,
      data: response.data.observation,
      message: 'Follow-up added successfully'
    };
  } catch (error) {
    console.error('Error adding follow-up:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to add follow-up'
    };
  }
};

/**
 * Get observations by area
 * @param {string} areaId - Area ID
 * @returns {Promise<Object>} Response with area observations
 */
export const getObservationsByArea = async (areaId) => {
  try {
    const response = await axiosInstance.get(`/api/community-observations/area/${areaId}`);
    
    return {
      success: true,
      data: response.data.observations || [],
      message: 'Area observations fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching area observations:', error);
    return {
      success: false,
      data: [],
      error: error.response?.data?.message || 'Failed to fetch area observations'
    };
  }
};

/**
 * Get observation patterns analysis
 * @param {Object} params - Analysis parameters
 * @returns {Promise<Object>} Response with pattern analysis
 */
export const getObservationPatterns = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/api/community-observations/patterns/analysis', { params });
    
    return {
      success: true,
      data: response.data.patterns,
      message: 'Pattern analysis completed successfully'
    };
  } catch (error) {
    console.error('Error fetching observation patterns:', error);
    return {
      success: false,
      data: {},
      error: error.response?.data?.message || 'Failed to fetch observation patterns'
    };
  }
};

/**
 * Generate comprehensive community report
 * @param {Object} params - Report parameters
 * @returns {Promise<Object>} Response with community report
 */
export const generateCommunityReport = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/api/community-observations/reports/community', { params });
    
    return {
      success: true,
      data: response.data.report,
      message: 'Community report generated successfully'
    };
  } catch (error) {
    console.error('Error generating community report:', error);
    return {
      success: false,
      data: {},
      error: error.response?.data?.message || 'Failed to generate community report'
    };
  }
};

// Enhanced backend endpoints implemented:
// - GET /api/community-observations - Get all community observations with filtering
// - GET /api/community-observations/:id - Get single community observation
// - POST /api/community-observations - Create new community observation
// - PUT /api/community-observations/:id - Update community observation
// - DELETE /api/community-observations/:id - Delete community observation (deprecated)
// - POST /api/community-observations/:id/escalate - Escalate observation to higher authority
// - POST /api/community-observations/:id/follow-up - Add follow-up to observation
// - GET /api/community-observations/area/:areaId - Get observations by area
// - GET /api/community-observations/patterns/analysis - Get observation patterns analysis
// - GET /api/community-observations/reports/community - Generate comprehensive community report

export default {
  getAllCommunityReports,
  getCommunityReportById,
  createCommunityReport,
  updateCommunityReport,
  deleteCommunityReport,
  getCommunityReportStats,
  createInfrastructureIssue,
  createHealthConcern,
  createSafetyIssue,
  getReportsByType,
  submitUrgentAlert,
  escalateObservation,
  addFollowUp,
  getObservationsByArea,
  getObservationPatterns,
  generateCommunityReport
};