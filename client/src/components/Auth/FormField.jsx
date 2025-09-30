import React from 'react';
import { FiAlertCircle } from 'react-icons/fi';

const FormField = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  required = false,
  disabled = false,
  icon: Icon,
  options = [], // for select fields
  helpText,
  className = '',
  validationState, // 'valid', 'invalid', 'pending'
  showValidation = false,
  ...props
}) => {
  // Determine validation state based on props
  const isValid = showValidation && value && !error;
  const isInvalid = showValidation && error;
  
  const baseInputClasses = `
    w-full px-3 py-2.5 border rounded-lg 
    focus:ring-2 focus:border-transparent 
    transition-all duration-200 text-sm disabled:bg-gray-50 disabled:cursor-not-allowed
    ${error ? 'border-red-500 focus:ring-red-200' : 
      isValid ? 'border-green-500 focus:ring-green-200' : 
      'border-gray-300 focus:ring-blue-200'}
    ${Icon ? 'pl-9' : ''}
    ${type === 'select' ? 'appearance-none bg-white' : ''}
  `;

  const renderInput = () => {
    switch (type) {
      case 'select':
        return (
          <select
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            className={`${baseInputClasses} ${className}`}
            {...props}
          >
            <option value="">{placeholder || `Select ${label}`}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      case 'textarea':
        return (
          <textarea
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={`${baseInputClasses} ${className} resize-none`}
            rows={3}
            {...props}
          />
        );
      
      case 'date':
        return (
          <input
            type="date"
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            className={`${baseInputClasses} ${className}`}
            {...props}
          />
        );
      
      default:
        return (
          <input
            type={type}
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={`${baseInputClasses} ${className}`}
            {...props}
          />
        );
    }
  };

  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Icon size={18} />
          </div>
        )}
        
        {renderInput()}
        
        {/* Dropdown arrow for select fields */}
        {type === 'select' && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
      </div>
      
      {/* Validation feedback */}
      {error && (
        <div className="flex items-center mt-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
          <FiAlertCircle className="mr-1 flex-shrink-0" size={12} />
          <span>{error}</span>
        </div>
      )}
      
      {/* Success indicator */}
      {isValid && (
        <div className="flex items-center mt-1 text-xs text-green-600">
          <svg className="mr-1 flex-shrink-0" width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M10 3L4.5 8.5 2 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Valid</span>
        </div>
      )}
      
      {/* Help text */}
      {helpText && !error && (
        <p className="mt-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">{helpText}</p>
      )}
    </div>
  );
};

export default FormField;