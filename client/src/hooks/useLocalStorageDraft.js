import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for localStorage-based draft functionality
 * Automatically saves form data to localStorage and restores on component mount
 * 
 * @param {string} key - Unique key for localStorage storage
 * @param {Object} initialData - Initial form data structure
 * @param {number} autosaveInterval - Auto-save interval in milliseconds (default: 2000ms)
 * @returns {Object} { draftData, updateDraft, clearDraft, isDraftAvailable, lastSaved }
 */
export const useLocalStorageDraft = (key, initialData = {}, autosaveInterval = 2000) => {
  const [draftData, setDraftData] = useState(initialData);
  const [lastSaved, setLastSaved] = useState(null);
  const [isDraftAvailable, setIsDraftAvailable] = useState(false);

  // Generate storage key with prefix to avoid conflicts
  const storageKey = `draft_${key}`;
  const timestampKey = `draft_timestamp_${key}`;

  // Load draft from localStorage on component mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(storageKey);
      const savedTimestamp = localStorage.getItem(timestampKey);
      
      if (savedDraft && savedTimestamp) {
        const parsedDraft = JSON.parse(savedDraft);
        const timestamp = new Date(savedTimestamp);
        
        // Check if draft is not empty (has meaningful data)
        const hasData = Object.values(parsedDraft).some(value => {
          if (typeof value === 'string') return value.trim() !== '';
          if (Array.isArray(value)) return value.length > 0;
          if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0;
          return value !== null && value !== undefined;
        });
        
        if (hasData) {
          setDraftData(parsedDraft);
          setLastSaved(timestamp);
          setIsDraftAvailable(true);
        }
      }
    } catch (error) {
      console.warn('Failed to load draft from localStorage:', error);
      // Clear corrupted data
      localStorage.removeItem(storageKey);
      localStorage.removeItem(timestampKey);
    }
  }, [storageKey, timestampKey]);

  // Save draft to localStorage
  const saveDraft = useCallback((data) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
      localStorage.setItem(timestampKey, new Date().toISOString());
      setLastSaved(new Date());
    } catch (error) {
      console.warn('Failed to save draft to localStorage:', error);
    }
  }, [storageKey, timestampKey]);

  // Update draft data and save to localStorage
  const updateDraft = useCallback((updatedData) => {
    setDraftData(updatedData);
    saveDraft(updatedData);
  }, [saveDraft]);

  // Clear draft from both state and localStorage
  const clearDraft = useCallback(() => {
    setDraftData(initialData);
    setLastSaved(null);
    setIsDraftAvailable(false);
    localStorage.removeItem(storageKey);
    localStorage.removeItem(timestampKey);
  }, [initialData, storageKey, timestampKey]);

  // Auto-save functionality
  useEffect(() => {
    const interval = setInterval(() => {
      // Only auto-save if data has changed and is not empty
      const hasData = Object.values(draftData).some(value => {
        if (typeof value === 'string') return value.trim() !== '';
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0;
        return value !== null && value !== undefined;
      });
      
      if (hasData) {
        saveDraft(draftData);
      }
    }, autosaveInterval);

    return () => clearInterval(interval);
  }, [draftData, saveDraft, autosaveInterval]);

  return {
    draftData,
    updateDraft,
    clearDraft,
    isDraftAvailable,
    lastSaved,
    saveDraft
  };
};

/**
 * Utility function to get all draft keys from localStorage
 * Useful for displaying available drafts or cleanup
 * 
 * @returns {Array<Object>} Array of draft info objects { key, timestamp, data }
 */
export const getAllDrafts = () => {
  const drafts = [];
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      if (key && key.startsWith('draft_') && !key.includes('_timestamp_')) {
        const timestampKey = `draft_timestamp_${key.replace('draft_', '')}`;
        const draftData = localStorage.getItem(key);
        const timestamp = localStorage.getItem(timestampKey);
        
        if (draftData && timestamp) {
          drafts.push({
            key: key.replace('draft_', ''),
            timestamp: new Date(timestamp),
            data: JSON.parse(draftData)
          });
        }
      }
    }
  } catch (error) {
    console.warn('Failed to retrieve drafts:', error);
  }
  
  return drafts.sort((a, b) => b.timestamp - a.timestamp);
};

/**
 * Utility function to clean up old drafts
 * Removes drafts older than specified days
 * 
 * @param {number} days - Number of days after which drafts should be cleaned up
 */
export const cleanupOldDrafts = (days = 7) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  try {
    const allDrafts = getAllDrafts();
    
    allDrafts.forEach(draft => {
      if (draft.timestamp < cutoffDate) {
        localStorage.removeItem(`draft_${draft.key}`);
        localStorage.removeItem(`draft_timestamp_${draft.key}`);
      }
    });
  } catch (error) {
    console.warn('Failed to cleanup old drafts:', error);
  }
};

export default useLocalStorageDraft;