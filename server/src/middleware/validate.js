import Joi from 'joi';

/**
 * Validation middleware using Joi for request validation
 */

/**
 * Validate request body against Joi schema
 * @param {Joi.Schema} schema - Joi validation schema
 * @param {Object} options - Validation options
 * @returns {Function} Middleware function
 */
const validateBody = (schema, options = {}) => {
  return (req, res, next) => {
    try {
      const validationOptions = {
        abortEarly: false, // Return all validation errors
        allowUnknown: false, // Don't allow unknown fields
        stripUnknown: true, // Remove unknown fields
        ...options
      };

      const { error, value } = schema.validate(req.body, validationOptions);

      if (error) {
        return res.status(400).json(createValidationError(error, 'Request body validation failed'));
      }

      // Replace request body with validated and sanitized data
      req.body = value;
      next();
    } catch (validationError) {
      console.error('Body validation middleware error:', validationError);
      res.status(500).json({
        success: false,
        message: 'Internal server error during body validation.'
      });
    }
  };
};

/**
 * Validate request parameters against Joi schema
 * @param {Joi.Schema} schema - Joi validation schema
 * @param {Object} options - Validation options
 * @returns {Function} Middleware function
 */
const validateParams = (schema, options = {}) => {
  return (req, res, next) => {
    try {
      const validationOptions = {
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: true,
        ...options
      };

      const { error, value } = schema.validate(req.params, validationOptions);

      if (error) {
        return res.status(400).json(createValidationError(error, 'Request parameters validation failed'));
      }

      req.params = value;
      next();
    } catch (validationError) {
      console.error('Params validation middleware error:', validationError);
      res.status(500).json({
        success: false,
        message: 'Internal server error during parameter validation.'
      });
    }
  };
};

/**
 * Validate request query parameters against Joi schema
 * @param {Joi.Schema} schema - Joi validation schema
 * @param {Object} options - Validation options
 * @returns {Function} Middleware function
 */
const validateQuery = (schema, options = {}) => {
  return (req, res, next) => {
    try {
      const validationOptions = {
        abortEarly: false,
        allowUnknown: true, // Allow unknown query params by default
        stripUnknown: false, // Don't strip unknown query params
        ...options
      };

      const { error, value } = schema.validate(req.query, validationOptions);

      if (error) {
        return res.status(400).json(createValidationError(error, 'Query parameters validation failed'));
      }

      req.query = value;
      next();
    } catch (validationError) {
      console.error('Query validation middleware error:', validationError);
      res.status(500).json({
        success: false,
        message: 'Internal server error during query validation.'
      });
    }
  };
};

/**
 * Create standardized validation error response
 * @param {Joi.ValidationError} joiError - Joi validation error
 * @param {string} message - Main error message
 * @returns {Object} Formatted error response
 */
const createValidationError = (joiError, message) => {
  const errors = joiError.details.map(detail => ({
    field: detail.path.join('.'),
    message: detail.message,
    value: detail.context?.value
  }));

  return {
    success: false,
    message: message,
    errors: errors,
    errorCount: errors.length
  };
};

/**
 * Optional validation - allows undefined values
 * @param {Joi.Schema} schema - Joi validation schema
 * @returns {Function} Middleware function
 */
const validateOptional = (schema) => {
  return validateBody(schema, { allowUnknown: true, presence: 'optional' });
};

/**
 * Strict validation - requires all fields and no unknown fields
 * @param {Joi.Schema} schema - Joi validation schema
 * @returns {Function} Middleware function
 */
const validateStrict = (schema) => {
  return validateBody(schema, { allowUnknown: false, presence: 'required' });
};

export {
  validateBody,
  validateParams,
  validateQuery,
  validateOptional,
  validateStrict,
  createValidationError
};

export default validateBody;