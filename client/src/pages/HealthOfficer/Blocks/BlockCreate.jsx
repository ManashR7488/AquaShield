import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import BlockForm from "./BlockForm";
import { createBlock } from "../../../services/blockService";
import useAuthStore from "../../../store/useAuthStore";
import { getHealthOfficerDistrict } from "../../../utils/healthOfficerGuard.jsx";

/**
 * BlockCreate Component
 * Page for creating new blocks within the health officer's district
 */
const BlockCreate = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Get health officer's district ID
  const districtId = getHealthOfficerDistrict();
  
  // Component state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if user is health officer
  useEffect(() => {
    if (user && user.roleInfo?.role !== 'health_official') {
      navigate('/app');
    }
  }, [user, navigate]);

  // Check if district is assigned
  useEffect(() => {
    if (!districtId) {
      setError("District information not available. Please contact your administrator.");
    }
  }, [districtId]);

  // Handle form submission
  const handleSubmit = async (blockData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await createBlock(blockData);
      
      if (response.success) {
        // Show success toast notification here if using toast library
        console.log("Block created successfully:", response.data);
        
        // Navigate back to blocks list
        navigate('/app/blocks');
      } else {
        setError(response.error || 'Failed to create block');
      }
    } catch (err) {
      console.error('Error creating block:', err);
      setError('An unexpected error occurred while creating the block');
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel action
  const handleCancel = () => {
    navigate('/app/blocks');
  };

  // If no district assigned, show error
  if (!districtId) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              District Not Assigned
            </h2>
            <p className="text-gray-600 mb-4">
              You need to be assigned to a district to create blocks.
            </p>
            <button
              onClick={() => navigate('/app')}
              className="text-blue-600 hover:text-blue-700"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={() => navigate('/app/blocks')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Block</h1>
            <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
              <span>District:</span>
              <span className="font-medium text-blue-600">
                {user?.roleInfo?.hierarchy?.district?.name || 'Loading...'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500">
          <button
            onClick={() => navigate('/app')}
            className="hover:text-gray-700"
          >
            Dashboard
          </button>
          <span>/</span>
          <button
            onClick={() => navigate('/app/blocks')}
            className="hover:text-gray-700"
          >
            Block Management
          </button>
          <span>/</span>
          <span className="text-gray-900">Create New Block</span>
        </nav>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodom" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Creating a New Block</h3>
            <div className="mt-1 text-sm text-blue-700">
              <p>Fill out the form below to create a new block within your district. Make sure to:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Assign a qualified block officer to manage the block</li>
                <li>Provide accurate geographic coordinates for boundary mapping</li>
                <li>Enter correct demographic and infrastructure data</li>
                <li>Configure village registration settings appropriately</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Block Creation Form */}
      <div className="bg-gray-50 rounded-lg p-6">
        <BlockForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
      </div>

      {/* Help Section */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Need Help?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Block Officer Assignment</h4>
            <p>
              Block officers are responsible for managing health programs and staff within the block.
              You can assign existing health officials or block officers from your district.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Geographic Boundaries</h4>
            <p>
              Provide the central coordinates of your block. This helps in mapping and resource 
              allocation. You can use online maps to find accurate coordinates.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Health Infrastructure</h4>
            <p>
              Record the current health facilities in the block. This information is used for 
              planning health programs and resource distribution.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Village Registration</h4>
            <p>
              Configure how villages can register under this block. Auto-generated tokens 
              simplify the registration process for village workers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockCreate;