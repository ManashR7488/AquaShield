import axios from "axios";
import useAuthStore from "../store/useAuthStore.js";

// Track pending requests to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, success = false) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(success);
        }
    });
    failedQueue = [];
};

const axiosInstance = axios.create({
    baseURL: "http://localhost:5000/api", // Update with your backend URL
    timeout: 30000, // 30 second timeout
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true, // CRITICAL: Include cookies for authentication
});

// Request interceptor for cookie-based authentication
axiosInstance.interceptors.request.use(
    (config) => {
        // No need to manually add tokens - cookies are handled automatically
        // Get user role for role-based headers if needed
        const userRole = useAuthStore.getState().user?.roleInfo?.role;
        
        if (userRole) {
            config.headers['X-User-Role'] = userRole;
        }
        
        // Add request timestamp for debugging
        config.headers['X-Request-Time'] = new Date().toISOString();
        
        // Log request for debugging in development
        if (process.env.NODE_ENV === 'development') {
            console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
                headers: config.headers,
                data: config.data
            });
        }
        
        return config;
    },
    (error) => {
        console.error('[API Request Error]', error);
        return Promise.reject(error);
    }
);

// Enhanced response interceptor with automatic token refresh for cookie-based auth
axiosInstance.interceptors.response.use(
    (response) => {
        // Log successful response in development
        if (process.env.NODE_ENV === 'development') {
            console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
                status: response.status,
                data: response.data
            });
        }
        
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        
        // Log error in development
        if (process.env.NODE_ENV === 'development') {
            console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
                status: error.response?.status,
                message: error.response?.data?.message || error.message,
                data: error.response?.data
            });
        }
        
        // Handle 401 Unauthorized - Token expired or invalid
        if (error.response?.status === 401 && !originalRequest._retry) {
            // Check if this is a token expiry error that can be refreshed
            const canRefresh = !originalRequest.url?.includes('/auth/login') && 
                              !originalRequest.url?.includes('/auth/signup') &&
                              !originalRequest.url?.includes('/auth/refresh');
            
            if (!canRefresh) {
                console.log('[Auth Error] Cannot refresh for this endpoint');
                return Promise.reject(error);
            }
            
            if (isRefreshing) {
                // If refresh is already in progress, queue this request
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(() => {
                    return axiosInstance(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }
            
            originalRequest._retry = true;
            isRefreshing = true;
            
            try {
                // Try to refresh token using the refresh endpoint
                console.log('[Auth] Attempting token refresh...');
                
                const refreshResponse = await axios.post(
                    `${axiosInstance.defaults.baseURL}/auth/refresh`,
                    {},
                    { 
                        withCredentials: true,
                        timeout: 10000 // Shorter timeout for refresh
                    }
                );
                
                if (refreshResponse.status === 200) {
                    console.log('[Auth] Token refresh successful');
                    
                    // Process queued requests
                    processQueue(null, true);
                    
                    // Retry original request (cookies are automatically included)
                    return axiosInstance(originalRequest);
                } else {
                    throw new Error('Refresh failed');
                }
                
            } catch (refreshError) {
                console.error('[Auth] Token refresh failed:', refreshError);
                
                // Clear user data on refresh failure
                useAuthStore.getState().clearUser();
                
                // Process queued requests with error
                processQueue(refreshError, false);
                
                // Redirect to login if not already on auth page
                if (!window.location.pathname.includes('/auth/')) {
                    window.location.href = '/auth/login';
                }
                
                return Promise.reject(refreshError);
                
            } finally {
                isRefreshing = false;
            }
        }
        
        // Handle 403 Forbidden - Insufficient permissions
        if (error.response?.status === 403) {
            console.error('[Auth Error] Access forbidden - insufficient permissions');
            // Could show a toast notification here
            if (typeof window !== 'undefined' && window.showToast) {
                window.showToast('Access denied. You do not have permission to perform this action.', 'error');
            }
        }
        
        // Handle 404 Not Found
        if (error.response?.status === 404) {
            console.error('[API Error] Resource not found:', originalRequest.url);
        }
        
        // Handle 429 Too Many Requests
        if (error.response?.status === 429) {
            console.error('[API Error] Rate limit exceeded');
            if (typeof window !== 'undefined' && window.showToast) {
                window.showToast('Too many requests. Please wait and try again.', 'warning');
            }
        }
        
        // Handle 500+ Server Errors
        if (error.response?.status >= 500) {
            console.error('[API Error] Server error:', error.response?.status);
            if (typeof window !== 'undefined' && window.showToast) {
                window.showToast('Server error. Please try again later.', 'error');
            }
        }
        
        // Handle Network Errors
        if (!error.response) {
            console.error('[Network Error] Request failed:', error.message);
            if (typeof window !== 'undefined' && window.showToast) {
                window.showToast('Network error. Please check your connection.', 'error');
            }
        }
        
        return Promise.reject(error);
    }
);

// Add method to manually clear authentication (for logout)
axiosInstance.clearAuth = () => {
    // Clear any stored tokens (if any are still used)
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userRole");
    
    // Clear auth store
    useAuthStore.getState().clearUser();
};

// Add method to check authentication status
axiosInstance.isAuthenticated = () => {
    // Check if user exists in auth store
    const user = useAuthStore.getState().user;
    return !!user;
};

// Add method to get current user info
axiosInstance.getCurrentUser = () => {
    return useAuthStore.getState().user;
};

export default axiosInstance;