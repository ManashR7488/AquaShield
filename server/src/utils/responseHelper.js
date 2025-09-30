/**
 * Response helper utilities for consistent API responses
 */

/**
 * Send successful response with data
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {Object} Response object
 */
const successResponse = (res, data = null, message = 'Success', statusCode = 200) => {
  const response = {
    success: true,
    message: message,
    data: data,
    timestamp: new Date().toISOString()
  };

  return res.status(statusCode).json(response);
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {Array|Object} errors - Detailed error information
 * @returns {Object} Response object
 */
const errorResponse = (res, message = 'Internal Server Error', statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message: message,
    statusCode: statusCode,
    timestamp: new Date().toISOString()
  };

  if (errors) {
    response.errors = Array.isArray(errors) ? errors : [errors];
    response.errorCount = response.errors.length;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send paginated response with metadata
 * @param {Object} res - Express response object
 * @param {Array} data - Array of data items
 * @param {Object} pagination - Pagination metadata
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {Object} Response object
 */
const paginatedResponse = (res, data = [], pagination = {}, message = 'Success', statusCode = 200) => {
  const response = {
    success: true,
    message: message,
    data: data,
    pagination: pagination,
    count: data.length,
    timestamp: new Date().toISOString()
  };

  return res.status(statusCode).json(response);
};

/**
 * Calculate pagination metadata
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items
 * @returns {Object} Pagination metadata
 */
const getPaginationData = (page, limit, total) => {
  const currentPage = parseInt(page) || 1;
  const itemsPerPage = parseInt(limit) || 10;
  const totalItems = parseInt(total) || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const skip = (currentPage - 1) * itemsPerPage;

  return {
    currentPage,
    itemsPerPage,
    totalItems,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    nextPage: currentPage < totalPages ? currentPage + 1 : null,
    prevPage: currentPage > 1 ? currentPage - 1 : null,
    skip
  };
};

/**
 * Send response for created resource (201)
 * @param {Object} res - Express response object
 * @param {*} data - Created resource data
 * @param {string} message - Success message
 * @returns {Object} Response object
 */
const createdResponse = (res, data = null, message = 'Resource created successfully') => {
  return successResponse(res, data, message, 201);
};

/**
 * Send response for updated resource (200)
 * @param {Object} res - Express response object
 * @param {*} data - Updated resource data
 * @param {string} message - Success message
 * @returns {Object} Response object
 */
const updatedResponse = (res, data = null, message = 'Resource updated successfully') => {
  return successResponse(res, data, message, 200);
};

/**
 * Send response for deleted resource (204 or 200 with confirmation)
 * @param {Object} res - Express response object
 * @param {boolean} sendData - Whether to send confirmation data (default: false for 204)
 * @param {string} message - Success message
 * @returns {Object} Response object
 */
const deletedResponse = (res, sendData = false, message = 'Resource deleted successfully') => {
  if (sendData) {
    return successResponse(res, null, message, 200);
  } else {
    return res.status(204).send(); // No Content
  }
};

/**
 * Send not found response (404)
 * @param {Object} res - Express response object
 * @param {string} message - Not found message
 * @returns {Object} Response object
 */
const notFoundResponse = (res, message = 'Resource not found') => {
  return errorResponse(res, message, 404);
};

/**
 * Send validation error response (400)
 * @param {Object} res - Express response object
 * @param {string} message - Validation error message
 * @param {Array|Object} errors - Validation errors
 * @returns {Object} Response object
 */
const validationErrorResponse = (res, message = 'Validation failed', errors = null) => {
  return errorResponse(res, message, 400, errors);
};

/**
 * Send unauthorized response (401)
 * @param {Object} res - Express response object
 * @param {string} message - Unauthorized message
 * @returns {Object} Response object
 */
const unauthorizedResponse = (res, message = 'Unauthorized access') => {
  return errorResponse(res, message, 401);
};

/**
 * Send forbidden response (403)
 * @param {Object} res - Express response object
 * @param {string} message - Forbidden message
 * @returns {Object} Response object
 */
const forbiddenResponse = (res, message = 'Access forbidden') => {
  return errorResponse(res, message, 403);
};

/**
 * Send conflict response (409)
 * @param {Object} res - Express response object
 * @param {string} message - Conflict message
 * @returns {Object} Response object
 */
const conflictResponse = (res, message = 'Resource conflict') => {
  return errorResponse(res, message, 409);
};

/**
 * Send too many requests response (429)
 * @param {Object} res - Express response object
 * @param {string} message - Rate limit message
 * @returns {Object} Response object
 */
const tooManyRequestsResponse = (res, message = 'Too many requests') => {
  return errorResponse(res, message, 429);
};

/**
 * Create standardized API response structure
 * @param {boolean} success - Success status
 * @param {*} data - Response data
 * @param {string} message - Response message
 * @param {number} statusCode - HTTP status code
 * @param {Object} meta - Additional metadata
 * @returns {Object} Formatted response object
 */
const createResponse = (success, data = null, message = '', statusCode = 200, meta = {}) => {
  const response = {
    success,
    message,
    timestamp: new Date().toISOString(),
    ...meta
  };

  if (success) {
    if (data !== null) {
      response.data = data;
    }
  } else {
    response.statusCode = statusCode;
  }

  return response;
};

export {
  successResponse,
  errorResponse,
  paginatedResponse,
  getPaginationData,
  createdResponse,
  updatedResponse,
  deletedResponse,
  notFoundResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  conflictResponse,
  tooManyRequestsResponse,
  createResponse
};