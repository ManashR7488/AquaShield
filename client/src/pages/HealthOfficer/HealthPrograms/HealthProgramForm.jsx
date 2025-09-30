import React, { useState, useEffect } from "react";
import FormField from "../../../components/Admin/FormField";
import { getAllBlocks } from "../../../services/blockService";
import useAuthStore from "../../../store/useAuthStore";
import { getHealthOfficerDistrict } from "../../../utils/healthOfficerGuard.jsx";

/**
 * HealthProgramForm Component
 * Reusable form component for creating and editing health programs
 */
const HealthProgramForm = ({ 
  initialData = {}, 
  onSubmit, 
  loading = false, 
  error = null 
}) => {
  const { user } = useAuthStore();
  const districtId = getHealthOfficerDistrict();
  
  // Available blocks in the district
  const [availableBlocks, setAvailableBlocks] = useState([]);
  const [blocksLoading, setBlocksLoading] = useState(true);
  
  // Form state
  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    description: '',
    type: '',
    
    // Duration and Schedule
    startDate: '',
    endDate: '',
    duration: '',
    
    // Target and Scope
    targetPopulation: '',
    targetAgeGroup: '',
    targetGender: '',
    targetParticipants: 0,
    
    // Implementation
    implementationStrategy: '',
    targetBlocks: [],
    assignedStaff: [],
    
    // Budget and Resources
    budget: {
      allocated: 0,
      spent: 0,
      currency: 'INR'
    },
    resources: [],
    
    // Monitoring and Evaluation
    indicators: [],
    milestones: [],
    reportingFrequency: '',
    
    // Health Program Specific Fields
    healthFocus: '',
    interventions: [],
    eligibilityCriteria: '',
    exclusionCriteria: '',
    
    // Additional Settings
    requiresApproval: false,
    isPublic: true,
    priority: 'medium',
    status: 'planned',
    
    // Contact and Support
    coordinatorContact: '',
    supportHotline: '',
    
    ...initialData
  });
  
  // Form validation state
  const [validationErrors, setValidationErrors] = useState({});

  // Fetch available blocks in the district
  useEffect(() => {
    const fetchBlocks = async () => {
      if (!districtId) return;
      
      try {
        const response = await getAllBlocks(districtId);
        if (response.success) {
          setAvailableBlocks(response.data);
        }
      } catch (err) {
        console.error('Error fetching blocks:', err);
      } finally {
        setBlocksLoading(false);
      }
    };

    fetchBlocks();
  }, [districtId]);

  // Handle input changes
  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Handle nested object changes (e.g., budget)
  const handleNestedInputChange = (parentKey, childKey, value) => {
    setFormData(prev => ({
      ...prev,
      [parentKey]: {
        ...prev[parentKey],
        [childKey]: value
      }
    }));
  };

  // Handle array field changes
  const handleArrayFieldChange = (fieldName, value) => {
    const arrayValue = value.split('\n').filter(item => item.trim() !== '');
    setFormData(prev => ({
      ...prev,
      [fieldName]: arrayValue
    }));
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    // Required fields validation
    if (!formData.name.trim()) {
      errors.name = 'Program name is required';
    }
    
    if (!formData.type) {
      errors.type = 'Program type is required';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }
    
    if (!formData.startDate) {
      errors.startDate = 'Start date is required';
    }
    
    if (!formData.targetPopulation) {
      errors.targetPopulation = 'Target population is required';
    }
    
    if (formData.targetParticipants <= 0) {
      errors.targetParticipants = 'Target participants must be greater than 0';
    }
    
    if (formData.budget.allocated < 0) {
      errors.budgetAllocated = 'Budget allocation cannot be negative';
    }
    
    // Date validation
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      if (endDate <= startDate) {
        errors.endDate = 'End date must be after start date';
      }
    }
    
    // Target blocks validation
    if (formData.targetBlocks.length === 0) {
      errors.targetBlocks = 'At least one target block must be selected';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Ensure district ID is included
      const submitData = {
        ...formData,
        districtId,
        // Convert string arrays back to arrays
        indicators: formData.indicators,
        milestones: formData.milestones,
        resources: formData.resources,
        interventions: formData.interventions
      };
      
      onSubmit(submitData);
    }
  };

  // Program type options - canonical taxonomy
  const programTypes = [
    { value: '', label: 'Select Program Type' },
    { value: 'vaccination', label: 'Vaccination Program' },
    { value: 'health_screening', label: 'Health Screening' },
    { value: 'awareness', label: 'Awareness Campaign' },
    { value: 'water_quality', label: 'Water Quality Program' }
  ];

  // Target population options
  const targetPopulationOptions = [
    { value: '', label: 'Select Target Population' },
    { value: 'children', label: 'Children (0-18 years)' },
    { value: 'adults', label: 'Adults (19-59 years)' },
    { value: 'elderly', label: 'Elderly (60+ years)' },
    { value: 'pregnant_women', label: 'Pregnant Women' },
    { value: 'lactating_mothers', label: 'Lactating Mothers' },
    { value: 'adolescents', label: 'Adolescents (10-19 years)' },
    { value: 'infants', label: 'Infants (0-2 years)' },
    { value: 'school_children', label: 'School Children (5-18 years)' },
    { value: 'general', label: 'General Population' }
  ];

  // Priority options
  const priorityOptions = [
    { value: 'low', label: 'Low Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'high', label: 'High Priority' },
    { value: 'urgent', label: 'Urgent Priority' }
  ];

  // Reporting frequency options
  const reportingFrequencyOptions = [
    { value: '', label: 'Select Frequency' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'bi_annual', label: 'Bi-Annual' },
    { value: 'annual', label: 'Annual' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Basic Information Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Program Name"
            name="name"
            type="text"
            value={formData.name}
            onChange={(value) => handleInputChange('name', value)}
            error={validationErrors.name}
            required
            placeholder="Enter program name"
          />
          
          <FormField
            label="Program Type"
            name="type"
            type="select"
            value={formData.type}
            onChange={(value) => handleInputChange('type', value)}
            options={programTypes}
            error={validationErrors.type}
            required
          />
          
          <div className="md:col-span-2">
            <FormField
              label="Description"
              name="description"
              type="textarea"
              value={formData.description}
              onChange={(value) => handleInputChange('description', value)}
              error={validationErrors.description}
              required
              placeholder="Provide a detailed description of the health program..."
              rows={4}
            />
          </div>
        </div>
      </div>

      {/* Duration and Schedule Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Duration and Schedule</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            label="Start Date"
            name="startDate"
            type="date"
            value={formData.startDate}
            onChange={(value) => handleInputChange('startDate', value)}
            error={validationErrors.startDate}
            required
          />
          
          <FormField
            label="End Date"
            name="endDate"
            type="date"
            value={formData.endDate}
            onChange={(value) => handleInputChange('endDate', value)}
            error={validationErrors.endDate}
            helpText="Leave empty for ongoing programs"
          />
          
          <FormField
            label="Duration (Days)"
            name="duration"
            type="number"
            value={formData.duration}
            onChange={(value) => handleInputChange('duration', value)}
            placeholder="e.g., 365"
            helpText="Auto-calculated if start and end dates are provided"
          />
        </div>
      </div>

      {/* Target and Scope Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Target and Scope</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Target Population"
            name="targetPopulation"
            type="select"
            value={formData.targetPopulation}
            onChange={(value) => handleInputChange('targetPopulation', value)}
            options={targetPopulationOptions}
            error={validationErrors.targetPopulation}
            required
          />
          
          <FormField
            label="Target Participants"
            name="targetParticipants"
            type="number"
            value={formData.targetParticipants}
            onChange={(value) => handleInputChange('targetParticipants', parseInt(value) || 0)}
            error={validationErrors.targetParticipants}
            required
            placeholder="Expected number of participants"
            min="1"
          />
          
          <FormField
            label="Target Age Group"
            name="targetAgeGroup"
            type="text"
            value={formData.targetAgeGroup}
            onChange={(value) => handleInputChange('targetAgeGroup', value)}
            placeholder="e.g., 0-5 years, 18-65 years"
          />
          
          <FormField
            label="Target Gender"
            name="targetGender"
            type="select"
            value={formData.targetGender}
            onChange={(value) => handleInputChange('targetGender', value)}
            options={[
              { value: '', label: 'All Genders' },
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
              { value: 'other', label: 'Other' }
            ]}
          />
        </div>
      </div>

      {/* Implementation Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Implementation</h3>
        <div className="space-y-4">
          <FormField
            label="Implementation Strategy"
            name="implementationStrategy"
            type="textarea"
            value={formData.implementationStrategy}
            onChange={(value) => handleInputChange('implementationStrategy', value)}
            placeholder="Describe the implementation approach and methodology..."
            rows={3}
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Blocks *
            </label>
            {blocksLoading ? (
              <div className="text-gray-500">Loading blocks...</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3">
                {availableBlocks.map(block => (
                  <label key={block._id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.targetBlocks.includes(block._id)}
                      onChange={(e) => {
                        const blockId = block._id;
                        if (e.target.checked) {
                          handleInputChange('targetBlocks', [...formData.targetBlocks, blockId]);
                        } else {
                          handleInputChange('targetBlocks', formData.targetBlocks.filter(id => id !== blockId));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{block.name}</span>
                  </label>
                ))}
              </div>
            )}
            {validationErrors.targetBlocks && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.targetBlocks}</p>
            )}
          </div>
        </div>
      </div>

      {/* Budget and Resources Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Budget and Resources</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Allocated Budget (₹)"
            name="budgetAllocated"
            type="number"
            value={formData.budget.allocated}
            onChange={(value) => handleNestedInputChange('budget', 'allocated', parseFloat(value) || 0)}
            error={validationErrors.budgetAllocated}
            placeholder="0"
            min="0"
            step="0.01"
          />
          
          <FormField
            label="Spent Budget (₹)"
            name="budgetSpent"
            type="number"
            value={formData.budget.spent}
            onChange={(value) => handleNestedInputChange('budget', 'spent', parseFloat(value) || 0)}
            placeholder="0"
            min="0"
            step="0.01"
            helpText="Current spending amount"
          />
          
          <div className="md:col-span-2">
            <FormField
              label="Required Resources"
              name="resources"
              type="textarea"
              value={formData.resources.join('\n')}
              onChange={(value) => handleArrayFieldChange('resources', value)}
              placeholder="List required resources (one per line)&#10;e.g., Vaccines&#10;Medical Equipment&#10;Staff Training Materials"
              rows={4}
              helpText="Enter each resource on a new line"
            />
          </div>
        </div>
      </div>

      {/* Health Program Specifics Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Health Program Specifics</h3>
        <div className="space-y-4">
          <FormField
            label="Health Focus Area"
            name="healthFocus"
            type="text"
            value={formData.healthFocus}
            onChange={(value) => handleInputChange('healthFocus', value)}
            placeholder="e.g., Maternal mortality reduction, Child malnutrition prevention"
          />
          
          <FormField
            label="Key Interventions"
            name="interventions"
            type="textarea"
            value={formData.interventions.join('\n')}
            onChange={(value) => handleArrayFieldChange('interventions', value)}
            placeholder="List key health interventions (one per line)&#10;e.g., Immunization campaigns&#10;Nutritional supplementation&#10;Health education sessions"
            rows={4}
            helpText="Enter each intervention on a new line"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Eligibility Criteria"
              name="eligibilityCriteria"
              type="textarea"
              value={formData.eligibilityCriteria}
              onChange={(value) => handleInputChange('eligibilityCriteria', value)}
              placeholder="Define who is eligible for this program..."
              rows={3}
            />
            
            <FormField
              label="Exclusion Criteria"
              name="exclusionCriteria"
              type="textarea"
              value={formData.exclusionCriteria}
              onChange={(value) => handleInputChange('exclusionCriteria', value)}
              placeholder="Define who should be excluded from this program..."
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Monitoring and Evaluation Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Monitoring and Evaluation</h3>
        <div className="space-y-4">
          <FormField
            label="Key Performance Indicators"
            name="indicators"
            type="textarea"
            value={formData.indicators.join('\n')}
            onChange={(value) => handleArrayFieldChange('indicators', value)}
            placeholder="List key performance indicators (one per line)&#10;e.g., Number of children immunized&#10;Percentage of target population reached&#10;Reduction in malnutrition rates"
            rows={4}
            helpText="Enter each indicator on a new line"
          />
          
          <FormField
            label="Project Milestones"
            name="milestones"
            type="textarea"
            value={formData.milestones.join('\n')}
            onChange={(value) => handleArrayFieldChange('milestones', value)}
            placeholder="List project milestones (one per line)&#10;e.g., Complete staff training&#10;Launch awareness campaign&#10;Achieve 50% target coverage"
            rows={4}
            helpText="Enter each milestone on a new line"
          />
          
          <FormField
            label="Reporting Frequency"
            name="reportingFrequency"
            type="select"
            value={formData.reportingFrequency}
            onChange={(value) => handleInputChange('reportingFrequency', value)}
            options={reportingFrequencyOptions}
          />
        </div>
      </div>

      {/* Program Settings Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Program Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Priority Level"
            name="priority"
            type="select"
            value={formData.priority}
            onChange={(value) => handleInputChange('priority', value)}
            options={priorityOptions}
          />
          
          <FormField
            label="Program Status"
            name="status"
            type="select"
            value={formData.status}
            onChange={(value) => handleInputChange('status', value)}
            options={[
              { value: 'planned', label: 'Planned' },
              { value: 'active', label: 'Active' },
              { value: 'paused', label: 'Paused' },
              { value: 'completed', label: 'Completed' }
            ]}
          />
          
          <div className="md:col-span-2 space-y-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.requiresApproval}
                onChange={(e) => handleInputChange('requiresApproval', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Requires approval before implementation</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Make program visible to public</span>
            </label>
          </div>
        </div>
      </div>

      {/* Contact Information Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Program Coordinator Contact"
            name="coordinatorContact"
            type="text"
            value={formData.coordinatorContact}
            onChange={(value) => handleInputChange('coordinatorContact', value)}
            placeholder="Phone number or email"
          />
          
          <FormField
            label="Support Hotline"
            name="supportHotline"
            type="text"
            value={formData.supportHotline}
            onChange={(value) => handleInputChange('supportHotline', value)}
            placeholder="24/7 support number"
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
          <span>{loading ? 'Saving...' : (initialData.name ? 'Update Program' : 'Create Program')}</span>
        </button>
      </div>
    </form>
  );
};

export default HealthProgramForm;