import axiosInstance from '../config/axios';

/**
 * Health Query Service
 * Handles all health query and AI interaction operations for users
 * All operations are scoped to the current user and their family members
 */

/**
 * Get all health queries for a user
 * @param {string} userId - User ID to filter health queries
 * @param {Object} params - Query parameters for filtering and pagination
 * @param {number} params.page - Page number for pagination
 * @param {number} params.limit - Number of items per page
 * @param {string} params.search - Search term for filtering
 * @param {string} params.queryType - Filter by query type
 * @param {string} params.status - Filter by status
 * @param {string} params.urgency - Filter by urgency level
 * @param {string} params.dateFrom - Filter from date
 * @param {string} params.dateTo - Filter to date
 * @param {string} params.sortBy - Field to sort by
 * @param {string} params.sortOrder - Sort order (asc/desc)
 * @returns {Promise<Object>} Response with health queries data
 */
export const getHealthQueries = async (userId, params = {}) => {
  try {
    const queryParams = {
      user: userId,
      ...params
    };
    
    const response = await axiosInstance.get('/api/health-queries', { params: queryParams });
    
    return {
      success: true,
      data: response.data.data || response.data.queries || [],
      total: response.data.total || 0,
      pagination: response.data.pagination || {},
      message: response.data.message || 'Health queries fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching health queries:', error);
    return {
      success: false,
      data: [],
      total: 0,
      message: error.response?.data?.message || 'Failed to fetch health queries',
      error: error.response?.data?.message || 'Failed to fetch health queries'
    };
  }
};

/**
 * Get health query by ID
 * @param {string} id - Health query ID
 * @returns {Promise<Object>} Response with health query data
 */
export const getHealthQueryById = async (id) => {
  try {
    const response = await axiosInstance.get(`/api/health-queries/${id}`);
    
    return {
      success: true,
      data: response.data.data || response.data.query || {},
      message: response.data.message || 'Health query fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching health query:', error);
    return {
      success: false,
      data: {},
      message: error.response?.data?.message || 'Failed to fetch health query',
      error: error.response?.data?.message || 'Failed to fetch health query'
    };
  }
};

/**
 * Create a new health query
 * @param {Object|FormData} queryData - Health query data (can be FormData for file uploads)
 * @param {string} queryData.queryType - Type of query (general_health, symptoms, medications, emergency, family_health)
 * @param {string} queryData.title - Query title
 * @param {string} queryData.description - Detailed question description
 * @param {string} queryData.urgency - Urgency level (low, medium, high, emergency)
 * @param {string} queryData.personId - Affected person ID (user or family member)
 * @param {Array} queryData.symptoms - Related symptoms
 * @param {Array} queryData.medications - Current medications
 * @param {string} queryData.medicalHistory - Relevant medical history
 * @param {Array} queryData.documents - Supporting documents
 * @returns {Promise<Object>} Response with created health query data
 */
export const createHealthQuery = async (queryData) => {
  try {
    const config = {};
    
    // Set content type for FormData
    if (queryData instanceof FormData) {
      config.headers = { 'Content-Type': 'multipart/form-data' };
    }
    
    const response = await axiosInstance.post('/api/health-queries', queryData, config);
    
    return {
      success: true,
      data: response.data.data || response.data.query || {},
      message: response.data.message || 'Health query created successfully'
    };
  } catch (error) {
    console.error('Error creating health query:', error);
    return {
      success: false,
      data: {},
      message: error.response?.data?.message || 'Failed to create health query',
      error: error.response?.data?.message || 'Failed to create health query'
    };
  }
};

/**
 * Update health query
 * @param {string} id - Health query ID
 * @param {Object|FormData} queryData - Updated health query data
 * @returns {Promise<Object>} Response with updated health query data
 */
export const updateHealthQuery = async (id, queryData) => {
  try {
    const config = {};
    
    // Set content type for FormData
    if (queryData instanceof FormData) {
      config.headers = { 'Content-Type': 'multipart/form-data' };
    }
    
    const response = await axiosInstance.put(`/api/health-queries/${id}`, queryData, config);
    
    return {
      success: true,
      data: response.data.data || response.data.query || {},
      message: response.data.message || 'Health query updated successfully'
    };
  } catch (error) {
    console.error('Error updating health query:', error);
    return {
      success: false,
      data: {},
      message: error.response?.data?.message || 'Failed to update health query',
      error: error.response?.data?.message || 'Failed to update health query'
    };
  }
};

/**
 * Delete health query
 * @param {string} id - Health query ID
 * @returns {Promise<Object>} Response with deletion status
 */
export const deleteHealthQuery = async (id) => {
  try {
    await axiosInstance.delete(`/api/health-queries/${id}`);
    
    return {
      success: true,
      message: 'Health query deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting health query:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to delete health query',
      error: error.response?.data?.message || 'Failed to delete health query'
    };
  }
};

/**
 * Get query history for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Response with query history
 */
export const getQueryHistory = async (userId) => {
  try {
    const response = await axiosInstance.get(`/api/health-queries/history/${userId}`);
    
    return {
      success: true,
      data: response.data.data || response.data.history || [],
      message: response.data.message || 'Query history fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching query history:', error);
    return {
      success: false,
      data: [],
      message: error.response?.data?.message || 'Failed to fetch query history',
      error: error.response?.data?.message || 'Failed to fetch query history'
    };
  }
};

/**
 * Submit urgent query
 * @param {string} userId - User ID
 * @param {Object} queryData - Urgent query data
 * @returns {Promise<Object>} Response with submitted urgent query
 */
export const submitUrgentQuery = async (userId, queryData) => {
  try {
    const urgentQueryData = {
      ...queryData,
      urgency: 'emergency',
      userId
    };
    
    return await createHealthQuery(urgentQueryData);
  } catch (error) {
    console.error('Error submitting urgent query:', error);
    return {
      success: false,
      data: {},
      message: error.response?.data?.message || 'Failed to submit urgent query',
      error: error.response?.data?.message || 'Failed to submit urgent query'
    };
  }
};

/**
 * Get query response
 * @param {string} queryId - Query ID
 * @returns {Promise<Object>} Response with query response data
 */
export const getQueryResponse = async (queryId) => {
  try {
    const response = await axiosInstance.get(`/api/health-queries/${queryId}/response`);
    
    return {
      success: true,
      data: response.data.data || response.data.response || {},
      message: response.data.message || 'Query response fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching query response:', error);
    return {
      success: false,
      data: {},
      message: error.response?.data?.message || 'Failed to fetch query response',
      error: error.response?.data?.message || 'Failed to fetch query response'
    };
  }
};

/**
 * Mark query as resolved
 * @param {string} queryId - Query ID
 * @returns {Promise<Object>} Response with updated status
 */
export const markQueryResolved = async (queryId) => {
  try {
    const response = await axiosInstance.patch(`/api/health-queries/${queryId}/resolve`);
    
    return {
      success: true,
      data: response.data.data || {},
      message: response.data.message || 'Query marked as resolved'
    };
  } catch (error) {
    console.error('Error marking query as resolved:', error);
    return {
      success: false,
      data: {},
      message: error.response?.data?.message || 'Failed to mark query as resolved',
      error: error.response?.data?.message || 'Failed to mark query as resolved'
    };
  }
};

/**
 * Get queries by category for a user
 * @param {string} category - Query category
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Response with filtered queries
 */
export const getQueriesByCategory = async (category, userId) => {
  try {
    return await getHealthQueries(userId, { queryType: category });
  } catch (error) {
    console.error('Error fetching queries by category:', error);
    return {
      success: false,
      data: [],
      message: error.response?.data?.message || 'Failed to fetch queries by category',
      error: error.response?.data?.message || 'Failed to fetch queries by category'
    };
  }
};

/**
 * Get frequently asked questions
 * @returns {Promise<Object>} Response with FAQs
 */
export const getFrequentlyAskedQuestions = async () => {
  try {
    const response = await axiosInstance.get('/api/health-queries/faq');
    
    return {
      success: true,
      data: response.data.data || response.data.faqs || [],
      message: response.data.message || 'FAQs fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return {
      success: false,
      data: [],
      message: error.response?.data?.message || 'Failed to fetch FAQs',
      error: error.response?.data?.message || 'Failed to fetch FAQs'
    };
  }
};

/**
 * Get suggested questions for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Response with suggested questions
 */
export const getSuggestedQuestions = async (userId) => {
  try {
    const response = await axiosInstance.get(`/api/health-queries/suggestions/${userId}`);
    
    return {
      success: true,
      data: response.data.data || response.data.suggestions || [],
      message: response.data.message || 'Suggested questions fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching suggested questions:', error);
    return {
      success: false,
      data: [],
      message: error.response?.data?.message || 'Failed to fetch suggested questions',
      error: error.response?.data?.message || 'Failed to fetch suggested questions'
    };
  }
};

// TODO: Backend endpoints need to be implemented:
// - GET /api/health-queries
// - GET /api/health-queries/:id
// - POST /api/health-queries
// - PUT /api/health-queries/:id
// - DELETE /api/health-queries/:id
// - GET /api/health-queries/history/:userId
// - GET /api/health-queries/:id/response
// - PATCH /api/health-queries/:id/resolve
// - GET /api/health-queries/faq
// - GET /api/health-queries/suggestions/:userId

export default {
  getHealthQueries,
  getHealthQueryById,
  createHealthQuery,
  updateHealthQuery,
  deleteHealthQuery,
  getQueryHistory,
  submitUrgentQuery,
  getQueryResponse,
  markQueryResolved,
  getQueriesByCategory,
  getFrequentlyAskedQuestions,
  getSuggestedQuestions
};