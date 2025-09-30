import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft, FiInfo, FiBookOpen } from "react-icons/fi";
import HealthProgramForm from "./HealthProgramForm";
import { 
  getHealthProgramById, 
  updateHealthProgram 
} from "../../../services/healthProgramService";
import useAuthStore from "../../../store/useAuthStore";
import { getHealthOfficerDistrict, canAccessDistrictResource } from "../../../utils/healthOfficerGuard.jsx";

/**
 * HealthProgramEdit Component
 * Page for editing existing health programs
 */
const HealthProgramEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuthStore();
  
  // Get health officer's district ID
  const districtId = getHealthOfficerDistrict();
  
  // Component state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [programData, setProgramData] = useState(null);

  // Check if user is health officer
  useEffect(() => {
    if (user && user.roleInfo?.role !== 'health_official') {
      navigate('/app');
    }
  }, [user, navigate]);

  // Fetch program data
  useEffect(() => {
    const fetchProgramData = async () => {
      if (!id || !districtId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await getHealthProgramById(id);
        
        if (!response.success) {
          setError(response.error || 'Failed to fetch program data');
          return;
        }
        
        const program = response.data;
        
        // Verify that the program belongs to the health officer's district
        if (!canAccessDistrictResource(program)) {
          setError("You don't have permission to edit this program. It belongs to a different district.");
          return;
        }
        
        // Transform data for form
        const formData = {
          ...program,
          // Ensure dates are in correct format for form inputs
          startDate: program.startDate ? new Date(program.startDate).toISOString().split('T')[0] : '',
          endDate: program.endDate ? new Date(program.endDate).toISOString().split('T')[0] : '',
          // Convert arrays to strings for textarea fields (if they were stored as strings)
          indicators: Array.isArray(program.indicators) ? program.indicators : [],
          milestones: Array.isArray(program.milestones) ? program.milestones : [],
          resources: Array.isArray(program.resources) ? program.resources : [],
          interventions: Array.isArray(program.interventions) ? program.interventions : [],
          // Ensure budget is properly structured
          budget: {
            allocated: program.budget?.allocated || 0,
            spent: program.budget?.spent || 0,
            currency: program.budget?.currency || 'INR'
          },
          // Ensure arrays for target blocks
          targetBlocks: program.targetBlocks || []
        };
        
        setProgramData(formData);
        
      } catch (err) {
        console.error('Error fetching program data:', err);
        setError('An unexpected error occurred while fetching program data');
      } finally {
        setLoading(false);
      }
    };

    fetchProgramData();
  }, [id, districtId]);

  // Handle form submission
  const handleFormSubmit = async (formData) => {
    setSaving(true);
    setError(null);
    
    try {
      const response = await updateHealthProgram(id, formData);
      
      if (response.success) {
        setSuccess(true);
        
        // Show success message briefly, then navigate
        setTimeout(() => {
          navigate(`/app/health-programs/${id}`);
        }, 2000);
        
      } else {
        setError(response.error || 'Failed to update health program');
      }
    } catch (err) {
      console.error('Error updating health program:', err);
      setError('An unexpected error occurred while updating the health program');
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading program data...</p>
          </div>
        </div>
      </div>
    );
  }

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
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Health Program Updated Successfully!</h2>
            <p className="text-gray-600 mb-4">Your health program has been updated with the latest information.</p>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Redirecting to program details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state for no district or permission
  if (!districtId || error || !programData) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {!districtId ? "District Not Assigned" : error ? "Error" : "Program Not Found"}
            </h2>
            <p className="text-gray-600 mb-4">
              {error || (!districtId ? "You need to be assigned to a district to edit programs." : "The requested program could not be found.")}
            </p>
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
            onClick={() => navigate(`/app/health-programs/${id}`)}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Health Program</h1>
            <p className="text-gray-600 mt-1">
              Update program details for{' '}
              <span className="font-medium text-blue-600">
                {programData.name}
              </span>
            </p>
          </div>
        </div>
        
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500">
          <button onClick={() => navigate('/app')} className="hover:text-gray-700">Dashboard</button>
          <span>/</span>
          <button onClick={() => navigate('/app/health-programs')} className="hover:text-gray-700">Health Program Management</button>
          <span>/</span>
          <button onClick={() => navigate(`/app/health-programs/${id}`)} className="hover:text-gray-700">{programData.name}</button>
          <span>/</span>
          <span className="text-gray-900">Edit</span>
        </nav>
      </div>

      {/* Information Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Edit Guidelines */}
        <div className="lg:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <FiInfo className="text-blue-600 flex-shrink-0 mt-1" size={20} />
            <div>
              <h3 className="text-lg font-medium text-blue-900 mb-2">Program Edit Guidelines</h3>
              <div className="text-blue-800 space-y-2 text-sm">
                <p><strong>Status Changes:</strong> Changing program status may affect ongoing activities</p>
                <p><strong>Budget Updates:</strong> Ensure budget modifications align with spending records</p>
                <p><strong>Block Changes:</strong> Modifying target blocks may impact assigned staff and participants</p>
                <p><strong>Validation:</strong> All changes are validated before saving to maintain data integrity</p>
                <p><strong>Approval:</strong> Some changes may require additional approval based on program settings</p>
              </div>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <FiBookOpen className="text-amber-600 flex-shrink-0 mt-1" size={20} />
            <div>
              <h3 className="text-lg font-medium text-amber-900 mb-2">Important Notes</h3>
              <div className="text-amber-800 space-y-2 text-sm">
                <p>• Active programs may have restrictions on certain changes</p>
                <p>• Participant data will be preserved during updates</p>
                <p>• Budget changes affect reporting metrics</p>
                <p>• Staff assignments remain unchanged unless blocks are modified</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Program Status Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Current Program Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Status</p>
            <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full mt-1 ${
              programData.status === 'active' 
                ? 'bg-green-100 text-green-800'
                : programData.status === 'planned'
                ? 'bg-blue-100 text-blue-800'
                : programData.status === 'completed'
                ? 'bg-gray-100 text-gray-800'
                : programData.status === 'paused'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {programData.status}
            </span>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600">Target Participants</p>
            <p className="text-xl font-bold text-blue-600 mt-1">
              {programData.targetParticipants?.toLocaleString() || 0}
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600">Current Participants</p>
            <p className="text-xl font-bold text-green-600 mt-1">
              {programData.participantCount?.toLocaleString() || 0}
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600">Target Blocks</p>
            <p className="text-xl font-bold text-purple-600 mt-1">
              {programData.targetBlocks?.length || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className="bg-gray-50 rounded-lg p-6">
        <HealthProgramForm 
          initialData={programData}
          onSubmit={handleFormSubmit}
          loading={saving}
          error={error}
        />
      </div>

      {/* Help Section */}
      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Help</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Status Changes</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li><strong>Planned:</strong> Program is being prepared for launch</li>
              <li><strong>Active:</strong> Program is currently running</li>
              <li><strong>Paused:</strong> Program is temporarily halted</li>
              <li><strong>Completed:</strong> Program has finished successfully</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Budget Considerations</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Allocated budget can be increased or decreased</li>
              <li>• Spent budget should reflect actual expenses</li>
              <li>• Budget changes affect program metrics</li>
              <li>• Maintain accurate financial records</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Contact Support */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Need help with program editing?{' '}
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

export default HealthProgramEdit;