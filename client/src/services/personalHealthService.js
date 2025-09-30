import axiosInstance from '../config/axios';

/**
 * Personal Health Service
 * Handles all personal health record-related API operations for users
 * All operations are scoped to the current user and their family members
 */

/**
 * Get all personal health records for a user
 * @param {string} userId - User ID to filter health records
 * @param {Object} params - Query parameters for filtering and pagination
 * @param {number} params.page - Page number for pagination
 * @param {number} params.limit - Number of items per page
 * @param {string} params.search - Search term for filtering
 * @param {string} params.recordType - Filter by record type
 * @param {string} params.familyMemberId - Filter by family member ID
 * @param {string} params.dateFrom - Filter from date
 * @param {string} params.dateTo - Filter to date
 * @param {string} params.severity - Filter by severity level
 * @param {string} params.sortBy - Field to sort by
 * @param {string} params.sortOrder - Sort order (asc/desc)
 * @returns {Promise<Object>} Response with health records data
 */
export const getPersonalHealthRecords = async (userId, params = {}) => {
  try {
    const queryParams = {
      ...params
    };
    
    // Map client params to backend-supported params
    if (params.personId && !params.familyMemberId) {
      queryParams.familyMemberId = params.personId;
      delete queryParams.personId;
    }
    
  const response = await axiosInstance.get('/health-records', { params: queryParams });
    
    const { healthRecords, pagination } = response.data.data || {};
    return {
      success: true,
      data: healthRecords || [],
      pagination,
      total: pagination?.totalCount || 0,
      message: response.data.message || 'Health records fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching health records:', error);
    return {
      success: false,
      data: [],
      total: 0,
      message: error.response?.data?.message || 'Failed to fetch health records',
      error: error.response?.data?.message || 'Failed to fetch health records'
    };
  }
};

/**
 * Get health record by ID
 * @param {string} id - Health record ID
 * @returns {Promise<Object>} Response with health record data
 */
export const getHealthRecordById = async (id) => {
  try {
  const response = await axiosInstance.get(`/health-records/${id}`);
    
    return {
      success: true,
      data: response.data.data?.healthRecord || {},
      message: response.data.message || 'Health record fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching health record:', error);
    return {
      success: false,
      data: {},
      message: error.response?.data?.message || 'Failed to fetch health record',
      error: error.response?.data?.message || 'Failed to fetch health record'
    };
  }
};

/**
 * Create a new health record
 * @param {Object|FormData} recordData - Health record data (can be FormData for file uploads)
 * @param {string} recordData.recordType - Type of record (vital_signs, medical_history, symptoms, medications, allergies, lab_results, doctor_visit)
 * @param {string} recordData.familyMemberId - Family member ID (optional, if for family member)
 * @param {string} recordData.date - Record date
 * @param {string} recordData.description - Record description
 * @param {string} recordData.severity - Severity level
 * @param {Object} recordData.measurements - Health measurements
 * @param {Array} recordData.symptoms - Symptoms list
 * @param {Array} recordData.medications - Medications taken
 * @param {Array} recordData.documents - Supporting documents
 * @returns {Promise<Object>} Response with created health record data
 */
export const createHealthRecord = async (recordData) => {
  try {
    const config = {};
    
    // Set content type for FormData
    if (recordData instanceof FormData) {
      config.headers = { 'Content-Type': 'multipart/form-data' };
    }
    
  const response = await axiosInstance.post('/health-records', recordData, config);
    
    return {
      success: true,
      data: response.data.data?.healthRecord || {},
      message: response.data.message || 'Health record created successfully'
    };
  } catch (error) {
    console.error('Error creating health record:', error);
    return {
      success: false,
      data: {},
      message: error.response?.data?.message || 'Failed to create health record',
      error: error.response?.data?.message || 'Failed to create health record'
    };
  }
};

/**
 * Update health record
 * @param {string} id - Health record ID
 * @param {Object|FormData} recordData - Updated health record data
 * @returns {Promise<Object>} Response with updated health record data
 */
export const updateHealthRecord = async (id, recordData) => {
  try {
    const config = {};
    
    // Set content type for FormData
    if (recordData instanceof FormData) {
      config.headers = { 'Content-Type': 'multipart/form-data' };
    }
    
  const response = await axiosInstance.put(`/health-records/${id}`, recordData, config);
    
    return {
      success: true,
      data: response.data.data?.healthRecord || {},
      message: response.data.message || 'Health record updated successfully'
    };
  } catch (error) {
    console.error('Error updating health record:', error);
    return {
      success: false,
      data: {},
      message: error.response?.data?.message || 'Failed to update health record',
      error: error.response?.data?.message || 'Failed to update health record'
    };
  }
};

/**
 * Delete health record
 * @param {string} id - Health record ID
 * @returns {Promise<Object>} Response with deletion status
 */
export const deleteHealthRecord = async (id) => {
  try {
  await axiosInstance.delete(`/health-records/${id}`);
    
    return {
      success: true,
      message: 'Health record deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting health record:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to delete health record',
      error: error.response?.data?.message || 'Failed to delete health record'
    };
  }
};

/**
 * Get health record statistics for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Response with health record statistics
 */
export const getHealthRecordStats = async (userId) => {
  try {
    const response = await axiosInstance.get('/health-records/stats');
    
    return {
      success: true,
      data: response.data.data?.stats || {},
      message: response.data.message || 'Health record statistics fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching health record statistics:', error);
    return {
      success: false,
      data: {},
      message: error.response?.data?.message || 'Failed to fetch health record statistics',
      error: error.response?.data?.message || 'Failed to fetch health record statistics'
    };
  }
};

/**
 * Create vital signs record
 * @param {string} userId - User ID
 * @param {Object} vitalsData - Vital signs data
 * @returns {Promise<Object>} Response with created vital signs record
 */
export const createVitalSigns = async (userId, vitalsData) => {
  try {
    const recordData = {
      ...vitalsData,
      recordType: 'vital_signs',
      personId: userId
    };
    
    return await createHealthRecord(recordData);
  } catch (error) {
    console.error('Error creating vital signs:', error);
    return {
      success: false,
      data: {},
      message: error.response?.data?.message || 'Failed to create vital signs record',
      error: error.response?.data?.message || 'Failed to create vital signs record'
    };
  }
};

/**
 * Create medical history record
 * @param {string} userId - User ID
 * @param {Object} historyData - Medical history data
 * @returns {Promise<Object>} Response with created medical history record
 */
export const createMedicalHistory = async (userId, historyData) => {
  try {
    const recordData = {
      ...historyData,
      recordType: 'medical_history',
      personId: userId
    };
    
    return await createHealthRecord(recordData);
  } catch (error) {
    console.error('Error creating medical history:', error);
    return {
      success: false,
      data: {},
      message: error.response?.data?.message || 'Failed to create medical history record',
      error: error.response?.data?.message || 'Failed to create medical history record'
    };
  }
};

/**
 * Create symptom log record
 * @param {string} userId - User ID
 * @param {Object} symptomData - Symptom data
 * @returns {Promise<Object>} Response with created symptom record
 */
export const createSymptomLog = async (userId, symptomData) => {
  try {
    const recordData = {
      ...symptomData,
      recordType: 'symptoms',
      personId: userId
    };
    
    return await createHealthRecord(recordData);
  } catch (error) {
    console.error('Error creating symptom log:', error);
    return {
      success: false,
      data: {},
      message: error.response?.data?.message || 'Failed to create symptom log',
      error: error.response?.data?.message || 'Failed to create symptom log'
    };
  }
};

/**
 * Get records by type for a user
 * @param {string} recordType - Type of record to filter
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Response with filtered records
 */
export const getRecordsByType = async (recordType, userId) => {
  try {
    return await getPersonalHealthRecords(userId, { recordType });
  } catch (error) {
    console.error('Error fetching records by type:', error);
    return {
      success: false,
      data: [],
      message: error.response?.data?.message || 'Failed to fetch records by type',
      error: error.response?.data?.message || 'Failed to fetch records by type'
    };
  }
};

/**
 * Get health trends for a user
 * @param {string} userId - User ID
 * @param {string} timeframe - Timeframe for trends (week, month, quarter, year)
 * @returns {Promise<Object>} Response with health trends data
 */
export const getHealthTrends = async (userId, params = {}) => {
  try {
    // Convert timeRange to timeframe for backward compatibility
    if (params.timeRange && !params.timeframe) {
      params.timeframe = params.timeRange;
      delete params.timeRange;
    }
    
    // Default to 'month' if no timeframe specified
    if (!params.timeframe) {
      params.timeframe = 'month';
    }
    
    const response = await axiosInstance.get('/health-records/trends', {
      params
    });
    
    return {
      success: true,
      data: response.data.data?.trends || {},
      message: response.data.message || 'Health trends fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching health trends:', error);
    return {
      success: false,
      data: {},
      message: error.response?.data?.message || 'Failed to fetch health trends',
      error: error.response?.data?.message || 'Failed to fetch health trends'
    };
  }
};

/**
 * Generate health report for a user
 * @param {string} userId - User ID
 * @param {Object} params - Report parameters
 * @param {string} params.dateFrom - Start date
 * @param {string} params.dateTo - End date
 * @param {Array} params.recordTypes - Types of records to include
 * @param {string} params.format - Report format (pdf, json)
 * @returns {Promise<Object>} Response with generated report
 */
export const generateHealthReport = async (userId, params = {}) => {
  try {
    const response = await axiosInstance.post('/health-records/generate-report', params);
    
    return {
      success: true,
      data: response.data.data?.report || {},
      message: response.data.message || 'Health report generated successfully'
    };
  } catch (error) {
    console.error('Error generating health report:', error);
    return {
      success: false,
      data: {},
      message: error.response?.data?.message || 'Failed to generate health report',
      error: error.response?.data?.message || 'Failed to generate health report'
    };
  }
};

// TODO: Backend endpoints need to be implemented:
// - GET /api/health-records
// - GET /api/health-records/:id
// - POST /api/health-records
// - PUT /api/health-records/:id
// - DELETE /api/health-records/:id
// - GET /api/health-records/stats/:userId
// - GET /api/health-records/trends/:userId
// - POST /api/health-records/generate-report/:userId

export default {
  getPersonalHealthRecords,
  getHealthRecordById,
  createHealthRecord,
  updateHealthRecord,
  deleteHealthRecord,
  getHealthRecordStats,
  createVitalSigns,
  createMedicalHistory,
  createSymptomLog,
  getRecordsByType,
  getHealthTrends,
  generateHealthReport
};