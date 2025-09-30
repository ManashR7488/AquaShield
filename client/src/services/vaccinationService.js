import axiosInstance from '../config/axios';

/**
 * Vaccination Service
 * Handles all vaccination-related API operations for ASHA workers
 * All operations are scoped to the ASHA worker's assigned villages
 */

/**
 * Get all vaccinations for specific villages with optional filtering and pagination
 * @param {string} villageId - Village ID to filter vaccinations
 * @param {Object} params - Query parameters for filtering, pagination, and sorting
 * @param {number} params.page - Page number for pagination (default: 1)
 * @param {number} params.limit - Number of items per page (default: 10)
 * @param {string} params.search - Search term for patient name or vaccination ID
 * @param {string} params.vaccineType - Filter by vaccine type
 * @param {string} params.status - Filter by status (scheduled, completed, overdue, missed)
 * @param {string} params.ageGroup - Filter by age group
 * @param {string} params.sortBy - Field to sort by (scheduledDate, patientName, vaccineType)
 * @param {string} params.sortOrder - Sort order (asc, desc)
 * @returns {Promise<Object>} Response with vaccination data and pagination info
 */
export const getAllVaccinations = async (villageId, params = {}) => {
  try {
    const queryParams = new URLSearchParams({
      village: villageId,
      ...params
    });
    
    const response = await axiosInstance.get(`/api/vaccination-records?${queryParams}`);
    
    return {
      success: true,
      data: response.data.vaccinations || [],
      pagination: response.data.pagination || {},
      stats: response.data.stats || {},
      message: 'Vaccinations fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching vaccinations:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch vaccinations',
      data: []
    };
  }
};

/**
 * Get a single vaccination by ID
 * @param {string} id - Vaccination ID
 * @returns {Promise<Object>} Response with vaccination data
 */
export const getVaccinationById = async (id) => {
  try {
    const response = await axiosInstance.get(`/api/vaccination-records/${id}`);
    
    return {
      success: true,
      data: response.data.vaccination,
      message: 'Vaccination fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching vaccination:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch vaccination',
      data: null
    };
  }
};

/**
 * Create a new vaccination record
 * @param {Object} vaccinationData - Vaccination data to create
 * @returns {Promise<Object>} Response with created vaccination data
 */
export const createVaccination = async (vaccinationData) => {
  try {
    const response = await axiosInstance.post('/api/vaccination-records', vaccinationData);
    
    return {
      success: true,
      data: response.data.vaccination,
      message: 'Vaccination created successfully'
    };
  } catch (error) {
    console.error('Error creating vaccination:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to create vaccination'
    };
  }
};

/**
 * Update an existing vaccination record
 * @param {string} id - Vaccination ID to update
 * @param {Object} vaccinationData - Updated vaccination data
 * @returns {Promise<Object>} Response with updated vaccination data
 */
export const updateVaccination = async (id, vaccinationData) => {
  try {
    const response = await axiosInstance.put(`/api/vaccination-records/${id}`, vaccinationData);
    
    return {
      success: true,
      data: response.data.vaccination,
      message: 'Vaccination updated successfully'
    };
  } catch (error) {
    console.error('Error updating vaccination:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to update vaccination'
    };
  }
};

/**
 * Delete a vaccination record
 * @param {string} id - Vaccination ID to delete
 * @returns {Promise<Object>} Response with deletion status
 */
export const deleteVaccination = async (id) => {
  try {
    const response = await axiosInstance.delete(`/api/vaccination-records/${id}`);
    
    return {
      success: true,
      message: 'Vaccination deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting vaccination:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to delete vaccination'
    };
  }
};

/**
 * Get vaccination schedule for patient
 * @param {string} patientId - Patient ID
 * @returns {Promise<Object>} Response with vaccination schedule
 */
export const getVaccinationSchedule = async (patientId) => {
  try {
    const response = await axiosInstance.get(`/api/patients/${patientId}/vaccination-schedule`);
    
    return {
      success: true,
      data: response.data.schedule || [],
      message: 'Vaccination schedule fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching vaccination schedule:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch vaccination schedule',
      data: []
    };
  }
};

/**
 * Schedule vaccination for patient
 * @param {Object} payload - Vaccination scheduling data
 * @returns {Promise<Object>} Response with scheduled vaccination
 */
export const scheduleVaccination = async (payload) => {
  try {
    const response = await axiosInstance.post('/api/vaccination-records/schedule', payload);
    
    return {
      success: true,
      data: response.data.vaccination,
      message: 'Vaccination scheduled successfully'
    };
  } catch (error) {
    console.error('Error scheduling vaccination:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to schedule vaccination'
    };
  }
};

/**
 * Mark vaccination as complete
 * @param {string} vaccinationId - Vaccination ID
 * @param {Object} administeredData - Administration details
 * @returns {Promise<Object>} Response with completed vaccination
 */
export const markVaccinationComplete = async (vaccinationId, administeredData) => {
  try {
    const response = await axiosInstance.put(`/api/vaccination-records/${vaccinationId}/complete`, administeredData);
    
    return {
      success: true,
      data: response.data.vaccination,
      message: 'Vaccination marked as complete successfully'
    };
  } catch (error) {
    console.error('Error marking vaccination complete:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to mark vaccination complete'
    };
  }
};

/**
 * Get vaccinations by type
 * @param {string} vaccineType - Vaccine type
 * @param {string} villageId - Village ID
 * @returns {Promise<Object>} Response with vaccinations by type
 */
export const getVaccinationsByType = async (vaccineType, villageId) => {
  try {
    const response = await axiosInstance.get(`/api/vaccination-records/by-type/${vaccineType}?village=${villageId}`);
    
    return {
      success: true,
      data: response.data.vaccinations || [],
      message: 'Vaccinations by type fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching vaccinations by type:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch vaccinations by type',
      data: []
    };
  }
};

/**
 * Get overdue vaccinations
 * @param {string} villageId - Village ID
 * @returns {Promise<Object>} Response with overdue vaccinations
 */
export const getOverdueVaccinations = async (villageId) => {
  try {
    const response = await axiosInstance.get(`/api/vaccination-records/overdue?village=${villageId}`);
    
    return {
      success: true,
      data: response.data.vaccinations || [],
      message: 'Overdue vaccinations fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching overdue vaccinations:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch overdue vaccinations',
      data: []
    };
  }
};

/**
 * Get vaccination coverage statistics
 * @param {string} villageId - Village ID
 * @param {string} vaccineType - Vaccine type (optional)
 * @returns {Promise<Object>} Response with vaccination coverage
 */
export const getVaccinationCoverage = async (villageId, vaccineType = null) => {
  try {
    const params = vaccineType ? `?vaccineType=${vaccineType}` : '';
    const response = await axiosInstance.get(`/api/villages/${villageId}/vaccination-coverage${params}`);
    
    return {
      success: true,
      data: response.data.coverage,
      message: 'Vaccination coverage fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching vaccination coverage:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch vaccination coverage',
      data: {}
    };
  }
};

/**
 * Generate vaccination report
 * @param {string} villageId - Village ID
 * @param {Object} params - Report parameters
 * @returns {Promise<Object>} Response with vaccination report
 */
export const generateVaccinationReport = async (villageId, params = {}) => {
  try {
    const queryParams = new URLSearchParams({
      village: villageId,
      ...params
    });
    
    const response = await axiosInstance.get(`/api/vaccination-records/report?${queryParams}`);
    
    return {
      success: true,
      data: response.data.report,
      message: 'Vaccination report generated successfully'
    };
  } catch (error) {
    console.error('Error generating vaccination report:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to generate vaccination report',
      data: null
    };
  }
};

/**
 * Report adverse reaction to vaccination
 * @param {string} vaccinationId - Vaccination record ID
 * @param {Object} reactionData - Adverse reaction details
 * @returns {Promise<Object>} Response with reported reaction
 */
export const reportAdverseReaction = async (vaccinationId, reactionData) => {
  try {
    const response = await axiosInstance.post(`/api/vaccination-records/${vaccinationId}/adverse-reaction`, reactionData);
    
    return {
      success: true,
      data: response.data.vaccinationRecord,
      message: 'Adverse reaction reported successfully'
    };
  } catch (error) {
    console.error('Error reporting adverse reaction:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to report adverse reaction'
    };
  }
};

/**
 * Analyze vaccination coverage for villages
 * @param {Array} villageIds - Array of village IDs
 * @param {Object} params - Analysis parameters
 * @returns {Promise<Object>} Response with coverage analysis
 */
export const analyzeCoverage = async (villageIds, params = {}) => {
  try {
    const queryParams = new URLSearchParams({
      villages: villageIds.join(','),
      ...params
    });
    
    const response = await axiosInstance.get(`/api/vaccination-records/coverage/analyze?${queryParams}`);
    
    return {
      success: true,
      data: response.data.analysis,
      message: 'Coverage analysis completed successfully'
    };
  } catch (error) {
    console.error('Error analyzing coverage:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to analyze coverage',
      data: {}
    };
  }
};

/**
 * Generate vaccination reminders for due vaccinations
 * @param {string} villageId - Village ID
 * @param {Object} params - Reminder parameters
 * @returns {Promise<Object>} Response with generated reminders
 */
export const generateReminders = async (villageId, params = {}) => {
  try {
    const queryParams = new URLSearchParams({
      village: villageId,
      ...params
    });
    
    const response = await axiosInstance.get(`/api/vaccination-records/reminders/generate?${queryParams}`);
    
    return {
      success: true,
      data: response.data.reminders,
      message: 'Reminders generated successfully'
    };
  } catch (error) {
    console.error('Error generating reminders:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to generate reminders',
      data: []
    };
  }
};

// Backend endpoints implemented in /api/vaccination-records routes:
// - GET /api/vaccination-records - Get all vaccination records with village filtering
// - GET /api/vaccination-records/:id - Get single vaccination record
// - POST /api/vaccination-records - Create new vaccination record
// - PUT /api/vaccination-records/:id - Update vaccination record
// - DELETE /api/vaccination-records/:id - Delete vaccination record
// - GET /api/patients/:id/vaccination-schedule - Get patient vaccination schedule
// - POST /api/vaccination-records/schedule - Schedule vaccination
// - PUT /api/vaccination-records/:id/complete - Mark vaccination complete
// - GET /api/vaccination-records/by-type/:type - Get vaccinations by type
// - GET /api/vaccination-records/overdue - Get overdue vaccinations
// - GET /api/villages/:id/vaccination-coverage - Get vaccination coverage
// - GET /api/vaccination-records/report - Generate vaccination report
// - POST /api/vaccination-records/:id/adverse-reaction - Report adverse reaction
// - GET /api/vaccination-records/coverage/analyze - Analyze vaccination coverage
// - GET /api/vaccination-records/reminders/generate - Generate vaccination reminders

export default {
  getAllVaccinations,
  getVaccinationById,
  createVaccination,
  updateVaccination,
  deleteVaccination,
  getVaccinationSchedule,
  scheduleVaccination,
  markVaccinationComplete,
  getVaccinationsByType,
  getOverdueVaccinations,
  getVaccinationCoverage,
  generateVaccinationReport,
  reportAdverseReaction,
  analyzeCoverage,
  generateReminders
};