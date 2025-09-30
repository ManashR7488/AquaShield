import React, { useState, useEffect } from 'react';
import FormField from '../../../components/Admin/FormField';
import { getUsersByRole } from '../../../services/userService';

/**
 * DistrictForm Component
 * Reusable form component for creating and editing districts
 */
const DistrictForm = ({
  initialData = null,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    state: '',
    code: '',
    districtOfficer: '',
    
    // Demographics
    demographics: {
      totalPopulation: '',
      ruralPopulation: '',
      urbanPopulation: '',
      ruralPercentage: '',
      urbanPercentage: '',
      literacyRate: '',
      sexRatio: '',
      childSexRatio: '',
      populationDensity: ''
    },
    
    // Health Infrastructure
    healthInfrastructure: {
      primaryHealthCenters: '',
      communityHealthCenters: '',
      subCenters: '',
      districtHospitals: '',
      privateHospitals: '',
      nursingHomes: '',
      diagnosticCenters: '',
      pharmacies: '',
      bloodBanks: '',
      ambulances: ''
    },
    
    // Block Registration Settings
    blockRegistration: {
      allowSelfRegistration: false,
      requireApproval: true,
      maxBlocksPerDistrict: '',
      blockNamingPattern: 'district_block',
      autoGenerateTokens: false
    },
    
    // Administrative Settings
    status: 'active',
    description: '',
    establishedDate: '',
    headquarters: ''
  });
  
  const [errors, setErrors] = useState({});
  const [healthOfficials, setHealthOfficials] = useState([]);
  const [loadingOfficials, setLoadingOfficials] = useState(true);

  // Initialize form with existing data if editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        state: initialData.state || '',
        code: initialData.code || '',
        districtOfficer: initialData.districtOfficer?._id || '',
        demographics: {
          totalPopulation: initialData.demographics?.totalPopulation || '',
          ruralPopulation: initialData.demographics?.ruralPopulation || '',
          urbanPopulation: initialData.demographics?.urbanPopulation || '',
          ruralPercentage: initialData.demographics?.ruralPercentage || '',
          urbanPercentage: initialData.demographics?.urbanPercentage || '',
          literacyRate: initialData.demographics?.literacyRate || '',
          sexRatio: initialData.demographics?.sexRatio || '',
          childSexRatio: initialData.demographics?.childSexRatio || '',
          populationDensity: initialData.demographics?.populationDensity || ''
        },
        healthInfrastructure: {
          primaryHealthCenters: initialData.healthInfrastructure?.primaryHealthCenters || '',
          communityHealthCenters: initialData.healthInfrastructure?.communityHealthCenters || '',
          subCenters: initialData.healthInfrastructure?.subCenters || '',
          districtHospitals: initialData.healthInfrastructure?.districtHospitals || '',
          privateHospitals: initialData.healthInfrastructure?.privateHospitals || '',
          nursingHomes: initialData.healthInfrastructure?.nursingHomes || '',
          diagnosticCenters: initialData.healthInfrastructure?.diagnosticCenters || '',
          pharmacies: initialData.healthInfrastructure?.pharmacies || '',
          bloodBanks: initialData.healthInfrastructure?.bloodBanks || '',
          ambulances: initialData.healthInfrastructure?.ambulances || ''
        },
        blockRegistration: {
          allowSelfRegistration: initialData.blockRegistration?.allowSelfRegistration || false,
          requireApproval: initialData.blockRegistration?.requireApproval !== false,
          maxBlocksPerDistrict: initialData.blockRegistration?.maxBlocksPerDistrict || '',
          blockNamingPattern: initialData.blockRegistration?.blockNamingPattern || 'district_block',
          autoGenerateTokens: initialData.blockRegistration?.autoGenerateTokens || false
        },
        status: initialData.status || 'active',
        description: initialData.description || '',
        establishedDate: initialData.establishedDate ? initialData.establishedDate.split('T')[0] : '',
        headquarters: initialData.headquarters || ''
      });
    }
  }, [initialData]);

  // Fetch health officials for district officer selection
  useEffect(() => {
    const fetchHealthOfficials = async () => {
      try {
        setLoadingOfficials(true);
        const response = await getUsersByRole('health_official', { limit: 100 });
        if (response.success) {
          setHealthOfficials(response.data);
        }
      } catch (error) {
        console.error('Error fetching health officials:', error);
      } finally {
        setLoadingOfficials(false);
      }
    };

    fetchHealthOfficials();
  }, []);

  const handleInputChange = (field, value, section = null) => {
    setFormData(prev => {
      if (section) {
        return {
          ...prev,
          [section]: {
            ...prev[section],
            [field]: value
          }
        };
      }
      return {
        ...prev,
        [field]: value
      };
    });

    // Clear error when user starts typing
    if (errors[section ? `${section}.${field}` : field]) {
      setErrors(prev => ({
        ...prev,
        [section ? `${section}.${field}` : field]: ''
      }));
    }
  };

  // Auto-calculate rural/urban percentages and populations
  useEffect(() => {
    const { totalPopulation, ruralPopulation, urbanPopulation } = formData.demographics;
    
    if (totalPopulation && ruralPopulation && !urbanPopulation) {
      const urban = totalPopulation - ruralPopulation;
      const ruralPercent = ((ruralPopulation / totalPopulation) * 100).toFixed(1);
      const urbanPercent = ((urban / totalPopulation) * 100).toFixed(1);
      
      setFormData(prev => ({
        ...prev,
        demographics: {
          ...prev.demographics,
          urbanPopulation: urban,
          ruralPercentage: ruralPercent,
          urbanPercentage: urbanPercent
        }
      }));
    } else if (totalPopulation && urbanPopulation && !ruralPopulation) {
      const rural = totalPopulation - urbanPopulation;
      const ruralPercent = ((rural / totalPopulation) * 100).toFixed(1);
      const urbanPercent = ((urbanPopulation / totalPopulation) * 100).toFixed(1);
      
      setFormData(prev => ({
        ...prev,
        demographics: {
          ...prev.demographics,
          ruralPopulation: rural,
          ruralPercentage: ruralPercent,
          urbanPercentage: urbanPercent
        }
      }));
    }
  }, [formData.demographics.totalPopulation, formData.demographics.ruralPopulation, formData.demographics.urbanPopulation]);

  const validateForm = () => {
    const newErrors = {};

    // Required field validation
    if (!formData.name.trim()) newErrors.name = 'District name is required';
    if (!formData.state) newErrors.state = 'State is required';
    if (!formData.code.trim()) newErrors.code = 'District code is required';

    // Code format validation
    if (formData.code && !/^[A-Z0-9]{2,10}$/.test(formData.code)) {
      newErrors.code = 'District code should be 2-10 uppercase letters/numbers';
    }

    // Population validation
    if (formData.demographics.totalPopulation && formData.demographics.totalPopulation < 0) {
      newErrors['demographics.totalPopulation'] = 'Population cannot be negative';
    }

    // Infrastructure count validation
    Object.entries(formData.healthInfrastructure).forEach(([key, value]) => {
      if (value && (isNaN(value) || parseInt(value) < 0)) {
        newErrors[`healthInfrastructure.${key}`] = 'Must be a valid number';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Clean up data before submission
      const cleanData = {
        ...formData,
        demographics: {
          ...formData.demographics,
          totalPopulation: parseInt(formData.demographics.totalPopulation) || null,
          ruralPopulation: parseInt(formData.demographics.ruralPopulation) || null,
          urbanPopulation: parseInt(formData.demographics.urbanPopulation) || null,
          ruralPercentage: parseFloat(formData.demographics.ruralPercentage) || null,
          urbanPercentage: parseFloat(formData.demographics.urbanPercentage) || null,
          literacyRate: parseFloat(formData.demographics.literacyRate) || null,
          sexRatio: parseInt(formData.demographics.sexRatio) || null,
          childSexRatio: parseInt(formData.demographics.childSexRatio) || null,
          populationDensity: parseFloat(formData.demographics.populationDensity) || null
        },
        healthInfrastructure: Object.entries(formData.healthInfrastructure).reduce((acc, [key, value]) => ({
          ...acc,
          [key]: parseInt(value) || 0
        }), {}),
        blockRegistration: {
          ...formData.blockRegistration,
          maxBlocksPerDistrict: parseInt(formData.blockRegistration.maxBlocksPerDistrict) || null
        }
      };

      onSubmit(cleanData);
    }
  };

  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
  ];

  const healthOfficialOptions = healthOfficials.map(official => ({
    value: official._id,
    label: `${official.name} (${official.email})`
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="District Name"
            name="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            error={errors.name}
            required
            placeholder="Enter district name"
          />
          
          <FormField
            label="State"
            name="state"
            type="select"
            value={formData.state}
            onChange={(e) => handleInputChange('state', e.target.value)}
            options={indianStates}
            error={errors.state}
            required
            placeholder="Select state"
          />
          
          <FormField
            label="District Code"
            name="code"
            value={formData.code}
            onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
            error={errors.code}
            required
            placeholder="e.g., DL01"
            maxLength={10}
            helpText="2-10 uppercase letters/numbers"
          />
          
          <FormField
            label="District Officer"
            name="districtOfficer"
            type="select"
            value={formData.districtOfficer}
            onChange={(e) => handleInputChange('districtOfficer', e.target.value)}
            options={healthOfficialOptions}
            error={errors.districtOfficer}
            placeholder={loadingOfficials ? "Loading officials..." : "Select district officer"}
            disabled={loadingOfficials}
          />
          
          <FormField
            label="Headquarters"
            name="headquarters"
            value={formData.headquarters}
            onChange={(e) => handleInputChange('headquarters', e.target.value)}
            placeholder="District headquarters city"
          />
          
          <FormField
            label="Established Date"
            name="establishedDate"
            type="date"
            value={formData.establishedDate}
            onChange={(e) => handleInputChange('establishedDate', e.target.value)}
          />
        </div>
        
        <FormField
          label="Description"
          name="description"
          type="textarea"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Brief description about the district"
          rows={3}
          className="mt-4"
        />
      </div>

      {/* Demographics Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Demographics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            label="Total Population"
            name="totalPopulation"
            type="number"
            value={formData.demographics.totalPopulation}
            onChange={(e) => handleInputChange('totalPopulation', e.target.value, 'demographics')}
            error={errors['demographics.totalPopulation']}
            min="0"
            placeholder="e.g., 1500000"
          />
          
          <FormField
            label="Rural Population"
            name="ruralPopulation"
            type="number"
            value={formData.demographics.ruralPopulation}
            onChange={(e) => handleInputChange('ruralPopulation', e.target.value, 'demographics')}
            min="0"
            placeholder="e.g., 900000"
          />
          
          <FormField
            label="Urban Population"
            name="urbanPopulation"
            type="number"
            value={formData.demographics.urbanPopulation}
            onChange={(e) => handleInputChange('urbanPopulation', e.target.value, 'demographics')}
            min="0"
            placeholder="e.g., 600000"
          />
          
          <FormField
            label="Literacy Rate (%)"
            name="literacyRate"
            type="number"
            value={formData.demographics.literacyRate}
            onChange={(e) => handleInputChange('literacyRate', e.target.value, 'demographics')}
            min="0"
            max="100"
            step="0.1"
            placeholder="e.g., 74.5"
          />
          
          <FormField
            label="Sex Ratio"
            name="sexRatio"
            type="number"
            value={formData.demographics.sexRatio}
            onChange={(e) => handleInputChange('sexRatio', e.target.value, 'demographics')}
            min="0"
            placeholder="e.g., 943"
            helpText="Females per 1000 males"
          />
          
          <FormField
            label="Population Density (per km²)"
            name="populationDensity"
            type="number"
            value={formData.demographics.populationDensity}
            onChange={(e) => handleInputChange('populationDensity', e.target.value, 'demographics')}
            min="0"
            step="0.1"
            placeholder="e.g., 500.5"
          />
        </div>
      </div>

      {/* Health Infrastructure Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Health Infrastructure</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FormField
            label="Primary Health Centers"
            name="primaryHealthCenters"
            type="number"
            value={formData.healthInfrastructure.primaryHealthCenters}
            onChange={(e) => handleInputChange('primaryHealthCenters', e.target.value, 'healthInfrastructure')}
            error={errors['healthInfrastructure.primaryHealthCenters']}
            min="0"
            placeholder="0"
          />
          
          <FormField
            label="Community Health Centers"
            name="communityHealthCenters"
            type="number"
            value={formData.healthInfrastructure.communityHealthCenters}
            onChange={(e) => handleInputChange('communityHealthCenters', e.target.value, 'healthInfrastructure')}
            min="0"
            placeholder="0"
          />
          
          <FormField
            label="Sub Centers"
            name="subCenters"
            type="number"
            value={formData.healthInfrastructure.subCenters}
            onChange={(e) => handleInputChange('subCenters', e.target.value, 'healthInfrastructure')}
            min="0"
            placeholder="0"
          />
          
          <FormField
            label="District Hospitals"
            name="districtHospitals"
            type="number"
            value={formData.healthInfrastructure.districtHospitals}
            onChange={(e) => handleInputChange('districtHospitals', e.target.value, 'healthInfrastructure')}
            min="0"
            placeholder="0"
          />
          
          <FormField
            label="Private Hospitals"
            name="privateHospitals"
            type="number"
            value={formData.healthInfrastructure.privateHospitals}
            onChange={(e) => handleInputChange('privateHospitals', e.target.value, 'healthInfrastructure')}
            min="0"
            placeholder="0"
          />
          
          <FormField
            label="Nursing Homes"
            name="nursingHomes"
            type="number"
            value={formData.healthInfrastructure.nursingHomes}
            onChange={(e) => handleInputChange('nursingHomes', e.target.value, 'healthInfrastructure')}
            min="0"
            placeholder="0"
          />
          
          <FormField
            label="Diagnostic Centers"
            name="diagnosticCenters"
            type="number"
            value={formData.healthInfrastructure.diagnosticCenters}
            onChange={(e) => handleInputChange('diagnosticCenters', e.target.value, 'healthInfrastructure')}
            min="0"
            placeholder="0"
          />
          
          <FormField
            label="Pharmacies"
            name="pharmacies"
            type="number"
            value={formData.healthInfrastructure.pharmacies}
            onChange={(e) => handleInputChange('pharmacies', e.target.value, 'healthInfrastructure')}
            min="0"
            placeholder="0"
          />
          
          <FormField
            label="Ambulances"
            name="ambulances"
            type="number"
            value={formData.healthInfrastructure.ambulances}
            onChange={(e) => handleInputChange('ambulances', e.target.value, 'healthInfrastructure')}
            min="0"
            placeholder="0"
          />
        </div>
      </div>

      {/* Block Registration Settings */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Block Registration Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Allow Self Registration"
            name="allowSelfRegistration"
            type="checkbox"
            value={formData.blockRegistration.allowSelfRegistration}
            onChange={(e) => handleInputChange('allowSelfRegistration', e.target.checked, 'blockRegistration')}
          />
          
          <FormField
            label="Require Approval"
            name="requireApproval"
            type="checkbox"
            value={formData.blockRegistration.requireApproval}
            onChange={(e) => handleInputChange('requireApproval', e.target.checked, 'blockRegistration')}
          />
          
          <FormField
            label="Max Blocks Per District"
            name="maxBlocksPerDistrict"
            type="number"
            value={formData.blockRegistration.maxBlocksPerDistrict}
            onChange={(e) => handleInputChange('maxBlocksPerDistrict', e.target.value, 'blockRegistration')}
            min="1"
            placeholder="e.g., 20"
          />
          
          <FormField
            label="Block Naming Pattern"
            name="blockNamingPattern"
            type="select"
            value={formData.blockRegistration.blockNamingPattern}
            onChange={(e) => handleInputChange('blockNamingPattern', e.target.value, 'blockRegistration')}
            options={[
              { value: 'district_block', label: 'District_Block' },
              { value: 'block_district', label: 'Block_District' },
              { value: 'custom', label: 'Custom Pattern' }
            ]}
          />
          
          <FormField
            label="Auto Generate Tokens"
            name="autoGenerateTokens"
            type="checkbox"
            value={formData.blockRegistration.autoGenerateTokens}
            onChange={(e) => handleInputChange('autoGenerateTokens', e.target.checked, 'blockRegistration')}
          />
        </div>
      </div>

      {/* Administrative Settings */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Administrative Settings</h3>
        <FormField
          label="Status"
          name="status"
          type="select"
          value={formData.status}
          onChange={(e) => handleInputChange('status', e.target.value)}
          options={[
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' }
          ]}
          required
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 pt-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              {initialData ? 'Updating...' : 'Creating...'}
            </div>
          ) : (
            initialData ? 'Update District' : 'Create District'
          )}
        </button>
      </div>
    </form>
  );
};

export default DistrictForm;