import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiSave } from "react-icons/fi";
import HealthReportForm from "./HealthReportForm";
import { createHealthReport } from "../../../services/healthReportService";
import useAuthStore from "../../../store/useAuthStore";
import { getAshaWorkerVillages } from "../../../utils/ashaWorkerGuard.jsx";
import useLocalStorageDraft from "../../../hooks/useLocalStorageDraft";
import DraftIndicator from "../../../components/DraftIndicator/DraftIndicator";

/**
 * HealthReportCreate Component
 * Page for creating new health reports
 */
const HealthReportCreate = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Get ASHA worker's assigned villages
  const assignedVillages = getAshaWorkerVillages();
  
  // Initial form data structure
  const initialFormData = {
    reportType: '',
    villageId: '',
    title: '',
    description: '',
    reportDate: new Date().toISOString().slice(0, 16), // Current date/time in local format
    priority: 'medium',
    location: {
      specificLocation: '',
      landmark: '',
      coordinates: '',
      areaType: ''
    },
    // Type-specific fields will be added dynamically based on reportType
    recommendations: '',
    resourcesNeeded: '',
    followUpActions: ''
  };

  // Component state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Draft functionality
  const {
    draftData: formData,
    updateDraft: setFormData,
    clearDraft,
    isDraftAvailable,
    lastSaved
  } = useLocalStorageDraft('health_report_create', initialFormData);

  // Check if user is ASHA worker
  useEffect(() => {
    if (user && user.roleInfo?.role !== 'asha_worker') {
      navigate('/app');
    }
  }, [user, navigate]);

  // Pre-select village if only one assigned and no draft village selected
  useEffect(() => {
    if (assignedVillages.length === 1 && !formData.villageId) {
      setFormData(prev => ({
        ...prev,
        villageId: assignedVillages[0]._id
      }));
    }
  }, [assignedVillages, formData.villageId, setFormData]);

  // Validate form data
  const validateForm = () => {
    const newErrors = {};

    // Basic validations
    if (!formData.reportType) {
      newErrors.reportType = 'Report type is required';
    }

    if (!formData.villageId) {
      newErrors.villageId = 'Village selection is required';
    }

    if (!formData.title || formData.title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters long';
    }

    if (!formData.description || formData.description.trim().length < 20) {
      newErrors.description = 'Description must be at least 20 characters long';
    }

    if (!formData.reportDate) {
      newErrors.reportDate = 'Report date is required';
    }

    // Type-specific validations
    switch (formData.reportType) {
      case 'disease_outbreak':
        if (!formData.affectedCount || formData.affectedCount < 1) {
          newErrors.affectedCount = 'Number of affected people is required';
        }
        if (!formData.symptoms || formData.symptoms.trim().length < 10) {
          newErrors.symptoms = 'Detailed symptoms description is required';
        }
        if (!formData.suspectedCause || formData.suspectedCause.trim().length < 5) {
          newErrors.suspectedCause = 'Suspected cause is required';
        }
        break;

      case 'water_quality':
        if (!formData.waterSource) {
          newErrors.waterSource = 'Water source is required';
        }
        if (!formData.qualityParameters || formData.qualityParameters.trim().length < 10) {
          newErrors.qualityParameters = 'Quality parameters description is required';
        }
        break;

      case 'health_survey':
        if (!formData.surveyType) {
          newErrors.surveyType = 'Survey type is required';
        }
        if (!formData.participantCount || formData.participantCount < 1) {
          newErrors.participantCount = 'Number of participants is required';
        }
        break;

      case 'emergency_alert':
        if (!formData.emergencyType) {
          newErrors.emergencyType = 'Emergency type is required';
        }
        if (!formData.immediateActions || formData.immediateActions.trim().length < 10) {
          newErrors.immediateActions = 'Description of immediate actions is required';
        }
        break;
    }

    // Validate coordinates format if provided
    if (formData.location.coordinates && formData.location.coordinates.trim()) {
      const coordPattern = /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/;
      if (!coordPattern.test(formData.location.coordinates.trim())) {
        newErrors['location.coordinates'] = 'Coordinates must be in format: latitude, longitude';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Prepare data for submission
      const submitData = {
        ...formData,
        // Ensure proper data types
        affectedCount: formData.affectedCount ? parseInt(formData.affectedCount) : undefined,
        participantCount: formData.participantCount ? parseInt(formData.participantCount) : undefined,
        reportDate: new Date(formData.reportDate).toISOString(),
        // Clean up location data
        location: {
          specificLocation: formData.location.specificLocation || '',
          landmark: formData.location.landmark || '',
          coordinates: formData.location.coordinates || '',
          areaType: formData.location.areaType || ''
        }
      };

      // Remove empty/undefined fields
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === undefined || submitData[key] === null || submitData[key] === '') {
          delete submitData[key];
        }
      });

      const response = await createHealthReport(submitData);
      
      if (response.success) {
        // Clear draft on successful submission
        clearDraft();
        navigate('/app/village-reports', {
          replace: true,
          state: { 
            message: 'Health report created successfully!', 
            type: 'success' 
          }
        });
      } else {
        setErrors({ 
          submit: response.error || 'Failed to create health report. Please try again.' 
        });
      }
    } catch (err) {
      console.error('Error creating health report:', err);
      setErrors({ 
        submit: 'An unexpected error occurred. Please check your connection and try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle form data changes
  const handleFormChange = (newFormData) => {
    setFormData(newFormData);
    
    // Clear errors when user starts typing
    if (Object.keys(errors).length > 0) {
      setErrors({});
    }
  };

  // if (!assignedVillages.length) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
  //           <FiArrowLeft className="text-red-600" size={24} />
  //         </div>
  //         <h3 className="mt-4 text-lg font-medium text-gray-900">No Assigned Villages</h3>
  //         <p className="mt-2 text-sm text-gray-500 max-w-md">
  //           You need to be assigned to villages before you can create health reports. 
  //           Please contact your supervisor to get village assignments.
  //         </p>
  //         <button
  //           onClick={() => navigate('/app')}
  //           className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
  //         >
  //           Go Back to Dashboard
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/app/village-reports')}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <FiArrowLeft size={20} />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Create Health Report</h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Document health situations and incidents in your assigned villages
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="text-sm text-gray-500">
                  Assigned Villages: <span className="font-medium text-gray-900">{assignedVillages.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {errors.submit && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{errors.submit}</p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Creating new health report</span>
              <span>Step 1 of 1</span>
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>

        {/* Draft Indicator */}
        {(isDraftAvailable || lastSaved) && (
          <DraftIndicator
            isDraftAvailable={isDraftAvailable}
            lastSaved={lastSaved}
            onClearDraft={() => {
              clearDraft();
              setErrors({}); // Clear any validation errors
            }}
            className="mb-6"
          />
        )}

        {/* Form */}
        <HealthReportForm
          formData={formData}
          onChange={handleFormChange}
          onSubmit={handleSubmit}
          loading={loading}
          isEdit={false}
          assignedVillages={assignedVillages}
          errors={errors}
        />

        {/* Help Text */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Tips for Creating Effective Health Reports</h4>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Be specific and detailed in your descriptions</li>
            <li>Include exact numbers when reporting affected individuals</li>
            <li>Provide clear location information for follow-up actions</li>
            <li>Set appropriate priority levels based on urgency</li>
            <li>Include recommendations for immediate and long-term actions</li>
            <li>Save drafts frequently using your browser's back button</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default HealthReportCreate;