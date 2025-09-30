import axiosInstance from '../config/axios';

/**
 * Patient Service
 * Handles all patient-related API operations for ASHA workers
 * All operations are scoped to the ASHA worker's assigned villages
 */

/**
 * Get all patients for specific villages with optional filtering and pagination
 * @param {string} villageId - Village ID to filter patients
 * @param {Object} params - Query parameters for filtering, pagination, and sorting
 * @param {number} params.page - Page number for pagination (default: 1)
 * @param {number} params.limit - Number of items per page (default: 10)
 * @param {string} params.search - Search term for patient name or health ID
 * @param {string} params.age - Filter by age range
 * @param {string} params.gender - Filter by gender (male, female, other)
 * @param {string} params.healthCondition - Filter by health condition
 * @param {string} params.sortBy - Field to sort by (name, age, createdAt, lastVisit)
 * @param {string} params.sortOrder - Sort order (asc, desc)
 * @returns {Promise<Object>} Response with patient data and pagination info
 */
export const getAllPatients = async (villageId, params = {}) => {
  try {
    const queryParams = new URLSearchParams({
      village: villageId,
      ...params
    });
    
    const response = await axiosInstance.get(`/api/patients?${queryParams}`);
    
    return {
      success: true,
      data: response.data.patients || [],
      pagination: response.data.pagination || {},
      stats: response.data.stats || {},
      message: 'Patients fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching patients:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch patients',
      data: []
    };
  }
};

/**
 * Get a single patient by ID
 * @param {string} id - Patient ID
 * @returns {Promise<Object>} Response with patient data
 */
export const getPatientById = async (id) => {
  try {
    const response = await axiosInstance.get(`/api/patients/${id}`);
    
    return {
      success: true,
      data: response.data.patient,
      message: 'Patient fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching patient:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch patient',
      data: null
    };
  }
};

/**
 * Create a new patient record
 * @param {Object} patientData - Patient data to create
 * @returns {Promise<Object>} Response with created patient data
 */
export const createPatient = async (patientData) => {
  try {
    const response = await axiosInstance.post('/api/patients', patientData);
    
    return {
      success: true,
      data: response.data.patient,
      message: 'Patient created successfully'
    };
  } catch (error) {
    console.error('Error creating patient:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to create patient'
    };
  }
};

/**
 * Update an existing patient record
 * @param {string} id - Patient ID to update
 * @param {Object} patientData - Updated patient data
 * @returns {Promise<Object>} Response with updated patient data
 */
export const updatePatient = async (id, patientData) => {
  try {
    const response = await axiosInstance.put(`/api/patients/${id}`, patientData);
    
    return {
      success: true,
      data: response.data.patient,
      message: 'Patient updated successfully'
    };
  } catch (error) {
    console.error('Error updating patient:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to update patient'
    };
  }
};

/**
 * Delete a patient record
 * @param {string} id - Patient ID to delete
 * @returns {Promise<Object>} Response with deletion status
 */
export const deletePatient = async (id) => {
  try {
    const response = await axiosInstance.delete(`/api/patients/${id}`);
    
    return {
      success: true,
      message: 'Patient deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting patient:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to delete patient'
    };
  }
};

/**
 * Get patient health history
 * @param {string} id - Patient ID
 * @returns {Promise<Object>} Response with patient health history
 */
export const getPatientHistory = async (id) => {
  try {
    const response = await axiosInstance.get(`/api/patients/${id}/history`);
    
    return {
      success: true,
      data: response.data.history || [],
      message: 'Patient history fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching patient history:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch patient history',
      data: []
    };
  }
};

/**
 * Add health record to patient
 * @param {string} patientId - Patient ID
 * @param {Object} healthData - Health record data
 * @returns {Promise<Object>} Response with added health record
 */
export const addPatientHealthRecord = async (patientId, healthData) => {
  try {
    const response = await axiosInstance.post(`/api/patients/${patientId}/health-records`, healthData);
    
    return {
      success: true,
      data: response.data.healthRecord,
      message: 'Health record added successfully'
    };
  } catch (error) {
    console.error('Error adding health record:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to add health record'
    };
  }
};

/**
 * Get patient vaccinations
 * @param {string} patientId - Patient ID
 * @returns {Promise<Object>} Response with patient vaccinations
 */
export const getPatientVaccinations = async (patientId) => {
  try {
    const response = await axiosInstance.get(`/api/patients/${patientId}/vaccinations`);
    
    return {
      success: true,
      data: response.data.vaccinations || [],
      message: 'Patient vaccinations fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching patient vaccinations:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch patient vaccinations',
      data: []
    };
  }
};

/**
 * Schedule vaccination for patient
 * @param {string} patientId - Patient ID
 * @param {Object} vaccinationData - Vaccination schedule data
 * @returns {Promise<Object>} Response with scheduled vaccination
 */
export const scheduleVaccination = async (patientId, vaccinationData) => {
  try {
    const response = await axiosInstance.post(`/api/patients/${patientId}/vaccinations`, vaccinationData);
    
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
 * Get patients by village
 * @param {string} villageId - Village ID
 * @returns {Promise<Object>} Response with village patients
 */
export const getPatientsByVillage = async (villageId) => {
  try {
    const response = await axiosInstance.get(`/api/villages/${villageId}/patients`);
    
    return {
      success: true,
      data: response.data.patients || [],
      message: 'Village patients fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching village patients:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch village patients',
      data: []
    };
  }
};

/**
 * Get patient statistics for a specific village
 * @param {string} villageId - Village ID to get statistics for
 * @returns {Promise<Object>} Response with patient statistics
 */
export const getPatientStats = async (villageId) => {
  try {
    const response = await axiosInstance.get(`/api/villages/${villageId}/patient-stats`);
    
    return {
      success: true,
      data: {
        total: response.data.total || 0,
        children: response.data.children || 0,
        adults: response.data.adults || 0,
        pregnant: response.data.pregnant || 0,
        pendingVaccinations: response.data.pendingVaccinations || 0
      },
      message: 'Patient statistics fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching patient statistics:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch patient statistics',
      data: {
        total: 0,
        children: 0,
        adults: 0,
        pregnant: 0,
        pendingVaccinations: 0
      }
    };
  }
};

// TODO: Backend endpoints need to be implemented
// - GET /api/patients - Get all patients with village filtering
// - GET /api/patients/:id - Get single patient
// - POST /api/patients - Create new patient
// - PUT /api/patients/:id - Update patient
// - DELETE /api/patients/:id - Delete patient
// - GET /api/patients/:id/history - Get patient health history
// - POST /api/patients/:id/health-records - Add health record
// - GET /api/patients/:id/vaccinations - Get patient vaccinations
// - POST /api/patients/:id/vaccinations - Schedule vaccination
// - GET /api/villages/:id/patients - Get patients by village

export default {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  getPatientHistory,
  addPatientHealthRecord,
  getPatientVaccinations,
  scheduleVaccination,
  getPatientsByVillage,
  getPatientStats
};