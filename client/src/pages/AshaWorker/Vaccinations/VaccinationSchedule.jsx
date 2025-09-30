import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  FiArrowLeft, 
  FiCalendar, 
  FiUser, 
  FiShield,
  FiMapPin,
  FiClock,
  FiSearch,
  FiPlus
} from "react-icons/fi";
import FormField from "../../../components/Admin/FormField";
import { 
  scheduleVaccination,
  getVaccinationSchedule
} from "../../../services/vaccinationService";
import { getAllPatients } from "../../../services/patientService";
import useAuthStore from "../../../store/useAuthStore";
import { getAshaWorkerVillages } from "../../../utils/ashaWorkerGuard.jsx";
import useLocalStorageDraft from "../../../hooks/useLocalStorageDraft";
import DraftIndicator from "../../../components/DraftIndicator/DraftIndicator";

/**
 * VaccinationSchedule Component
 * Page for scheduling new vaccinations for patients
 */
const VaccinationSchedule = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  
  // Get ASHA worker's assigned villages
  const assignedVillages = getAshaWorkerVillages();
  
  // Get pre-selected patient from URL params
  const preSelectedPatientId = searchParams.get('patientId');
  
  // Component state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [vaccineSchedule, setVaccineSchedule] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  
  // Initial form data structure
  const initialFormData = {
    patientId: preSelectedPatientId || '',
    villageId: '',
    vaccineType: '',
    doseNumber: 1,
    totalDoses: '',
    scheduledDate: '',
    scheduledTime: '',
    location: '',
    notes: '',
    batchNumber: '',
    manufacturer: '',
    expiryDate: '',
    priority: 'normal'
  };

  // Draft functionality
  const {
    draftData: formData,
    updateDraft: setFormData,
    clearDraft,
    isDraftAvailable,
    lastSaved
  } = useLocalStorageDraft('vaccination_schedule', initialFormData);

  // Check if user is ASHA worker
  useEffect(() => {
    if (user && user.roleInfo?.role !== 'asha_worker') {
      navigate('/app');
    }
  }, [user, navigate]);

  // Fetch patients for all assigned villages
  useEffect(() => {
    const fetchPatients = async () => {
      if (assignedVillages.length === 0) return;
      
      setLoadingPatients(true);
      try {
        const patientsPromises = assignedVillages.map(village => 
          getAllPatients(village._id, { limit: 1000 })
        );
        
        const patientsResponses = await Promise.all(patientsPromises);
        const allPatients = patientsResponses.reduce((acc, response) => {
          if (response.success) {
            return [...acc, ...response.data];
          }
          return acc;
        }, []);
        
        setPatients(allPatients);
        
        // Set pre-selected patient if available
        if (preSelectedPatientId) {
          const preSelected = allPatients.find(p => p._id === preSelectedPatientId);
          if (preSelected) {
            setSelectedPatient(preSelected);
            setFormData(prev => ({
              ...prev,
              patientId: preSelected._id,
              villageId: preSelected.villageId
            }));
          }
        }
      } catch (err) {
        console.error('Error fetching patients:', err);
        setErrors({ patients: 'Failed to load patients' });
      } finally {
        setLoadingPatients(false);
      }
    };

    fetchPatients();
  }, [assignedVillages, preSelectedPatientId]);

  // Fetch vaccine schedule when patient is selected
  useEffect(() => {
    const fetchVaccineSchedule = async () => {
      if (!selectedPatient) return;
      
      try {
        const response = await getVaccinationSchedule(selectedPatient._id);
        if (response.success) {
          setVaccineSchedule(response.data);
        }
      } catch (err) {
        console.error('Error fetching vaccine schedule:', err);
      }
    };

    fetchVaccineSchedule();
  }, [selectedPatient]);

  // Pre-select village if only one assigned
  useEffect(() => {
    if (assignedVillages.length === 1 && !formData.villageId) {
      setFormData(prev => ({
        ...prev,
        villageId: assignedVillages[0]._id
      }));
    }
  }, [assignedVillages, formData.villageId, setFormData]);

  // Vaccine types and their information
  const vaccineTypes = {
    'BCG': { 
      name: 'BCG (Tuberculosis)', 
      totalDoses: 1, 
      ageGroup: 'Birth', 
      description: 'Bacille Calmette-Guérin vaccine for tuberculosis protection' 
    },
    'OPV': { 
      name: 'OPV (Oral Polio)', 
      totalDoses: 4, 
      ageGroup: 'Birth-18 months', 
      description: 'Oral Polio Vaccine for polio prevention' 
    },
    'DPT': { 
      name: 'DPT (Diphtheria, Pertussis, Tetanus)', 
      totalDoses: 3, 
      ageGroup: '6 weeks-18 months', 
      description: 'Triple antigen for diphtheria, pertussis, and tetanus' 
    },
    'Hepatitis_B': { 
      name: 'Hepatitis B', 
      totalDoses: 3, 
      ageGroup: 'Birth-6 months', 
      description: 'Hepatitis B vaccine for liver protection' 
    },
    'Measles': { 
      name: 'Measles (MR)', 
      totalDoses: 2, 
      ageGroup: '9-15 months', 
      description: 'Measles-Rubella vaccine' 
    },
    'MMR': { 
      name: 'MMR (Measles, Mumps, Rubella)', 
      totalDoses: 2, 
      ageGroup: '12-15 months', 
      description: 'Combined vaccine for measles, mumps, and rubella' 
    },
    'Tetanus': { 
      name: 'Tetanus Toxoid', 
      totalDoses: 2, 
      ageGroup: 'Pregnant women', 
      description: 'Tetanus protection during pregnancy' 
    },
    'COVID-19': { 
      name: 'COVID-19 Vaccine', 
      totalDoses: 2, 
      ageGroup: '18+ years', 
      description: 'COVID-19 vaccination for adults' 
    },
    'Japanese_Encephalitis': { 
      name: 'Japanese Encephalitis', 
      totalDoses: 1, 
      ageGroup: '9 months', 
      description: 'Japanese Encephalitis vaccine' 
    },
    'Rotavirus': { 
      name: 'Rotavirus', 
      totalDoses: 3, 
      ageGroup: '6-24 weeks', 
      description: 'Rotavirus vaccine for diarrheal disease prevention' 
    }
  };

  // Calculate patient age
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Handle patient selection
  const handlePatientSelect = (patientId) => {
    const patient = patients.find(p => p._id === patientId);
    setSelectedPatient(patient);
    setFormData(prev => ({
      ...prev,
      patientId,
      villageId: patient?.villageId || prev.villageId
    }));
  };

  // Handle vaccine type selection
  const handleVaccineTypeSelect = (vaccineType) => {
    const vaccineInfo = vaccineTypes[vaccineType];
    setFormData(prev => ({
      ...prev,
      vaccineType,
      totalDoses: vaccineInfo?.totalDoses || '',
      doseNumber: 1
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.patientId) {
      newErrors.patientId = 'Please select a patient';
    }

    if (!formData.villageId) {
      newErrors.villageId = 'Village selection is required';
    }

    if (!formData.vaccineType) {
      newErrors.vaccineType = 'Vaccine type is required';
    }

    if (!formData.scheduledDate) {
      newErrors.scheduledDate = 'Scheduled date is required';
    } else {
      const scheduledDate = new Date(formData.scheduledDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (scheduledDate < today) {
        newErrors.scheduledDate = 'Scheduled date cannot be in the past';
      }
    }

    if (!formData.doseNumber || formData.doseNumber < 1) {
      newErrors.doseNumber = 'Dose number must be at least 1';
    }

    if (formData.totalDoses && formData.doseNumber > formData.totalDoses) {
      newErrors.doseNumber = 'Dose number cannot exceed total doses';
    }

    if (formData.expiryDate) {
      const expiryDate = new Date(formData.expiryDate);
      const today = new Date();
      
      if (expiryDate <= today) {
        newErrors.expiryDate = 'Expiry date must be in the future';
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
      const submitData = {
        ...formData,
        scheduledDate: new Date(`${formData.scheduledDate}T${formData.scheduledTime || '09:00'}`).toISOString(),
        doseNumber: parseInt(formData.doseNumber),
        totalDoses: parseInt(formData.totalDoses) || undefined,
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : undefined
      };

      const response = await scheduleVaccination(submitData);
      
      if (response.success) {
        // Clear draft on successful submission
        clearDraft();
        navigate('/app/vaccinations', {
          replace: true,
          state: { 
            message: 'Vaccination scheduled successfully!', 
            type: 'success' 
          }
        });
      } else {
        setErrors({ 
          submit: response.error || 'Failed to schedule vaccination. Please try again.' 
        });
      }
    } catch (err) {
      console.error('Error scheduling vaccination:', err);
      setErrors({ 
        submit: 'An unexpected error occurred. Please check your connection and try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Get filtered patients
  const getFilteredPatients = (searchTerm) => {
    if (!searchTerm) return patients.slice(0, 20); // Show first 20 by default
    
    return patients
      .filter(patient =>
        patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.contactNumber?.includes(searchTerm) ||
        patient.aadharNumber?.includes(searchTerm)
      )
      .slice(0, 20); // Limit to 20 results
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
  //           You need to be assigned to villages before you can schedule vaccinations. 
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
                  onClick={() => navigate('/app/vaccinations')}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <FiArrowLeft size={20} />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Schedule Vaccination</h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Schedule a new vaccination appointment for a patient
                  </p>
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

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Patient Selection Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Select Patient</h3>
              <p className="mt-1 text-sm text-gray-500">
                Choose the patient who needs vaccination
              </p>
            </div>
            
            <div className="p-6">
              {!preSelectedPatientId ? (
                <div className="space-y-4">
                  <FormField
                    label="Search and Select Patient"
                    type="searchSelect"
                    name="patientId"
                    value={formData.patientId}
                    onChange={(value) => handlePatientSelect(value)}
                    error={errors.patientId}
                    required
                    searchPlaceholder="Search by name, contact, or Aadhar number..."
                    options={getFilteredPatients}
                    renderOption={(patient) => (
                      <div className="flex items-center space-x-3 p-3 hover:bg-gray-50">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <FiUser className="text-blue-600" size={14} />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{patient.name}</div>
                          <div className="text-sm text-gray-500">
                            {patient.gender} • {calculateAge(patient.dateOfBirth)} years
                          </div>
                          <div className="text-xs text-gray-400">
                            {patient.contactNumber} • {patient.village?.name}
                          </div>
                        </div>
                      </div>
                    )}
                    loading={loadingPatients}
                    icon={FiSearch}
                  />

                  {selectedPatient && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">Selected Patient</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-blue-700">Name:</span>
                          <span className="ml-2 text-blue-900">{selectedPatient.name}</span>
                        </div>
                        <div>
                          <span className="text-blue-700">Age:</span>
                          <span className="ml-2 text-blue-900">{calculateAge(selectedPatient.dateOfBirth)} years</span>
                        </div>
                        <div>
                          <span className="text-blue-700">Village:</span>
                          <span className="ml-2 text-blue-900">{selectedPatient.village?.name}</span>
                        </div>
                        <div>
                          <span className="text-blue-700">Vaccination Status:</span>
                          <span className="ml-2 text-blue-900">{selectedPatient.vaccinationStatus || 'Unknown'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                selectedPatient && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-900 mb-2">Pre-selected Patient</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-green-700">Name:</span>
                        <span className="ml-2 text-green-900">{selectedPatient.name}</span>
                      </div>
                      <div>
                        <span className="text-green-700">Age:</span>
                        <span className="ml-2 text-green-900">{calculateAge(selectedPatient.dateOfBirth)} years</span>
                      </div>
                      <div>
                        <span className="text-green-700">Village:</span>
                        <span className="ml-2 text-green-900">{selectedPatient.village?.name}</span>
                      </div>
                      <div>
                        <span className="text-green-700">Contact:</span>
                        <span className="ml-2 text-green-900">{selectedPatient.contactNumber}</span>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Vaccination Details Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Vaccination Details</h3>
              <p className="mt-1 text-sm text-gray-500">
                Specify vaccine type and dosage information
              </p>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Vaccine Type"
                  type="select"
                  name="vaccineType"
                  value={formData.vaccineType}
                  onChange={(value) => handleVaccineTypeSelect(value)}
                  error={errors.vaccineType}
                  required
                  options={[
                    { value: '', label: 'Select vaccine type' },
                    ...Object.entries(vaccineTypes).map(([key, vaccine]) => ({
                      value: key,
                      label: vaccine.name
                    }))
                  ]}
                  icon={FiShield}
                />

                <FormField
                  label="Village"
                  type="select"
                  name="villageId"
                  value={formData.villageId}
                  onChange={(value) => setFormData(prev => ({ ...prev, villageId: value }))}
                  error={errors.villageId}
                  required
                  options={[
                    { value: '', label: 'Select village' },
                    ...assignedVillages.map(village => ({
                      value: village._id,
                      label: `${village.name} - ${village.block || 'Unknown Block'}`
                    }))
                  ]}
                  icon={FiMapPin}
                />

                <FormField
                  label="Dose Number"
                  type="number"
                  name="doseNumber"
                  value={formData.doseNumber}
                  onChange={(value) => setFormData(prev => ({ ...prev, doseNumber: value }))}
                  error={errors.doseNumber}
                  required
                  min="1"
                  max={formData.totalDoses || 10}
                />

                <FormField
                  label="Total Doses"
                  type="number"
                  name="totalDoses"
                  value={formData.totalDoses}
                  onChange={(value) => setFormData(prev => ({ ...prev, totalDoses: value }))}
                  error={errors.totalDoses}
                  min="1"
                  max="10"
                  helperText={formData.vaccineType && vaccineTypes[formData.vaccineType] ? 
                    `Recommended: ${vaccineTypes[formData.vaccineType].totalDoses} doses` : ''}
                />
              </div>

              {/* Vaccine Information Display */}
              {formData.vaccineType && vaccineTypes[formData.vaccineType] && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Vaccine Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">Recommended Age Group:</span>
                      <span className="ml-2 text-blue-900">{vaccineTypes[formData.vaccineType].ageGroup}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Standard Doses:</span>
                      <span className="ml-2 text-blue-900">{vaccineTypes[formData.vaccineType].totalDoses}</span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-blue-700">Description:</span>
                      <span className="ml-2 text-blue-900">{vaccineTypes[formData.vaccineType].description}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Schedule Details Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Schedule Details</h3>
              <p className="mt-1 text-sm text-gray-500">
                Set appointment date, time, and location
              </p>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Scheduled Date"
                  type="date"
                  name="scheduledDate"
                  value={formData.scheduledDate}
                  onChange={(value) => setFormData(prev => ({ ...prev, scheduledDate: value }))}
                  error={errors.scheduledDate}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  icon={FiCalendar}
                />

                <FormField
                  label="Scheduled Time"
                  type="time"
                  name="scheduledTime"
                  value={formData.scheduledTime}
                  onChange={(value) => setFormData(prev => ({ ...prev, scheduledTime: value }))}
                  error={errors.scheduledTime}
                  icon={FiClock}
                />

                <FormField
                  label="Vaccination Location"
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
                  error={errors.location}
                  placeholder="e.g., Primary Health Center, Anganwadi"
                />

                <FormField
                  label="Priority Level"
                  type="select"
                  name="priority"
                  value={formData.priority}
                  onChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                  error={errors.priority}
                  options={[
                    { value: 'normal', label: 'Normal Priority' },
                    { value: 'high', label: 'High Priority' },
                    { value: 'urgent', label: 'Urgent Priority' }
                  ]}
                />
              </div>

              <FormField
                label="Notes & Instructions"
                type="textarea"
                name="notes"
                value={formData.notes}
                onChange={(value) => setFormData(prev => ({ ...prev, notes: value }))}
                error={errors.notes}
                placeholder="Any special instructions or notes for the vaccination..."
                rows={3}
              />
            </div>
          </div>

          {/* Vaccine Batch Information (Optional) */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Vaccine Batch Information (Optional)</h3>
              <p className="mt-1 text-sm text-gray-500">
                Record vaccine batch details for tracking
              </p>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  label="Batch Number"
                  type="text"
                  name="batchNumber"
                  value={formData.batchNumber}
                  onChange={(value) => setFormData(prev => ({ ...prev, batchNumber: value }))}
                  error={errors.batchNumber}
                  placeholder="e.g., VB2024001"
                />

                <FormField
                  label="Manufacturer"
                  type="text"
                  name="manufacturer"
                  value={formData.manufacturer}
                  onChange={(value) => setFormData(prev => ({ ...prev, manufacturer: value }))}
                  error={errors.manufacturer}
                  placeholder="e.g., Serum Institute"
                />

                <FormField
                  label="Expiry Date"
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={(value) => setFormData(prev => ({ ...prev, expiryDate: value }))}
                  error={errors.expiryDate}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/app/vaccinations')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={loading || !selectedPatient}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>{loading ? 'Scheduling...' : 'Schedule Vaccination'}</span>
            </button>
          </div>
        </form>

        {/* Help Text */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Tips for Scheduling Vaccinations</h4>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Check patient's vaccination history before scheduling</li>
            <li>Follow recommended age-appropriate vaccine schedules</li>
            <li>Ensure adequate gap between doses as per guidelines</li>
            <li>Schedule during regular health camp timings when possible</li>
            <li>Record batch information for better vaccine tracking</li>
            <li>Inform patients/caregivers about vaccination date and location</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default VaccinationSchedule;