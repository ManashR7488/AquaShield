import React from 'react';
import { FiCheck, FiAlertCircle, FiInfo } from 'react-icons/fi';

/**
 * FormField Component
 * A reusable form field component with validation and consistent styling
 */
const FormField = ({
  label,
  name,
  type = 'text',
  value = '',
  onChange,
  onBlur,
  error = '',
  required = false,
  placeholder = '',
  options = [],
  disabled = false,
  className = '',
  helpText = '',
  maxLength,
  rows = 3,
  min,
  max,
  step,
  pattern,
  autoComplete,
  id
}) => {
  const fieldId = id || `field-${name}`;
  const hasError = Boolean(error);
  const isSuccess = !hasError && value && type !== 'password';
  
  const getFieldClassName = () => {
    const baseClass = "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors";
    
    if (hasError) {
      return `${baseClass} border-red-300 focus:border-red-500 focus:ring-red-200`;
    } else if (isSuccess) {
      return `${baseClass} border-green-300 focus:border-green-500 focus:ring-green-200`;
    } else {
      return `${baseClass} border-gray-300 focus:border-blue-500 focus:ring-blue-200`;
    }
  };

  const renderValidationIcon = () => {
    if (hasError) {
      return <FiAlertCircle className="w-4 h-4 text-red-500" />;
    } else if (isSuccess) {
      return <FiCheck className="w-4 h-4 text-green-500" />;
    }
    return null;
  };

  const renderInput = () => {
    const commonProps = {
      id: fieldId,
      name,
      value,
      onChange,
      onBlur,
      placeholder,
      disabled,
      required,
      className: getFieldClassName(),
      autoComplete
    };

    switch (type) {
      case 'textarea':
        return (
          <textarea
            {...commonProps}
            rows={rows}
            maxLength={maxLength}
          />
        );
        
      case 'select':
        return (
          <select {...commonProps}>
            <option value="" disabled={required}>
              {placeholder || 'Select an option...'}
            </option>
            {options.map((option) => {
              const optionValue = typeof option === 'string' ? option : option.value;
              const optionLabel = typeof option === 'string' ? option : option.label;
              return (
                <option key={optionValue} value={optionValue}>
                  {optionLabel}
                </option>
              );
            })}
          </select>
        );
        
      case 'radio':
        return (
          <div className="space-y-2">
            {options.map((option) => {
              const optionValue = typeof option === 'string' ? option : option.value;
              const optionLabel = typeof option === 'string' ? option : option.label;
              const radioId = `${fieldId}-${optionValue}`;
              
              return (
                <label key={optionValue} htmlFor={radioId} className="flex items-center cursor-pointer">
                  <input
                    id={radioId}
                    type="radio"
                    name={name}
                    value={optionValue}
                    checked={value === optionValue}
                    onChange={onChange}
                    disabled={disabled}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">{optionLabel}</span>
                </label>
              );
            })}
          </div>
        );
        
      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              {...commonProps}
              type="checkbox"
              checked={value}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor={fieldId} className="ml-2 text-sm text-gray-700 cursor-pointer">
              {label}
            </label>
          </div>
        );
        
      case 'number':
        return (
          <input
            {...commonProps}
            type="number"
            min={min}
            max={max}
            step={step}
          />
        );
        
      case 'date':
      case 'datetime-local':
      case 'time':
        return (
          <input
            {...commonProps}
            type={type}
            min={min}
            max={max}
          />
        );
        
      case 'tel':
        return (
          <input
            {...commonProps}
            type="tel"
            pattern={pattern}
            maxLength={maxLength}
          />
        );
        
      case 'email':
        return (
          <input
            {...commonProps}
            type="email"
            pattern={pattern}
            maxLength={maxLength}
          />
        );
        
      case 'password':
        return (
          <input
            {...commonProps}
            type="password"
            maxLength={maxLength}
          />
        );
        
      case 'url':
        return (
          <input
            {...commonProps}
            type="url"
            pattern={pattern}
          />
        );
        
      default:
        return (
          <input
            {...commonProps}
            type="text"
            maxLength={maxLength}
            pattern={pattern}
          />
        );
    }
  };

  const renderCharacterCount = () => {
    if (maxLength && (type === 'text' || type === 'textarea') && value) {
      const remaining = maxLength - value.length;
      const isNearLimit = remaining <= 10;
      return (
        <div className={`text-xs mt-1 ${isNearLimit ? 'text-red-500' : 'text-gray-500'}`}>
          {value.length}/{maxLength} characters
        </div>
      );
    }
    return null;
  };

  // For checkbox type, render differently
  if (type === 'checkbox') {
    return (
      <div className={`space-y-1 ${className}`}>
        {renderInput()}
        {error && (
          <div className="flex items-center space-x-1 text-red-600 text-sm">
            <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {helpText && !error && (
          <div className="flex items-center space-x-1 text-gray-500 text-sm">
            <FiInfo className="w-4 h-4 flex-shrink-0" />
            <span>{helpText}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {/* Label */}
      {label && type !== 'checkbox' && (
        <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {/* Input with validation icon */}
      <div className="relative">
        {renderInput()}
        {(hasError || isSuccess) && type !== 'radio' && type !== 'checkbox' && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            {renderValidationIcon()}
          </div>
        )}
      </div>
      
      {/* Character count */}
      {renderCharacterCount()}
      
      {/* Error message */}
      {error && (
        <div className="flex items-center space-x-1 text-red-600 text-sm">
          <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {/* Help text */}
      {helpText && !error && (
        <div className="flex items-center space-x-1 text-gray-500 text-sm">
          <FiInfo className="w-4 h-4 flex-shrink-0" />
          <span>{helpText}</span>
        </div>
      )}
    </div>
  );
};

export default FormField;