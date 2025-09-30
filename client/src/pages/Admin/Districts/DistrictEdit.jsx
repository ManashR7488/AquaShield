import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import DistrictForm from './DistrictForm';
import { getDistrictById, updateDistrict } from '../../../services/districtService';
import useAuthStore  from '../../../store/useAuthStore';

/**
 * DistrictEdit Component
 * Page for editing existing districts using the DistrictForm component
 */
const DistrictEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuthStore();
  
  const [district, setDistrict] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check admin access
  useEffect(() => {
    if (!user || user.roleInfo?.role !== 'admin') {
      navigate('/app');
      return;
    }
  }, [user, navigate]);

  // Fetch district data
  useEffect(() => {
    const fetchDistrict = async () => {
      if (!id) {
        setError('District ID is required');
        setFetchLoading(false);
        return;
      }

      try {
        setFetchLoading(true);
        const response = await getDistrictById(id);
        
        if (response.success) {
          setDistrict(response.data);
          setError(null);
        } else {
          setError(response.message || 'Failed to fetch district');
        }
      } catch (error) {
        console.error('Error fetching district:', error);
        setError('Failed to load district data');
      } finally {
        setFetchLoading(false);
      }
    };

    if (user?.roleInfo?.role === 'admin') {
      fetchDistrict();
    }
  }, [id, user]);

  const handleSubmit = async (districtData) => {
    setLoading(true);
    try {
      const response = await updateDistrict(id, districtData);
      
      if (response.success) {
        // TODO: Show success notification
        console.log('District updated successfully:', response.data);
        navigate('/app/districts');
      } else {
        // TODO: Show error notification
        console.error('Failed to update district:', response.message);
      }
    } catch (error) {
      console.error('Error updating district:', error);
      // TODO: Show error notification
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/app/districts');
  };

  if (!user || user.roleInfo?.role !== 'admin') {
    return null;
  }

  // Loading state
  if (fetchLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="animate-pulse">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-8 h-8 bg-gray-200 rounded"></div>
              <div className="space-y-2">
                <div className="h-6 bg-gray-200 rounded w-48"></div>
                <div className="h-4 bg-gray-200 rounded w-64"></div>
              </div>
            </div>
            <div className="space-y-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
            <button
              onClick={() => navigate('/app/districts')}
              className="hover:text-blue-600 transition-colors"
            >
              District Management
            </button>
            <span>/</span>
            <span className="text-gray-900">Edit District</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={handleCancel}
              className="inline-flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <FiArrowLeft className="w-4 h-4 mr-1" />
              Back to Districts
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <div className="text-red-600 text-lg font-semibold mb-2">Error Loading District</div>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="space-x-4">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Retry
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // District not found
  if (!district) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
            <button
              onClick={() => navigate('/app/districts')}
              className="hover:text-blue-600 transition-colors"
            >
              District Management
            </button>
            <span>/</span>
            <span className="text-gray-900">Edit District</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={handleCancel}
              className="inline-flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <FiArrowLeft className="w-4 h-4 mr-1" />
              Back to Districts
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <div className="text-gray-600 text-lg font-semibold mb-2">District Not Found</div>
            <p className="text-gray-500 mb-4">The district you're looking for doesn't exist or has been removed.</p>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Back to Districts
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header with breadcrumbs */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
          <button
            onClick={() => navigate('/app/districts')}
            className="hover:text-blue-600 transition-colors"
          >
            District Management
          </button>
          <span>/</span>
          <button
            onClick={() => navigate(`/app/districts/${id}`)}
            className="hover:text-blue-600 transition-colors"
          >
            {district.name}
          </button>
          <span>/</span>
          <span className="text-gray-900">Edit</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={handleCancel}
            className="inline-flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <FiArrowLeft className="w-4 h-4 mr-1" />
            Back to Districts
          </button>
          <div className="border-l border-gray-300 h-6"></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit District: {district.name}</h1>
            <p className="text-gray-600 mt-1">Update district information and administrative settings</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-gray-50 rounded-lg p-6">
        <DistrictForm
          initialData={district}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default DistrictEdit;