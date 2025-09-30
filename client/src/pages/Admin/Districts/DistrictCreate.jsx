import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import DistrictForm from './DistrictForm';
import { createDistrict } from '../../../services/districtService';
import useAuthStore  from '../../../store/useAuthStore';

/**
 * DistrictCreate Component
 * Page for creating new districts using the DistrictForm component
 */
const DistrictCreate = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // Check admin access
  useEffect(() => {
    if (!user || user.roleInfo?.role !== 'admin') {
      navigate('/app');
      return;
    }
  }, [user, navigate]);

  const handleSubmit = async (districtData) => {
    setLoading(true);
    try {
      const response = await createDistrict(districtData);
      
      if (response.success) {
        // TODO: Show success notification
        console.log('District created successfully:', response.data);
        navigate('/app/districts');
      } else {
        // TODO: Show error notification
        console.error('Failed to create district:', response.message);
      }
    } catch (error) {
      console.error('Error creating district:', error);
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
          <span className="text-gray-900">Create New District</span>
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
            <h1 className="text-2xl font-bold text-gray-900">Create New District</h1>
            <p className="text-gray-600 mt-1">Add a new district to the system with administrative settings</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-gray-50 rounded-lg p-6">
        <DistrictForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default DistrictCreate;