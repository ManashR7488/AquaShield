import { validationErrorResponse } from '../utils/responseHelper.js';

/**
 * Middleware to validate request data against Joi schema
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
export const validateRequest = (schema) => {
  return (req, res, next) => {
    // Validate request body
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Return all validation errors
      allowUnknown: false, // Don't allow unknown fields
      stripUnknown: true // Remove unknown fields
    });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/"/g, ''), // Remove quotes from error messages
        value: detail.context?.value
      }));

      return validationErrorResponse(
        res,
        'Validation failed',
        validationErrors
      );
    }

    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
};

/**
 * Middleware to validate query parameters against Joi schema
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
export const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/"/g, ''),
        value: detail.context?.value
      }));

      return validationErrorResponse(
        res,
        'Query validation failed',
        validationErrors
      );
    }

    req.query = value;
    next();
  };
};

/**
 * Middleware to validate request parameters against Joi schema
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
export const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/"/g, ''),
        value: detail.context?.value
      }));

      return validationErrorResponse(
        res,
        'Parameter validation failed',
        validationErrors
      );
    }

    req.params = value;
    next();
  };
};

/**
 * Middleware to validate request body, query, and params
 * @param {Object} schemas - Object containing body, query, and params schemas
 * @returns {Function} Express middleware function
 */
export const validateAll = (schemas) => {
  return (req, res, next) => {
    const errors = [];

    // Validate body if schema provided
    if (schemas.body) {
      const { error: bodyError, value: bodyValue } = schemas.body.validate(req.body, {
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: true
      });

      if (bodyError) {
        bodyError.details.forEach(detail => {
          errors.push({
            type: 'body',
            field: detail.path.join('.'),
            message: detail.message.replace(/"/g, ''),
            value: detail.context?.value
          });
        });
      } else {
        req.body = bodyValue;
      }
    }

    // Validate query if schema provided
    if (schemas.query) {
      const { error: queryError, value: queryValue } = schemas.query.validate(req.query, {
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: true
      });

      if (queryError) {
        queryError.details.forEach(detail => {
          errors.push({
            type: 'query',
            field: detail.path.join('.'),
            message: detail.message.replace(/"/g, ''),
            value: detail.context?.value
          });
        });
      } else {
        req.query = queryValue;
      }
    }

    // Validate params if schema provided
    if (schemas.params) {
      const { error: paramsError, value: paramsValue } = schemas.params.validate(req.params, {
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: true
      });

      if (paramsError) {
        paramsError.details.forEach(detail => {
          errors.push({
            type: 'params',
            field: detail.path.join('.'),
            message: detail.message.replace(/"/g, ''),
            value: detail.context?.value
          });
        });
      } else {
        req.params = paramsValue;
      }
    }

    if (errors.length > 0) {
      return validationErrorResponse(
        res,
        'Validation failed',
        errors
      );
    }

    next();
  };
};

export default {
  validateRequest,
  validateQuery,
  validateParams,
  validateAll
};