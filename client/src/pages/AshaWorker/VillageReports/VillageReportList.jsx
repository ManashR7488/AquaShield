import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FiPlus, 
  FiSearch, 
  FiFilter, 
  FiFileText,
  FiCalendar,
  FiActivity,
  FiTrendingUp,
  FiDownload,
  FiAlertTriangle,
  FiCheckCircle
} from "react-icons/fi";
import { FaStethoscope } from "react-icons/fa";
import AdminTable from "../../../components/Admin/AdminTable";
import ConfirmDialog from "../../../components/Admin/ConfirmDialog";
import {
  getAllHealthReports,
  deleteHealthReport,
  getHealthReportStats
} from "../../../services/healthReportService";
import useAuthStore from "../../../store/useAuthStore";
import { getAshaWorkerVillages } from "../../../utils/ashaWorkerGuard.jsx";

/**
 * VillageReportList Component
 * Main listing page for health reports created by ASHA workers
 */
const VillageReportList = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Get ASHA worker's assigned villages
  const assignedVillages = getAshaWorkerVillages();
  
  // Component state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [stats, setStats] = useState({});
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedVillage, setSelectedVillage] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: 'delete',
    title: '',
    message: '',
    onConfirm: null,
    reportId: null
  });

  // Check if user is ASHA worker
  useEffect(() => {
    if (user && user.roleInfo?.role !== 'asha_worker') {
      navigate('/app');
    }
  }, [user, navigate]);

  // Fetch reports and statistics
  useEffect(() => {
    const fetchReportsAndStats = async () => {
      if (assignedVillages.length === 0) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch reports for all assigned villages
        const reportsPromises = assignedVillages.map(village => 
          getAllHealthReports(village._id, {
            page: currentPage,
            limit: itemsPerPage,
            search: searchTerm,
            reportType: selectedType !== 'all' ? selectedType : '',
            status: selectedStatus !== 'all' ? selectedStatus : '',
            priority: selectedPriority !== 'all' ? selectedPriority : '',
            sortBy: 'createdAt',
            sortOrder: 'desc'
          })
        );
        
        const reportsResponses = await Promise.all(reportsPromises);
        const allReports = reportsResponses.reduce((acc, response) => {
          if (response.success) {
            return [...acc, ...response.data];
          }
          return acc;
        }, []);
        
        setReports(allReports);
        setFilteredReports(allReports);
        
        // Calculate combined stats
        const combinedStats = reportsResponses.reduce((acc, response) => {
          if (response.success && response.stats) {
            acc.total = (acc.total || 0) + (response.stats.total || 0);
            acc.pending = (acc.pending || 0) + (response.stats.pending || 0);
            acc.urgent = (acc.urgent || 0) + (response.stats.urgent || 0);
          }
          return acc;
        }, {});
        
        setStats(combinedStats);
        
      } catch (err) {
        console.error('Error fetching reports:', err);
        setError('An unexpected error occurred while fetching reports');
      } finally {
        setLoading(false);
      }
    };

    fetchReportsAndStats();
  }, [assignedVillages, currentPage, itemsPerPage, searchTerm, selectedType, selectedStatus, selectedPriority]);

  // Filter reports based on search and filters
  useEffect(() => {
    let filtered = reports;

    if (searchTerm) {
      filtered = filtered.filter(report =>
        report.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.village?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedVillage !== 'all') {
      filtered = filtered.filter(report => report.villageId === selectedVillage);
    }

    setFilteredReports(filtered);
  }, [reports, searchTerm, selectedVillage]);

  // Handle report deletion
  const handleDeleteReport = async (reportId) => {
    try {
      const response = await deleteHealthReport(reportId);
      if (response.success) {
        setReports(prev => prev.filter(report => report._id !== reportId));
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      } else {
        setError(response.error || 'Failed to delete report');
      }
    } catch (err) {
      console.error('Error deleting report:', err);
      setError('An error occurred while deleting the report');
    }
  };

  // Table columns configuration
  const columns = [
    {
      key: "reportType",
      label: "Report Type",
      sortable: true,
      render: (report) => (
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            report.reportType === 'disease_outbreak' ? 'bg-red-100' :
            report.reportType === 'water_quality' ? 'bg-blue-100' :
            report.reportType === 'health_survey' ? 'bg-green-100' :
            report.reportType === 'emergency_alert' ? 'bg-orange-100' :
            'bg-gray-100'
          }`}>
            {report.reportType === 'disease_outbreak' ? <FiAlertTriangle className="text-red-600" size={14} /> :
             report.reportType === 'water_quality' ? <FaStethoscope className="text-blue-600" size={14} /> :
             report.reportType === 'health_survey' ? <FiActivity className="text-green-600" size={14} /> :
             report.reportType === 'emergency_alert' ? <FiAlertTriangle className="text-orange-600" size={14} /> :
             <FiFileText className="text-gray-600" size={14} />}
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {report.reportType?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'}
            </div>
            <div className="text-sm text-gray-500">{report.title || 'No title'}</div>
          </div>
        </div>
      )
    },
    {
      key: "village",
      label: "Village",
      render: (report) => (
        <div>
          <div className="font-medium text-gray-900">
            {report.village?.name || 'Unknown Village'}
          </div>
          <div className="text-sm text-gray-500">
            {report.village?.block || 'Unknown Block'}
          </div>
        </div>
      )
    },
    {
      key: "reportDate",
      label: "Report Date",
      sortable: true,
      render: (report) => (
        <div>
          <div className="font-medium text-gray-900">
            {new Date(report.reportDate || report.createdAt).toLocaleDateString()}
          </div>
          <div className="text-sm text-gray-500">
            {new Date(report.reportDate || report.createdAt).toLocaleTimeString()}
          </div>
        </div>
      )
    },
    {
      key: "status",
      label: "Status",
      render: (report) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          report.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
          report.status === 'approved' ? 'bg-green-100 text-green-800' :
          report.status === 'draft' ? 'bg-gray-100 text-gray-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {report.status?.charAt(0).toUpperCase() + report.status?.slice(1) || 'Draft'}
        </span>
      )
    },
    {
      key: "priority",
      label: "Priority",
      render: (report) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          report.priority === 'urgent' ? 'bg-red-100 text-red-800' :
          report.priority === 'high' ? 'bg-orange-100 text-orange-800' :
          report.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {report.priority?.charAt(0).toUpperCase() + report.priority?.slice(1) || 'Low'}
        </span>
      )
    },
    {
      key: "actions",
      label: "Actions",
      render: (report) => (
        <div className="flex space-x-2">
          <button
            onClick={() => navigate(`/app/village-reports/${report._id}`)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View
          </button>
          <button
            onClick={() => setConfirmDialog({
              isOpen: true,
              type: 'delete',
              title: 'Delete Report',
              message: 'Are you sure you want to delete this health report? This action cannot be undone.',
              onConfirm: () => handleDeleteReport(report._id),
              reportId: report._id
            })}
            className="text-red-600 hover:text-red-800 text-sm font-medium"
          >
            Delete
          </button>
        </div>
      )
    }
  ];

  // Filter configuration
  const filters = [
    // Add village filter only if multiple villages are assigned
    ...(assignedVillages.length > 1 ? [{
      key: "village",
      label: "Village",
      value: selectedVillage,
      onChange: setSelectedVillage,
      options: [
        { value: "all", label: "All Villages" },
        ...assignedVillages.map(village => ({
          value: village._id,
          label: village.name
        }))
      ]
    }] : []),
    {
      key: "reportType",
      label: "Report Type",
      value: selectedType,
      onChange: setSelectedType,
      options: [
        { value: "all", label: "All Types" },
        { value: "disease_outbreak", label: "Disease Outbreak" },
        { value: "water_quality", label: "Water Quality" },
        { value: "health_survey", label: "Health Survey" },
        { value: "emergency_alert", label: "Emergency Alert" },
        { value: "routine_checkup", label: "Routine Checkup" }
      ]
    },
    {
      key: "status",
      label: "Status",
      value: selectedStatus,
      onChange: setSelectedStatus,
      options: [
        { value: "all", label: "All Statuses" },
        { value: "draft", label: "Draft" },
        { value: "submitted", label: "Submitted" },
        { value: "approved", label: "Approved" }
      ]
    },
    {
      key: "priority",
      label: "Priority",
      value: selectedPriority,
      onChange: setSelectedPriority,
      options: [
        { value: "all", label: "All Priorities" },
        { value: "urgent", label: "Urgent" },
        { value: "high", label: "High" },
        { value: "medium", label: "Medium" },
        { value: "low", label: "Low" }
      ]
    }
  ];

  // if (!assignedVillages.length) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
  //       <div className="text-center">
  //         <FiFileText className="mx-auto h-12 w-12 text-gray-400" />
  //         <h3 className="mt-2 text-sm font-medium text-gray-900">No Assigned Villages</h3>
  //         <p className="mt-1 text-sm text-gray-500">You need to be assigned to villages to create health reports.</p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Village Health Reports</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Manage health reports for your assigned villages
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => navigate('/app/village-reports/new')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <FiPlus size={16} />
                  <span>Create New Report</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <FiFileText className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Reports</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <FiCalendar className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Pending Submissions</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pending || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <FiAlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Urgent Alerts</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.urgent || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <FiCheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Assigned Villages</p>
                <p className="text-2xl font-semibold text-gray-900">{assignedVillages.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search reports, villages, or descriptions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                {filters.map(filter => (
                  <select
                    key={filter.key}
                    value={filter.value}
                    onChange={(e) => filter.onChange(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {filter.options.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Reports Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-400">
              <div className="flex">
                <FiAlertTriangle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <AdminTable
            data={filteredReports}
            columns={columns}
            loading={loading}
            emptyState={{
              icon: FiFileText,
              title: "No health reports found",
              description: "Create your first health report to get started."
            }}
          />
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

export default VillageReportList;