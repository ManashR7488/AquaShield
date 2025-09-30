import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import BlockForm from "./BlockForm";
import { getBlockById, updateBlock } from "../../../services/blockService";
import useAuthStore from "../../../store/useAuthStore";
import { getHealthOfficerDistrict, canManageBlock } from "../../../utils/healthOfficerGuard.jsx";

/**
 * BlockEdit Component
 * Page for editing existing blocks within the health officer's district
 */
const BlockEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuthStore();
  
  // Get health officer's district ID
  const districtId = getHealthOfficerDistrict();
  
  // Component state
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [blockData, setBlockData] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Check if user is health officer
  useEffect(() => {
    if (user && user.roleInfo?.role !== 'health_official') {
      navigate('/app');
    }
  }, [user, navigate]);

  // Fetch block data on component mount
  useEffect(() => {
    const fetchBlockData = async () => {
      if (!id || !districtId) return;
      
      setInitialLoading(true);
      setError(null);
      
      try {
        const response = await getBlockById(id);
        
        if (response.success) {
          const block = response.data;
          
          // Verify that the block belongs to the health officer's district
          if (block.districtId !== districtId) {
            setError("You don't have permission to edit this block. It belongs to a different district.");
            return;
          }
          
          // Check if health officer can manage this block
          if (!canManageBlock(id)) {
            setError("You don't have permission to edit this block.");
            return;
          }
          
          setBlockData(block);
        } else {
          setError(response.error || 'Failed to fetch block data');
        }
      } catch (err) {
        console.error('Error fetching block:', err);
        setError('An unexpected error occurred while fetching block data');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchBlockData();
  }, [id, districtId]);

  // Handle form submission
  const handleSubmit = async (updatedBlockData) => {
    setSubmitting(true);
    setError(null);
    
    try {
      const response = await updateBlock(id, updatedBlockData);
      
      if (response.success) {
        // Show success toast notification here if using toast library
        console.log("Block updated successfully:", response.data);
        
        // Navigate back to block view or list
        navigate(`/app/blocks/${id}`);
      } else {
        setError(response.error || 'Failed to update block');
      }
    } catch (err) {
      console.error('Error updating block:', err);
      setError('An unexpected error occurred while updating the block');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle cancel action
  const handleCancel = () => {
    navigate(`/app/blocks/${id}`);
  };

  // Loading state
  if (initialLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading block data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state (no district or permission issues)
  if (!districtId || (error && !blockData)) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {!districtId ? "District Not Assigned" : "Access Denied"}
            </h2>
            <p className="text-gray-600 mb-4">
              {error || "You need to be assigned to a district to edit blocks."}
            </p>
            <div className="space-x-4">
              <button
                onClick={() => navigate('/app/blocks')}
                className="text-blue-600 hover:text-blue-700"
              >
                Return to Blocks
              </button>
              <button
                onClick={() => navigate('/app')}
                className="text-gray-600 hover:text-gray-700"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Block not found
  if (!blockData) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Block Not Found
            </h2>
            <p className="text-gray-600 mb-4">
              The requested block could not be found or you don't have permission to access it.
            </p>
            <button
              onClick={() => navigate('/app/blocks')}
              className="text-blue-600 hover:text-blue-700"
            >
              Return to Blocks
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
            onClick={() => navigate(`/app/blocks/${id}`)}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Block</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
              <div className="flex items-center space-x-2">
                <span>Block:</span>
                <span className="font-medium text-gray-900">{blockData.name}</span>
              </div>
              <span>•</span>
              <div className="flex items-center space-x-2">
                <span>District:</span>
                <span className="font-medium text-blue-600">
                  {user?.roleInfo?.hierarchy?.district?.name || 'Loading...'}
                </span>
              </div>
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
          <button
            onClick={() => navigate(`/app/blocks/${id}`)}
            className="hover:text-gray-700"
          >
            {blockData.name}
          </button>
          <span>/</span>
          <span className="text-gray-900">Edit</span>
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
      <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-amber-800">Editing Block Information</h3>
            <div className="mt-1 text-sm text-amber-700">
              <p>You're editing an existing block. Consider the following:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Changes to block officer assignments may affect ongoing programs</li>
                <li>Geographic boundary changes should be verified with district authorities</li>
                <li>Demographic updates should reflect recent census or survey data</li>
                <li>Infrastructure changes should match actual facility status</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Block Edit Form */}
      <div className="bg-gray-50 rounded-lg p-6">
        <BlockForm
          initialData={blockData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={submitting}
        />
      </div>

      {/* Last Updated Info */}
      {blockData.updatedAt && (
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              <span className="font-medium">Last updated:</span>
              <span className="ml-2">
                {new Date(blockData.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            {blockData.updatedBy && (
              <div>
                <span className="font-medium">Updated by:</span>
                <span className="ml-2">{blockData.updatedBy.name}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Need Help?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Changing Block Officer</h4>
            <p>
              Reassigning a block officer will transfer all responsibilities and access rights.
              Ensure proper handover of ongoing programs and data.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Updating Demographics</h4>
            <p>
              Demographic changes affect resource allocation and program planning.
              Use the most recent and reliable data sources.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Infrastructure Changes</h4>
            <p>
              Keep health infrastructure data current to ensure accurate reporting
              and effective program implementation.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Status Changes</h4>
            <p>
              Changing block status affects all associated villages and programs.
              Inactive blocks won't receive new program assignments.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockEdit;