import axiosInstance from '../config/axios';

/**
 * Health Observation Service
 * Handles all health observation recording and tracking operations for volunteers
 * All operations are scoped to the volunteer's assigned areas
 */

/**
 * Get all health observations for assigned areas
 * @param {Object} params - Query parameters for filtering and pagination
 * @param {Array|string} params.areaIds - Area IDs to filter observations (can be array or single ID)
 * @param {string} params.villageId - Village ID to filter observations (deprecated, use areaIds)
 * @param {number} params.page - Page number for pagination
 * @param {number} params.limit - Number of items per page
 * @param {string} params.search - Search term for filtering
 * @param {string} params.observationType - Filter by observation type
 * @param {string} params.severity - Filter by severity level
 * @param {string} params.affectedDemographics - Filter by affected population
 * @param {string} params.sortBy - Field to sort by
 * @param {string} params.sortOrder - Sort order (asc/desc)
 * @returns {Promise<Object>} Response with health observations data
 */
export const getAllHealthObservations = async (params = {}) => {
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
    
    const response = await axiosInstance.get('/api/health-observations', { params: queryParams });
    
    return {
      success: true,
      data: response.data.data || response.data.observations || [],
      total: response.data.total || 0,
      pagination: response.data.pagination || {},
      message: response.data.message || 'Health observations fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching health observations:', error);
    return {
      success: false,
      data: [],
      total: 0,
      message: error.response?.data?.message || 'Failed to fetch health observations',
      error: error.response?.data?.message || 'Failed to fetch health observations'
    };
  }
};

/**
 * Get health observation by ID
 * @param {string} id - Observation ID
 * @returns {Promise<Object>} Response with observation data
 */
export const getHealthObservationById = async (id) => {
  try {
    const response = await axiosInstance.get(`/api/health-observations/${id}`);
    
    return {
      success: true,
      data: response.data.data || response.data.observation || {},
      message: response.data.message || 'Health observation fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching health observation:', error);
    return {
      success: false,
      data: {},
      message: error.response?.data?.message || 'Failed to fetch health observation',
      error: error.response?.data?.message || 'Failed to fetch health observation'
    };
  }
};

/**
 * Create a new health observation
 * @param {Object|FormData} observationData - Health observation data (can be FormData for file uploads)
 * @param {string} observationData.observationType - Type of observation (symptom_pattern, environmental_health, behavioral_change, infrastructure_health)
 * @param {string} observationData.description - Observation description
 * @param {Object} observationData.location - Location details
 * @param {Object} observationData.affectedDemographics - Affected demographics (age groups, gender, population count)
 * @param {string} observationData.severity - Severity level (low, medium, high, critical)
 * @param {Array} observationData.symptoms - Observed symptoms or conditions
 * @param {Array} observationData.potentialCauses - Potential causes
 * @param {Object} observationData.environmentalFactors - Environmental factors
 * @param {string} observationData.recommendedActions - Recommended actions
 * @returns {Promise<Object>} Response with created observation data
 */
export const createHealthObservation = async (observationData) => {
  try {
    const config = {};
    
    // Set content type for FormData
    if (observationData instanceof FormData) {
      config.headers = { 'Content-Type': 'multipart/form-data' };
    }
    
    const response = await axiosInstance.post('/api/health-observations', observationData, config);
    
    return {
      success: true,
      data: response.data.data || response.data.observation || {},
      message: response.data.message || 'Health observation created successfully'
    };
  } catch (error) {
    console.error('Error creating health observation:', error);
    return {
      success: false,
      data: {},
      message: error.response?.data?.message || 'Failed to create health observation',
      error: error.response?.data?.message || 'Failed to create health observation'
    };
  }
};

/**
 * Update health observation
 * @param {string} id - Observation ID
 * @param {Object|FormData} observationData - Updated observation data (can be FormData for file uploads)
 * @returns {Promise<Object>} Response with updated observation data
 */
export const updateHealthObservation = async (id, observationData) => {
  try {
    const config = {};
    
    // Set content type for FormData
    if (observationData instanceof FormData) {
      config.headers = { 'Content-Type': 'multipart/form-data' };
    }
    
    const response = await axiosInstance.put(`/api/health-observations/${id}`, observationData, config);
    
    return {
      success: true,
      data: response.data.data || response.data.observation || {},
      message: 'Health observation updated successfully'
    };
  } catch (error) {
    console.error('Error updating health observation:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to update health observation'
    };
  }
};

/**
 * Delete health observation
 * @param {string} id - Observation ID
 * @returns {Promise<Object>} Response with deletion status
 */
export const deleteHealthObservation = async (id) => {
  try {
    await axiosInstance.delete(`/api/health-observations/${id}`);
    
    return {
      success: true,
      message: 'Health observation deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting health observation:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to delete health observation'
    };
  }
};

/**
 * Get observation trends for a village
 * @param {string} villageId - Village ID
 * @returns {Promise<Object>} Response with observation trends
 */
export const getObservationTrends = async (villageId) => {
  try {
    const response = await axiosInstance.get(`/api/health-observations/trends/${villageId}`);
    
    return {
      success: true,
      data: response.data.trends || {},
      message: 'Observation trends fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching observation trends:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch observation trends'
    };
  }
};

/**
 * Record symptom observation
 * @param {string} villageId - Village ID
 * @param {Object} symptomData - Symptom observation data
 * @returns {Promise<Object>} Response with created observation
 */
export const recordSymptomObservation = async (villageId, symptomData) => {
  try {
    const observationData = {
      ...symptomData,
      observationType: 'symptom_pattern',
      villageId
    };
    
    return await createHealthObservation(observationData);
  } catch (error) {
    console.error('Error recording symptom observation:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to record symptom observation'
    };
  }
};

/**
 * Record environmental observation
 * @param {string} villageId - Village ID
 * @param {Object} envData - Environmental observation data
 * @returns {Promise<Object>} Response with created observation
 */
export const recordEnvironmentalObservation = async (villageId, envData) => {
  try {
    const observationData = {
      ...envData,
      observationType: 'environmental_health',
      villageId
    };
    
    return await createHealthObservation(observationData);
  } catch (error) {
    console.error('Error recording environmental observation:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to record environmental observation'
    };
  }
};

/**
 * Record behavioral observation
 * @param {string} villageId - Village ID
 * @param {Object} behaviorData - Behavioral observation data
 * @returns {Promise<Object>} Response with created observation
 */
export const recordBehavioralObservation = async (villageId, behaviorData) => {
  try {
    const observationData = {
      ...behaviorData,
      observationType: 'behavioral_change',
      villageId
    };
    
    return await createHealthObservation(observationData);
  } catch (error) {
    console.error('Error recording behavioral observation:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to record behavioral observation'
    };
  }
};

/**
 * Get observations by type for a village
 * @param {string} observationType - Type of observation to filter
 * @param {string} villageId - Village ID
 * @returns {Promise<Object>} Response with filtered observations
 */
export const getObservationsByType = async (observationType, villageId) => {
  try {
    return await getAllHealthObservations(villageId, { observationType });
  } catch (error) {
    console.error('Error fetching observations by type:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch observations by type'
    };
  }
};

/**
 * Get health trends for a village within a timeframe
 * @param {string} villageId - Village ID
 * @param {string} timeframe - Timeframe for trends (week, month, quarter, year)
 * @returns {Promise<Object>} Response with health trends
 */
export const getHealthTrends = async (villageId, timeframe = 'month') => {
  try {
    const response = await axiosInstance.get(`/api/health-observations/health-trends/${villageId}`, {
      params: { timeframe }
    });
    
    return {
      success: true,
      data: response.data.trends || {},
      message: 'Health trends fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching health trends:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch health trends'
    };
  }
};

/**
 * Submit health alert
 * @param {string} villageId - Village ID
 * @param {Object} alertData - Health alert data
 * @returns {Promise<Object>} Response with submitted alert
 */
export const submitHealthAlert = async (villageId, alertData) => {
  try {
    const observationData = {
      ...alertData,
      severity: 'critical',
      villageId
    };
    
    return await createHealthObservation(observationData);
  } catch (error) {
    console.error('Error submitting health alert:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to submit health alert'
    };
  }
};

/**
 * Add follow-up to health observation
 * @param {string} observationId - Observation ID
 * @param {Object} followUpData - Follow-up data
 * @returns {Promise<Object>} Response with updated observation
 */
export const addFollowUp = async (observationId, followUpData) => {
  try {
    const response = await axiosInstance.post(`/api/health-observations/${observationId}/follow-up`, followUpData);
    
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
    const response = await axiosInstance.get(`/api/health-observations/area/${areaId}`);
    
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
    const response = await axiosInstance.get('/api/health-observations/patterns/analysis', { params });
    
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
 * Get temporal observation trends
 * @param {Object} params - Trend parameters
 * @returns {Promise<Object>} Response with temporal trends
 */
export const getTemporalTrends = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/api/health-observations/trends/temporal', { params });
    
    return {
      success: true,
      data: response.data.trends,
      message: 'Temporal trends fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching temporal trends:', error);
    return {
      success: false,
      data: {},
      error: error.response?.data?.message || 'Failed to fetch temporal trends'
    };
  }
};

/**
 * Calculate health metrics
 * @param {Object} params - Metrics parameters
 * @returns {Promise<Object>} Response with health metrics
 */
export const calculateHealthMetrics = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/api/health-observations/metrics/calculate', { params });
    
    return {
      success: true,
      data: response.data.metrics,
      message: 'Health metrics calculated successfully'
    };
  } catch (error) {
    console.error('Error calculating health metrics:', error);
    return {
      success: false,
      data: {},
      error: error.response?.data?.message || 'Failed to calculate health metrics'
    };
  }
};

/**
 * Generate comprehensive health report
 * @param {Object} params - Report parameters
 * @returns {Promise<Object>} Response with health report
 */
export const generateComprehensiveReport = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/api/health-observations/reports/comprehensive', { params });
    
    return {
      success: true,
      data: response.data.report,
      message: 'Comprehensive report generated successfully'
    };
  } catch (error) {
    console.error('Error generating comprehensive report:', error);
    return {
      success: false,
      data: {},
      error: error.response?.data?.message || 'Failed to generate comprehensive report'
    };
  }
};

/**
 * Generate critical health alerts
 * @param {Object} params - Alert parameters
 * @returns {Promise<Object>} Response with critical alerts
 */
export const generateCriticalAlerts = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/api/health-observations/alerts/critical', { params });
    
    return {
      success: true,
      data: response.data.alerts || [],
      message: 'Critical alerts generated successfully'
    };
  } catch (error) {
    console.error('Error generating critical alerts:', error);
    return {
      success: false,
      data: [],
      error: error.response?.data?.message || 'Failed to generate critical alerts'
    };
  }
};

/**
 * Perform outbreak detection analysis
 * @param {Object} params - Detection parameters
 * @returns {Promise<Object>} Response with outbreak detection results
 */
export const performOutbreakDetection = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/api/health-observations/outbreak/detect', { params });
    
    return {
      success: true,
      data: response.data.outbreakAnalysis,
      message: 'Outbreak detection completed successfully'
    };
  } catch (error) {
    console.error('Error performing outbreak detection:', error);
    return {
      success: false,
      data: {},
      error: error.response?.data?.message || 'Failed to perform outbreak detection'
    };
  }
};

// Enhanced backend endpoints implemented:
// - GET /api/health-observations - Get all health observations with filtering
// - GET /api/health-observations/:id - Get single health observation
// - POST /api/health-observations - Create new health observation
// - PUT /api/health-observations/:id - Update health observation
// - DELETE /api/health-observations/:id - Delete health observation (deprecated)
// - POST /api/health-observations/:id/follow-up - Add follow-up to observation
// - GET /api/health-observations/area/:areaId - Get observations by area
// - GET /api/health-observations/patterns/analysis - Get observation patterns analysis
// - GET /api/health-observations/trends/temporal - Get temporal observation trends
// - GET /api/health-observations/metrics/calculate - Calculate health metrics
// - GET /api/health-observations/reports/comprehensive - Generate comprehensive health report
// - GET /api/health-observations/alerts/critical - Generate critical health alerts
// - GET /api/health-observations/outbreak/detect - Perform outbreak detection analysis

export default {
  getAllHealthObservations,
  getHealthObservationById,
  createHealthObservation,
  updateHealthObservation,
  deleteHealthObservation,
  getObservationTrends,
  recordSymptomObservation,
  recordEnvironmentalObservation,
  recordBehavioralObservation,
  getObservationsByType,
  getHealthTrends,
  submitHealthAlert,
  addFollowUp,
  getObservationsByArea,
  getObservationPatterns,
  getTemporalTrends,
  calculateHealthMetrics,
  generateComprehensiveReport,
  generateCriticalAlerts,
  performOutbreakDetection
};