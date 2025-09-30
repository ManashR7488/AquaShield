import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

/**
 * Health Officer Guard Utility
 * Provides functions and components for health officer role-based route protection
 */

/**
 * Check if the current user has health officer privileges
 * @returns {boolean} True if user is health officer, false otherwise
 */
export const requireHealthOfficerRole = () => {
  const { user } = useAuthStore.getState?.() || { user: null }; // avoid React hook usage here
  return !!(user && user.roleInfo?.role === 'health_official');
};

/**
 * Hook to check health officer access and redirect if unauthorized
 * @param {string} redirectPath - Path to redirect if not health officer (default: '/app')
 * @returns {boolean} True if user is health officer, false otherwise
 */
export const useHealthOfficerGuard = (redirectPath = '/app') => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && (!user || user.roleInfo?.role !== 'health_official')) {
      navigate(redirectPath);
    }
  }, [user, isLoading, navigate, redirectPath]);

  return !!(user && user.roleInfo?.role === 'health_official');
};

/**
 * Higher-order component for health officer route protection
 * @param {React.Component} Component - Component to protect
 * @param {string} redirectPath - Path to redirect if not health officer
 * @returns {React.Component} Protected component
 */
export const withHealthOfficerGuard = (Component, redirectPath = '/app') => {
  return function HealthOfficerProtectedComponent(props) {
    const navigate = useNavigate();
    const { user, isLoading } = useAuthStore();

    useEffect(() => {
      if (!isLoading && (!user || user.roleInfo?.role !== 'health_official')) {
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

    if (!user || user.roleInfo?.role !== 'health_official') return null;
    return <Component {...props} />;
  };
};

/**
 * Component to wrap health officer-only content
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to render if health officer
 * @param {React.ReactNode} props.fallback - Content to render if not health officer
 * @param {boolean} props.showLoading - Show loading while checking auth
 * @returns {React.Component}
 */
export const HealthOfficerOnly = ({ 
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
  
  // Check if user is health officer
  const isHealthOfficer = user && user.roleInfo?.role === 'health_official';
  
  if (isHealthOfficer) {
    return children;
  }
  
  return fallback;
};

/**
 * Get the health officer's assigned district ID
 * @param {Object} user - User object (optional, uses current user if not provided)
 * @returns {string|null} District ID or null if not available
 */
export const getHealthOfficerDistrict = (user = null) => {
  const targetUser = user || useAuthStore.getState?.()?.user || null;
  
  if (!targetUser || targetUser.roleInfo?.role !== 'health_official') {
    return null;
  }
  
  // Support both embedded district objects and plain districtId
  return targetUser.roleInfo?.hierarchy?.district?._id
    || targetUser.roleInfo?.hierarchy?.districtId
    || null;
};

/**
 * Check if health officer can manage a specific block
 * @param {string} blockId - Block ID to check
 * @param {Object} user - User object (optional, uses current user if not provided)
 * @returns {boolean} True if health officer can manage the block
 */
export const canManageBlock = (blockId, user = null) => {
  const targetUser = user || useAuthStore.getState?.()?.user || null;
  
  if (!targetUser || targetUser.roleInfo?.role !== 'health_official') {
    return false;
  }
  
  const districtId = getHealthOfficerDistrict(targetUser);
  if (!districtId) {
    return false;
  }
  
  // For now, return true if district is assigned
  // In a real implementation, you'd check if the block belongs to the district
  return true;
};

/**
 * Check if health officer has specific permission
 * @param {string} permission - Permission to check
 * @param {Object} user - User object (optional, uses current user if not provided)
 * @returns {boolean} True if user has permission
 */
export const hasHealthOfficerPermission = (permission, user = null) => {
  const targetUser = user || useAuthStore.getState?.()?.user || null;
  
  if (!targetUser || targetUser.roleInfo?.role !== 'health_official') {
    return false;
  }
  
  // Define health officer permissions
  const healthOfficerPermissions = [
    'view_district_data',
    'manage_blocks',
    'manage_health_programs',
    'manage_district_staff',
    'view_health_reports',
    'assign_staff_to_blocks',
    'generate_village_tokens',
    'update_block_status',
    'create_health_programs',
    'assign_programs_to_blocks',
    'view_program_metrics',
    'generate_program_reports',
    'manage_asha_workers',
    'manage_volunteers',
    'view_staff_performance'
  ];
  
  return healthOfficerPermissions.includes(permission);
};

/**
 * Check if user can access specific resource within their district
 * @param {string} resource - Resource type ('block', 'health_program', 'staff', etc.)
 * @param {string} resourceId - ID of the resource (optional)
 * @param {Object} user - User object (optional, uses current user if not provided)
 * @returns {boolean} True if user can access resource
 */
export const canAccessDistrictResource = (resource, resourceId = null, user = null) => {
  const targetUser = user || useAuthStore.getState?.()?.user || null;
  
  if (!targetUser || targetUser.roleInfo?.role !== 'health_official') {
    return false;
  }
  
  const districtId = getHealthOfficerDistrict(targetUser);
  if (!districtId) {
    return false;
  }
  
  // Check resource-specific access based on district scope
  switch (resource) {
    case 'block':
      // Health officers can access blocks in their assigned district
      return true; // In real implementation, verify block belongs to district
      
    case 'health_program':
      // Health officers can access programs in their district
      return true; // In real implementation, verify program belongs to district
      
    case 'staff':
      // Health officers can access staff assigned to their district
      return true; // In real implementation, verify staff is assigned to district
      
    case 'village':
      // Health officers can access villages in blocks within their district
      return true; // In real implementation, verify village belongs to district blocks
      
    default:
      return false;
  }
};

/**
 * Get health officer's accessible resources based on their district assignment
 * @param {string} resourceType - Type of resource ('blocks', 'health_programs', 'staff')
 * @param {Object} user - User object (optional, uses current user if not provided)
 * @returns {Object} Object with resource access information
 */
export const getHealthOfficerAccessibleResources = (resourceType, user = null) => {
  const targetUser = user || useAuthStore.getState?.()?.user || null;
  
  if (!targetUser || targetUser.roleInfo?.role !== 'health_official') {
    return { all: false, ids: [], districtId: null };
  }
  
  const districtId = getHealthOfficerDistrict(targetUser);
  if (!districtId) {
    return { all: false, ids: [], districtId: null };
  }
  
  // Health officers have access to all resources within their assigned district
  const result = { all: false, ids: [], districtId };
  
  switch (resourceType) {
    case 'blocks':
      result.districtScope = true; // Access all blocks in district
      break;
      
    case 'health_programs':
      result.districtScope = true; // Access all programs in district
      break;
      
    case 'staff':
      result.districtScope = true; // Access all staff in district
      result.roles = ['asha_worker', 'volunteer', 'block_officer']; // Manageable roles
      break;
      
    case 'villages':
      result.districtScope = true; // Access all villages in district blocks
      break;
  }
  
  return result;
};

/**
 * Check if user is in health officer role
 * @param {Object} user - User object (optional, uses current user if not provided)
 * @returns {boolean} True if user is health officer
 */
export const isHealthOfficer = (user = null) => {
  const targetUser = user || useAuthStore.getState?.()?.user || null;
  
  return !!(targetUser && targetUser.roleInfo?.role === 'health_official');
};

/**
 * Get health officer's district information
 * @param {Object} user - User object (optional, uses current user if not provided)
 * @returns {Object|null} District information or null if not available
 */
export const getHealthOfficerDistrictInfo = (user = null) => {
  const targetUser = user || useAuthStore.getState?.()?.user || null;
  
  if (!targetUser || targetUser.roleInfo?.role !== 'health_official') {
    return null;
  }
  
  return targetUser.roleInfo?.hierarchy?.district || null;
};

/**
 * Check if current user can manage specific staff member
 * @param {Object} staffUser - Staff user to be managed
 * @param {Object} currentUser - Current user (optional, uses auth store if not provided)
 * @returns {boolean} True if current user can manage staff
 */
export const canManageDistrictStaff = (staffUser, currentUser = null) => {
  const { user } = useAuthStore();
  const manager = currentUser || user;
  
  if (!manager || !staffUser) {
    return false;
  }
  
  // Health officers can manage staff in their district
  if (manager.roleInfo?.role === 'health_official') {
    const managerDistrictId = getHealthOfficerDistrict(manager);
    const staffDistrictId = staffUser.roleInfo?.hierarchy?.district?._id;
    
    // Check if staff belongs to same district and is manageable role
    const manageableRoles = ['asha_worker', 'volunteer', 'block_officer'];
    return managerDistrictId === staffDistrictId && 
           manageableRoles.includes(staffUser.roleInfo?.role);
  }
  
  return false;
};

export default {
  requireHealthOfficerRole,
  useHealthOfficerGuard,
  withHealthOfficerGuard,
  HealthOfficerOnly,
  getHealthOfficerDistrict,
  canManageBlock,
  hasHealthOfficerPermission,
  canAccessDistrictResource,
  getHealthOfficerAccessibleResources,
  isHealthOfficer,
  getHealthOfficerDistrictInfo,
  canManageDistrictStaff
};