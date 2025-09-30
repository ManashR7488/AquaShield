import React from 'react';
import { FiSave, FiClock, FiTrash2 } from 'react-icons/fi';

/**
 * Draft Indicator Component
 * Shows draft status, last saved time, and provides draft management options
 */
const DraftIndicator = ({
  isDraftAvailable,
  lastSaved,
  onClearDraft,
  onRestoreDraft,
  className = ''
}) => {
  if (!isDraftAvailable && !lastSaved) {
    return null;
  }

  const formatLastSaved = (timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just saved';
    if (minutes < 60) return `Saved ${minutes}m ago`;
    if (hours < 24) return `Saved ${hours}h ago`;
    return `Saved ${days}d ago`;
  };

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FiSave className="text-blue-600" size={16} />
          <div className="text-sm">
            <span className="font-medium text-blue-900">
              {isDraftAvailable ? 'Draft Available' : 'Auto-saved'}
            </span>
            {lastSaved && (
              <div className="flex items-center space-x-1 text-blue-700">
                <FiClock size={12} />
                <span className="text-xs">{formatLastSaved(lastSaved)}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {isDraftAvailable && onRestoreDraft && (
            <button
              onClick={onRestoreDraft}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-100"
            >
              Restore
            </button>
          )}
          
          {onClearDraft && (
            <button
              onClick={onClearDraft}
              className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
              title="Clear draft"
            >
              <FiTrash2 size={12} />
            </button>
          )}
        </div>
      </div>
      
      {isDraftAvailable && (
        <div className="mt-2 text-xs text-blue-700">
          You have unsaved changes from a previous session. Click "Restore" to continue editing.
        </div>
      )}
    </div>
  );
};

export default DraftIndicator;