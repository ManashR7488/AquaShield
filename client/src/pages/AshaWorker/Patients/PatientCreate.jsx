import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import PatientForm from "./PatientForm";
import { createPatient } from "../../../services/patientService";
import useAuthStore from "../../../store/useAuthStore";
import { getAshaWorkerVillages } from "../../../utils/ashaWorkerGuard.jsx";
import useLocalStorageDraft from "../../../hooks/useLocalStorageDraft";
import DraftIndicator from "../../../components/DraftIndicator/DraftIndicator";

/**
 * PatientCreate Component
 * Page for creating new patient records
 */
const PatientCreate = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Get ASHA worker's assigned villages
  const assignedVillages = getAshaWorkerVillages();
  
  // Initial form data structure
  const initialFormData = {
    name: '',
    dateOfBirth: '',
    gender: '',
    villageId: '',
    contactNumber: '',
    aadharNumber: '',
    email: '',
    address: {
      houseNumber: '',
      area: '',
      landmark: '',
      pincode: ''
    },
    bloodGroup: '',
    height: '',
    weight: '',
    vaccinationStatus: 'unknown',
    isPregnant: false,
    expectedDueDate: '',
    hasDisability: false,
    disabilityDetails: '',
    medicalHistory: '',
    currentMedications: '',
    emergencyContact: {
      name: '',
      relationship: '',
      contactNumber: '',
      alternativeContact: ''
    },
    notes: ''
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
  } = useLocalStorageDraft('patient_create', initialFormData);

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
    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters long';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      // Check if date is not in future
      const today = new Date();
      const birthDate = new Date(formData.dateOfBirth);
      if (birthDate > today) {
        newErrors.dateOfBirth = 'Date of birth cannot be in the future';
      }
      
      // Check if age is reasonable (not more than 150 years)
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age > 150) {
        newErrors.dateOfBirth = 'Please enter a valid date of birth';
      }
    }

    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }

    if (!formData.villageId) {
      newErrors.villageId = 'Village selection is required';
    }

    if (!formData.contactNumber) {
      newErrors.contactNumber = 'Contact number is required';
    } else if (!/^[0-9]{10}$/.test(formData.contactNumber)) {
      newErrors.contactNumber = 'Contact number must be exactly 10 digits';
    }

    // Aadhar validation (if provided)
    if (formData.aadharNumber && !/^[0-9]{12}$/.test(formData.aadharNumber)) {
      newErrors.aadharNumber = 'Aadhar number must be exactly 12 digits';
    }

    // Email validation (if provided)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Address validation
    if (!formData.address.area || formData.address.area.trim().length < 3) {
      newErrors['address.area'] = 'Area/Locality is required and must be at least 3 characters';
    }

    // PIN code validation (if provided)
    if (formData.address.pincode && !/^[0-9]{6}$/.test(formData.address.pincode)) {
      newErrors['address.pincode'] = 'PIN code must be exactly 6 digits';
    }

    // Health validations
    if (formData.height && (formData.height < 50 || formData.height > 250)) {
      newErrors.height = 'Height must be between 50 and 250 cm';
    }

    if (formData.weight && (formData.weight < 2 || formData.weight > 300)) {
      newErrors.weight = 'Weight must be between 2 and 300 kg';
    }

    // Pregnancy validations
    if (formData.isPregnant && formData.gender !== 'female') {
      newErrors.isPregnant = 'Pregnancy status can only be set for female patients';
      setFormData(prev => ({ ...prev, isPregnant: false }));
    }

    if (formData.isPregnant && formData.expectedDueDate) {
      const dueDate = new Date(formData.expectedDueDate);
      const today = new Date();
      if (dueDate <= today) {
        newErrors.expectedDueDate = 'Due date must be in the future';
      }
    }

    // Emergency contact validations
    if (formData.emergencyContact.contactNumber && !/^[0-9]{10}$/.test(formData.emergencyContact.contactNumber)) {
      newErrors['emergencyContact.contactNumber'] = 'Emergency contact must be exactly 10 digits';
    }

    if (formData.emergencyContact.alternativeContact && !/^[0-9]{10}$/.test(formData.emergencyContact.alternativeContact)) {
      newErrors['emergencyContact.alternativeContact'] = 'Alternative contact must be exactly 10 digits';
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
        height: formData.height ? parseFloat(formData.height) : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        dateOfBirth: new Date(formData.dateOfBirth).toISOString(),
        expectedDueDate: formData.expectedDueDate ? new Date(formData.expectedDueDate).toISOString() : undefined,
        // Clean up address data
        address: {
          houseNumber: formData.address.houseNumber || '',
          area: formData.address.area || '',
          landmark: formData.address.landmark || '',
          pincode: formData.address.pincode || ''
        },
        // Clean up emergency contact
        emergencyContact: {
          name: formData.emergencyContact.name || '',
          relationship: formData.emergencyContact.relationship || '',
          contactNumber: formData.emergencyContact.contactNumber || '',
          alternativeContact: formData.emergencyContact.alternativeContact || ''
        }
      };

      // Remove empty/undefined fields
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === undefined || submitData[key] === null || submitData[key] === '') {
          delete submitData[key];
        }
      });

      // Remove empty nested objects
      if (Object.values(submitData.address).every(val => !val)) {
        delete submitData.address;
      }
      
      if (Object.values(submitData.emergencyContact).every(val => !val)) {
        delete submitData.emergencyContact;
      }

      const response = await createPatient(submitData);
      
      if (response.success) {
        // Clear draft on successful submission
        clearDraft();
        navigate('/app/patients', {
          replace: true,
          state: { 
            message: 'Patient record created successfully!', 
            type: 'success' 
          }
        });
      } else {
        setErrors({ 
          submit: response.error || 'Failed to create patient record. Please try again.' 
        });
      }
    } catch (err) {
      console.error('Error creating patient:', err);
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

    // Auto-reset pregnancy status if gender is not female
    if (newFormData.gender !== 'female' && newFormData.isPregnant) {
      setFormData(prev => ({ 
        ...prev, 
        isPregnant: false, 
        expectedDueDate: '' 
      }));
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
  //           You need to be assigned to villages before you can add patients. 
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
                  onClick={() => navigate('/app/patients')}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <FiArrowLeft size={20} />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Add New Patient</h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Create a new patient record for health management
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
              <span>Creating new patient record</span>
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
        <PatientForm
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
          <h4 className="text-sm font-medium text-blue-900 mb-2">Tips for Adding Patient Records</h4>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Ensure all contact information is accurate for follow-up</li>
            <li>Medical history helps in providing better care</li>
            <li>Emergency contact is crucial for urgent situations</li>
            <li>Keep vaccination status updated for proper scheduling</li>
            <li>Regular weight and height measurements help track growth</li>
            <li>Address information should be complete for home visits</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PatientCreate;