import React from "react";
import PropTypes from "prop-types";
import { 
  FiUser, 
  FiCalendar, 
  FiPhone, 
  FiMapPin, 
  FiFileText,
  FiHeart,
  FiShield,
  FiHome,
  FiMail,
  FiCreditCard,
  FiUsers,
  FiActivity
} from "react-icons/fi";
import FormField from "../../../components/Admin/FormField";

/**
 * PatientForm Component
 * Reusable form for creating and editing patient records
 */
const PatientForm = ({
  formData,
  onChange,
  onSubmit,
  loading = false,
  isEdit = false,
  assignedVillages = [],
  errors = {}
}) => {

  // Handle form field changes
  const handleFieldChange = (name, value) => {
    onChange({
      ...formData,
      [name]: value
    });
  };

  // Handle nested field changes (e.g., address, emergencyContact)
  const handleNestedChange = (parent, field, value) => {
    onChange({
      ...formData,
      [parent]: {
        ...formData[parent],
        [field]: value
      }
    });
  };

  // Add/remove items from arrays
  const handleArrayChange = (arrayName, index, value, action = 'update') => {
    const currentArray = formData[arrayName] || [];
    let newArray;

    switch (action) {
      case 'add':
        newArray = [...currentArray, value];
        break;
      case 'remove':
        newArray = currentArray.filter((_, i) => i !== index);
        break;
      case 'update':
      default:
        newArray = currentArray.map((item, i) => i === index ? value : item);
        break;
    }

    onChange({
      ...formData,
      [arrayName]: newArray
    });
  };

  // Calculate age from date of birth
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

  // Get maximum date for date of birth (today)
  const getMaxDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {/* Basic Information Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
          <p className="mt-1 text-sm text-gray-500">
            Essential patient details and identification
          </p>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <FormField
              label="Full Name"
              type="text"
              name="name"
              value={formData.name || ''}
              onChange={(value) => handleFieldChange('name', value)}
              error={errors.name}
              required
              placeholder="Enter patient's full name"
              icon={FiUser}
            />

            {/* Date of Birth */}
            <FormField
              label="Date of Birth"
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth || ''}
              onChange={(value) => handleFieldChange('dateOfBirth', value)}
              error={errors.dateOfBirth}
              required
              max={getMaxDate()}
              icon={FiCalendar}
              helperText={formData.dateOfBirth ? `Age: ${calculateAge(formData.dateOfBirth)} years` : ''}
            />

            {/* Gender */}
            <FormField
              label="Gender"
              type="select"
              name="gender"
              value={formData.gender || ''}
              onChange={(value) => handleFieldChange('gender', value)}
              error={errors.gender}
              required
              options={[
                { value: '', label: 'Select gender' },
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' }
              ]}
              icon={FiUser}
            />

            {/* Village Selection */}
            <FormField
              label="Village"
              type="select"
              name="villageId"
              value={formData.villageId || ''}
              onChange={(value) => handleFieldChange('villageId', value)}
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Number */}
            <FormField
              label="Contact Number"
              type="tel"
              name="contactNumber"
              value={formData.contactNumber || ''}
              onChange={(value) => handleFieldChange('contactNumber', value)}
              error={errors.contactNumber}
              required
              placeholder="Enter 10-digit mobile number"
              pattern="[0-9]{10}"
              maxLength="10"
              icon={FiPhone}
            />

            {/* Aadhar Number */}
            <FormField
              label="Aadhar Number"
              type="text"
              name="aadharNumber"
              value={formData.aadharNumber || ''}
              onChange={(value) => handleFieldChange('aadharNumber', value)}
              error={errors.aadharNumber}
              placeholder="Enter 12-digit Aadhar number (optional)"
              pattern="[0-9]{12}"
              maxLength="12"
              icon={FiCreditCard}
            />
          </div>

          {/* Email (Optional) */}
          <FormField
            label="Email Address (Optional)"
            type="email"
            name="email"
            value={formData.email || ''}
            onChange={(value) => handleFieldChange('email', value)}
            error={errors.email}
            placeholder="Enter email address"
            icon={FiMail}
          />
        </div>
      </div>

      {/* Address Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Address Information</h3>
          <p className="mt-1 text-sm text-gray-500">
            Residential address and location details
          </p>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="House Number/Name"
              type="text"
              name="houseNumber"
              value={formData.address?.houseNumber || ''}
              onChange={(value) => handleNestedChange('address', 'houseNumber', value)}
              error={errors['address.houseNumber']}
              placeholder="e.g., 123, Krishna Bhavan"
              icon={FiHome}
            />

            <FormField
              label="Area/Locality"
              type="text"
              name="area"
              value={formData.address?.area || ''}
              onChange={(value) => handleNestedChange('address', 'area', value)}
              error={errors['address.area']}
              required
              placeholder="e.g., Main Road, Gandhi Nagar"
              icon={FiMapPin}
            />

            <FormField
              label="Landmark"
              type="text"
              name="landmark"
              value={formData.address?.landmark || ''}
              onChange={(value) => handleNestedChange('address', 'landmark', value)}
              error={errors['address.landmark']}
              placeholder="e.g., Near Primary School"
            />

            <FormField
              label="PIN Code"
              type="text"
              name="pincode"
              value={formData.address?.pincode || ''}
              onChange={(value) => handleNestedChange('address', 'pincode', value)}
              error={errors['address.pincode']}
              placeholder="e.g., 123456"
              pattern="[0-9]{6}"
              maxLength="6"
            />
          </div>
        </div>
      </div>

      {/* Health Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Health Information</h3>
          <p className="mt-1 text-sm text-gray-500">
            Medical history and current health status
          </p>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Blood Group"
              type="select"
              name="bloodGroup"
              value={formData.bloodGroup || ''}
              onChange={(value) => handleFieldChange('bloodGroup', value)}
              error={errors.bloodGroup}
              options={[
                { value: '', label: 'Select blood group' },
                { value: 'A+', label: 'A+' },
                { value: 'A-', label: 'A-' },
                { value: 'B+', label: 'B+' },
                { value: 'B-', label: 'B-' },
                { value: 'AB+', label: 'AB+' },
                { value: 'AB-', label: 'AB-' },
                { value: 'O+', label: 'O+' },
                { value: 'O-', label: 'O-' },
                { value: 'unknown', label: 'Unknown' }
              ]}
              icon={FiHeart}
            />

            <FormField
              label="Height (cm)"
              type="number"
              name="height"
              value={formData.height || ''}
              onChange={(value) => handleFieldChange('height', parseFloat(value) || '')}
              error={errors.height}
              placeholder="e.g., 165"
              min="50"
              max="250"
              step="0.1"
              icon={FiActivity}
            />

            <FormField
              label="Weight (kg)"
              type="number"
              name="weight"
              value={formData.weight || ''}
              onChange={(value) => handleFieldChange('weight', parseFloat(value) || '')}
              error={errors.weight}
              placeholder="e.g., 60"
              min="2"
              max="300"
              step="0.1"
              icon={FiActivity}
            />

            <FormField
              label="Vaccination Status"
              type="select"
              name="vaccinationStatus"
              value={formData.vaccinationStatus || 'unknown'}
              onChange={(value) => handleFieldChange('vaccinationStatus', value)}
              error={errors.vaccinationStatus}
              options={[
                { value: 'unknown', label: 'Unknown' },
                { value: 'up_to_date', label: 'Up to Date' },
                { value: 'pending', label: 'Pending' },
                { value: 'overdue', label: 'Overdue' },
                { value: 'partial', label: 'Partial' }
              ]}
              icon={FiShield}
            />
          </div>

          {/* Special Conditions */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="isPregnant"
                checked={formData.isPregnant || false}
                onChange={(e) => handleFieldChange('isPregnant', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={formData.gender !== 'female'}
              />
              <label htmlFor="isPregnant" className="text-sm font-medium text-gray-700">
                Pregnant (only applicable for female patients)
              </label>
            </div>

            {formData.isPregnant && (
              <FormField
                label="Expected Due Date"
                type="date"
                name="expectedDueDate"
                value={formData.expectedDueDate || ''}
                onChange={(value) => handleFieldChange('expectedDueDate', value)}
                error={errors.expectedDueDate}
                min={new Date().toISOString().split('T')[0]}
                icon={FiCalendar}
              />
            )}

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="hasDisability"
                checked={formData.hasDisability || false}
                onChange={(e) => handleFieldChange('hasDisability', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="hasDisability" className="text-sm font-medium text-gray-700">
                Has disability or special needs
              </label>
            </div>

            {formData.hasDisability && (
              <FormField
                label="Disability Details"
                type="textarea"
                name="disabilityDetails"
                value={formData.disabilityDetails || ''}
                onChange={(value) => handleFieldChange('disabilityDetails', value)}
                error={errors.disabilityDetails}
                placeholder="Describe the disability or special needs"
                rows={3}
              />
            )}
          </div>

          {/* Medical History */}
          <FormField
            label="Known Medical Conditions"
            type="textarea"
            name="medicalHistory"
            value={formData.medicalHistory || ''}
            onChange={(value) => handleFieldChange('medicalHistory', value)}
            error={errors.medicalHistory}
            placeholder="List any known medical conditions, chronic diseases, allergies, etc."
            rows={3}
            icon={FiFileText}
          />

          <FormField
            label="Current Medications"
            type="textarea"
            name="currentMedications"
            value={formData.currentMedications || ''}
            onChange={(value) => handleFieldChange('currentMedications', value)}
            error={errors.currentMedications}
            placeholder="List current medications and dosages"
            rows={3}
          />
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Emergency Contact</h3>
          <p className="mt-1 text-sm text-gray-500">
            Contact person in case of emergency
          </p>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Emergency Contact Name"
              type="text"
              name="emergencyName"
              value={formData.emergencyContact?.name || ''}
              onChange={(value) => handleNestedChange('emergencyContact', 'name', value)}
              error={errors['emergencyContact.name']}
              placeholder="Enter contact person's name"
              icon={FiUser}
            />

            <FormField
              label="Relationship"
              type="select"
              name="emergencyRelationship"
              value={formData.emergencyContact?.relationship || ''}
              onChange={(value) => handleNestedChange('emergencyContact', 'relationship', value)}
              error={errors['emergencyContact.relationship']}
              options={[
                { value: '', label: 'Select relationship' },
                { value: 'father', label: 'Father' },
                { value: 'mother', label: 'Mother' },
                { value: 'spouse', label: 'Spouse' },
                { value: 'son', label: 'Son' },
                { value: 'daughter', label: 'Daughter' },
                { value: 'sibling', label: 'Sibling' },
                { value: 'friend', label: 'Friend' },
                { value: 'neighbor', label: 'Neighbor' },
                { value: 'other', label: 'Other' }
              ]}
              icon={FiUsers}
            />

            <FormField
              label="Emergency Contact Number"
              type="tel"
              name="emergencyContact"
              value={formData.emergencyContact?.contactNumber || ''}
              onChange={(value) => handleNestedChange('emergencyContact', 'contactNumber', value)}
              error={errors['emergencyContact.contactNumber']}
              placeholder="Enter 10-digit mobile number"
              pattern="[0-9]{10}"
              maxLength="10"
              icon={FiPhone}
            />

            <FormField
              label="Alternative Contact (Optional)"
              type="tel"
              name="emergencyAlternativeContact"
              value={formData.emergencyContact?.alternativeContact || ''}
              onChange={(value) => handleNestedChange('emergencyContact', 'alternativeContact', value)}
              error={errors['emergencyContact.alternativeContact']}
              placeholder="Alternative contact number"
              pattern="[0-9]{10}"
              maxLength="10"
              icon={FiPhone}
            />
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Additional Information</h3>
          <p className="mt-1 text-sm text-gray-500">
            Additional notes and observations
          </p>
        </div>
        
        <div className="p-6 space-y-6">
          <FormField
            label="Notes & Observations"
            type="textarea"
            name="notes"
            value={formData.notes || ''}
            onChange={(value) => handleFieldChange('notes', value)}
            error={errors.notes}
            placeholder="Any additional notes, observations, or relevant information about the patient"
            rows={4}
            icon={FiFileText}
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => window.history.back()}
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
          {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          <span>{loading ? 'Saving...' : isEdit ? 'Update Patient' : 'Add Patient'}</span>
        </button>
      </div>
    </form>
  );
};

PatientForm.propTypes = {
  formData: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  isEdit: PropTypes.bool,
  assignedVillages: PropTypes.array,
  errors: PropTypes.object
};

export default PatientForm;