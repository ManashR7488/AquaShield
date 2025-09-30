import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiEdit,
  FiUsers,
  FiCalendar,
  FiActivity,
  FiBarChart,
  FiDollarSign,
  FiTarget,
  FiSettings,
  FiDownload,
  FiPlay,
  FiPause,
  FiCheckCircle
} from "react-icons/fi";
import { FaHeart, FaStethoscope } from "react-icons/fa";
import ConfirmDialog from "../../../components/Admin/ConfirmDialog";
import {
  getHealthProgramById,
  deleteHealthProgram,
  updateProgramStatus,
  getProgramParticipants,
  generateProgramReport,
  getProgramMetrics
} from "../../../services/healthProgramService";
import useAuthStore from "../../../store/useAuthStore";
import { getHealthOfficerDistrict, canAccessDistrictResource } from "../../../utils/healthOfficerGuard.jsx";

/**
 * HealthProgramView Component
 * Detailed view page for a specific health program
 */
const HealthProgramView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuthStore();
  
  // Get health officer's district ID
  const districtId = getHealthOfficerDistrict();
  
  // Component state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [programData, setProgramData] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [activeTab, setActiveTab] = useState('overview');
  
  // Action loading states
  const [actionLoading, setActionLoading] = useState(false);
  
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: 'delete',
    title: '',
    message: '',
    onConfirm: null
  });

  // Check if user is health officer
  useEffect(() => {
    if (user && user.roleInfo?.role !== 'health_official') {
      navigate('/app');
    }
  }, [user, navigate]);

  // Fetch all program data
  useEffect(() => {
    const fetchAllProgramData = async () => {
      if (!id || !districtId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch main program data
        const programResponse = await getHealthProgramById(id);
        
        if (!programResponse.success) {
          setError(programResponse.error || 'Failed to fetch program data');
          return;
        }
        
        const program = programResponse.data;
        
        // Verify that the program belongs to the health officer's district
        if (!canAccessDistrictResource('health_program', id)) {
          setError("You don't have permission to view this program. It belongs to a different district.");
          return;
        }
        
        // Additional check comparing program district to officer's district
        const officerDistrictId = getHealthOfficerDistrict();
        if (officerDistrictId && program.districtId && program.districtId !== officerDistrictId) {
          setError("You don't have permission to view this program. It belongs to a different district.");
          return;
        }
        
        setProgramData(program);
        
        // Fetch related data in parallel
        const [participantsResponse, metricsResponse] = await Promise.all([
          getProgramParticipants(id),
          getProgramMetrics(id)
        ]);
        
        if (participantsResponse.success) {
          setParticipants(participantsResponse.data);
        }
        
        if (metricsResponse.success) {
          setMetrics(metricsResponse.data);
        }
        
      } catch (err) {
        console.error('Error fetching program data:', err);
        setError('An unexpected error occurred while fetching program data');
      } finally {
        setLoading(false);
      }
    };

    fetchAllProgramData();
  }, [id, districtId]);

  // Handle delete program
  const handleDeleteProgram = async () => {
    setActionLoading(true);
    
    try {
      const response = await deleteHealthProgram(id);
      
      if (response.success) {
        console.log("Program deleted successfully");
        navigate('/app/health-programs');
      } else {
        setError(response.error || 'Failed to delete program');
      }
    } catch (err) {
      console.error('Error deleting program:', err);
      setError('An unexpected error occurred while deleting the program');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle status update
  const handleStatusUpdate = async (newStatus) => {
    setActionLoading(true);
    
    try {
      const response = await updateProgramStatus(id, newStatus);
      
      if (response.success) {
        setProgramData(prev => ({ ...prev, status: newStatus }));
        console.log("Program status updated successfully");
      } else {
        setError(response.error || 'Failed to update program status');
      }
    } catch (err) {
      console.error('Error updating program status:', err);
      setError('An unexpected error occurred while updating program status');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle generate report
  const handleGenerateReport = async () => {
    setActionLoading(true);
    
    try {
      const response = await generateProgramReport(id);
      
      if (response.success) {
        // Download or display report
        console.log("Report generated:", response.data);
        // TODO: Handle report download
      } else {
        setError(response.error || 'Failed to generate report');
      }
    } catch (err) {
      console.error('Error generating report:', err);
      setError('An unexpected error occurred while generating report');
    } finally {
      setActionLoading(false);
    }
  };

  // Get program type icon and color
  const getProgramTypeDetails = (type) => {
    const typeMap = {
      immunization: { icon: FaStethoscope, color: 'blue' },
      nutrition: { icon: FaHeart, color: 'green' },
      maternal_health: { icon: FaHeart, color: 'pink' },
      child_health: { icon: FaHeart, color: 'purple' },
      disease_prevention: { icon: FiActivity, color: 'red' },
      health_education: { icon: FiActivity, color: 'indigo' },
      default: { icon: FiActivity, color: 'gray' }
    };
    
    return typeMap[type] || typeMap.default;
  };

  // Calculate progress percentage
  const calculateProgress = () => {
    if (!programData?.targetParticipants || !programData?.participantCount) return 0;
    return Math.min((programData.participantCount / programData.targetParticipants) * 100, 100);
  };

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: FiActivity },
    { id: 'participants', label: 'Participants', icon: FiUsers },
    { id: 'metrics', label: 'Metrics', icon: FiBarChart },
    { id: 'budget', label: 'Budget', icon: FiDollarSign },
    { id: 'implementation', label: 'Implementation', icon: FiTarget },
    { id: 'settings', label: 'Settings', icon: FiSettings }
  ];

  // Loading state
  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading program details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (!districtId || error || !programData) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {!districtId ? "District Not Assigned" : error ? "Error" : "Program Not Found"}
            </h2>
            <p className="text-gray-600 mb-4">
              {error || (!districtId ? "You need to be assigned to a district to view programs." : "The requested program could not be found.")}
            </p>
            <button
              onClick={() => navigate('/app/health-programs')}
              className="text-blue-600 hover:text-blue-700"
            >
              Return to Programs
            </button>
          </div>
        </div>
      </div>
    );
  }

  const typeDetails = getProgramTypeDetails(programData.type);
  const TypeIcon = typeDetails.icon;
  const progress = calculateProgress();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/app/health-programs')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <FiArrowLeft size={20} />
            </button>
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 bg-${typeDetails.color}-100 rounded-lg flex items-center justify-center`}>
                <TypeIcon className={`text-${typeDetails.color}-600`} size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{programData.name}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                  <div className="flex items-center space-x-2">
                    <span>Program ID:</span>
                    <span className="font-mono text-gray-900">{programData._id}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center space-x-2">
                    <span>Type:</span>
                    <span className="font-medium text-blue-600 capitalize">
                      {programData.type?.replace('_', ' ')}
                    </span>
                  </div>
                  <span>•</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
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
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(`/app/health-programs/${id}/edit`)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FiEdit size={16} />
              <span>Edit</span>
            </button>
            
            <button
              onClick={() => {
                setConfirmDialog({
                  isOpen: true,
                  type: 'info',
                  title: 'Generate Report',
                  message: 'Generate a comprehensive report for this program?',
                  onConfirm: () => {
                    handleGenerateReport();
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                  }
                });
              }}
              disabled={actionLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <FiDownload size={16} />
              <span>Generate Report</span>
            </button>
            
            {/* Status Action Button */}
            {programData.status === 'planned' && (
              <button
                onClick={() => {
                  setConfirmDialog({
                    isOpen: true,
                    type: 'info',
                    title: 'Start Program',
                    message: `Are you sure you want to start "${programData.name}"? This will change the status to active.`,
                    onConfirm: () => {
                      handleStatusUpdate('active');
                      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                    }
                  });
                }}
                disabled={actionLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <FiPlay size={16} />
                <span>Start Program</span>
              </button>
            )}
            
            {programData.status === 'active' && (
              <button
                onClick={() => {
                  setConfirmDialog({
                    isOpen: true,
                    type: 'warning',
                    title: 'Pause Program',
                    message: `Are you sure you want to pause "${programData.name}"? This will stop all active activities.`,
                    onConfirm: () => {
                      handleStatusUpdate('paused');
                      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                    }
                  });
                }}
                disabled={actionLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-colors"
              >
                <FiPause size={16} />
                <span>Pause Program</span>
              </button>
            )}
            
            {programData.status === 'paused' && (
              <button
                onClick={() => {
                  setConfirmDialog({
                    isOpen: true,
                    type: 'info',
                    title: 'Resume Program',
                    message: `Are you sure you want to resume "${programData.name}"?`,
                    onConfirm: () => {
                      handleStatusUpdate('active');
                      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                    }
                  });
                }}
                disabled={actionLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <FiPlay size={16} />
                <span>Resume Program</span>
              </button>
            )}
            
            {(programData.status === 'active' || programData.status === 'paused') && (
              <button
                onClick={() => {
                  setConfirmDialog({
                    isOpen: true,
                    type: 'info',
                    title: 'Complete Program',
                    message: `Are you sure you want to mark "${programData.name}" as completed?`,
                    onConfirm: () => {
                      handleStatusUpdate('completed');
                      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                    }
                  });
                }}
                disabled={actionLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                <FiCheckCircle size={16} />
                <span>Complete</span>
              </button>
            )}
            
            <button
              onClick={() => {
                setConfirmDialog({
                  isOpen: true,
                  type: 'delete',
                  title: 'Delete Program',
                  message: `Are you sure you want to delete "${programData.name}"? This action cannot be undone and will remove all associated data.`,
                  onConfirm: () => {
                    handleDeleteProgram();
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                  }
                });
              }}
              disabled={actionLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {actionLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Delete</span>
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500">
          <button onClick={() => navigate('/app')} className="hover:text-gray-700">Dashboard</button>
          <span>/</span>
          <button onClick={() => navigate('/app/health-programs')} className="hover:text-gray-700">Health Program Management</button>
          <span>/</span>
          <span className="text-gray-900">{programData.name}</span>
        </nav>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Participants</p>
              <p className="text-2xl font-bold text-blue-600">
                {programData.participantCount || 0}
              </p>
              <p className="text-xs text-gray-500">
                Target: {programData.targetParticipants || 0}
              </p>
            </div>
            <FiUsers className="text-blue-600" size={24} />
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">{progress.toFixed(1)}% of target</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Budget Utilized</p>
              <p className="text-2xl font-bold text-green-600">
                {((programData.budget?.spent || 0) / 100000).toFixed(1)}L
              </p>
              <p className="text-xs text-gray-500">
                Total: {((programData.budget?.allocated || 0) / 100000).toFixed(1)}L
              </p>
            </div>
            <FiDollarSign className="text-green-600" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Target Blocks</p>
              <p className="text-2xl font-bold text-indigo-600">
                {programData.targetBlocks?.length || 0}
              </p>
            </div>
            <FiTarget className="text-indigo-600" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Duration</p>
              <p className="text-2xl font-bold text-purple-600">
                {programData.duration || 0}
              </p>
              <p className="text-xs text-gray-500">days</p>
            </div>
            <FiCalendar className="text-purple-600" size={24} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Program Description</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700">{programData.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Program Details */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Program Details</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Start Date:</span>
                      <span className="font-medium">
                        {programData.startDate ? new Date(programData.startDate).toLocaleDateString() : 'Not set'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">End Date:</span>
                      <span className="font-medium">
                        {programData.endDate ? new Date(programData.endDate).toLocaleDateString() : 'Ongoing'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Target Population:</span>
                      <span className="font-medium capitalize">{programData.targetPopulation?.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Priority:</span>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium capitalize ${
                        programData.priority === 'high' ? 'bg-red-100 text-red-800' :
                        programData.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {programData.priority}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Health Focus */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Health Focus</h3>
                  <div className="space-y-3">
                    {programData.healthFocus && (
                      <div>
                        <span className="text-gray-600">Focus Area:</span>
                        <p className="font-medium mt-1">{programData.healthFocus}</p>
                      </div>
                    )}
                    {programData.targetAgeGroup && (
                      <div>
                        <span className="text-gray-600">Age Group:</span>
                        <p className="font-medium mt-1">{programData.targetAgeGroup}</p>
                      </div>
                    )}
                    {programData.eligibilityCriteria && (
                      <div>
                        <span className="text-gray-600">Eligibility:</span>
                        <p className="text-sm text-gray-700 mt-1">{programData.eligibilityCriteria}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Key Interventions */}
              {programData.interventions && programData.interventions.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Key Interventions</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <ul className="space-y-2">
                      {programData.interventions.map((intervention, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-blue-600 mt-1">•</span>
                          <span className="text-gray-700">{intervention}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Other tab contents would be implemented similarly */}
          {activeTab === 'participants' && (
            <div className="text-center py-8">
              <FiUsers className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Participants Management</h3>
              <p className="text-gray-600">Participant management features coming soon.</p>
            </div>
          )}

          {activeTab === 'metrics' && (
            <div className="text-center py-8">
              <FiBarChart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Program Metrics</h3>
              <p className="text-gray-600">Metrics and analytics features coming soon.</p>
            </div>
          )}

          {activeTab === 'budget' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <p className="text-sm text-gray-600 mb-2">Allocated Budget</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ₹{programData.budget?.allocated?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <p className="text-sm text-gray-600 mb-2">Spent Budget</p>
                  <p className="text-2xl font-bold text-red-600">
                    ₹{programData.budget?.spent?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <p className="text-sm text-gray-600 mb-2">Remaining Budget</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₹{((programData.budget?.allocated || 0) - (programData.budget?.spent || 0)).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'implementation' && (
            <div className="space-y-6">
              {programData.implementationStrategy && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Implementation Strategy</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{programData.implementationStrategy}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Program Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Requires Approval</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      programData.requiresApproval ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {programData.requiresApproval ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Public Program</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      programData.isPublic ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {programData.isPublic ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Reporting Frequency</span>
                    <span className="font-medium capitalize">
                      {programData.reportingFrequency?.replace('_', ' ') || 'Not set'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
      />
    </div>
  );
};

export default HealthProgramView;