import axiosInstance from '../config/axios';

/**
 * Water Test Service
 * Handles all water quality testing and submission operations for volunteers
 * All operations are scoped to the volunteer's assigned areas
 */

/**
 * Get all water tests for assigned areas
 * @param {Object} params - Query parameters for filtering and pagination
 * @param {Array|string} params.areaIds - Area IDs to filter tests (can be array or single ID)
 * @param {string} params.villageId - Village ID to filter tests (deprecated, use areaIds)
 * @param {number} params.page - Page number for pagination
 * @param {number} params.limit - Number of items per page
 * @param {string} params.search - Search term for filtering
 * @param {string} params.sourceType - Filter by water source type
 * @param {string} params.testType - Filter by test type
 * @param {string} params.resultStatus - Filter by result status
 * @param {string} params.sortBy - Field to sort by
 * @param {string} params.sortOrder - Sort order (asc/desc)
 * @returns {Promise<Object>} Response with water tests data
 */
export const getAllWaterTests = async (params = {}) => {
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
    
    const response = await axiosInstance.get('/api/water-quality-tests', { params: queryParams });
    
    return {
      success: true,
      data: response.data.data || response.data.tests || [],
      total: response.data.total || 0,
      pagination: response.data.pagination || {},
      message: response.data.message || 'Water tests fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching water tests:', error);
    return {
      success: false,
      data: [],
      total: 0,
      message: error.response?.data?.message || 'Failed to fetch water tests',
      error: error.response?.data?.message || 'Failed to fetch water tests'
    };
  }
};

/**
 * Get water test by ID
 * @param {string} id - Test ID
 * @returns {Promise<Object>} Response with test data
 */
export const getWaterTestById = async (id) => {
  try {
    const response = await axiosInstance.get(`/api/water-quality-tests/${id}`);
    
    return {
      success: true,
      data: response.data.data || response.data.test || {},
      message: response.data.message || 'Water test fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching water test:', error);
    return {
      success: false,
      data: {},
      message: error.response?.data?.message || 'Failed to fetch water test',
      error: error.response?.data?.message || 'Failed to fetch water test'
    };
  }
};

/**
 * Create a new water test
 * @param {Object|FormData} testData - Water test data (can be FormData for file uploads)
 * @param {string} testData.sourceId - Water source ID
 * @param {string} testData.testType - Type of test (chemical, biological, physical, rapid_test_kit)
 * @param {string} testData.testDate - Date and time of test
 * @param {string} testData.testingMethod - Method used for testing
 * @param {Object} testData.parameters - Test parameters (pH, turbidity, chlorine, bacteria, etc.)
 * @param {Object} testData.results - Test results
 * @param {string} testData.contaminationLevel - Contamination level (safe, mild, moderate, severe)
 * @param {string} testData.recommendedActions - Recommended actions based on results
 * @param {Array} testData.evidence - Evidence files/photos of test results
 * @returns {Promise<Object>} Response with created test data
 */
export const createWaterTest = async (testData) => {
  try {
    const config = {};
    
    // Set content type for FormData
    if (testData instanceof FormData) {
      config.headers = { 'Content-Type': 'multipart/form-data' };
    }
    
    const response = await axiosInstance.post('/api/water-quality-tests', testData, config);
    
    return {
      success: true,
      data: response.data.data || response.data.test || {},
      message: response.data.message || 'Water test created successfully'
    };
  } catch (error) {
    console.error('Error creating water test:', error);
    return {
      success: false,
      data: {},
      message: error.response?.data?.message || 'Failed to create water test',
      error: error.response?.data?.message || 'Failed to create water test'
    };
  }
};

/**
 * Update water test
 * @param {string} id - Test ID
 * @param {Object|FormData} testData - Updated test data (can be FormData for file uploads)
 * @returns {Promise<Object>} Response with updated test data
 */
export const updateWaterTest = async (id, testData) => {
  try {
    const config = {};
    
    // Set content type for FormData
    if (testData instanceof FormData) {
      config.headers = { 'Content-Type': 'multipart/form-data' };
    }
    
    const response = await axiosInstance.put(`/api/water-quality-tests/${id}`, testData, config);
    
    return {
      success: true,
      data: response.data.data || response.data.test || {},
      message: response.data.message || 'Water test updated successfully'
    };
  } catch (error) {
    console.error('Error updating water test:', error);
    return {
      success: false,
      data: {},
      message: error.response?.data?.message || 'Failed to update water test',
      error: error.response?.data?.message || 'Failed to update water test'
    };
  }
};

/**
 * Delete water test
 * @param {string} id - Test ID
 * @returns {Promise<Object>} Response with deletion status
 */
export const deleteWaterTest = async (id) => {
  try {
    await axiosInstance.delete(`/api/water-quality-tests/${id}`);
    
    return {
      success: true,
      message: 'Water test deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting water test:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to delete water test'
    };
  }
};

/**
 * Get water test history for a specific source
 * @param {string} sourceId - Water source ID
 * @returns {Promise<Object>} Response with test history
 */
export const getWaterTestHistory = async (sourceId) => {
  try {
    const response = await axiosInstance.get(`/api/water-quality-tests/history/${sourceId}`);
    
    return {
      success: true,
      data: response.data.tests || [],
      message: 'Water test history fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching water test history:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch water test history'
    };
  }
};

/**
 * Submit test results for an existing test
 * @param {string} testId - Test ID
 * @param {Object} results - Test results data
 * @returns {Promise<Object>} Response with updated test
 */
export const submitTestResults = async (testId, results) => {
  try {
    const response = await axiosInstance.put(`/api/water-quality-tests/${testId}/results`, results);
    
    return {
      success: true,
      data: response.data.test || {},
      message: 'Test results submitted successfully'
    };
  } catch (error) {
    console.error('Error submitting test results:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to submit test results'
    };
  }
};

/**
 * Get water sources by village
 * @param {string} villageId - Village ID
 * @returns {Promise<Object>} Response with water sources
 */
export const getWaterSourcesByVillage = async (villageId) => {
  try {
    const response = await axiosInstance.get(`/api/water-sources/village/${villageId}`);
    
    return {
      success: true,
      data: response.data.sources || [],
      message: 'Water sources fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching water sources:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch water sources'
    };
  }
};

/**
 * Create water source test
 * @param {string} sourceId - Water source ID
 * @param {Object} testData - Test data
 * @returns {Promise<Object>} Response with created test
 */
export const createWaterSourceTest = async (sourceId, testData) => {
  try {
    const data = {
      ...testData,
      sourceId
    };
    
    return await createWaterTest(data);
  } catch (error) {
    console.error('Error creating water source test:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to create water source test'
    };
  }
};

/**
 * Get test results by water source
 * @param {string} sourceId - Water source ID
 * @returns {Promise<Object>} Response with test results
 */
export const getTestResultsBySource = async (sourceId) => {
  try {
    const response = await axiosInstance.get(`/api/water-quality-tests/source/${sourceId}/results`);
    
    return {
      success: true,
      data: response.data.results || [],
      message: 'Test results fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching test results:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch test results'
    };
  }
};

/**
 * Get contamination alerts for a village
 * @param {string} villageId - Village ID
 * @returns {Promise<Object>} Response with contamination alerts
 */
export const getContaminationAlerts = async (villageId) => {
  try {
    const response = await axiosInstance.get(`/api/water-quality-tests/alerts/${villageId}`);
    
    return {
      success: true,
      data: response.data.alerts || [],
      message: 'Contamination alerts fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching contamination alerts:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch contamination alerts'
    };
  }
};

/**
 * Generate water quality report for a village
 * @param {string} villageId - Village ID
 * @param {Object} params - Report parameters
 * @param {string} params.startDate - Start date for report
 * @param {string} params.endDate - End date for report
 * @param {Array} params.sourceTypes - Water source types to include
 * @returns {Promise<Object>} Response with water quality report
 */
export const generateWaterQualityReport = async (villageId, params = {}) => {
  try {
    const response = await axiosInstance.get(`/api/water-quality-tests/report/${villageId}`, { params });
    
    return {
      success: true,
      data: response.data.report || {},
      message: 'Water quality report generated successfully'
    };
  } catch (error) {
    console.error('Error generating water quality report:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to generate water quality report'
    };
  }
};



export default {
  getAllWaterTests,
  getWaterTestById,
  createWaterTest,
  updateWaterTest,
  deleteWaterTest,
  getWaterTestHistory,
  submitTestResults,
  getWaterSourcesByVillage,
  createWaterSourceTest,
  getTestResultsBySource,
  getContaminationAlerts,
  generateWaterQualityReport
};