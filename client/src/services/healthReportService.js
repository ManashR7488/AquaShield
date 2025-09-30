import axiosInstance from '../config/axios';

/**
 * Health Report Service
 * Handles all health report-related API operations for ASHA workers
 * All operations are scoped to the ASHA worker's assigned villages
 */

/**
 * Get all health reports for specific villages with optional filtering and pagination
 * @param {string} villageId - Village ID to filter health reports
 * @param {Object} params - Query parameters for filtering, pagination, and sorting
 * @param {number} params.page - Page number for pagination (default: 1)
 * @param {number} params.limit - Number of items per page (default: 10)
 * @param {string} params.search - Search term for report title or description
 * @param {string} params.reportType - Filter by report type
 * @param {string} params.status - Filter by status (draft, submitted, approved)
 * @param {string} params.priority - Filter by priority level
 * @param {string} params.dateRange - Filter by date range
 * @param {string} params.sortBy - Field to sort by (createdAt, reportDate, priority)
 * @param {string} params.sortOrder - Sort order (asc, desc)
 * @returns {Promise<Object>} Response with health report data and pagination info
 */
export const getAllHealthReports = async (villageId, params = {}) => {
  try {
    const queryParams = new URLSearchParams({
      village: villageId,
      ...params
    });
    
    const response = await axiosInstance.get(`/api/health-reports?${queryParams}`);
    
    return {
      success: true,
      data: response.data.reports || [],
      pagination: response.data.pagination || {},
      stats: response.data.stats || {},
      message: 'Health reports fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching health reports:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch health reports',
      data: []
    };
  }
};

/**
 * Get a single health report by ID
 * @param {string} id - Health report ID
 * @returns {Promise<Object>} Response with health report data
 */
export const getHealthReportById = async (id) => {
  try {
    const response = await axiosInstance.get(`/api/health-reports/${id}`);
    
    return {
      success: true,
      data: response.data.report,
      message: 'Health report fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching health report:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch health report',
      data: null
    };
  }
};

/**
 * Create a new health report
 * @param {Object} reportData - Health report data to create
 * @returns {Promise<Object>} Response with created health report data
 */
export const createHealthReport = async (reportData) => {
  try {
    const response = await axiosInstance.post('/api/health-reports', reportData);
    
    return {
      success: true,
      data: response.data.report,
      message: 'Health report created successfully'
    };
  } catch (error) {
    console.error('Error creating health report:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to create health report'
    };
  }
};

/**
 * Update an existing health report
 * @param {string} id - Health report ID to update
 * @param {Object} reportData - Updated health report data
 * @returns {Promise<Object>} Response with updated health report data
 */
export const updateHealthReport = async (id, reportData) => {
  try {
    const response = await axiosInstance.put(`/api/health-reports/${id}`, reportData);
    
    return {
      success: true,
      data: response.data.report,
      message: 'Health report updated successfully'
    };
  } catch (error) {
    console.error('Error updating health report:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to update health report'
    };
  }
};

/**
 * Delete a health report
 * @param {string} id - Health report ID to delete
 * @returns {Promise<Object>} Response with deletion status
 */
export const deleteHealthReport = async (id) => {
  try {
    const response = await axiosInstance.delete(`/api/health-reports/${id}`);
    
    return {
      success: true,
      message: 'Health report deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting health report:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to delete health report'
    };
  }
};

/**
 * Get health report statistics for village
 * @param {string} villageId - Village ID
 * @returns {Promise<Object>} Response with health report statistics
 */
export const getHealthReportStats = async (villageId) => {
  try {
    const response = await axiosInstance.get(`/api/villages/${villageId}/health-report-stats`);
    
    return {
      success: true,
      data: response.data.stats,
      message: 'Health report statistics fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching health report stats:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch health report statistics',
      data: {}
    };
  }
};

/**
 * Create disease outbreak report
 * @param {string} villageId - Village ID
 * @param {Object} diseaseData - Disease outbreak data
 * @returns {Promise<Object>} Response with created disease outbreak report
 */
export const createDiseaseOutbreakReport = async (villageId, diseaseData) => {
  try {
    const reportData = {
      ...diseaseData,
      villageId,
      reportType: 'disease_outbreak'
    };
    
    const response = await axiosInstance.post('/api/health-reports/disease-outbreak', reportData);
    
    return {
      success: true,
      data: response.data.report,
      message: 'Disease outbreak report created successfully'
    };
  } catch (error) {
    console.error('Error creating disease outbreak report:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to create disease outbreak report'
    };
  }
};

/**
 * Create water quality report
 * @param {string} villageId - Village ID
 * @param {Object} waterData - Water quality data
 * @returns {Promise<Object>} Response with created water quality report
 */
export const createWaterQualityReport = async (villageId, waterData) => {
  try {
    const reportData = {
      ...waterData,
      villageId,
      reportType: 'water_quality'
    };
    
    const response = await axiosInstance.post('/api/health-reports/water-quality', reportData);
    
    return {
      success: true,
      data: response.data.report,
      message: 'Water quality report created successfully'
    };
  } catch (error) {
    console.error('Error creating water quality report:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to create water quality report'
    };
  }
};

/**
 * Create health survey report
 * @param {string} villageId - Village ID
 * @param {Object} surveyData - Health survey data
 * @returns {Promise<Object>} Response with created health survey report
 */
export const createHealthSurveyReport = async (villageId, surveyData) => {
  try {
    const reportData = {
      ...surveyData,
      villageId,
      reportType: 'health_survey'
    };
    
    const response = await axiosInstance.post('/api/health-reports/health-survey', reportData);
    
    return {
      success: true,
      data: response.data.report,
      message: 'Health survey report created successfully'
    };
  } catch (error) {
    console.error('Error creating health survey report:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to create health survey report'
    };
  }
};

/**
 * Get reports by type
 * @param {string} reportType - Report type (disease_outbreak, water_quality, health_survey, emergency_alert, routine_checkup)
 * @param {string} villageId - Village ID
 * @returns {Promise<Object>} Response with reports by type
 */
export const getReportsByType = async (reportType, villageId) => {
  try {
    const response = await axiosInstance.get(`/api/health-reports/by-type/${reportType}?village=${villageId}`);
    
    return {
      success: true,
      data: response.data.reports || [],
      message: 'Reports by type fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching reports by type:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch reports by type',
      data: []
    };
  }
};

/**
 * Get monthly health summary
 * @param {string} villageId - Village ID
 * @param {number} month - Month (1-12)
 * @param {number} year - Year
 * @returns {Promise<Object>} Response with monthly health summary
 */
export const getMonthlyHealthSummary = async (villageId, month, year) => {
  try {
    const response = await axiosInstance.get(`/api/villages/${villageId}/health-summary/${year}/${month}`);
    
    return {
      success: true,
      data: response.data.summary,
      message: 'Monthly health summary fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching monthly health summary:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch monthly health summary',
      data: null
    };
  }
};

/**
 * Submit emergency alert
 * @param {string} villageId - Village ID
 * @param {Object} alertData - Emergency alert data
 * @returns {Promise<Object>} Response with submitted emergency alert
 */
export const submitEmergencyAlert = async (villageId, alertData) => {
  try {
    const reportData = {
      ...alertData,
      villageId,
      reportType: 'emergency_alert',
      priority: 'urgent'
    };
    
    const response = await axiosInstance.post('/api/health-reports/emergency-alert', reportData);
    
    return {
      success: true,
      data: response.data.report,
      message: 'Emergency alert submitted successfully'
    };
  } catch (error) {
    console.error('Error submitting emergency alert:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to submit emergency alert'
    };
  }
};

// TODO: Backend endpoints need to be implemented
// - GET /api/health-reports - Get all health reports with village filtering
// - GET /api/health-reports/:id - Get single health report
// - POST /api/health-reports - Create new health report
// - PUT /api/health-reports/:id - Update health report
// - DELETE /api/health-reports/:id - Delete health report
// - GET /api/villages/:id/health-report-stats - Get health report statistics
// - POST /api/health-reports/disease-outbreak - Create disease outbreak report
// - POST /api/health-reports/water-quality - Create water quality report
// - POST /api/health-reports/health-survey - Create health survey report
// - GET /api/health-reports/by-type/:type - Get reports by type
// - GET /api/villages/:id/health-summary/:year/:month - Get monthly health summary
// - POST /api/health-reports/emergency-alert - Submit emergency alert

/**
 * Create a health survey
 * @param {Object} surveyData - Survey data
 * @returns {Promise<Object>} Response with survey creation result
 */
export const createHealthSurvey = async (surveyData) => {
  try {
    const response = await axiosInstance.post('/api/health-surveys', surveyData);
    
    return {
      success: true,
      data: response.data.survey || response.data,
      message: response.data.message || 'Health survey created successfully'
    };
  } catch (error) {
    console.error('Error creating health survey:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to create health survey',
      data: null
    };
  }
};

/**
 * Get all health surveys with optional filtering
 * @param {Object} params - Query parameters for filtering and pagination
 * @returns {Promise<Object>} Response with health surveys data
 */
export const getAllHealthSurveys = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams(params);
    const response = await axiosInstance.get(`/api/health-surveys?${queryParams}`);
    
    return {
      success: true,
      data: response.data.surveys || response.data,
      pagination: response.data.pagination || {},
      message: 'Health surveys fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching health surveys:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch health surveys',
      data: []
    };
  }
};

/**
 * Get health survey statistics for a village
 * @param {string} villageId - Village ID
 * @returns {Promise<Object>} Response with survey statistics
 */
export const getHealthSurveyStats = async (villageId) => {
  try {
    const response = await axiosInstance.get(`/api/villages/${villageId}/health-survey-stats`);
    
    return {
      success: true,
      data: response.data.stats || response.data,
      message: 'Health survey statistics fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching health survey stats:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch health survey statistics',
      data: {}
    };
  }
};

export default {
  getAllHealthReports,
  getHealthReportById,
  createHealthReport,
  updateHealthReport,
  deleteHealthReport,
  getHealthReportStats,
  createDiseaseOutbreakReport,
  createWaterQualityReport,
  createHealthSurveyReport,
  getReportsByType,
  getMonthlyHealthSummary,
  submitEmergencyAlert,
  createHealthSurvey,
  getAllHealthSurveys,
  getHealthSurveyStats
};