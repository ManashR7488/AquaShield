import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiInfo, FiBookOpen } from "react-icons/fi";
import HealthProgramForm from "./HealthProgramForm";
import { createHealthProgram } from "../../../services/healthProgramService";
import useAuthStore from "../../../store/useAuthStore";
import { getHealthOfficerDistrict } from "../../../utils/healthOfficerGuard.jsx";

/**
 * HealthProgramCreate Component
 * Page for creating new health programs
 */
const HealthProgramCreate = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Get health officer's district ID
  const districtId = getHealthOfficerDistrict();
  
  // Component state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Check if user is health officer
  useEffect(() => {
    if (user && user.roleInfo?.role !== 'health_official') {
      navigate('/app');
    }
  }, [user, navigate]);

  // Handle form submission
  const handleFormSubmit = async (formData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await createHealthProgram(formData);
      
      if (response.success) {
        setSuccess(true);
        
        // Show success message briefly, then navigate
        setTimeout(() => {
          navigate(`/app/health-programs/${response.data._id}`);
        }, 2000);
        
      } else {
        setError(response.error || 'Failed to create health program');
      }
    } catch (err) {
      console.error('Error creating health program:', err);
      setError('An unexpected error occurred while creating the health program');
    } finally {
      setLoading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Health Program Created Successfully!</h2>
            <p className="text-gray-600 mb-4">Your health program has been created and is ready for implementation.</p>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Redirecting to program details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state for no district
  if (!districtId) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">District Not Assigned</h2>
            <p className="text-gray-600 mb-4">You need to be assigned to a district to create health programs.</p>
            <button
              onClick={() => navigate('/app/health-programs')}
              className="text-blue-600 hover:text-blue-700"
            >
              Return to Health Programs
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={() => navigate('/app/health-programs')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Health Program</h1>
            <p className="text-gray-600 mt-1">
              Create a new health program for{' '}
              <span className="font-medium text-blue-600">
                {user?.roleInfo?.hierarchy?.district?.name}
              </span>{' '}
              district
            </p>
          </div>
        </div>
        
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500">
          <button onClick={() => navigate('/app')} className="hover:text-gray-700">Dashboard</button>
          <span>/</span>
          <button onClick={() => navigate('/app/health-programs')} className="hover:text-gray-700">Health Program Management</button>
          <span>/</span>
          <span className="text-gray-900">Create Program</span>
        </nav>
      </div>

      {/* Information Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Program Creation Guide */}
        <div className="lg:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <FiInfo className="text-blue-600 flex-shrink-0 mt-1" size={20} />
            <div>
              <h3 className="text-lg font-medium text-blue-900 mb-2">Health Program Creation Guide</h3>
              <div className="text-blue-800 space-y-2 text-sm">
                <p><strong>1. Basic Information:</strong> Provide clear program name, type, and detailed description</p>
                <p><strong>2. Target & Scope:</strong> Define target population, age groups, and expected participants</p>
                <p><strong>3. Implementation:</strong> Select target blocks within your district and define strategy</p>
                <p><strong>4. Budget Planning:</strong> Allocate budget and list required resources</p>
                <p><strong>5. Monitoring:</strong> Set KPIs, milestones, and reporting frequency</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <FiBookOpen className="text-green-600 flex-shrink-0 mt-1" size={20} />
            <div>
              <h3 className="text-lg font-medium text-green-900 mb-2">Quick Tips</h3>
              <div className="text-green-800 space-y-2 text-sm">
                <p>• Use specific, measurable objectives</p>
                <p>• Set realistic participant targets</p>
                <p>• Include multiple blocks for better coverage</p>
                <p>• Define clear eligibility criteria</p>
                <p>• Plan for regular monitoring</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className="bg-gray-50 rounded-lg p-6">
        <HealthProgramForm 
          onSubmit={handleFormSubmit}
          loading={loading}
          error={error}
        />
      </div>

      {/* Help Section */}
      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Need Help?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Program Types</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li><strong>Immunization:</strong> Vaccination campaigns and schedules</li>
              <li><strong>Nutrition:</strong> Malnutrition prevention and treatment</li>
              <li><strong>Maternal Health:</strong> Prenatal and postnatal care</li>
              <li><strong>Child Health:</strong> Child development and care programs</li>
              <li><strong>Disease Prevention:</strong> Epidemic prevention and control</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Best Practices</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Conduct baseline surveys before program start</li>
              <li>• Involve community leaders in planning</li>
              <li>• Train staff before program implementation</li>
              <li>• Set up regular review meetings</li>
              <li>• Maintain detailed documentation</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Contact Support */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Need assistance with program creation?{' '}
          <button 
            onClick={() => {
              // TODO: Open support chat or contact form
              console.log('Open support contact');
            }}
            className="text-blue-600 hover:text-blue-700"
          >
            Contact Support
          </button>
        </p>
      </div>
    </div>
  );
};

export default HealthProgramCreate;