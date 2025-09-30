import React, { useEffect, useRef } from 'react';
import { FiX, FiAlertTriangle, FiCheck, FiInfo } from 'react-icons/fi';

/**
 * ConfirmDialog Component
 * A reusable confirmation dialog for destructive actions with proper accessibility
 */
const ConfirmDialog = ({
  isOpen = false,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning', // 'success', 'warning', 'danger', 'info'
  loading = false,
  className = ''
}) => {
  const dialogRef = useRef(null);
  const confirmButtonRef = useRef(null);
  const cancelButtonRef = useRef(null);

  // Focus management
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      // Focus the dialog when it opens
      dialogRef.current.focus();
      
      // Focus the appropriate button
      if (type === 'danger') {
        cancelButtonRef.current?.focus();
      } else {
        confirmButtonRef.current?.focus();
      }
    }
  }, [isOpen, type]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isOpen) return;

      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'Enter') {
        event.preventDefault();
        onConfirm();
      } else if (event.key === 'Tab') {
        // Simple focus trapping
        const focusableElements = dialogRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements && focusableElements.length > 0) {
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];
          
          if (event.shiftKey && document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          } else if (!event.shiftKey && document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, onConfirm]);

  if (!isOpen) return null;

  const getTypeConfig = () => {
    const configs = {
      success: {
        icon: FiCheck,
        iconColor: 'text-green-600',
        iconBg: 'bg-green-100',
        confirmButtonClass: 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
      },
      warning: {
        icon: FiAlertTriangle,
        iconColor: 'text-yellow-600',
        iconBg: 'bg-yellow-100',
        confirmButtonClass: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
      },
      danger: {
        icon: FiAlertTriangle,
        iconColor: 'text-red-600',
        iconBg: 'bg-red-100',
        confirmButtonClass: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
      },
      info: {
        icon: FiInfo,
        iconColor: 'text-blue-600',
        iconBg: 'bg-blue-100',
        confirmButtonClass: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
      }
    };
    return configs[type] || configs.warning;
  };

  const typeConfig = getTypeConfig();
  const IconComponent = typeConfig.icon;

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="dialog-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        onClick={handleOverlayClick}
      />
      
      {/* Dialog container */}
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div
          ref={dialogRef}
          className={`relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg ${className}`}
          tabIndex="-1"
        >
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              {/* Icon */}
              <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${typeConfig.iconBg} sm:mx-0 sm:h-10 sm:w-10`}>
                <IconComponent className={`h-6 w-6 ${typeConfig.iconColor}`} aria-hidden="true" />
              </div>
              
              {/* Content */}
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left flex-1">
                <h3
                  className="text-base font-semibold leading-6 text-gray-900"
                  id="dialog-title"
                >
                  {title}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    {message}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              ref={confirmButtonRef}
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${typeConfig.confirmButtonClass}`}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Loading...
                </div>
              ) : (
                confirmText
              )}
            </button>
            <button
              ref={cancelButtonRef}
              type="button"
              onClick={onClose}
              disabled={loading}
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;