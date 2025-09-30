/**
 * Centralized error handling middleware for consistent error responses
 */

/**
 * Main error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging (don't log in production for sensitive data)
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error Stack:', err.stack);
    console.error('Error Details:', {
      name: err.name,
      message: err.message,
      path: req.path,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query,
      user: req.user ? req.user._id : 'Not authenticated'
    });
  } else {
    // In production, log only essential error information
    console.error(`${new Date().toISOString()} - ${req.method} ${req.path} - ${err.name}: ${err.message}`);
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found. Invalid ID format.';
    error = createErrorResponse(message, 404);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `Duplicate value for field '${field}': '${value}'. This value already exists.`;
    error = createErrorResponse(message, 409);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = 'Validation Error';
    const errors = Object.values(err.errors).map(val => ({
      field: val.path,
      message: val.message,
      value: val.value
    }));
    error = createErrorResponse(message, 400, errors);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token. Please log in again.';
    error = createErrorResponse(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token has expired. Please log in again.';
    error = createErrorResponse(message, 401);
  }

  // MongoDB connection errors
  if (err.name === 'MongoError' || err.name === 'MongooseError') {
    const message = 'Database connection error. Please try again later.';
    error = createErrorResponse(message, 500);
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File size too large. Please upload a smaller file.';
    error = createErrorResponse(message, 400);
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    const message = 'Too many files. Please reduce the number of files.';
    error = createErrorResponse(message, 400);
  }

  // Rate limiting errors
  if (err.status === 429) {
    const message = 'Too many requests. Please try again later.';
    error = createErrorResponse(message, 429);
  }

  // Default error response
  if (!error.statusCode) {
    error = createErrorResponse(
      error.message || 'Internal Server Error',
      error.statusCode || 500
    );
  }

  res.status(error.statusCode).json(error);
};

/**
 * Create standardized error response
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {Array} errors - Array of detailed errors
 * @returns {Object} Formatted error response
 */
const createErrorResponse = (message, statusCode, errors = null) => {
  const errorResponse = {
    success: false,
    message: message,
    statusCode: statusCode,
    timestamp: new Date().toISOString()
  };

  // Add detailed errors if provided
  if (errors && errors.length > 0) {
    errorResponse.errors = errors;
    errorResponse.errorCount = errors.length;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV !== 'production' && Error.captureStackTrace) {
    Error.captureStackTrace(errorResponse, createErrorResponse);
  }

  return errorResponse;
};

/**
 * Handle async errors in routes (wrapper for async route handlers)
 * @param {Function} fn - Async route handler function
 * @returns {Function} Wrapped function with error handling
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Handle 404 errors for routes not found
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const notFound = (req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export {
  errorHandler,
  createErrorResponse,
  asyncHandler,
  notFound
};