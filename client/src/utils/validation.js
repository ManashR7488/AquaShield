/**
 * Frontend validation utilities that match backend Joi schemas
 */

// Email validation
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return 'Email is required';
  if (!emailRegex.test(email)) return 'Please provide a valid email address';
  return null;
};

// Phone validation (Indian format to match backend)
export const validatePhone = (phone) => {
  const phoneRegex = /^(\+91[6-9]\d{9}|[6-9]\d{9})$/;
  if (!phone) return 'Phone number is required';
  if (!phoneRegex.test(phone)) return 'Please provide a valid Indian mobile number (10 digits starting with 6-9), you may prefix +91';
  return null;
};

// Username validation
export const validateUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9]+$/;
  if (!username) return 'Username is required';
  if (username.length < 3) return 'Username must be at least 3 characters';
  if (username.length > 30) return 'Username must be less than 30 characters';
  if (!usernameRegex.test(username)) return 'Username must contain only letters and numbers';
  return null;
};

// Enhanced password validation that matches backend exactly
export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (password.length > 128) return 'Password must be less than 128 characters';
  
  const requirements = {
    minLength: password.length >= 8,
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[@$!%*?&]/.test(password),
    validCharsOnly: /^[A-Za-z\d@$!%*?&]+$/.test(password)
  };
  
  const failedRequirements = [];
  if (!requirements.minLength) failedRequirements.push('at least 8 characters');
  if (!requirements.hasLowercase) failedRequirements.push('one lowercase letter');
  if (!requirements.hasUppercase) failedRequirements.push('one uppercase letter');
  if (!requirements.hasNumber) failedRequirements.push('one number');
  if (!requirements.hasSpecialChar) failedRequirements.push('one special character (@$!%*?&)');
  if (!requirements.validCharsOnly) failedRequirements.push('only allowed characters (letters, numbers, @$!%*?&)');
  
  if (failedRequirements.length > 0) {
    return `Password must contain ${failedRequirements.join(', ')}`;
  }
  
  return null;
};



// Name validation
export const validateName = (name, fieldName = 'Name') => {
  const nameRegex = /^[a-zA-Z\s]+$/;
  if (!name) return `${fieldName} is required`;
  if (name.length < 2) return `${fieldName} must be at least 2 characters`;
  if (name.length > 50) return `${fieldName} must be less than 50 characters`;
  if (!nameRegex.test(name)) return `${fieldName} must contain only letters and spaces`;
  return null;
};

// Date of birth validation
export const validateDateOfBirth = (dateOfBirth) => {
  if (!dateOfBirth) return 'Date of birth is required';
  
  const date = new Date(dateOfBirth);
  const today = new Date();
  
  if (date > today) return 'Date of birth cannot be in the future';
  
  // Check if person is at least 13 years old (reasonable minimum)
  const minDate = new Date();
  minDate.setFullYear(today.getFullYear() - 13);
  if (date > minDate) return 'You must be at least 13 years old';
  
  // Check if person is not older than 120 years (reasonable maximum)
  const maxDate = new Date();
  maxDate.setFullYear(today.getFullYear() - 120);
  if (date < maxDate) return 'Please enter a valid date of birth';
  
  return null;
};

// Gender validation
export const validateGender = (gender) => {
  const validGenders = ['male', 'female', 'other', 'prefer_not_to_say'];
  if (!gender) return 'Gender selection is required';
  if (!validGenders.includes(gender)) return 'Please select a valid gender option';
  return null;
};

// Role validation
export const validateRole = (role) => {
  const validRoles = ['admin', 'health_official', 'asha_worker', 'volunteer', 'community_member', 'user'];
  if (!role) return 'Role selection is required';
  if (!validRoles.includes(role)) return 'Please select a valid role';
  return null;
};

// State validation (matches backend validation)
export const validateState = (state) => {
  const validIndianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    // Union Territories
    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi', 'Lakshadweep', 'Puducherry', 'Jammu and Kashmir', 'Ladakh'
  ];
  
  if (!state) return 'State is required';
  if (!validIndianStates.includes(state)) return 'Please select a valid Indian state';
  return null;
};

// Address validation
export const validateAddress = (address) => {
  const errors = {};
  
  if (!address.street) errors.street = 'Street address is required';
  else if (address.street.length > 200) errors.street = 'Street address must be less than 200 characters';
  
  if (!address.city) errors.city = 'City is required';
  else if (address.city.length > 100) errors.city = 'City must be less than 100 characters';
  
  if (!address.state) errors.state = 'State is required';
  else if (address.state.length > 100) errors.state = 'State must be less than 100 characters';
  
  if (!address.pincode) errors.pincode = 'Pincode is required';
  else if (!/^\d{6}$/.test(address.pincode)) errors.pincode = 'Pincode must be 6 digits';
  
  return Object.keys(errors).length > 0 ? errors : null;
};

// Emergency contact validation
export const validateEmergencyContact = (contact) => {
  const errors = {};
  
  if (!contact.name) errors.name = 'Emergency contact name is required';
  else if (contact.name.length < 2) errors.name = 'Name must be at least 2 characters';
  else if (contact.name.length > 100) errors.name = 'Name must be less than 100 characters';
  
  const phoneError = validatePhone(contact.phone);
  if (phoneError) errors.phone = phoneError;
  
  if (!contact.relationship) errors.relationship = 'Relationship is required';
  else if (contact.relationship.length > 50) errors.relationship = 'Relationship must be less than 50 characters';
  
  return Object.keys(errors).length > 0 ? errors : null;
};

// Complete form validation
export const validateSignupForm = (formData) => {
  const errors = {};
  
  // Personal info validation
  const firstNameError = validateName(formData.firstName, 'First name');
  if (firstNameError) errors.firstName = firstNameError;
  
  const lastNameError = validateName(formData.lastName, 'Last name');
  if (lastNameError) errors.lastName = lastNameError;
  
  const dobError = validateDateOfBirth(formData.dateOfBirth);
  if (dobError) errors.dateOfBirth = dobError;
  
  const genderError = validateGender(formData.gender);
  if (genderError) errors.gender = genderError;
  
  // Authentication validation
  const emailError = validateEmail(formData.email);
  if (emailError) errors.email = emailError;
  
  const phoneError = validatePhone(formData.phone);
  if (phoneError) errors.phone = phoneError;
  
  const usernameError = validateUsername(formData.username);
  if (usernameError) errors.username = usernameError;
  
  const passwordError = validatePassword(formData.password);
  if (passwordError) errors.password = passwordError;
  
  if (!formData.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }
  
  // Role validation
  const roleError = validateRole(formData.role);
  if (roleError) errors.role = roleError;
  
  // Address validation
  const addressErrors = validateAddress({
    street: formData.street,
    city: formData.city,
    state: formData.state,
    pincode: formData.pincode
  });
  if (addressErrors) Object.assign(errors, addressErrors);
  
  // Emergency contact validation
  const emergencyContactErrors = validateEmergencyContact({
    name: formData.emergencyContactName,
    phone: formData.emergencyContactPhone,
    relationship: formData.emergencyContactRelationship
  });
  if (emergencyContactErrors) {
    Object.keys(emergencyContactErrors).forEach(key => {
      errors[`emergencyContact${key.charAt(0).toUpperCase() + key.slice(1)}`] = emergencyContactErrors[key];
    });
  }
  
  // Agreement validation
  if (!formData.agreeToTerms) {
    errors.agreeToTerms = 'You must agree to the terms and conditions';
  }
  
  if (!formData.dataUsageConsent) {
    errors.dataUsageConsent = 'Data usage consent is required';
  }
  
  return Object.keys(errors).length > 0 ? errors : null;
};

// Utility to format phone number for display
export const formatPhoneNumber = (phone) => {
  // Add +91 prefix for Indian numbers if not present
  if (phone && !phone.startsWith('+')) {
    if (phone.length === 10 && /^[6-9]\d{9}$/.test(phone)) {
      return `+91${phone}`;
    }
  }
  return phone;
};

// Enhanced password strength calculation with detailed feedback
export const getPasswordStrength = (password) => {
  if (!password) return { score: 0, strength: 'None', requirements: {}, feedback: [] };
  
  const requirements = {
    minLength: password.length >= 8,
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[@$!%*?&]/.test(password),
    validCharsOnly: /^[A-Za-z\d@$!%*?&]+$/.test(password)
  };
  
  const score = Object.values(requirements).filter(Boolean).length;
  const meetsBackendRequirements = score === 6;
  
  let strength = 'Weak';
  if (score >= 5 && meetsBackendRequirements) strength = 'Strong';
  else if (score >= 4) strength = 'Good';
  else if (score >= 3) strength = 'Fair';
  
  const feedback = [];
  if (!requirements.minLength) feedback.push('Use at least 8 characters');
  if (!requirements.hasLowercase) feedback.push('Add lowercase letters');
  if (!requirements.hasUppercase) feedback.push('Add uppercase letters');
  if (!requirements.hasNumber) feedback.push('Add numbers');
  if (!requirements.hasSpecialChar) feedback.push('Add special characters (@$!%*?&)');
  if (!requirements.validCharsOnly) feedback.push('Use only allowed characters');
  
  return { score, strength, requirements, meetsBackendRequirements, feedback };
};

// Simplified signup validation for the actual signup form
export const validateSignupFormSimple = (formData) => {
  const errors = {};
  
  // Essential fields only (matching SignUp.jsx)
  const nameError = validateName(formData.name);
  if (nameError) errors.name = nameError;
  
  const emailError = validateEmail(formData.email);
  if (emailError) errors.email = emailError;
  
  const phoneError = validatePhone(formData.phone);
  if (phoneError) errors.phone = phoneError;
  
  const usernameError = validateUsername(formData.username);
  if (usernameError) errors.username = usernameError;
  
  const passwordError = validatePassword(formData.password);
  if (passwordError) errors.password = passwordError;
  
  if (formData.confirmPassword !== formData.password) {
    errors.confirmPassword = 'Passwords do not match';
  }
  
  const stateError = validateState(formData.state);
  if (stateError) errors.state = stateError;
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Real-time field validation (for individual field updates)
export const validateField = (fieldName, value, formData = {}) => {
  switch (fieldName) {
    case 'name':
      return validateName(value);
    case 'email':
      return validateEmail(value);
    case 'phone':
      return validatePhone(value);
    case 'username':
      return validateUsername(value);
    case 'password':
      return validatePassword(value);
    case 'confirmPassword':
      return value !== formData.password ? 'Passwords do not match' : null;
    case 'state':
      return validateState(value);
    default:
      return null;
  }
};

// Debug helper for validation testing
export const debugValidation = (formData) => {
  console.log('🔍 Validation Debug:', {
    formData,
    nameValid: !validateName(formData.name),
    emailValid: !validateEmail(formData.email),
    phoneValid: !validatePhone(formData.phone),
    usernameValid: !validateUsername(formData.username),
    passwordValid: !validatePassword(formData.password),
    stateValid: !validateState(formData.state),
    passwordStrength: getPasswordStrength(formData.password)
  });
};