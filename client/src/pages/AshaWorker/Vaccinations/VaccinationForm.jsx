import React, { useState, useEffect } from "react";
import { FiUser, FiShield, FiCalendar, FiMapPin, FiInfo } from "react-icons/fi";
import FormField from "../../../components/Admin/FormField";

/**
 * VaccinationForm Component
 * Reusable form component for vaccination scheduling and editing
 */
const VaccinationForm = ({
  initialData = {},
  onSubmit,
  onCancel,
  loading = false,
  errors = {},
  patients = [],
  villages = [],
  mode = 'create', // 'create' or 'edit'
  selectedPatient = null,
  onPatientSelect = null,
  loadingPatients = false
}) => {
  // Form state
  const [formData, setFormData] = useState({
    patientId: '',
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
    priority: 'normal',
    ...initialData
  });

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

  // Update form data when initial data changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, ...initialData }));
  }, [initialData]);

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

  // Handle input changes
  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle patient selection
  const handlePatientSelect = (patientId) => {
    handleInputChange('patientId', patientId);
    if (onPatientSelect) {
      onPatientSelect(patientId);
    }
    
    // Auto-select patient's village if available
    const patient = patients.find(p => p._id === patientId);
    if (patient && patient.villageId) {
      handleInputChange('villageId', patient.villageId);
    }
  };

  // Handle vaccine type selection
  const handleVaccineTypeSelect = (vaccineType) => {
    const vaccineInfo = vaccineTypes[vaccineType];
    setFormData(prev => ({
      ...prev,
      vaccineType,
      totalDoses: vaccineInfo?.totalDoses || prev.totalDoses,
      doseNumber: prev.doseNumber || 1
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      scheduledDate: formData.scheduledDate && formData.scheduledTime ? 
        new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toISOString() :
        formData.scheduledDate ? new Date(formData.scheduledDate).toISOString() : '',
      doseNumber: parseInt(formData.doseNumber) || 1,
      totalDoses: parseInt(formData.totalDoses) || undefined,
      expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : undefined
    };

    onSubmit(submitData);
  };

  // Get filtered patients for search
  const getFilteredPatients = (searchTerm) => {
    if (!searchTerm && patients.length > 20) {
      return patients.slice(0, 20); // Show first 20 by default for large lists
    }
    
    if (!searchTerm) return patients;
    
    return patients
      .filter(patient =>
        patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.contactNumber?.includes(searchTerm) ||
        patient.aadharNumber?.includes(searchTerm)
      )
      .slice(0, 20); // Limit to 20 results
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Patient Selection Section */}
      {mode === 'create' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Patient Information</h3>
            <p className="mt-1 text-sm text-gray-500">
              Select the patient for vaccination
            </p>
          </div>
          
          <div className="p-6">
            <FormField
              label="Search and Select Patient"
              type="searchSelect"
              name="patientId"
              value={formData.patientId}
              onChange={handlePatientSelect}
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
              icon={FiUser}
            />

            {/* Selected Patient Display */}
            {selectedPatient && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
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
                    <span className="text-blue-700">Contact:</span>
                    <span className="ml-2 text-blue-900">{selectedPatient.contactNumber}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
              onChange={handleVaccineTypeSelect}
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
              onChange={(value) => handleInputChange('villageId', value)}
              error={errors.villageId}
              required
              options={[
                { value: '', label: 'Select village' },
                ...villages.map(village => ({
                  value: village._id || village.id,
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
              onChange={(value) => handleInputChange('doseNumber', value)}
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
              onChange={(value) => handleInputChange('totalDoses', value)}
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
              <div className="flex items-center space-x-2 mb-2">
                <FiInfo className="text-blue-600" size={16} />
                <h4 className="font-medium text-blue-900">Vaccine Information</h4>
              </div>
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
              onChange={(value) => handleInputChange('scheduledDate', value)}
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
              onChange={(value) => handleInputChange('scheduledTime', value)}
              error={errors.scheduledTime}
            />

            <FormField
              label="Vaccination Location"
              type="text"
              name="location"
              value={formData.location}
              onChange={(value) => handleInputChange('location', value)}
              error={errors.location}
              placeholder="e.g., Primary Health Center, Anganwadi"
            />

            <FormField
              label="Priority Level"
              type="select"
              name="priority"
              value={formData.priority}
              onChange={(value) => handleInputChange('priority', value)}
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
            onChange={(value) => handleInputChange('notes', value)}
            error={errors.notes}
            placeholder="Any special instructions or notes for the vaccination..."
            rows={3}
          />
        </div>
      </div>

      {/* Vaccine Batch Information (Optional) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Vaccine Batch Information</h3>
          <p className="mt-1 text-sm text-gray-500">
            Optional: Record vaccine batch details for tracking
          </p>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              label="Batch Number"
              type="text"
              name="batchNumber"
              value={formData.batchNumber}
              onChange={(value) => handleInputChange('batchNumber', value)}
              error={errors.batchNumber}
              placeholder="e.g., VB2024001"
            />

            <FormField
              label="Manufacturer"
              type="text"
              name="manufacturer"
              value={formData.manufacturer}
              onChange={(value) => handleInputChange('manufacturer', value)}
              error={errors.manufacturer}
              placeholder="e.g., Serum Institute"
            />

            <FormField
              label="Expiry Date"
              type="date"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={(value) => handleInputChange('expiryDate', value)}
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
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        >
          Cancel
        </button>
        
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {loading && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          <span>
            {loading ? 
              (mode === 'edit' ? 'Updating...' : 'Scheduling...') : 
              (mode === 'edit' ? 'Update Vaccination' : 'Schedule Vaccination')
            }
          </span>
        </button>
      </div>

      {/* Validation Guidelines */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-yellow-900 mb-2">Vaccination Guidelines</h4>
        <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
          <li>Verify patient's age matches vaccine age group recommendations</li>
          <li>Check vaccination history to ensure appropriate dose sequence</li>
          <li>Maintain proper intervals between vaccine doses</li>
          <li>Record accurate batch information for tracking and safety</li>
          <li>Schedule during appropriate times for patient convenience</li>
          <li>Ensure vaccine storage and handling requirements are met</li>
        </ul>
      </div>
    </form>
  );
};

export default VaccinationForm;