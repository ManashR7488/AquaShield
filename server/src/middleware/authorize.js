/**
 * Role-based authorization middleware to restrict access based on user roles
 */

/**
 * Generic authorization function that accepts an array of allowed roles
 * @param {Array<string>} allowedRoles - Array of roles that are allowed to access the resource
 * @returns {Function} Middleware function
 */
const authorize = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // Check if user object exists (should be set by authenticate middleware)
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required. Please log in.'
        });
      }

      // Check if user has role information
      if (!req.user.roleInfo || !req.user.roleInfo.role) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. User role information missing.'
        });
      }

      // Check if user role is in allowed roles
      const userRole = req.user.roleInfo.role;
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}. Your role: ${userRole}`
        });
      }

      next();
    } catch (error) {
      console.error('Authorization middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during authorization.'
      });
    }
  };
};

/**
 * Helper functions for common role combinations
 */

// Admin only access
const adminOnly = () => authorize(['admin']);

// Health officials and above (admin, health_official)
const healthOfficialAndAbove = () => authorize(['admin', 'health_official']);

// ASHA workers and above (admin, health_official, asha_worker)
const ashaWorkerAndAbove = () => authorize(['admin', 'health_official', 'asha_worker']);

// Volunteers and above (all roles including volunteer)
const volunteerAndAbove = () => authorize(['admin', 'health_official', 'asha_worker', 'volunteer']);

// Health workers (ASHA workers and health officials)
const healthWorkers = () => authorize(['health_official', 'asha_worker']);

// Field workers (ASHA workers and volunteers)
const fieldWorkers = () => authorize(['asha_worker', 'volunteer']);

// Management roles (admin and health officials)
const managementRoles = () => authorize(['admin', 'health_official']);

/**
 * Resource ownership authorization - checks if user owns the resource
 * @param {string} resourceUserField - Field name in the resource that contains the user ID
 * @returns {Function} Middleware function
 */
const authorizeResourceOwner = (resourceUserField = 'userId') => {
  return (req, res, next) => {
    try {
      // This middleware should be used after the resource is fetched
      // and attached to req.resource by the controller
      if (!req.resource) {
        return res.status(500).json({
          success: false,
          message: 'Resource not found for ownership validation.'
        });
      }

      const resourceOwnerId = req.resource[resourceUserField];
      const currentUserId = req.user._id;

      // Check if user owns the resource or has admin/health_official role
      const userRole = req.user.roleInfo.role;
      const isOwner = resourceOwnerId && resourceOwnerId.toString() === currentUserId.toString();
      const hasElevatedRole = ['admin', 'health_official'].includes(userRole);

      if (!isOwner && !hasElevatedRole) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only access your own resources.'
        });
      }

      next();
    } catch (error) {
      console.error('Resource ownership authorization error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during ownership validation.'
      });
    }
  };
};

export {
  authorize,
  adminOnly,
  healthOfficialAndAbove,
  ashaWorkerAndAbove,
  volunteerAndAbove,
  healthWorkers,
  fieldWorkers,
  managementRoles,
  authorizeResourceOwner
};

export default authorize;