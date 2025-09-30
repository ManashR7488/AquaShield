import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiLoader,
  FiMapPin,
  FiAlertCircle,
  FiShield,
  FiUsers
} from 'react-icons/fi';
import useAuthStore from '../../../store/useAuthStore';
import FormField from '../../../components/Auth/FormField';
import PasswordField from '../../../components/Auth/PasswordField';

const SignUp = () => {
  const [formData, setFormData] = useState({
    // Essential Personal Info
    firstName: '',
    lastName: '',
    
    // Essential Authentication
    email: '',
    phone: '',
    username: '',
    password: '',
    confirmPassword: '',
    
    // Essential Role Selection
    role: 'user',
    
    // Minimal Address (only city and state for location context)
    city: '',
    state: '',
    
    // Agreements
    agreeToTerms: false,
    dataUsageConsent: false
  });

  const [errors, setErrors] = useState({});
  const { signup, isLoading, error, fieldErrors } = useAuthStore();
  const navigate = useNavigate();

  // Simplified role options
  const roleOptions = [
    { value: 'user', label: 'Community Member', description: 'General community member' },
    { value: 'volunteer', label: 'Health Volunteer', description: 'Assist in health monitoring activities' },
    { value: 'asha_worker', label: 'ASHA Worker', description: 'Accredited Social Health Activist' },
    { value: 'health_official', label: 'Health Official', description: 'Government health department official' }
  ];

  // Indian states for dropdown
  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
  ].map(state => ({ value: state, label: state }));

  // Password validation function that matches backend requirements
  const validatePassword = (password) => {
    const requirements = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[@$!%*?&]/.test(password)
    };
    
    const isValid = Object.values(requirements).every(req => req);
    return { isValid, requirements };
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Real-time password validation
    if (name === 'password') {
      const validation = validatePassword(value);
      if (!validation.isValid && value.length > 0) {
        setErrors(prev => ({
          ...prev,
          password: 'Password must contain at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&)'
        }));
      }
    }

    // Confirm password validation
    if (name === 'confirmPassword') {
      if (value !== formData.password && value.length > 0) {
        setErrors(prev => ({
          ...prev,
          confirmPassword: 'Passwords do not match'
        }));
      }
    }
  };



  const validateForm = () => {
    const newErrors = {};
    
    // Essential field validation
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    
    // Email validation with better regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Phone validation for Indian numbers
    const phoneRegex = /^(\+91[6-9]\d{9}|[6-9]\d{9})$/;
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid Indian phone number (10 digits starting with 6-9)';
    }
    
    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters long';
    }
    
    // Password validation using the same logic as backend
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        newErrors.password = 'Password must contain at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&)';
      }
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Password confirmation is required';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    // Role validation - ensure it's one of the valid roles
    const validRoles = ['user', 'volunteer', 'asha_worker', 'health_official'];
    if (!formData.role) {
      newErrors.role = 'Role selection is required';
    } else if (!validRoles.includes(formData.role)) {
      newErrors.role = 'Please select a valid role';
    }
    
    // Location validation
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state) newErrors.state = 'State is required';
    
    // Terms validation
    if (!formData.agreeToTerms) newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    if (!formData.dataUsageConsent) newErrors.dataUsageConsent = 'Data usage consent is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🚀 SignUp: Form submission started');
    console.log('📋 SignUp: Current form data:', formData);
    
    if (!validateForm()) {
      console.log('❌ SignUp: Client-side validation failed');
      return;
    }

    try {
      // Structure data for minimal signup with proper formatting
      const userData = {
        personalInfo: {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim()
          // dateOfBirth and gender are optional for minimal signup
        },
        authentication: {
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim().replace(/\s/g, ''), // Remove spaces
          username: formData.username.trim().toLowerCase(),
          password: formData.password
        },
        roleInfo: {
          role: formData.role
        },
        contactInfo: {
          address: {
            city: formData.city.trim(),
            state: formData.state,
            country: 'India'
            // street and pincode are optional for minimal signup
          }
          // emergencyContact is optional for minimal signup
        },
        preferences: {
          language: 'en',
          notifications: {
            email: true,
            sms: true,
            push: true,
            whatsapp: false
          },
          privacy: {
            profileVisibility: 'private',
            dataSharing: formData.dataUsageConsent,
            analyticsOptIn: false
          }
        },
        termsAccepted: formData.agreeToTerms,
        privacyPolicyAccepted: formData.agreeToTerms
      };

      console.log('📤 SignUp: Sending user data to backend:', userData);

      const result = await signup(userData);
      
      console.log('📥 SignUp: Backend response:', result);
      
      if (result.success) {
        console.log('✅ SignUp: Registration successful, navigating to profile completion');
        navigate('/app/profile/complete');
      } else {
        console.log('❌ SignUp: Registration failed');
        // Handle field-specific errors from backend
        if (result.fieldErrors) {
          console.log('🔍 SignUp: Setting field errors:', result.fieldErrors);
          setErrors(result.fieldErrors);
        }
      }
    } catch (error) {
      console.error('💥 SignUp: Unexpected error during submission:', error);
      // Set a general error message for network issues
      setErrors({
        general: 'Network error occurred. Please check your connection and try again.'
      });
    }
  };



  return (
    <div className="mt-8 bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          
          {/* Left Side - Branding & Information */}
          <div className="lg:w-2/5 bg-gradient-to-br from-blue-500 to-indigo-600 p-6 lg:p-10 flex flex-col justify-center text-white">
            <div className="text-center lg:text-left">
              {/* Logo */}
              <div className="flex items-center justify-center lg:justify-start mb-6">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <img
                    src="/images/favIcon.png"
                    alt="AquaShield"
                    className="w-8 h-8 object-cover"
                  />
                </div>
              </div>

              {/* Title & Description */}
              <h1 className="text-2xl lg:text-3xl font-bold mb-3">
                Join AquaShield
              </h1>
              <p className="text-blue-100 text-base lg:text-lg mb-6 leading-relaxed">
                Help protect your community's health through early warning and surveillance
              </p>

              {/* Benefits */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-center lg:justify-start text-blue-100">
                  <FiUser className="mr-3" size={16} />
                  <span className="text-sm">Quick & Easy Registration</span>
                </div>
                <div className="flex items-center justify-center lg:justify-start text-blue-100">
                  <FiShield className="mr-3" size={16} />
                  <span className="text-sm">Secure & Private</span>
                </div>
                <div className="flex items-center justify-center lg:justify-start text-blue-100">
                  <FiUsers className="mr-3" size={16} />
                  <span className="text-sm">Join Your Community</span>
                </div>
              </div>

              {/* Note */}
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <p className="text-xs text-blue-100">
                  <strong>Note:</strong> You can complete additional profile information later to unlock more features.
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Signup Form */}
          <div className="lg:w-3/5 p-6 lg:p-10">
            <div className="max-w-lg mx-auto">
              {/* Form Header */}
              <div className="mb-6">
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">
                  Create Account
                </h2>
                <p className="text-gray-600 text-sm">
                  Get started with just the essentials - complete your profile later
                </p>
              </div>

              {/* Display backend errors if any */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center text-sm text-red-600">
                    <FiAlertCircle className="mr-2" size={16} />
                    {error}
                  </div>
                </div>
              )}

              {/* Display general errors if any */}
              {errors.general && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center text-sm text-red-600">
                    <FiAlertCircle className="mr-2" size={16} />
                    {errors.general}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Personal Information */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label="First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    error={errors.firstName}
                    required
                    icon={FiUser}
                    placeholder="Enter your first name"
                  />
                  
                  <FormField
                    label="Last Name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    error={errors.lastName}
                    required
                    icon={FiUser}
                    placeholder="Enter your last name"
                  />
                </div>
                
                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    error={errors.email}
                    required
                    icon={FiMail}
                    placeholder="your.email@example.com"
                  />
                  
                  <FormField
                    label="Phone Number"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    error={errors.phone}
                    required
                    icon={FiPhone}
                    placeholder="9XXXXXXXXX or +919XXXXXXXXX"
                    helpText="Indian mobile number"
                  />
                </div>
                
                {/* Account Information */}
                <FormField
                  label="Username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  error={errors.username}
                  required
                  icon={FiUser}
                  placeholder="Choose a unique username"
                  helpText="Only letters and numbers allowed, 3-30 characters"
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <PasswordField
                    label="Password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    error={errors.password}
                    required
                    showStrengthIndicator
                    placeholder="Create a strong password"
                  />
                  
                  <PasswordField
                    label="Confirm Password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    error={errors.confirmPassword}
                    required
                    placeholder="Confirm your password"
                  />
                </div>
                
                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Role *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {roleOptions.map((role) => (
                      <label
                        key={role.value}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                          formData.role === role.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="role"
                          value={role.value}
                          checked={formData.role === role.value}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <div>
                          <div className="font-medium text-sm text-gray-900">{role.label}</div>
                          <div className="text-xs text-gray-600 mt-1">{role.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                  {errors.role && (
                    <div className="flex items-center mt-1 text-xs text-red-600">
                      <FiAlertCircle className="mr-1" size={12} />
                      {errors.role}
                    </div>
                  )}
                </div>
                
                {/* Location Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="City"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    error={errors.city}
                    required
                    icon={FiMapPin}
                    placeholder="Your city"
                  />
                  
                  <FormField
                    type="select"
                    label="State"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    error={errors.state}
                    required
                    icon={FiMapPin}
                    options={indianStates}
                    placeholder="Select your state"
                  />
                </div>
                
                {/* Terms & Agreements */}
                <div className="space-y-4 pt-4 border-t">
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      name="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onChange={handleInputChange}
                      className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-3 text-sm text-gray-600">
                      I agree to the{' '}
                      <Link to="/terms" className="text-blue-600 hover:text-blue-700 font-medium">
                        Terms and Conditions
                      </Link>{' '}
                      and{' '}
                      <Link to="/privacy" className="text-blue-600 hover:text-blue-700 font-medium">
                        Privacy Policy
                      </Link>
                      <span className="text-red-500 ml-1">*</span>
                    </span>
                  </label>
                  {errors.agreeToTerms && (
                    <div className="flex items-center mt-1 text-xs text-red-600 ml-7">
                      <FiAlertCircle className="mr-1" size={12} />
                      {errors.agreeToTerms}
                    </div>
                  )}

                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      name="dataUsageConsent"
                      checked={formData.dataUsageConsent}
                      onChange={handleInputChange}
                      className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-3 text-sm text-gray-600">
                      I consent to data usage for health surveillance and community protection purposes
                      <span className="text-red-500 ml-1">*</span>
                    </span>
                  </label>
                  {errors.dataUsageConsent && (
                    <div className="flex items-center mt-1 text-xs text-red-600 ml-7">
                      <FiAlertCircle className="mr-1" size={12} />
                      {errors.dataUsageConsent}
                    </div>
                  )}
                </div>
                
                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isLoading ? (
                      <>
                        <FiLoader className="animate-spin mr-2" size={18} />
                        Creating Account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </button>
                </div>
              </form>

              {/* Sign In Link */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link
                    to="/app/auth/login"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;