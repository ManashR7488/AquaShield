import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  FiArrowLeft, 
  FiEdit, 
  FiTrash2, 
  FiDownload, 
  FiShare,
  FiCalendar,
  FiMapPin,
  FiUser,
  FiFileText,
  FiAlertTriangle,
  FiTag,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiPrinter
} from "react-icons/fi";
import { FaStethoscope } from "react-icons/fa";
import ConfirmDialog from "../../../components/Admin/ConfirmDialog";
import {
  getHealthReportById,
  deleteHealthReport
} from "../../../services/healthReportService";
import useAuthStore from "../../../store/useAuthStore";
import { canManageVillage } from "../../../utils/ashaWorkerGuard.jsx";

/**
 * HealthReportView Component
 * Detailed view of a specific health report
 */
const HealthReportView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Component state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);
  
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: 'delete',
    title: '',
    message: '',
    onConfirm: null
  });

  // Check if user is ASHA worker
  useEffect(() => {
    if (user && user.roleInfo?.role !== 'asha_worker') {
      navigate('/app');
    }
  }, [user, navigate]);

  // Fetch report details
  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await getHealthReportById(id);
        
        if (response.success) {
          setReport(response.data);
          
          // Check if user can access this report
          if (!canManageVillage(response.data.villageId)) {
            setError('You do not have permission to view this report');
          }
        } else {
          setError(response.error || 'Failed to fetch report details');
        }
      } catch (err) {
        console.error('Error fetching report:', err);
        setError('An unexpected error occurred while fetching the report');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchReport();
    }
  }, [id]);

  // Handle report deletion
  const handleDeleteReport = async () => {
    try {
      const response = await deleteHealthReport(id);
      if (response.success) {
        navigate('/app/village-reports', {
          replace: true,
          state: { 
            message: 'Health report deleted successfully!', 
            type: 'success' 
          }
        });
      } else {
        setError(response.error || 'Failed to delete report');
      }
    } catch (err) {
      console.error('Error deleting report:', err);
      setError('An error occurred while deleting the report');
    } finally {
      setConfirmDialog({ ...confirmDialog, isOpen: false });
    }
  };

  // Report type configurations
  const reportTypeConfigs = {
    disease_outbreak: {
      label: "Disease Outbreak Report",
      icon: FiAlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-100"
    },
    water_quality: {
      label: "Water Quality Report",
      icon: FaStethoscope,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    health_survey: {
      label: "Health Survey Report",
      icon: FiFileText,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    emergency_alert: {
      label: "Emergency Alert",
      icon: FiAlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-100"
    },
    routine_checkup: {
      label: "Routine Health Checkup",
      icon: FiCheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100"
    }
  };

  // Get current report type configuration
  const currentTypeConfig = report ? 
    (reportTypeConfigs[report.reportType] || reportTypeConfigs.routine_checkup) : 
    reportTypeConfigs.routine_checkup;

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading report details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <FiXCircle className="text-red-600" size={24} />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Error Loading Report</h3>
          <p className="mt-2 text-sm text-gray-500 max-w-md">
            {error || 'The requested report could not be found.'}
          </p>
          <button
            onClick={() => navigate('/app/village-reports')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Reports
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/app/village-reports')}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <FiArrowLeft size={20} />
                </button>
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentTypeConfig.bgColor}`}>
                    <currentTypeConfig.icon className={`${currentTypeConfig.color}`} size={20} />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{report.title}</h1>
                    <p className="mt-1 text-sm text-gray-500">{currentTypeConfig.label}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigate('/app/village-reports/new')}
                  className="flex items-center space-x-2 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
                >
                  <FiEdit size={16} />
                  <span>Create New Report</span>
                </button>
                
                <button
                  onClick={() => setConfirmDialog({
                    isOpen: true,
                    type: 'delete',
                    title: 'Delete Health Report',
                    message: 'Are you sure you want to delete this health report? This action cannot be undone and all associated data will be permanently removed.',
                    onConfirm: handleDeleteReport
                  })}
                  className="flex items-center space-x-2 px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50"
                >
                  <FiTrash2 size={16} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Report Information</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start space-x-3">
                    <FiCalendar className="text-gray-400 mt-1" size={16} />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Report Date</p>
                      <p className="text-base text-gray-900">{formatDate(report.reportDate)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <FiMapPin className="text-gray-400 mt-1" size={16} />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Village</p>
                      <p className="text-base text-gray-900">
                        {report.village?.name || 'Unknown Village'}
                      </p>
                      {report.village?.block && (
                        <p className="text-sm text-gray-500">{report.village.block}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <FiTag className="text-gray-400 mt-1" size={16} />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Priority Level</p>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        report.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        report.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        report.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {report.priority?.charAt(0).toUpperCase() + report.priority?.slice(1) || 'Low'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <FiFileText className="text-gray-400 mt-1" size={16} />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        report.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                        report.status === 'approved' ? 'bg-green-100 text-green-800' :
                        report.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {report.status?.charAt(0).toUpperCase() + report.status?.slice(1) || 'Draft'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-sm font-medium text-gray-500 mb-2">Description</p>
                  <p className="text-gray-900 leading-relaxed">
                    {report.description || 'No description provided.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Location Information */}
            {(report.location?.specificLocation || report.location?.landmark || report.location?.coordinates) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Location Details</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {report.location.specificLocation && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Specific Location</p>
                        <p className="text-gray-900">{report.location.specificLocation}</p>
                      </div>
                    )}
                    
                    {report.location.landmark && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Landmark</p>
                        <p className="text-gray-900">{report.location.landmark}</p>
                      </div>
                    )}
                    
                    {report.location.coordinates && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">GPS Coordinates</p>
                        <p className="text-gray-900 font-mono text-sm">{report.location.coordinates}</p>
                      </div>
                    )}
                    
                    {report.location.areaType && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Area Type</p>
                        <p className="text-gray-900">
                          {report.location.areaType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Type-Specific Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">{currentTypeConfig.label} Details</h3>
              </div>
              <div className="p-6">
                {/* Disease Outbreak Specific */}
                {report.reportType === 'disease_outbreak' && (
                  <div className="space-y-4">
                    {report.affectedCount && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Number of Affected People</p>
                        <p className="text-2xl font-bold text-red-600">{report.affectedCount}</p>
                      </div>
                    )}
                    
                    {report.suspectedCause && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Suspected Cause</p>
                        <p className="text-gray-900">{report.suspectedCause}</p>
                      </div>
                    )}
                    
                    {report.symptoms && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Symptoms Observed</p>
                        <p className="text-gray-900 leading-relaxed">{report.symptoms}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Water Quality Specific */}
                {report.reportType === 'water_quality' && (
                  <div className="space-y-4">
                    {report.waterSource && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Water Source</p>
                        <p className="text-gray-900">
                          {report.waterSource.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                      </div>
                    )}
                    
                    {report.qualityStatus && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Quality Status</p>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          report.qualityStatus === 'good' ? 'bg-green-100 text-green-800' :
                          report.qualityStatus === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                          report.qualityStatus === 'poor' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {report.qualityStatus.charAt(0).toUpperCase() + report.qualityStatus.slice(1)}
                        </span>
                      </div>
                    )}
                    
                    {report.qualityParameters && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Quality Parameters & Issues</p>
                        <p className="text-gray-900 leading-relaxed">{report.qualityParameters}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Health Survey Specific */}
                {report.reportType === 'health_survey' && (
                  <div className="space-y-4">
                    {report.surveyType && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Survey Type</p>
                        <p className="text-gray-900">
                          {report.surveyType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                      </div>
                    )}
                    
                    {report.participantCount && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Number of Participants</p>
                        <p className="text-2xl font-bold text-green-600">{report.participantCount}</p>
                      </div>
                    )}
                    
                    {report.surveyFindings && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Survey Findings</p>
                        <p className="text-gray-900 leading-relaxed">{report.surveyFindings}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Emergency Alert Specific */}
                {report.reportType === 'emergency_alert' && (
                  <div className="space-y-4">
                    {report.emergencyType && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Emergency Type</p>
                        <p className="text-gray-900">
                          {report.emergencyType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                      </div>
                    )}
                    
                    {report.severityLevel && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Severity Level</p>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          report.severityLevel === 'critical' ? 'bg-red-100 text-red-800' :
                          report.severityLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                          report.severityLevel === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {report.severityLevel.charAt(0).toUpperCase() + report.severityLevel.slice(1)}
                        </span>
                      </div>
                    )}
                    
                    {report.immediateActions && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Immediate Actions Taken</p>
                        <p className="text-gray-900 leading-relaxed">{report.immediateActions}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Recommendations and Actions */}
            {(report.recommendations || report.resourcesNeeded || report.followUpActions) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Recommendations & Actions</h3>
                </div>
                <div className="p-6 space-y-6">
                  {report.recommendations && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Recommendations</p>
                      <p className="text-gray-900 leading-relaxed">{report.recommendations}</p>
                    </div>
                  )}
                  
                  {report.resourcesNeeded && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Resources Needed</p>
                      <p className="text-gray-900 leading-relaxed">{report.resourcesNeeded}</p>
                    </div>
                  )}
                  
                  {report.followUpActions && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Follow-up Actions Required</p>
                      <p className="text-gray-900 leading-relaxed">{report.followUpActions}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
              </div>
              <div className="p-6 space-y-3">
                <button className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 rounded-lg border border-gray-200">
                  <FiDownload className="text-gray-400" size={16} />
                  <span className="text-gray-700">Download Report</span>
                </button>
                
                <button className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 rounded-lg border border-gray-200">
                  <FiPrinter className="text-gray-400" size={16} />
                  <span className="text-gray-700">Print Report</span>
                </button>
                
                <button className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 rounded-lg border border-gray-200">
                  <FiShare className="text-gray-400" size={16} />
                  <span className="text-gray-700">Share Report</span>
                </button>
              </div>
            </div>

            {/* Report Metadata */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Report Metadata</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Created By</p>
                  <p className="text-gray-900">{report.createdBy?.name || 'Unknown'}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Created On</p>
                  <p className="text-gray-900">{formatDate(report.createdAt)}</p>
                </div>
                
                {report.updatedAt && report.updatedAt !== report.createdAt && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Last Updated</p>
                    <p className="text-gray-900">{formatDate(report.updatedAt)}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Report ID</p>
                  <p className="text-gray-900 font-mono text-xs">{report._id}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
      />
    </div>
  );
};

export default HealthReportView;