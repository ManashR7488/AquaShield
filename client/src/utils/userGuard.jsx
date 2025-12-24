/**
 * User guard utility
 * Provides authentication and authorization checks for user role
 * Ensures only authenticated users can access user-specific routes
 */

import React, { useEffect } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { log, warn, error, maskEmail, maskId } from './logger';
import useAuthStore  from '../store/useAuthStore';

/**
 * Check if current user has user role
 * @returns {boolean} True if user has user role
 */
export const isUser = () => {
  const { user } = useAuthStore.getState();
  // Fix: Use user.roleInfo.role instead of user.role
  return user?.roleInfo?.role === 'user';
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if user is authenticated
 */
export const isAuthenticatedFn = () => {
  const { user, isAuthenticated } = useAuthStore.getState();
  // Fix: Use isAuthenticated instead of isLoggedIn
  return isAuthenticated && user !== null;
};

/**
 * Check if user is authenticated and has user role
 * @returns {boolean} True if user is authenticated with user role
 */
export const canAccessUserRoutes = () => {
  return isAuthenticatedFn() && isUser();
};

/**
 * Get current user information
 * @returns {Object|null} Current user object or null if not authenticated
 */
export const getCurrentUser = () => {
  const { user } = useAuthStore.getState();
  return user;
};

/**
 * Get user ID
 * @returns {string|null} User ID or null if not authenticated
 */
export const getUserId = () => {
  const user = getCurrentUser();
  return user?._id || user?.id || user?.userId || null;
};

/**
 * Check if user owns a resource (by user ID comparison)
 * @param {string} resourceUserId - User ID associated with the resource
 * @returns {boolean} True if current user owns the resource
 */
export const ownsResource = (resourceUserId) => {
  const currentUserId = getUserId();
  return currentUserId && currentUserId === resourceUserId;
};

/**
 * Check if user can access family member data
 * @param {string} familyMemberId - Family member ID
 * @param {Array} familyMembers - Array of user's family members
 * @returns {boolean} True if user can access family member data
 */
export const canAccessFamilyMember = (familyMemberId, familyMembers = []) => {
  const currentUserId = getUserId();
  if (!currentUserId) return false;
  
  // User can access their own data
  if (familyMemberId === currentUserId) return true;
  
  // Check if the family member belongs to current user
  return familyMembers.some(member => 
    member._id === familyMemberId || member.id === familyMemberId
  );
};

/**
 * Check if user can perform health-related operations
 * @returns {boolean} True if user can perform health operations
 */
export const canAccessHealthFeatures = () => {
  return canAccessUserRoutes();
};

/**
 * Check if user can create health queries
 * @returns {boolean} True if user can create health queries
 */
export const canCreateHealthQueries = () => {
  return canAccessUserRoutes();
};

/**
 * Check if user can manage family members
 * @returns {boolean} True if user can manage family members
 */
export const canManageFamilyMembers = () => {
  return canAccessUserRoutes();
};

/**
 * Redirect to login if not authenticated
 * @param {Function} navigate - Navigation function from react-router-dom
 */
export const redirectToLogin = (navigate) => {
  if (navigate) {
    navigate('/app/auth/login', { replace: true });
  }
};

/**
 * Redirect to unauthorized page if not authorized
 * @param {Function} navigate - Navigation function from react-router-dom
 */
export const redirectToUnauthorized = (navigate) => {
  if (navigate) {
    navigate('/unauthorized', { replace: true });
  }
};

/**
 * Higher-order component for protecting user routes
 * @param {React.Component} Component - Component to protect
 * @param {Object} options - Protection options
 * @returns {React.Component} Protected component
 */
export const withUserGuard = (Component, options = {}) => {
  return function ProtectedComponent(props) {
    const { user, isAuthenticated, isLoading } = useAuthStore();
    const navigate = useNavigate();
    const redirectPath = options.unauthorizedRedirect || '/app';
    
    // Add debug logging with PII masking
    log('🔒 UserGuard Check:', {
      isAuthenticated,
      hasUser: !!user,
      userRole: user?.roleInfo?.role,
      userId: maskId(user?._id || user?.id),
      isLoading
    });
    
    // Passive guard - only redirect based on state, don't call checkAuth
    useEffect(() => {
      if (!isLoading && !user) {
        // User not authenticated, redirect to login
        log('❌ UserGuard: Not authenticated, redirecting to login');
        navigate(options.redirectTo || '/app/auth/login');
      } else if (!isLoading && user && user.roleInfo?.role !== 'user') {
        // User authenticated but wrong role, redirect to dashboard
        log('❌ UserGuard: Wrong role:', user.roleInfo?.role, 'expected: user');
        navigate(redirectPath);
      }
    }, [user, isLoading, navigate, redirectPath]);
    
    // Show loading while checking authentication
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      );
    }
    
    // Don't render if not authenticated or wrong role
    if (!user || user.roleInfo?.role !== 'user') {
      return null;
    }
    
    log('✅ UserGuard: Access granted for user role');
    return <Component {...props} />;
  };
};

/**
 * Hook for user authentication and authorization
 * @returns {Object} Object with auth state and utility functions
 */
export const useUserGuard = () => {
  const { user, isAuthenticated: isAuthed } = useAuthStore();
  
  return {
    user,
    isAuthenticated: isAuthed,
    isUser: isUser(),
    canAccessUserRoutes: canAccessUserRoutes(),
    canAccessHealthFeatures: canAccessHealthFeatures(),
    canCreateHealthQueries: canCreateHealthQueries(),
    canManageFamilyMembers: canManageFamilyMembers(),
    getCurrentUser,
    getUserId,
    ownsResource,
    canAccessFamilyMember
  };
};

/**
 * Route guard component for user routes
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @param {string} props.fallback - Fallback content for unauthorized access
 * @returns {React.ReactNode} Protected content or fallback
 */
export const UserGuard = ({ children, fallback = null }) => {
  const { canAccessUserRoutes } = useUserGuard();
  
  if (!canAccessUserRoutes()) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">You need to be logged in as a user to access this page.</p>
          <Link
            to="/app/auth/login"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-block"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }
  
  return children;
};

export default {
  isAuthenticatedFn,
  isUser,
  canAccessUserRoutes,
  getCurrentUser,
  getUserId,
  ownsResource,
  canAccessFamilyMember,
  canAccessHealthFeatures,
  canCreateHealthQueries,
  canManageFamilyMembers,
  redirectToLogin,
  redirectToUnauthorized,
  withUserGuard,
  useUserGuard,
  UserGuard
};