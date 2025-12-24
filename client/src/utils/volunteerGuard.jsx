import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

/**
 * Volunteer Guard Utility
 * Provides functions and components for volunteer role-based route protection
 * Follows the same pattern as existing ashaWorkerGuard utility
 */

/**
 * Check if the current user has volunteer privileges
 * @returns {boolean} True if user is volunteer, false otherwise
 */
export const requireVolunteerRole = () => {
  const { user } = useAuthStore.getState?.() || { user: null };
  return !!(user && user.roleInfo?.role === 'volunteer');
};

/**
 * Hook to check volunteer access and redirect if unauthorized
 * @param {string} redirectPath - Path to redirect if not volunteer (default: '/app')
 * @returns {boolean} True if user is volunteer, false otherwise
 */
export const useVolunteerGuard = (redirectPath = '/app') => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && (!user || user.roleInfo?.role !== 'volunteer')) {
      navigate(redirectPath);
    }
  }, [user, isLoading, navigate, redirectPath]);

  return !!(user && user.roleInfo?.role === 'volunteer');
};

/**
 * Higher-order component for volunteer route protection
 * @param {React.Component} Component - Component to protect
 * @param {string} redirectPath - Path to redirect if not volunteer
 * @returns {React.Component} Protected component
 */
export const withVolunteerGuard = (Component, redirectPath = '/app') => {
  return function VolunteerProtectedComponent(props) {
    const navigate = useNavigate();
    const { user, isLoading } = useAuthStore();

    useEffect(() => {
      if (!isLoading && !user) {
        // User not authenticated, redirect to login
        navigate('/app/auth/login');
      } else if (!isLoading && user && user.roleInfo?.role !== 'volunteer') {
        // User authenticated but wrong role, redirect to dashboard
        navigate(redirectPath);
      }
    }, [user, isLoading, navigate, redirectPath]);

    // Show loading while checking authentication
    if (isLoading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    // Don't render if not volunteer
    if (!user || user.roleInfo?.role !== 'volunteer') {
      return null;
    }

    return <Component {...props} />;
  };
};

/**
 * Get volunteer's assigned area IDs
 * @param {Object} user - User object (optional, uses current user if not provided)
 * @returns {Array} Array of assigned area IDs
 */
export const getVolunteerAreas = (user = null) => {
  const targetUser = user || useAuthStore.getState?.()?.user || null;
  
  if (!targetUser || targetUser.roleInfo?.role !== 'volunteer') {
    return [];
  }
  
  // Assuming area info is stored in user.roleInfo.assignedAreas
  return targetUser.roleInfo?.assignedAreas || [];
};

/**
 * Check if volunteer can access a specific area
 * @param {string} areaId - Area ID to check
 * @param {Object} user - User object (optional, uses current user if not provided)
 * @returns {boolean} True if volunteer can access the area
 */
export const canAccessArea = (areaId, user = null) => {
  const targetUser = user || useAuthStore.getState?.()?.user || null;
  
  if (!targetUser || targetUser.roleInfo?.role !== 'volunteer') {
    return false;
  }
  
  const assignedAreas = getVolunteerAreas(targetUser);
  return assignedAreas.includes(areaId);
};

/**
 * Get volunteer's assigned village ID
 * @param {Object} user - User object (optional, uses current user if not provided)
 * @returns {string|null} Assigned village ID or null if not available
 */
export const getVolunteerVillage = (user = null) => {
  const targetUser = user || useAuthStore.getState?.()?.user || null;
  
  if (!targetUser || targetUser.roleInfo?.role !== 'volunteer') {
    return null;
  }
  
  // Assuming village info is stored in user.roleInfo.assignedVillage
  return targetUser.roleInfo?.assignedVillage || null;
};

/**
 * Check if volunteer has a specific permission
 * @param {string} permission - Permission to check
 * @param {Object} user - User object (optional, uses current user if not provided)
 * @returns {boolean} True if volunteer has the permission
 */
export const hasVolunteerPermission = (permission, user = null) => {
  const targetUser = user || useAuthStore.getState?.()?.user || null;
  
  if (!targetUser || targetUser.roleInfo?.role !== 'volunteer') {
    return false;
  }
  
  const permissions = targetUser.roleInfo?.permissions || [];
  return permissions.includes(permission);
};

/**
 * Check if volunteer can manage community reports
 * @param {Object} user - User object (optional, uses current user if not provided)
 * @returns {boolean} True if volunteer can manage community reports
 */
export const canManageCommunityReports = (user = null) => {
  return hasVolunteerPermission('create_community_reports', user) || 
         hasVolunteerPermission('update_community_reports', user);
};

/**
 * Check if volunteer can conduct water tests
 * @param {Object} user - User object (optional, uses current user if not provided)
 * @returns {boolean} True if volunteer can conduct water tests
 */
export const canConductWaterTests = (user = null) => {
  return hasVolunteerPermission('create_water_tests', user) || 
         hasVolunteerPermission('update_water_tests', user);
};

/**
 * Check if volunteer can record health observations
 * @param {Object} user - User object (optional, uses current user if not provided)
 * @returns {boolean} True if volunteer can record health observations
 */
export const canRecordHealthObservations = (user = null) => {
  return hasVolunteerPermission('create_health_observations', user) || 
         hasVolunteerPermission('update_health_observations', user);
};

/**
 * Check if current user is volunteer
 * @param {Object} user - User object (optional, uses current user if not provided)
 * @returns {boolean} True if user is volunteer, false otherwise
 */
export const isVolunteer = (user = null) => {
  const targetUser = user || useAuthStore.getState?.()?.user || null;
  
  return !!(targetUser && targetUser.roleInfo?.role === 'volunteer');
};

/**
 * Get volunteer's work area information
 * @param {Object} user - User object (optional, uses current user if not provided)
 * @returns {Object|null} Work area information or null if not available
 */
export const getVolunteerWorkArea = (user = null) => {
  const targetUser = user || useAuthStore.getState?.()?.user || null;
  
  if (!targetUser || targetUser.roleInfo?.role !== 'volunteer') {
    return null;
  }
  
  return {
    villageId: getVolunteerVillage(targetUser),
    areas: getVolunteerAreas(targetUser),
    permissions: targetUser.roleInfo?.permissions || []
  };
};

export default {
  requireVolunteerRole,
  useVolunteerGuard,
  withVolunteerGuard,
  getVolunteerAreas,
  canAccessArea,
  getVolunteerVillage,
  hasVolunteerPermission,
  canManageCommunityReports,
  canConductWaterTests,
  canRecordHealthObservations,
  isVolunteer,
  getVolunteerWorkArea
};