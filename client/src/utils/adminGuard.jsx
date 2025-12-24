import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

/**
 * Admin Guard Utility
 * Provides functions and components for role-based route protection
 */

/**
 * Check if the current user has admin privileges
 * @returns {boolean} True if user is admin, false otherwise
 */
export const requireAdminRole = () => {
  const { user } = useAuthStore.getState?.() || { user: null }; // avoid React hook usage here
  return !!(user && user.roleInfo?.role === 'admin');
};

/**
 * Hook to check admin access and redirect if unauthorized
 * @param {string} redirectPath - Path to redirect if not admin (default: '/app')
 * @returns {boolean} True if user is admin, false otherwise
 */
export const useAdminGuard = (redirectPath = '/app') => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && (!user || user.roleInfo?.role !== 'admin')) {
      navigate(redirectPath);
    }
  }, [user, isLoading, navigate, redirectPath]);

  return !!(user && user.roleInfo?.role === 'admin');
};

/**
 * Higher-order component for admin route protection
 * @param {React.Component} Component - Component to protect
 * @param {string} redirectPath - Path to redirect if not admin
 * @returns {React.Component} Protected component
 */
export const withAdminGuard = (Component, redirectPath = '/app') => {
  return function AdminProtectedComponent(props) {
    const navigate = useNavigate();
    const { user, isLoading } = useAuthStore();

    useEffect(() => {
      if (!isLoading && !user) {
        // User not authenticated, redirect to login
        navigate('/app/auth/login');
      } else if (!isLoading && user && user.roleInfo?.role !== 'admin') {
        // User authenticated but wrong role, redirect to dashboard
        navigate(redirectPath);
      }
    }, [user, isLoading, navigate, redirectPath]);

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      );
    }

    if (!user || user.roleInfo?.role !== 'admin') return null;
    return <Component {...props} />;
  };
};

/**
 * Component to wrap admin-only content
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to render if admin
 * @param {React.ReactNode} props.fallback - Content to render if not admin
 * @param {boolean} props.showLoading - Show loading while checking auth
 * @returns {React.Component}
 */
export const AdminOnly = ({ 
  children, 
  fallback = null, 
  showLoading = true 
}) => {
  const { user, isLoading } = useAuthStore();
  
  // Show loading while auth is being initialized
  if (isLoading && showLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  // Check if user is admin
  const isAdmin = user && user.roleInfo?.role === 'admin';
  
  if (isAdmin) {
    return children;
  }
  
  return fallback;
};

/**
 * Check if user has specific permission
 * @param {string} permission - Permission to check
 * @param {Object} user - User object (optional, uses current user if not provided)
 * @returns {boolean} True if user has permission
 */
export const hasPermission = (permission, user = null) => {
  const { user: currentUser } = useAuthStore();
  const targetUser = user || currentUser;
  
  if (!targetUser || !targetUser.roleInfo) {
    return false;
  }
  
  const { role } = targetUser.roleInfo;
  
  // Define role-based permissions
  const permissions = {
    admin: [
      'manage_users',
      'manage_districts', 
      'manage_blocks',
      'manage_villages',
      'view_analytics',
      'system_settings',
      'export_data',
      'manage_roles',
      'audit_logs'
    ],
    health_official: [
      'view_district_data',
      'manage_district_settings',
      'view_health_reports',
      'manage_health_workers'
    ],
    block_officer: [
      'view_block_data',
      'manage_block_settings',
      'view_village_reports',
      'manage_village_workers'
    ],
    village_worker: [
      'view_village_data',
      'submit_reports',
      'manage_citizens'
    ],
    citizen: [
      'view_own_data',
      'submit_feedback'
    ]
  };
  
  const userPermissions = permissions[role] || [];
  return userPermissions.includes(permission);
};

/**
 * Check if user can access specific resource
 * @param {string} resource - Resource type ('district', 'block', 'village', etc.)
 * @param {string} resourceId - ID of the resource (optional)
 * @param {Object} user - User object (optional, uses current user if not provided)
 * @returns {boolean} True if user can access resource
 */
export const canAccessResource = (resource, resourceId = null, user = null) => {
  const { user: currentUser } = useAuthStore();
  const targetUser = user || currentUser;
  
  if (!targetUser || !targetUser.roleInfo) {
    return false;
  }
  
  const { role, hierarchy } = targetUser.roleInfo;
  
  // Admin can access everything
  if (role === 'admin') {
    return true;
  }
  
  // Check resource-specific access based on user hierarchy
  switch (resource) {
    case 'district':
      if (role === 'health_official') {
        // Health officials can access their assigned district
        return !resourceId || hierarchy?.district?._id === resourceId;
      }
      break;
      
    case 'block':
      if (['health_official', 'block_officer'].includes(role)) {
        if (role === 'health_official') {
          // Health officials can access blocks in their district
          return !resourceId || hierarchy?.district?._id;
        } else if (role === 'block_officer') {
          // Block officers can access their assigned block
          return !resourceId || hierarchy?.block?._id === resourceId;
        }
      }
      break;
      
    case 'village':
      if (['health_official', 'block_officer', 'village_worker'].includes(role)) {
        if (role === 'health_official') {
          // Health officials can access villages in their district
          return !resourceId || hierarchy?.district?._id;
        } else if (role === 'block_officer') {
          // Block officers can access villages in their block
          return !resourceId || hierarchy?.block?._id;
        } else if (role === 'village_worker') {
          // Village workers can access their assigned village
          return !resourceId || hierarchy?.village?._id === resourceId;
        }
      }
      break;
      
    case 'user':
      if (role === 'admin') {
        return true;
      }
      // Users can access their own data
      return !resourceId || targetUser._id === resourceId;
      
    default:
      return false;
  }
  
  return false;
};

/**
 * Get user's accessible resources based on their role and hierarchy
 * @param {string} resourceType - Type of resource ('districts', 'blocks', 'villages')
 * @param {Object} user - User object (optional, uses current user if not provided)
 * @returns {Object} Object with resource IDs that user can access
 */
export const getUserAccessibleResources = (resourceType, user = null) => {
  const { user: currentUser } = useAuthStore();
  const targetUser = user || currentUser;
  
  if (!targetUser || !targetUser.roleInfo) {
    return { all: false, ids: [] };
  }
  
  const { role, hierarchy } = targetUser.roleInfo;
  
  // Admin has access to all resources
  if (role === 'admin') {
    return { all: true, ids: [] };
  }
  
  const result = { all: false, ids: [] };
  
  switch (resourceType) {
    case 'districts':
      if (role === 'health_official' && hierarchy?.district) {
        result.ids.push(hierarchy.district._id);
      }
      break;
      
    case 'blocks':
      if (role === 'health_official' && hierarchy?.district) {
        // Health officials can access all blocks in their district
        // This would need to be populated from the district's blocks
        result.districtId = hierarchy.district._id;
      } else if (role === 'block_officer' && hierarchy?.block) {
        result.ids.push(hierarchy.block._id);
      }
      break;
      
    case 'villages':
      if (role === 'health_official' && hierarchy?.district) {
        // Health officials can access all villages in their district
        result.districtId = hierarchy.district._id;
      } else if (role === 'block_officer' && hierarchy?.block) {
        // Block officers can access all villages in their block
        result.blockId = hierarchy.block._id;
      } else if (role === 'village_worker' && hierarchy?.village) {
        result.ids.push(hierarchy.village._id);
      }
      break;
  }
  
  return result;
};

/**
 * Check if user is in a specific role
 * @param {string|Array} roles - Role(s) to check against
 * @param {Object} user - User object (optional, uses current user if not provided)
 * @returns {boolean} True if user has one of the specified roles
 */
export const hasRole = (roles, user = null) => {
  const { user: currentUser } = useAuthStore();
  const targetUser = user || currentUser;
  
  if (!targetUser || !targetUser.roleInfo) {
    return false;
  }
  
  const userRole = targetUser.roleInfo.role;
  
  if (Array.isArray(roles)) {
    return roles.includes(userRole);
  }
  
  return userRole === roles;
};

/**
 * Get user's role hierarchy level (higher number = more permissions)
 * @param {Object} user - User object (optional, uses current user if not provided)
 * @returns {number} Hierarchy level (0-4)
 */
export const getRoleHierarchyLevel = (user = null) => {
  const { user: currentUser } = useAuthStore();
  const targetUser = user || currentUser;
  
  if (!targetUser || !targetUser.roleInfo) {
    return -1;
  }
  
  const roleHierarchy = {
    'citizen': 0,
    'village_worker': 1,
    'block_officer': 2,
    'health_official': 3,
    'admin': 4
  };
  
  return roleHierarchy[targetUser.roleInfo.role] || -1;
};

/**
 * Check if current user can manage another user based on role hierarchy
 * @param {Object} targetUser - User to be managed
 * @param {Object} currentUser - Current user (optional, uses auth store if not provided)
 * @returns {boolean} True if current user can manage target user
 */
export const canManageUser = (targetUser, currentUser = null) => {
  const { user } = useAuthStore();
  const manager = currentUser || user;
  
  if (!manager || !targetUser) {
    return false;
  }
  
  const managerLevel = getRoleHierarchyLevel(manager);
  const targetLevel = getRoleHierarchyLevel(targetUser);
  
  // Admin can manage everyone, others can only manage users at lower hierarchy levels
  return managerLevel > targetLevel || manager.roleInfo?.role === 'admin';
};

export default {
  requireAdminRole,
  useAdminGuard,
  withAdminGuard,
  AdminOnly,
  hasPermission,
  canAccessResource,
  getUserAccessibleResources,
  hasRole,
  getRoleHierarchyLevel,
  canManageUser
};