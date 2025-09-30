import {create} from "zustand";
import axiosInstance from "../config/axios";
import { toast } from "react-toastify";

const useAuthStore = create((set, get) => ({
    user: null, // Start with null user - will be set after authentication check
    isLoading: false,
    isAuthenticated: false,
    error: null,
    fieldErrors: {},
    
    // Check authentication status by calling /auth/me endpoint
    checkAuth: async () => {
        set({ isLoading: true });
        console.log('🔍 AuthStore: Checking authentication status...');
        try {
            const response = await axiosInstance.get("/auth/me");
            console.log('✅ AuthStore: Authentication successful:', {
                userId: response.data.data?.id,
                role: response.data.data?.roleInfo?.role,
                email: response.data.data?.authentication?.email
            });
            
            set({ 
                user: response.data.data, 
                isAuthenticated: true,
                error: null
            });
            return true;
        } catch (error) {
            console.log('❌ AuthStore: Authentication failed:', {
                status: error.response?.status,
                message: error.response?.data?.message || error.message
            });
            
            set({ 
                user: null, 
                isAuthenticated: false,
                error: error.response?.data?.message || 'Authentication failed'
            });
            return false;
        } finally {
            set({ isLoading: false });
        }
    },
    
    login: async (credentials) => {
        set({ isLoading: true, error: null, fieldErrors: {} });
        try {
            console.log('🔐 AuthStore: Attempting login...');
            const response = await axiosInstance.post("/auth/login", credentials);
            
            console.log('✅ AuthStore: Login successful:', {
                userId: response.data.data?.id,
                role: response.data.data?.roleInfo?.role,
                email: response.data.data?.authentication?.email
            });
            
            set({ 
                user: response.data.data, 
                isAuthenticated: true,
                error: null,
                fieldErrors: {}
            });
            toast.success(response.data.message || "Login successful!");
            return { success: true, user: response.data.data };
        } catch (error) {
            console.error("❌ AuthStore: Login failed:", {
                status: error.response?.status,
                message: error.response?.data?.message,
                errors: error.response?.data?.errors
            });
            
            let fieldErrors = {};
            let errorMessage = error.response?.data?.message || "Login failed. Please try again.";
            
            if (error.response?.data) {
                // Handle validation errors from errors field
                if (error.response.data.errors) {
                    fieldErrors = get().mapValidationErrors(error.response.data.errors);
                }
                
                // Handle validation errors from validationErrors field
                if (error.response.data.validationErrors) {
                    fieldErrors = get().mapValidationErrors(error.response.data.validationErrors);
                }
                
                // Handle conflicts for login (e.g., account locked)
                if (error.response.status === 409 && error.response.data.conflicts) {
                    error.response.data.conflicts.forEach(conflict => {
                        fieldErrors[conflict.field] = conflict.message;
                    });
                }
                
                // Handle single field errors
                if (error.response.data.field) {
                    fieldErrors[error.response.data.field] = errorMessage;
                }
            }
            
            set({ 
                error: errorMessage,
                fieldErrors
            });
            
            // Only show toast for general errors, not field-specific ones
            if (Object.keys(fieldErrors).length === 0) {
                toast.error(errorMessage);
            }
            
            return { success: false, error: errorMessage, fieldErrors };
        } finally {
            set({ isLoading: false });
        }
    },
    
    // Helper function to flatten nested validation error keys
    mapValidationErrors: (errors) => {
        const flatErrors = {};
        
        // Handle both array format (from server validation) and object format
        if (Array.isArray(errors)) {
            errors.forEach(error => {
                if (error.field && error.message) {
                    // Map nested field names to flat form field names
                    const fieldName = error.field;
                    switch (fieldName) {
                        case 'personalInfo.firstName':
                            flatErrors.firstName = error.message;
                            break;
                        case 'personalInfo.lastName':
                            flatErrors.lastName = error.message;
                            break;
                        case 'personalInfo.dateOfBirth':
                            flatErrors.dateOfBirth = error.message;
                            break;
                        case 'personalInfo.gender':
                            flatErrors.gender = error.message;
                            break;
                        case 'authentication.email':
                            flatErrors.email = error.message;
                            break;
                        case 'authentication.phone':
                            flatErrors.phone = error.message;
                            break;
                        case 'authentication.username':
                            flatErrors.username = error.message;
                            break;
                        case 'authentication.password':
                            flatErrors.password = error.message;
                            break;
                        case 'roleInfo.role':
                            flatErrors.role = error.message;
                            break;
                        case 'contactInfo.address.city':
                            flatErrors.city = error.message;
                            break;
                        case 'contactInfo.address.state':
                            flatErrors.state = error.message;
                            break;
                        case 'termsAccepted':
                            flatErrors.agreeToTerms = error.message;
                            break;
                        case 'privacyPolicyAccepted':
                            flatErrors.agreeToTerms = error.message;
                            break;
                        default:
                            // Use the field name as-is if no mapping found
                            flatErrors[fieldName] = error.message;
                            break;
                    }
                }
            });
        } else {
            // Handle object format (legacy)
            Object.keys(errors).forEach(key => {
                // Map nested keys to flat form field names
                switch (key) {
                case 'personalInfo.firstName':
                    flatErrors.firstName = errors[key];
                    break;
                case 'personalInfo.lastName':
                    flatErrors.lastName = errors[key];
                    break;
                case 'personalInfo.dateOfBirth':
                    flatErrors.dateOfBirth = errors[key];
                    break;
                case 'personalInfo.gender':
                    flatErrors.gender = errors[key];
                    break;
                case 'authentication.email':
                    flatErrors.email = errors[key];
                    break;
                case 'authentication.phone':
                    flatErrors.phone = errors[key];
                    break;
                case 'authentication.username':
                    flatErrors.username = errors[key];
                    break;
                case 'authentication.password':
                    flatErrors.password = errors[key];
                    break;
                case 'roleInfo.role':
                    flatErrors.role = errors[key];
                    break;
                case 'contactInfo.address.street':
                    flatErrors.street = errors[key];
                    break;
                case 'contactInfo.address.city':
                    flatErrors.city = errors[key];
                    break;
                case 'contactInfo.address.state':
                    flatErrors.state = errors[key];
                    break;
                case 'contactInfo.address.pincode':
                    flatErrors.pincode = errors[key];
                    break;
                case 'contactInfo.emergencyContact.name':
                    flatErrors.emergencyContactName = errors[key];
                    break;
                case 'contactInfo.emergencyContact.phone':
                    flatErrors.emergencyContactPhone = errors[key];
                    break;
                case 'contactInfo.emergencyContact.relationship':
                    flatErrors.emergencyContactRelationship = errors[key];
                    break;
                default:
                    // For non-nested keys, use as-is
                    flatErrors[key] = errors[key];
                    break;
                }
            });
        }
        
        return flatErrors;
    },

    // Client-side validation before sending signup request
    validateSignupData: (userData) => {
        const errors = {};
        let isValid = true;

        // Validate personal info
        if (!userData.personalInfo?.firstName?.trim()) {
            errors.firstName = 'First name is required';
            isValid = false;
        }
        if (!userData.personalInfo?.lastName?.trim()) {
            errors.lastName = 'Last name is required';
            isValid = false;
        }

        // Validate authentication
        if (!userData.authentication?.email?.trim()) {
            errors.email = 'Email is required';
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.authentication.email)) {
            errors.email = 'Please enter a valid email address';
            isValid = false;
        }

        if (!userData.authentication?.phone?.trim()) {
            errors.phone = 'Phone number is required';
            isValid = false;
        } else if (!/^(\+91[6-9]\d{9}|[6-9]\d{9})$/.test(userData.authentication.phone.replace(/\s/g, ''))) {
            errors.phone = 'Please enter a valid Indian phone number';
            isValid = false;
        }

        if (!userData.authentication?.username?.trim()) {
            errors.username = 'Username is required';
            isValid = false;
        } else if (userData.authentication.username.trim().length < 3) {
            errors.username = 'Username must be at least 3 characters long';
            isValid = false;
        }

        if (!userData.authentication?.password) {
            errors.password = 'Password is required';
            isValid = false;
        } else {
            // Password strength validation
            const password = userData.authentication.password;
            const hasUppercase = /[A-Z]/.test(password);
            const hasLowercase = /[a-z]/.test(password);
            const hasNumber = /\d/.test(password);
            const hasSpecialChar = /[@$!%*?&]/.test(password);
            const isLongEnough = password.length >= 8;

            if (!isLongEnough || !hasUppercase || !hasLowercase || !hasNumber || !hasSpecialChar) {
                errors.password = 'Password must contain at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&)';
                isValid = false;
            }
        }

        // Validate role
        const validRoles = ['user', 'volunteer', 'asha_worker', 'health_official'];
        if (!userData.roleInfo?.role) {
            errors.role = 'Role selection is required';
            isValid = false;
        } else if (!validRoles.includes(userData.roleInfo.role)) {
            errors.role = 'Please select a valid role';
            isValid = false;
        }

        // Validate contact info
        if (!userData.contactInfo?.address?.city?.trim()) {
            errors.city = 'City is required';
            isValid = false;
        }
        if (!userData.contactInfo?.address?.state?.trim()) {
            errors.state = 'State is required';
            isValid = false;
        }

        // Validate terms acceptance
        if (!userData.termsAccepted) {
            errors.agreeToTerms = 'You must agree to the terms and conditions';
            isValid = false;
        }
        if (!userData.privacyPolicyAccepted) {
            errors.dataUsageConsent = 'Data usage consent is required';
            isValid = false;
        }

        return { isValid, errors };
    },

    signup: async (userData) => {
        try {
            console.log('🚀 AuthStore: Starting signup process');
            
            // Client-side validation before sending request
            const validationResult = get().validateSignupData(userData);
            if (!validationResult.isValid) {
                console.log('❌ AuthStore: Client-side validation failed:', validationResult.errors);
                set({ 
                    error: 'Please fix the form errors',
                    fieldErrors: validationResult.errors
                });
                return { success: false, error: 'Validation failed', fieldErrors: validationResult.errors };
            }

            set({ isLoading: true, error: null, fieldErrors: {} });
            
            console.log('📤 AuthStore: Sending signup request:', {
                personalInfo: userData.personalInfo,
                roleInfo: userData.roleInfo,
                contactInfo: userData.contactInfo,
                hasAuthentication: !!userData.authentication,
                hasPreferences: !!userData.preferences,
                termsAccepted: userData.termsAccepted,
                privacyPolicyAccepted: userData.privacyPolicyAccepted
            });
            
            const response = await axiosInstance.post("/auth/signup", userData);
            
            console.log('📥 AuthStore: Signup response received:', {
                success: response.data.success,
                status: response.status,
                hasUserData: !!response.data.data,
                userId: response.data.data?.id,
                role: response.data.data?.roleInfo?.role
            });
            
            if (response.data.success) {
                console.log('✅ AuthStore: Signup successful, updating auth state');
                set({ 
                    user: response.data.data, 
                    isAuthenticated: true,
                    error: null,
                    fieldErrors: {}
                });
                toast.success(response.data.message || "Registration successful!");
                return { success: true, user: response.data.data };
            } else {
                console.log('❌ AuthStore: Signup failed with success=false');
                throw new Error(response.data.message || 'Signup failed');
            }
        } catch (error) {
            console.error('💥 AuthStore: Signup error occurred:', {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                responseData: error.response?.data,
                isNetworkError: !error.response,
                isTimeout: error.code === 'ECONNABORTED'
            });
            
            // Enhanced error handling with detailed logging
            let errorMessage = 'Registration failed. Please try again.';
            let fieldErrors = {};
            
            // Handle network errors
            if (!error.response) {
                console.error('🌐 AuthStore: Network error during signup');
                errorMessage = 'Network error. Please check your internet connection and try again.';
                set({ error: errorMessage, fieldErrors: {} });
                return { success: false, error: errorMessage };
            }
            
            // Handle timeout errors
            if (error.code === 'ECONNABORTED') {
                console.error('⏰ AuthStore: Request timeout during signup');
                errorMessage = 'Request timeout. Please try again.';
                set({ error: errorMessage, fieldErrors: {} });
                return { success: false, error: errorMessage };
            }
            
            if (error.response?.data) {
                errorMessage = error.response.data.message || errorMessage;
                
                console.log('🔍 AuthStore: Processing server error response:', {
                    status: error.response.status,
                    hasErrors: !!error.response.data.errors,
                    hasValidationErrors: !!error.response.data.validationErrors,
                    hasConflicts: !!(error.response.data.errors && error.response.data.errors.some(e => e.conflicts))
                });
                
                // Handle validation errors (400)
                if (error.response.status === 400 && error.response.data.errors) {
                    console.log('📋 AuthStore: Processing validation errors');
                    fieldErrors = get().mapValidationErrors(error.response.data.errors);
                }
                
                // Handle validation errors from validationErrors field (legacy)
                if (error.response.data.validationErrors) {
                    console.log('📋 AuthStore: Processing legacy validation errors');
                    fieldErrors = get().mapValidationErrors(error.response.data.validationErrors);
                }
                
                // Handle duplicate user errors with conflicts array (409)
                if (error.response.status === 409 && error.response.data.errors) {
                    // Server returns conflicts nested in errors array
                    error.response.data.errors.forEach(errorObj => {
                        if (errorObj.conflicts) {
                            errorObj.conflicts.forEach(conflict => {
                                // Map server field names to form field names
                                switch (conflict.field) {
                                    case 'email':
                                        fieldErrors.email = conflict.message;
                                        break;
                                    case 'phone':
                                        fieldErrors.phone = conflict.message;
                                        break;
                                    case 'username':
                                        fieldErrors.username = conflict.message;
                                        break;
                                    default:
                                        fieldErrors[conflict.field] = conflict.message;
                                        break;
                                }
                            });
                        }
                    });
                }
                
                // Handle single field conflict (legacy)
                if (error.response.status === 409 && error.response.data.field) {
                    fieldErrors[error.response.data.field] = errorMessage;
                }
            }
            
            set({ 
                error: errorMessage,
                fieldErrors
            });
            
            // Only show toast for general errors, not field-specific ones
            if (Object.keys(fieldErrors).length === 0) {
                toast.error(errorMessage);
            }
            
            return { 
                success: false, 
                error: errorMessage, 
                fieldErrors 
            };
        } finally {
            set({ isLoading: false });
        }
    },
    
    logout: async () => {
        set({ isLoading: true });
        try {
            console.log('🚪 AuthStore: Attempting logout...');
            await axiosInstance.post("/auth/logout");
            
            console.log('✅ AuthStore: Logout successful');
            set({ 
                user: null, 
                isAuthenticated: false,
                error: null,
                fieldErrors: {}
            });
            toast.success("Logout successful!");
            return { success: true };
        } catch (error) {
            console.error("❌ AuthStore: Logout failed:", error);
            // Even if logout fails on server, clear local state
            set({ 
                user: null, 
                isAuthenticated: false,
                error: null,
                fieldErrors: {}
            });
            toast.error("Logout failed. Please try again.");
            return { success: false, error: "Logout failed" };
        } finally {
            set({ isLoading: false });
        }
    },
    
    // Clear user data (used by axios interceptor on auth failures)
    clearUser: () => {
        set({ 
            user: null, 
            isAuthenticated: false,
            error: null,
            fieldErrors: {}
        });
    },

    // Clear field-specific error
    clearFieldError: (fieldName) => {
        set(state => ({
            fieldErrors: {
                ...state.fieldErrors,
                [fieldName]: undefined
            }
        }));
    },

    // Clear all errors
    clearErrors: () => {
        set({ error: null, fieldErrors: {} });
    },
    
    // Change password
    changePassword: async (passwordData) => {
        set({ isLoading: true });
        try {
            const response = await axiosInstance.put("/auth/change-password", passwordData);
            toast.success(response.data.message || "Password changed successfully!");
            return { success: true };
        } catch (error) {
            console.error("Change password failed:", error);
            const errorMessage = error.response?.data?.message || "Password change failed. Please try again.";
            toast.error(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            set({ isLoading: false });
        }
    },
    
    // Verify email
    verifyEmail: async (token) => {
        set({ isLoading: true });
        try {
            const response = await axiosInstance.post("/auth/verify-email", { token });
            toast.success(response.data.message || "Email verified successfully!");
            // Refresh user data
            await get().checkAuth();
            return { success: true };
        } catch (error) {
            console.error("Email verification failed:", error);
            const errorMessage = error.response?.data?.message || "Email verification failed. Please try again.";
            toast.error(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            set({ isLoading: false });
        }
    },
    
    // Verify phone
    verifyPhone: async (otp) => {
        set({ isLoading: true });
        try {
            const response = await axiosInstance.post("/auth/verify-phone", { otp });
            toast.success(response.data.message || "Phone verified successfully!");
            // Refresh user data
            await get().checkAuth();
            return { success: true };
        } catch (error) {
            console.error("Phone verification failed:", error);
            const errorMessage = error.response?.data?.message || "Phone verification failed. Please try again.";
            toast.error(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            set({ isLoading: false });
        }
    },

    // Add profile update function
    updateProfile: async (profileData) => {
        set({ isLoading: true, error: null, fieldErrors: {} });
        try {
            console.log('🔄 Updating profile...');
            console.log('📤 Sending profile data:', profileData);
            
            const response = await axiosInstance.put("/auth/profile", profileData);
            
            console.log('✅ Profile update successful:', {
                message: response.data.message,
                completionPercentage: response.data.data?.profileCompletion?.completionPercentage
            });
            
            // Update user data in store
            set(state => ({ 
                user: {
                    ...state.user,
                    ...response.data.data
                },
                error: null,
                fieldErrors: {}
            }));
            
            toast.success(response.data.message || "Profile updated successfully!");
            return { success: true, user: response.data.data };
        } catch (error) {
            console.error('❌ Profile update error:', {
                status: error.response?.status,
                message: error.response?.data?.message,
                errors: error.response?.data?.errors
            });
            
            let errorMessage = 'Profile update failed. Please try again.';
            let fieldErrors = {};
            
            if (error.response?.data) {
                errorMessage = error.response.data.message || errorMessage;
                
                if (error.response.data.errors) {
                    fieldErrors = get().mapValidationErrors(error.response.data.errors);
                }
                
                if (error.response.data.validationErrors) {
                    fieldErrors = get().mapValidationErrors(error.response.data.validationErrors);
                }
            }
            
            set({ 
                error: errorMessage,
                fieldErrors
            });
            
            if (Object.keys(fieldErrors).length === 0) {
                toast.error(errorMessage);
            }
            
            return { success: false, error: errorMessage, fieldErrors };
        } finally {
            set({ isLoading: false });
        }
    },

    // Add profile completion check function
    getProfileCompletion: async () => {
        try {
            const response = await axiosInstance.get("/auth/profile-completion");
            return response.data.data;
        } catch (error) {
            console.error('Failed to get profile completion:', error);
            return null;
        }
    },

    // Add helper to check if profile is complete
    isProfileComplete: () => {
        const user = get().user;
        if (!user) return false;
        
        // Check essential fields for full profile
        const hasPersonalInfo = user.personalInfo?.dateOfBirth && user.personalInfo?.gender;
        const hasAddress = user.contactInfo?.address?.street && user.contactInfo?.address?.pincode;
        const hasEmergencyContact = user.contactInfo?.emergencyContact?.name && 
                                   user.contactInfo?.emergencyContact?.phone;
        const hasVerification = user.authentication?.isEmailVerified && 
                               user.authentication?.isPhoneVerified;
        
        return hasPersonalInfo && hasAddress && hasEmergencyContact && hasVerification;
    },

    // Add helper to get missing profile fields
    getMissingProfileFields: () => {
        const user = get().user;
        if (!user) return [];
        
        const missing = [];
        
        if (!user.personalInfo?.dateOfBirth) missing.push({ field: 'dateOfBirth', label: 'Date of Birth', category: 'personal' });
        if (!user.personalInfo?.gender) missing.push({ field: 'gender', label: 'Gender', category: 'personal' });
        if (!user.contactInfo?.address?.street) missing.push({ field: 'street', label: 'Street Address', category: 'address' });
        if (!user.contactInfo?.address?.pincode) missing.push({ field: 'pincode', label: 'Pincode', category: 'address' });
        if (!user.contactInfo?.emergencyContact?.name) missing.push({ field: 'emergencyContactName', label: 'Emergency Contact Name', category: 'emergency' });
        if (!user.contactInfo?.emergencyContact?.phone) missing.push({ field: 'emergencyContactPhone', label: 'Emergency Contact Phone', category: 'emergency' });
        if (!user.authentication?.isEmailVerified) missing.push({ field: 'emailVerification', label: 'Email Verification', category: 'verification' });
        if (!user.authentication?.isPhoneVerified) missing.push({ field: 'phoneVerification', label: 'Phone Verification', category: 'verification' });
        
        return missing;
    },
}));

export default useAuthStore;