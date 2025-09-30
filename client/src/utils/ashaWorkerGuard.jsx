import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

/**
 * ASHA Worker Guard Utility
 * Provides functions and components for ASHA worker role-based route protection
 */

/**
 * Check if the current user has ASHA worker privileges
 * @returns {boolean} True if user is ASHA worker, false otherwise
 */
export const requireAshaWorkerRole = () => {
  const { user } = useAuthStore.getState?.() || { user: null };
  return !!(user && user.roleInfo?.role === 'asha_worker');
};

/**
 * Hook to check ASHA worker access and redirect if unauthorized
 * @param {string} redirectPath - Path to redirect if not ASHA worker (default: '/app')
 * @returns {boolean} True if user is ASHA worker, false otherwise
 */
export const useAshaWorkerGuard = (redirectPath = '/app') => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && (!user || user.roleInfo?.role !== 'asha_worker')) {
      navigate(redirectPath);
    }
  }, [user, isLoading, navigate, redirectPath]);

  return !!(user && user.roleInfo?.role === 'asha_worker');
};

/**
 * Higher-order component for ASHA worker route protection
 * @param {React.Component} Component - Component to protect
 * @param {string} redirectPath - Path to redirect if not ASHA worker
 * @returns {React.Component} Protected component
 */
export const withAshaWorkerGuard = (Component, redirectPath = '/app') => {
  return function AshaWorkerProtectedComponent(props) {
    const navigate = useNavigate();
    const { user, isLoading } = useAuthStore();

    useEffect(() => {
      if (!isLoading && (!user || user.roleInfo?.role !== 'asha_worker')) {
        navigate(redirectPath);
      }
    }, [user, isLoading, navigate]);

    // Show loading state while checking authentication
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      );
    }

    if (!user || user.roleInfo?.role !== 'asha_worker') return null;
    return <Component {...props} />;
  };
};

/**
 * Get ASHA worker's assigned village IDs
 * @param {Object} user - User object (optional, uses current user if not provided)
 * @returns {Array} Array of assigned village IDs
 */
export const getAshaWorkerVillages = (user = null) => {
  const targetUser = user || useAuthStore.getState?.()?.user || null;
  
  if (!targetUser || targetUser.roleInfo?.role !== 'asha_worker') {
    return [];
  }
  
  // Normalize assignedVillages to ensure consistent village object format
  const assignedVillages = targetUser.roleInfo?.assignedVillages || [];
  
  return assignedVillages.map(village => {
    // If it's already an object with _id, return as-is
    if (village && typeof village === 'object' && village._id) {
      return village;
    }
    
    // If it's a string (village ID), convert to object format
    if (typeof village === 'string') {
      return {
        _id: village,
        name: `Village ${village}`,
        // Add other default properties as needed
        district: null,
        block: null
      };
    }
    
    // Handle other formats or malformed data
    return {
      _id: village?.id || village?._id || String(village),
      name: village?.name || `Village ${village?.id || village?._id || String(village)}`,
      district: village?.district || null,
      block: village?.block || null
    };
  });
};

/**
 * Check if ASHA worker can manage a specific patient
 * @param {string} patientId - Patient ID to check
 * @param {Object} user - User object (optional, uses current user if not provided)
 * @returns {boolean} True if ASHA worker can manage the patient
 */
export const canManagePatient = (patientId, user = null) => {
  const targetUser = user || useAuthStore.getState?.()?.user || null;
  
  if (!targetUser || targetUser.roleInfo?.role !== 'asha_worker') {
    return false;
  }
  
  const assignedVillages = getAshaWorkerVillages(targetUser);
  if (assignedVillages.length === 0) {
    return false;
  }
  
  // For now, return true if villages are assigned
  // In a real implementation, you'd check if the patient belongs to assigned villages
  return true;
};

/**
 * Get ASHA worker's assigned block ID
 * @param {Object} user - User object (optional, uses current user if not provided)
 * @returns {string|null} Block ID or null if not available
 */
export const getAshaWorkerBlock = (user = null) => {
  const targetUser = user || useAuthStore.getState?.()?.user || null;
  
  if (!targetUser || targetUser.roleInfo?.role !== 'asha_worker') {
    return null;
  }
  
  // Assuming block info is stored in user.roleInfo.assignedBlock
  return targetUser.roleInfo?.assignedBlock || null;
};

/**
 * Check if ASHA worker has specific permission
 * @param {string} permission - Permission to check
 * @param {Object} user - User object (optional, uses current user if not provided)
 * @returns {boolean} True if user has permission
 */
export const hasAshaWorkerPermission = (permission, user = null) => {
  const targetUser = user || useAuthStore.getState?.()?.user || null;
  
  if (!targetUser || targetUser.roleInfo?.role !== 'asha_worker') {
    return false;
  }
  
  // Check if user has the specific permission
  const permissions = targetUser.roleInfo?.permissions || [];
  return permissions.includes(permission);
};

/**
 * Check if user can access specific resource within their assigned villages
 * @param {string} resource - Resource type ('patient', 'vaccination', 'health_report', etc.)
 * @param {string} resourceId - ID of the resource (optional)
 * @param {Object} user - User object (optional, uses current user if not provided)
 * @returns {boolean} True if user can access resource
 */
export const canAccessVillageResource = (resource, resourceId = null, user = null) => {
  const targetUser = user || useAuthStore.getState?.()?.user || null;
  
  if (!targetUser || targetUser.roleInfo?.role !== 'asha_worker') {
    return false;
  }
  
  const assignedVillages = getAshaWorkerVillages(targetUser);
  if (assignedVillages.length === 0) {
    return false;
  }
  
  // For now, return true if villages are assigned
  // In a real implementation, you'd check if the resource belongs to assigned villages
  return true;
};

/**
 * Get list of resources accessible to ASHA worker
 * @param {string} resourceType - Type of resource to get access info for
 * @param {Object} user - User object (optional, uses current user if not provided)
 * @returns {Object} Object with resource access information
 */
export const getAshaWorkerAccessibleResources = (resourceType, user = null) => {
  const targetUser = user || useAuthStore.getState?.()?.user || null;
  
  if (!targetUser || targetUser.roleInfo?.role !== 'asha_worker') {
    return { all: false, villages: [], blockId: null };
  }
  
  const assignedVillages = getAshaWorkerVillages(targetUser);
  const blockId = getAshaWorkerBlock(targetUser);
  
  return {
    all: false, // ASHA workers don't have access to all resources
    villages: assignedVillages,
    blockId: blockId
  };
};

/**
 * Check if user is in ASHA worker role
 * @param {Object} user - User object (optional, uses current user if not provided)
 * @returns {boolean} True if user is ASHA worker
 */
export const isAshaWorker = (user = null) => {
  const targetUser = user || useAuthStore.getState?.()?.user || null;
  
  return !!(targetUser && targetUser.roleInfo?.role === 'asha_worker');
};

/**
 * Get ASHA worker's village information
 * @param {Object} user - User object (optional, uses current user if not provided)
 * @returns {Array|null} Array of village information or null if not available
 */
export const getAshaWorkerVillageInfo = (user = null) => {
  const targetUser = user || useAuthStore.getState?.()?.user || null;
  
  if (!targetUser || targetUser.roleInfo?.role !== 'asha_worker') {
    return null;
  }
  
  return targetUser.roleInfo?.villageInfo || [];
};

/**
 * Check if current user can manage specific village
 * @param {string} villageId - Village ID to check
 * @param {Object} user - User object (optional, uses current user if not provided)
 * @returns {boolean} True if user can manage the village
 */
export const canManageVillage = (villageId, user = null) => {
  const targetUser = user || useAuthStore.getState?.()?.user || null;
  
  if (!targetUser || targetUser.roleInfo?.role !== 'asha_worker') {
    return false;
  }
  
  const assignedVillages = getAshaWorkerVillages(targetUser);
  return assignedVillages.some(village => village._id === villageId);
};

export default {
  requireAshaWorkerRole,
  useAshaWorkerGuard,
  withAshaWorkerGuard,
  getAshaWorkerVillages,
  canManagePatient,
  getAshaWorkerBlock,
  hasAshaWorkerPermission,
  canAccessVillageResource,
  getAshaWorkerAccessibleResources,
  isAshaWorker,
  getAshaWorkerVillageInfo,
  canManageVillage
};