import React, { useState } from 'react';
import { FiLock, FiEye, FiEyeOff, FiCheck, FiX } from 'react-icons/fi';

const PasswordField = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  required = false,
  disabled = false,
  showStrengthIndicator = false,
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  // Password strength validation - matches backend regex exactly
  const getPasswordStrength = (password) => {
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password)
    };
    
    const score = Object.values(checks).filter(Boolean).length;
    
    // Check if password matches backend requirements exactly
    const backendRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    const meetsBackendRequirements = password.length >= 8 && backendRegex.test(password);
    
    return { checks, score, meetsBackendRequirements };
  };

  const { checks, score, meetsBackendRequirements } = getPasswordStrength(value);
  
  const getStrengthColor = () => {
    if (score <= 2) return 'text-red-500';
    if (score <= 3) return 'text-yellow-500';
    if (score <= 4) return 'text-blue-500';
    return 'text-green-500';
  };

  const getStrengthText = () => {
    if (score <= 2) return 'Weak';
    if (score <= 3) return 'Fair';
    if (score <= 4) return 'Good';
    return 'Strong';
  };

  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          <FiLock size={18} />
        </div>
        
        <input
          type={showPassword ? 'text' : 'password'}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full pl-9 pr-10 py-2.5 border rounded-lg 
            focus:ring-2 focus:ring-blue-500 focus:border-transparent 
            transition-colors text-sm disabled:bg-gray-50 disabled:cursor-not-allowed
            ${error ? 'border-red-500' : 'border-gray-300'}
            ${className}
          `}
          {...props}
        />
        
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          disabled={disabled}
        >
          {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
        </button>
      </div>
      
      {showStrengthIndicator && value && (
        <div className="mt-2 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Password Strength:</span>
            <span className={`text-xs font-medium ${getStrengthColor()}`}>
              {getStrengthText()}
            </span>
          </div>
          
          <div className="grid grid-cols-5 gap-1">
            {[1, 2, 3, 4, 5].map((level) => (
              <div
                key={level}
                className={`h-1 rounded-full ${
                  level <= score
                    ? score <= 2
                      ? 'bg-red-500'
                      : score <= 3
                      ? 'bg-yellow-500'
                      : score <= 4
                      ? 'bg-blue-500'
                      : 'bg-green-500'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          
          <div className="space-y-1">
            {[
              { key: 'length', text: 'At least 8 characters' },
              { key: 'lowercase', text: 'One lowercase letter' },
              { key: 'uppercase', text: 'One uppercase letter' },
              { key: 'number', text: 'One number' },
              { key: 'special', text: 'One special character (@$!%*?&)' }
            ].map(({ key, text }) => (
              <div key={key} className="flex items-center text-xs">
                {checks[key] ? (
                  <FiCheck className="text-green-500 mr-1" size={12} />
                ) : (
                  <FiX className="text-gray-400 mr-1" size={12} />
                )}
                <span className={checks[key] ? 'text-green-600' : 'text-gray-500'}>
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Backend compliance indicator */}
      {showStrengthIndicator && value && (
        <div className="mt-1">
          {meetsBackendRequirements ? (
            <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
              <FiCheck className="mr-1 flex-shrink-0" size={12} />
              <span>Password meets all requirements</span>
            </div>
          ) : value.length > 0 && (
            <div className="flex items-center text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
              <FiX className="mr-1 flex-shrink-0" size={12} />
              <span>Password doesn't meet all requirements</span>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center mt-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
          <FiX className="mr-1 flex-shrink-0" size={12} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default PasswordField;