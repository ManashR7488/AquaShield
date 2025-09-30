import axios from 'axios';
import { toast } from 'react-toastify';
import { log, warn, error } from '../utils/logger';
import useAuthStore from '../store/useAuthStore';

// Create axios instance with base configuration
const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 30000,
  withCredentials: true, // Important for cookie-based authentication
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for debugging
axiosInstance.interceptors.request.use(
  (config) => {
    log('📤 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      withCredentials: config.withCredentials
    });
    
    return config;
  },
  (error) => {
    error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for debugging and error handling
axiosInstance.interceptors.response.use(
  (response) => {
    log('📥 API Response:', {
      status: response.status,
      url: response.config.url,
      method: response.config.method?.toUpperCase(),
      success: response.data?.success,
      message: response.data?.message
    });
    
    return response;
  },
  (error) => {
    error('❌ API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    });
    
    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401) {
      log('🔒 Unauthorized access - clearing auth state');
      const { clearUser } = useAuthStore.getState();
      clearUser();
      
      // Only redirect if not already on auth page
      if (!window.location.pathname.includes('/auth/')) {
        log('🔄 Redirecting to login page');
        window.location.href = '/app/auth/login';
      }
    }
    
    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      log('🚫 Access forbidden for current user role');
      // Could redirect to unauthorized page or dashboard
    }
    
    // Handle network errors
    if (!error.response) {
      error('🌐 Network Error - Server might be down');
    }
        
        // Handle 500+ Server Errors
        if (error.response?.status >= 500) {
            const errorMessage = 'Server error occurred. Please try again later.';
            toast.error(errorMessage);
            error('[Server Error]', error.response?.data || error.message);
        }
        
        // Handle network errors
        if (!error.response && (error.code === 'ERR_NETWORK' || error.code === 'NETWORK_ERROR')) {
            const errorMessage = 'Network error. Please check your internet connection.';
            toast.error(errorMessage);
            error('[Network Error]', error.message);
        }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
