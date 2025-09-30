import React, { useState, useEffect } from "react";
import FormField from "../../../components/Admin/FormField";
import { getAllUsers } from "../../../services/userService";
import { getHealthOfficerDistrict } from "../../../utils/healthOfficerGuard.jsx";

/**
 * BlockForm Component
 * Reusable form component for creating and editing blocks
 */
const BlockForm = ({ 
  initialData = null, 
  onSubmit, 
  onCancel, 
  loading = false 
}) => {
  // Get health officer's district ID
  const districtId = getHealthOfficerDistrict();
  
  // Form state
  const [formData, setFormData] = useState({
    // Basic Information
    name: "",
    blockCode: "",
    headquarters: "",
    
    // Block Officer Assignment
    blockOfficerId: "",
    
    // Geographic Boundaries
    geographicBoundaries: {
      coordinates: {
        latitude: "",
        longitude: ""
      },
      area: "",
      boundaryDescription: ""
    },
    
    // Demographics
    demographics: {
      totalPopulation: "",
      totalHouseholds: "",
      totalVillages: "",
      ruralPopulation: "",
      urbanPopulation: "",
      literacyRate: ""
    },
    
    // Health Infrastructure
    healthInfrastructure: {
      phcs: {
        total: "",
        functional: ""
      },
      subCenters: {
        total: "",
        functional: ""
      },
      hospitals: "",
      dispensaries: ""
    },
    
    // Village Registration Settings
    villageRegistration: {
      requiresApproval: false,
      maxVillagesPerToken: 5,
      tokenExpiryDays: 30,
      autoGenerateTokens: true
    },
    
    // Status
    status: "active"
  });
  
  // Available block officers
  const [availableOfficers, setAvailableOfficers] = useState([]);
  const [loadingOfficers, setLoadingOfficers] = useState(false);
  
  // Form validation errors
  const [errors, setErrors] = useState({});

  // Indian states for dropdown (can be moved to a constants file)
  const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
  ];

  // Initialize form data
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        blockCode: initialData.blockCode || "",
        headquarters: initialData.headquarters || "",
        blockOfficerId: initialData.blockOfficerId || "",
        geographicBoundaries: {
          coordinates: {
            latitude: initialData.geographicBoundaries?.coordinates?.latitude || "",
            longitude: initialData.geographicBoundaries?.coordinates?.longitude || ""
          },
          area: initialData.geographicBoundaries?.area || "",
          boundaryDescription: initialData.geographicBoundaries?.boundaryDescription || ""
        },
        demographics: {
          totalPopulation: initialData.demographics?.totalPopulation || "",
          totalHouseholds: initialData.demographics?.totalHouseholds || "",
          totalVillages: initialData.demographics?.totalVillages || "",
          ruralPopulation: initialData.demographics?.ruralPopulation || "",
          urbanPopulation: initialData.demographics?.urbanPopulation || "",
          literacyRate: initialData.demographics?.literacyRate || ""
        },
        healthInfrastructure: {
          phcs: {
            total: initialData.healthInfrastructure?.phcs?.total || "",
            functional: initialData.healthInfrastructure?.phcs?.functional || ""
          },
          subCenters: {
            total: initialData.healthInfrastructure?.subCenters?.total || "",
            functional: initialData.healthInfrastructure?.subCenters?.functional || ""
          },
          hospitals: initialData.healthInfrastructure?.hospitals || "",
          dispensaries: initialData.healthInfrastructure?.dispensaries || ""
        },
        villageRegistration: {
          requiresApproval: initialData.villageRegistration?.requiresApproval || false,
          maxVillagesPerToken: initialData.villageRegistration?.maxVillagesPerToken || 5,
          tokenExpiryDays: initialData.villageRegistration?.tokenExpiryDays || 30,
          autoGenerateTokens: initialData.villageRegistration?.autoGenerateTokens || true
        },
        status: initialData.status || "active"
      });
    }
  }, [initialData]);

  // Fetch available block officers
  useEffect(() => {
    const fetchOfficers = async () => {
      if (!districtId) return;
      
      setLoadingOfficers(true);
      try {
        // Fetch health officials and block officers separately
        const [healthOfficials, blockOfficers] = await Promise.all([
          getAllUsers({ districtId, role: 'health_official', status: 'active', limit: 100 }),
          getAllUsers({ districtId, role: 'block_officer', status: 'active', limit: 100 })
        ]);
        
        // Merge and de-duplicate by _id
        const allOfficers = [];
        const seenIds = new Set();
        
        [healthOfficials, blockOfficers].forEach(response => {
          if (response.success) {
            response.data.forEach(user => {
              if (!seenIds.has(user._id)) {
                seenIds.add(user._id);
                allOfficers.push(user);
              }
            });
          }
        });
        
        setAvailableOfficers(allOfficers);
      } catch (err) {
        console.error("Failed to fetch officers:", err);
      } finally {
        setLoadingOfficers(false);
      }
    };

    fetchOfficers();
  }, [districtId]);

  // Handle input changes
  const handleInputChange = (name, value) => {
    setFormData(prev => {
      if (name.includes('.')) {
        const keys = name.split('.');
        const newData = { ...prev };
        let current = newData;
        
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) current[keys[i]] = {};
          current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
        return newData;
      } else {
        return { ...prev, [name]: value };
      }
    });
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Calculate auto values
  useEffect(() => {
    const totalPop = parseFloat(formData.demographics.totalPopulation) || 0;
    const ruralPop = parseFloat(formData.demographics.ruralPopulation) || 0;
    
    if (totalPop > 0 && ruralPop <= totalPop) {
      const urbanPop = totalPop - ruralPop;
      setFormData(prev => ({
        ...prev,
        demographics: {
          ...prev.demographics,
          urbanPopulation: urbanPop.toString()
        }
      }));
    }
  }, [formData.demographics.totalPopulation, formData.demographics.ruralPopulation]);

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Block name is required";
    }
    
    if (!formData.headquarters.trim()) {
      newErrors.headquarters = "Headquarters is required";
    }
    
    if (!formData.blockOfficerId) {
      newErrors.blockOfficerId = "Block officer assignment is required";
    }
    
    // Validate coordinates
    const lat = parseFloat(formData.geographicBoundaries.coordinates.latitude);
    const lng = parseFloat(formData.geographicBoundaries.coordinates.longitude);
    
    if (isNaN(lat) || lat < -90 || lat > 90) {
      newErrors['geographicBoundaries.coordinates.latitude'] = "Valid latitude required (-90 to 90)";
    }
    
    if (isNaN(lng) || lng < -180 || lng > 180) {
      newErrors['geographicBoundaries.coordinates.longitude'] = "Valid longitude required (-180 to 180)";
    }
    
    // Validate demographics
    if (formData.demographics.totalPopulation && 
        parseFloat(formData.demographics.totalPopulation) <= 0) {
      newErrors['demographics.totalPopulation'] = "Population must be greater than 0";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Map UI fields to backend block model schema
    const submissionData = {
      name: formData.name,
      districtId,
      blockOfficer: formData.blockOfficerId ? { userId: formData.blockOfficerId } : null,
      boundaries: {
        coordinates: [], // TODO: map polygon if available or derive from lat/lng
        area: Number(formData.geographicBoundaries.area) || 0,
        headquarters: {
          latitude: Number(formData.geographicBoundaries.coordinates.latitude) || 0,
          longitude: Number(formData.geographicBoundaries.coordinates.longitude) || 0,
          address: formData.headquarters || '',
        },
      },
      demographics: {
        totalPopulation: Number(formData.demographics.totalPopulation) || 0,
        households: Number(formData.demographics.households) || 0,
        ruralPopulation: Number(formData.demographics.ruralPopulation) || 0,
        urbanPopulation: Number(formData.demographics.urbanPopulation) || 0,
        literacyRate: Number(formData.demographics.literacyRate) || 0,
        femalePopulation: Number(formData.demographics.femalePopulation) || 0,
        malePopulation: Number(formData.demographics.malePopulation) || 0,
      },
      healthInfrastructure: {
        phcs: Number(formData.healthInfrastructure.phcs) || 0,
        subCenters: Number(formData.healthInfrastructure.subCenters) || 0,
        chcs: Number(formData.healthInfrastructure.chcs) || 0,
        privateClinics: Number(formData.healthInfrastructure.privateClinics) || 0,
        hospitals: Number(formData.healthInfrastructure.hospitals) || 0,
      },
      villageRegistration: {
        registrationEnabled: true,
        requiresApproval: formData.villageRegistration?.requiresApproval || false,
        autoGenerateTokens: formData.villageRegistration?.autoGenerateTokens || false,
        tokenValidityDays: Number(formData.villageRegistration?.tokenExpiryDays) || 30,
        maxVillagesAllowed: Number(formData.villageRegistration?.maxVillagesPerToken) || 10,
      },
      status: formData.status || 'pending_approval',
    };
    
    onSubmit(submissionData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            type="text"
            label="Block Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            error={errors.name}
            required
            placeholder="Enter block name"
          />
          
          <FormField
            type="text"
            label="Block Code"
            name="blockCode"
            value={formData.blockCode}
            onChange={handleInputChange}
            error={errors.blockCode}
            placeholder="Enter block code (optional)"
          />
          
          <FormField
            type="text"
            label="Headquarters"
            name="headquarters"
            value={formData.headquarters}
            onChange={handleInputChange}
            error={errors.headquarters}
            required
            placeholder="Enter block headquarters"
          />
          
          <FormField
            type="select"
            label="Block Officer"
            name="blockOfficerId"
            value={formData.blockOfficerId}
            onChange={handleInputChange}
            error={errors.blockOfficerId}
            required
            loading={loadingOfficers}
            options={[
              { value: "", label: "Select Block Officer" },
              ...availableOfficers.map(officer => ({
                value: officer._id,
                label: `${officer.name} (${officer.roleInfo?.role})`
              }))
            ]}
          />
        </div>
      </div>

      {/* Geographic Boundaries Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Geographic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            type="number"
            label="Latitude"
            name="geographicBoundaries.coordinates.latitude"
            value={formData.geographicBoundaries.coordinates.latitude}
            onChange={handleInputChange}
            error={errors['geographicBoundaries.coordinates.latitude']}
            placeholder="e.g., 28.6139"
            step="any"
          />
          
          <FormField
            type="number"
            label="Longitude"
            name="geographicBoundaries.coordinates.longitude"
            value={formData.geographicBoundaries.coordinates.longitude}
            onChange={handleInputChange}
            error={errors['geographicBoundaries.coordinates.longitude']}
            placeholder="e.g., 77.2090"
            step="any"
          />
          
          <FormField
            type="number"
            label="Area (sq km)"
            name="geographicBoundaries.area"
            value={formData.geographicBoundaries.area}
            onChange={handleInputChange}
            error={errors['geographicBoundaries.area']}
            placeholder="Enter area in square kilometers"
          />
          
          <div className="md:col-span-2">
            <FormField
              type="textarea"
              label="Boundary Description"
              name="geographicBoundaries.boundaryDescription"
              value={formData.geographicBoundaries.boundaryDescription}
              onChange={handleInputChange}
              error={errors['geographicBoundaries.boundaryDescription']}
              placeholder="Describe the geographic boundaries..."
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Demographics Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Demographics</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            type="number"
            label="Total Population"
            name="demographics.totalPopulation"
            value={formData.demographics.totalPopulation}
            onChange={handleInputChange}
            error={errors['demographics.totalPopulation']}
            placeholder="Enter total population"
          />
          
          <FormField
            type="number"
            label="Rural Population"
            name="demographics.ruralPopulation"
            value={formData.demographics.ruralPopulation}
            onChange={handleInputChange}
            error={errors['demographics.ruralPopulation']}
            placeholder="Enter rural population"
          />
          
          <FormField
            type="number"
            label="Urban Population"
            name="demographics.urbanPopulation"
            value={formData.demographics.urbanPopulation}
            onChange={handleInputChange}
            error={errors['demographics.urbanPopulation']}
            placeholder="Auto-calculated"
            disabled
          />
          
          <FormField
            type="number"
            label="Total Households"
            name="demographics.totalHouseholds"
            value={formData.demographics.totalHouseholds}
            onChange={handleInputChange}
            error={errors['demographics.totalHouseholds']}
            placeholder="Enter total households"
          />
          
          <FormField
            type="number"
            label="Total Villages"
            name="demographics.totalVillages"
            value={formData.demographics.totalVillages}
            onChange={handleInputChange}
            error={errors['demographics.totalVillages']}
            placeholder="Enter total villages"
          />
          
          <FormField
            type="number"
            label="Literacy Rate (%)"
            name="demographics.literacyRate"
            value={formData.demographics.literacyRate}
            onChange={handleInputChange}
            error={errors['demographics.literacyRate']}
            placeholder="Enter literacy rate"
            min="0"
            max="100"
          />
        </div>
      </div>

      {/* Health Infrastructure Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Health Infrastructure</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Primary Health Centers (PHCs)</h4>
            <div className="space-y-3">
              <FormField
                type="number"
                label="Total PHCs"
                name="healthInfrastructure.phcs.total"
                value={formData.healthInfrastructure.phcs.total}
                onChange={handleInputChange}
                placeholder="Enter total PHCs"
              />
              <FormField
                type="number"
                label="Functional PHCs"
                name="healthInfrastructure.phcs.functional"
                value={formData.healthInfrastructure.phcs.functional}
                onChange={handleInputChange}
                placeholder="Enter functional PHCs"
              />
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Sub Centers</h4>
            <div className="space-y-3">
              <FormField
                type="number"
                label="Total Sub Centers"
                name="healthInfrastructure.subCenters.total"
                value={formData.healthInfrastructure.subCenters.total}
                onChange={handleInputChange}
                placeholder="Enter total sub centers"
              />
              <FormField
                type="number"
                label="Functional Sub Centers"
                name="healthInfrastructure.subCenters.functional"
                value={formData.healthInfrastructure.subCenters.functional}
                onChange={handleInputChange}
                placeholder="Enter functional sub centers"
              />
            </div>
          </div>
          
          <FormField
            type="number"
            label="Hospitals"
            name="healthInfrastructure.hospitals"
            value={formData.healthInfrastructure.hospitals}
            onChange={handleInputChange}
            placeholder="Enter number of hospitals"
          />
          
          <FormField
            type="number"
            label="Dispensaries"
            name="healthInfrastructure.dispensaries"
            value={formData.healthInfrastructure.dispensaries}
            onChange={handleInputChange}
            placeholder="Enter number of dispensaries"
          />
        </div>
      </div>

      {/* Village Registration Settings Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Village Registration Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            type="checkbox"
            label="Requires Approval for Village Registration"
            name="villageRegistration.requiresApproval"
            checked={formData.villageRegistration.requiresApproval}
            onChange={(name, checked) => handleInputChange(name, checked)}
          />
          
          <FormField
            type="checkbox"
            label="Auto-generate Village Tokens"
            name="villageRegistration.autoGenerateTokens"
            checked={formData.villageRegistration.autoGenerateTokens}
            onChange={(name, checked) => handleInputChange(name, checked)}
          />
          
          <FormField
            type="number"
            label="Max Villages per Token"
            name="villageRegistration.maxVillagesPerToken"
            value={formData.villageRegistration.maxVillagesPerToken}
            onChange={handleInputChange}
            min="1"
            max="20"
          />
          
          <FormField
            type="number"
            label="Token Expiry (Days)"
            name="villageRegistration.tokenExpiryDays"
            value={formData.villageRegistration.tokenExpiryDays}
            onChange={handleInputChange}
            min="1"
            max="365"
          />
        </div>
      </div>

      {/* Status Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Status</h3>
        
        <FormField
          type="radio"
          label="Block Status"
          name="status"
          value={formData.status}
          onChange={handleInputChange}
          options={[
            { value: "pending_approval", label: "Pending Approval" },
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" }
          ]}
        />
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
        >
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          )}
          <span>{initialData ? 'Update Block' : 'Create Block'}</span>
        </button>
      </div>
    </form>
  );
};

export default BlockForm;