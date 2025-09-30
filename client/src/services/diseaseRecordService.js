import axiosInstance from '../config/axios';

/**
 * Disease Record Service
 * Handles all disease tracking and epidemiological analysis operations
 * Provides comprehensive disease surveillance and outbreak detection capabilities
 */

/**
 * Get all disease records with optional filtering
 * @param {Object} params - Query parameters for filtering and pagination
 * @param {number} params.page - Page number for pagination
 * @param {number} params.limit - Number of items per page
 * @param {string} params.search - Search term for filtering
 * @param {string} params.disease - Filter by disease type
 * @param {string} params.severity - Filter by severity level
 * @param {string} params.status - Filter by status
 * @param {string} params.area - Filter by area ID
 * @param {string} params.sortBy - Field to sort by
 * @param {string} params.sortOrder - Sort order (asc/desc)
 * @returns {Promise<Object>} Response with disease records data
 */
export const getAllDiseaseRecords = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/api/disease-records', { params });
    
    return {
      success: true,
      data: response.data.diseaseRecords || [],
      total: response.data.total || 0,
      pagination: response.data.pagination || {},
      message: 'Disease records fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching disease records:', error);
    return {
      success: false,
      data: [],
      total: 0,
      error: error.response?.data?.message || 'Failed to fetch disease records'
    };
  }
};

/**
 * Get disease record by ID
 * @param {string} id - Disease record ID
 * @returns {Promise<Object>} Response with disease record data
 */
export const getDiseaseRecordById = async (id) => {
  try {
    const response = await axiosInstance.get(`/api/disease-records/${id}`);
    
    return {
      success: true,
      data: response.data.diseaseRecord || {},
      message: 'Disease record fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching disease record:', error);
    return {
      success: false,
      data: {},
      error: error.response?.data?.message || 'Failed to fetch disease record'
    };
  }
};

/**
 * Create a new disease record
 * @param {Object} diseaseData - Disease record data
 * @param {string} diseaseData.patientId - Patient ID
 * @param {string} diseaseData.disease - Disease name/type
 * @param {string} diseaseData.diagnosisDate - Date of diagnosis
 * @param {string} diseaseData.severity - Severity level (mild, moderate, severe, critical)
 * @param {Array} diseaseData.symptoms - List of symptoms
 * @param {string} diseaseData.treatmentPlan - Treatment plan details
 * @param {Object} diseaseData.epidemiologicalData - Epidemiological information
 * @param {string} diseaseData.status - Current status
 * @returns {Promise<Object>} Response with created disease record
 */
export const createDiseaseRecord = async (diseaseData) => {
  try {
    const response = await axiosInstance.post('/api/disease-records', diseaseData);
    
    return {
      success: true,
      data: response.data.diseaseRecord || {},
      message: 'Disease record created successfully'
    };
  } catch (error) {
    console.error('Error creating disease record:', error);
    return {
      success: false,
      data: {},
      error: error.response?.data?.message || 'Failed to create disease record'
    };
  }
};

/**
 * Update disease record
 * @param {string} id - Disease record ID
 * @param {Object} updateData - Updated disease record data
 * @returns {Promise<Object>} Response with updated disease record
 */
export const updateDiseaseRecord = async (id, updateData) => {
  try {
    const response = await axiosInstance.put(`/api/disease-records/${id}`, updateData);
    
    return {
      success: true,
      data: response.data.diseaseRecord || {},
      message: 'Disease record updated successfully'
    };
  } catch (error) {
    console.error('Error updating disease record:', error);
    return {
      success: false,
      data: {},
      error: error.response?.data?.message || 'Failed to update disease record'
    };
  }
};

/**
 * Delete disease record
 * @param {string} id - Disease record ID
 * @returns {Promise<Object>} Response confirming deletion
 */
export const deleteDiseaseRecord = async (id) => {
  try {
    await axiosInstance.delete(`/api/disease-records/${id}`);
    
    return {
      success: true,
      message: 'Disease record deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting disease record:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to delete disease record'
    };
  }
};

/**
 * Add case investigation details
 * @param {string} recordId - Disease record ID
 * @param {Object} investigationData - Investigation details
 * @returns {Promise<Object>} Response with updated record
 */
export const addCaseInvestigation = async (recordId, investigationData) => {
  try {
    const response = await axiosInstance.post(`/api/disease-records/${recordId}/investigation`, investigationData);
    
    return {
      success: true,
      data: response.data.diseaseRecord,
      message: 'Case investigation added successfully'
    };
  } catch (error) {
    console.error('Error adding case investigation:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to add case investigation'
    };
  }
};

/**
 * Add contact tracing information
 * @param {string} recordId - Disease record ID
 * @param {Object} contactData - Contact tracing data
 * @returns {Promise<Object>} Response with updated record
 */
export const addContactTracing = async (recordId, contactData) => {
  try {
    const response = await axiosInstance.post(`/api/disease-records/${recordId}/contact-tracing`, contactData);
    
    return {
      success: true,
      data: response.data.diseaseRecord,
      message: 'Contact tracing added successfully'
    };
  } catch (error) {
    console.error('Error adding contact tracing:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to add contact tracing'
    };
  }
};

/**
 * Get diseases by area
 * @param {string} areaId - Area ID
 * @param {Object} params - Additional parameters
 * @returns {Promise<Object>} Response with area disease records
 */
export const getDiseasesByArea = async (areaId, params = {}) => {
  try {
    const response = await axiosInstance.get(`/api/disease-records/area/${areaId}`, { params });
    
    return {
      success: true,
      data: response.data.diseaseRecords || [],
      message: 'Area disease records fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching area disease records:', error);
    return {
      success: false,
      data: [],
      error: error.response?.data?.message || 'Failed to fetch area disease records'
    };
  }
};

/**
 * Perform outbreak detection analysis
 * @param {Object} params - Detection parameters
 * @param {string} params.area - Area ID (optional)
 * @param {string} params.disease - Disease type (optional)
 * @param {string} params.timeframe - Time frame for analysis
 * @returns {Promise<Object>} Response with outbreak detection results
 */
export const performOutbreakDetection = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/api/disease-records/outbreak/detect', { params });
    
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

/**
 * Get epidemiological investigation data
 * @param {Object} params - Investigation parameters
 * @returns {Promise<Object>} Response with epidemiological data
 */
export const getEpidemiologicalInvestigation = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/api/disease-records/epidemiology/investigate', { params });
    
    return {
      success: true,
      data: response.data.investigation,
      message: 'Epidemiological investigation completed successfully'
    };
  } catch (error) {
    console.error('Error performing epidemiological investigation:', error);
    return {
      success: false,
      data: {},
      error: error.response?.data?.message || 'Failed to perform epidemiological investigation'
    };
  }
};

/**
 * Generate surveillance report
 * @param {Object} params - Report parameters
 * @param {string} params.area - Area ID (optional)
 * @param {string} params.disease - Disease type (optional)
 * @param {string} params.startDate - Start date
 * @param {string} params.endDate - End date
 * @returns {Promise<Object>} Response with surveillance report
 */
export const generateSurveillanceReport = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/api/disease-records/surveillance/report', { params });
    
    return {
      success: true,
      data: response.data.report,
      message: 'Surveillance report generated successfully'
    };
  } catch (error) {
    console.error('Error generating surveillance report:', error);
    return {
      success: false,
      data: {},
      error: error.response?.data?.message || 'Failed to generate surveillance report'
    };
  }
};

/**
 * Calculate disease statistics
 * @param {Object} params - Statistics parameters
 * @returns {Promise<Object>} Response with disease statistics
 */
export const calculateDiseaseStatistics = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/api/disease-records/statistics/calculate', { params });
    
    return {
      success: true,
      data: response.data.statistics,
      message: 'Disease statistics calculated successfully'
    };
  } catch (error) {
    console.error('Error calculating disease statistics:', error);
    return {
      success: false,
      data: {},
      error: error.response?.data?.message || 'Failed to calculate disease statistics'
    };
  }
};

/**
 * Get disease trends analysis
 * @param {Object} params - Trend analysis parameters
 * @returns {Promise<Object>} Response with disease trends
 */
export const getDiseaseTrends = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/api/disease-records/trends/analyze', { params });
    
    return {
      success: true,
      data: response.data.trends,
      message: 'Disease trends analyzed successfully'
    };
  } catch (error) {
    console.error('Error analyzing disease trends:', error);
    return {
      success: false,
      data: {},
      error: error.response?.data?.message || 'Failed to analyze disease trends'
    };
  }
};

// Backend endpoints implemented:
// - GET /api/disease-records - Get all disease records with filtering
// - GET /api/disease-records/:id - Get single disease record
// - POST /api/disease-records - Create new disease record
// - PUT /api/disease-records/:id - Update disease record
// - DELETE /api/disease-records/:id - Delete disease record
// - POST /api/disease-records/:id/investigation - Add case investigation
// - POST /api/disease-records/:id/contact-tracing - Add contact tracing
// - GET /api/disease-records/area/:areaId - Get diseases by area
// - GET /api/disease-records/outbreak/detect - Perform outbreak detection
// - GET /api/disease-records/epidemiology/investigate - Get epidemiological investigation
// - GET /api/disease-records/surveillance/report - Generate surveillance report
// - GET /api/disease-records/statistics/calculate - Calculate disease statistics
// - GET /api/disease-records/trends/analyze - Get disease trends analysis

export default {
  getAllDiseaseRecords,
  getDiseaseRecordById,
  createDiseaseRecord,
  updateDiseaseRecord,
  deleteDiseaseRecord,
  addCaseInvestigation,
  addContactTracing,
  getDiseasesByArea,
  performOutbreakDetection,
  getEpidemiologicalInvestigation,
  generateSurveillanceReport,
  calculateDiseaseStatistics,
  getDiseaseTrends
};