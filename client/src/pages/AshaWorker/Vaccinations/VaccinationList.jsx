import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FiPlus, 
  FiSearch, 
  FiFilter, 
  FiShield,
  FiCalendar,
  FiUser,
  FiMapPin,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiActivity
} from "react-icons/fi";
import AdminTable from "../../../components/Admin/AdminTable";
import ConfirmDialog from "../../../components/Admin/ConfirmDialog";
import {
  getAllVaccinations,
  markVaccinationComplete,
  deleteVaccination
} from "../../../services/vaccinationService";
import useAuthStore from "../../../store/useAuthStore";
import { getAshaWorkerVillages } from "../../../utils/ashaWorkerGuard.jsx";

/**
 * VaccinationList Component
 * Main listing page for vaccination records managed by ASHA workers
 */
const VaccinationList = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Get ASHA worker's assigned villages
  const assignedVillages = getAshaWorkerVillages();
  
  // Component state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vaccinations, setVaccinations] = useState([]);
  const [filteredVaccinations, setFilteredVaccinations] = useState([]);
  const [stats, setStats] = useState({});
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedVaccineType, setSelectedVaccineType] = useState("all");
  const [selectedVillage, setSelectedVillage] = useState("all");
  const [selectedDateRange, setSelectedDateRange] = useState("all");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: 'delete',
    title: '',
    message: '',
    onConfirm: null,
    vaccinationId: null
  });

  // Check if user is ASHA worker
  useEffect(() => {
    if (user && user.roleInfo?.role !== 'asha_worker') {
      navigate('/app');
    }
  }, [user, navigate]);

  // Fetch vaccinations and statistics
  useEffect(() => {
    const fetchVaccinationsAndStats = async () => {
      if (assignedVillages.length === 0) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch vaccinations for all assigned villages
        const vaccinationsPromises = assignedVillages.map(village => 
          getAllVaccinations(village._id, {
            page: currentPage,
            limit: itemsPerPage,
            search: searchTerm,
            status: selectedStatus !== 'all' ? selectedStatus : '',
            vaccineType: selectedVaccineType !== 'all' ? selectedVaccineType : '',
            dateRange: selectedDateRange !== 'all' ? selectedDateRange : '',
            sortBy: 'scheduledDate',
            sortOrder: 'asc'
          })
        );
        
        const vaccinationsResponses = await Promise.all(vaccinationsPromises);
        const allVaccinations = vaccinationsResponses.reduce((acc, response) => {
          if (response.success) {
            return [...acc, ...response.data];
          }
          return acc;
        }, []);
        
        setVaccinations(allVaccinations);
        setFilteredVaccinations(allVaccinations);
        
        // Calculate combined stats
        const combinedStats = vaccinationsResponses.reduce((acc, response) => {
          if (response.success && response.stats) {
            acc.total = (acc.total || 0) + (response.stats.total || 0);
            acc.scheduled = (acc.scheduled || 0) + (response.stats.scheduled || 0);
            acc.completed = (acc.completed || 0) + (response.stats.completed || 0);
            acc.overdue = (acc.overdue || 0) + (response.stats.overdue || 0);
            acc.cancelled = (acc.cancelled || 0) + (response.stats.cancelled || 0);
          }
          return acc;
        }, {});
        
        setStats(combinedStats);
        
      } catch (err) {
        console.error('Error fetching vaccinations:', err);
        setError('An unexpected error occurred while fetching vaccination records');
      } finally {
        setLoading(false);
      }
    };

    fetchVaccinationsAndStats();
  }, [assignedVillages, currentPage, itemsPerPage, searchTerm, selectedStatus, selectedVaccineType, selectedDateRange]);

  // Filter vaccinations based on search and filters
  useEffect(() => {
    let filtered = vaccinations;

    if (searchTerm) {
      filtered = filtered.filter(vaccination =>
        vaccination.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vaccination.vaccineType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vaccination.batchNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vaccination.village?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedVillage !== 'all') {
      filtered = filtered.filter(vaccination => vaccination.villageId === selectedVillage);
    }

    setFilteredVaccinations(filtered);
  }, [vaccinations, searchTerm, selectedVillage]);

  // Handle vaccination completion
  const handleMarkComplete = async (vaccinationId) => {
    try {
      const response = await markVaccinationComplete(vaccinationId, {
        completedDate: new Date().toISOString(),
        administeredBy: user._id,
        notes: 'Marked complete by ASHA worker'
      });
      
      if (response.success) {
        setVaccinations(prev => prev.map(vaccination =>
          vaccination._id === vaccinationId
            ? { ...vaccination, status: 'completed', completedDate: new Date().toISOString() }
            : vaccination
        ));
      } else {
        setError(response.error || 'Failed to mark vaccination as complete');
      }
    } catch (err) {
      console.error('Error marking vaccination complete:', err);
      setError('An error occurred while updating vaccination status');
    }
  };

  // Handle vaccination deletion
  const handleDeleteVaccination = async (vaccinationId) => {
    try {
      const response = await deleteVaccination(vaccinationId);
      if (response.success) {
        setVaccinations(prev => prev.filter(vaccination => vaccination._id !== vaccinationId));
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      } else {
        setError(response.error || 'Failed to delete vaccination record');
      }
    } catch (err) {
      console.error('Error deleting vaccination:', err);
      setError('An error occurred while deleting the vaccination record');
    }
  };

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Get status badge
  const getStatusBadge = (vaccination) => {
    const today = new Date();
    const scheduledDate = new Date(vaccination.scheduledDate);
    
    let status = vaccination.status;
    let className = '';
    let icon = null;
    
    // Determine if overdue
    if (status === 'scheduled' && scheduledDate < today) {
      status = 'overdue';
    }
    
    switch (status) {
      case 'completed':
        className = 'bg-green-100 text-green-800';
        icon = FiCheckCircle;
        break;
      case 'scheduled':
        className = 'bg-blue-100 text-blue-800';
        icon = FiCalendar;
        break;
      case 'overdue':
        className = 'bg-red-100 text-red-800';
        icon = FiAlertCircle;
        break;
      case 'cancelled':
        className = 'bg-gray-100 text-gray-800';
        icon = FiAlertCircle;
        break;
      default:
        className = 'bg-yellow-100 text-yellow-800';
        icon = FiClock;
    }
    
    const IconComponent = icon;
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center space-x-1 ${className}`}>
        <IconComponent size={12} />
        <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
      </span>
    );
  };

  // Table columns configuration
  const columns = [
    {
      key: "patient",
      label: "Patient",
      sortable: true,
      render: (vaccination) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <FiUser className="text-blue-600" size={14} />
          </div>
          <div>
            <div className="font-medium text-gray-900">{vaccination.patient?.name || 'Unknown Patient'}</div>
            <div className="text-sm text-gray-500">
              {vaccination.patient?.age && `${vaccination.patient.age} years`} • 
              {vaccination.patient?.gender || 'Unknown'}
            </div>
          </div>
        </div>
      )
    },
    {
      key: "vaccine",
      label: "Vaccine Information",
      render: (vaccination) => (
        <div>
          <div className="font-medium text-gray-900">
            {vaccination.vaccineType || 'Unknown Vaccine'}
          </div>
          <div className="text-sm text-gray-500">
            Dose: {vaccination.doseNumber || 1} of {vaccination.totalDoses || 'Unknown'}
          </div>
          {vaccination.batchNumber && (
            <div className="text-xs text-gray-400">Batch: {vaccination.batchNumber}</div>
          )}
        </div>
      )
    },
    {
      key: "scheduledDate",
      label: "Scheduled Date",
      sortable: true,
      render: (vaccination) => {
        const isOverdue = new Date(vaccination.scheduledDate) < new Date() && vaccination.status === 'scheduled';
        return (
          <div>
            <div className={`font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
              {formatDate(vaccination.scheduledDate)}
            </div>
            {vaccination.scheduledTime && (
              <div className="text-sm text-gray-500">{vaccination.scheduledTime}</div>
            )}
            {isOverdue && (
              <div className="text-xs text-red-500 font-medium">Overdue</div>
            )}
          </div>
        );
      }
    },
    {
      key: "village",
      label: "Village",
      render: (vaccination) => (
        <div>
          <div className="font-medium text-gray-900">
            {vaccination.village?.name || 'Unknown Village'}
          </div>
          <div className="text-sm text-gray-500">
            {vaccination.village?.block || 'Unknown Block'}
          </div>
        </div>
      )
    },
    {
      key: "status",
      label: "Status",
      render: (vaccination) => getStatusBadge(vaccination)
    },
    {
      key: "completedDate",
      label: "Completed Date",
      render: (vaccination) => (
        <div>
          {vaccination.completedDate ? (
            <>
              <div className="font-medium text-gray-900">
                {formatDate(vaccination.completedDate)}
              </div>
              {vaccination.administeredBy?.name && (
                <div className="text-sm text-gray-500">
                  By: {vaccination.administeredBy.name}
                </div>
              )}
            </>
          ) : (
            <span className="text-gray-500 text-sm">Not completed</span>
          )}
        </div>
      )
    },
    {
      key: "actions",
      label: "Actions",
      render: (vaccination) => {
        const isOverdue = new Date(vaccination.scheduledDate) < new Date() && vaccination.status === 'scheduled';
        
        return (
          <div className="flex space-x-2">
            <button
              onClick={() => navigate('/app/vaccinations/complete')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View
            </button>
            
            {vaccination.status === 'scheduled' && (
              <button
                onClick={() => handleMarkComplete(vaccination._id)}
                className="text-green-600 hover:text-green-800 text-sm font-medium"
              >
                Mark Complete
              </button>
            )}
            
            <button
              onClick={() => setConfirmDialog({
                isOpen: true,
                type: 'delete',
                title: 'Delete Vaccination Record',
                message: 'Are you sure you want to delete this vaccination record? This action cannot be undone.',
                onConfirm: () => handleDeleteVaccination(vaccination._id),
                vaccinationId: vaccination._id
              })}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Delete
            </button>
          </div>
        );
      }
    }
  ];

  // Filter configuration
  const filters = [
    {
      key: "status",
      label: "Status",
      value: selectedStatus,
      onChange: setSelectedStatus,
      options: [
        { value: "all", label: "All Statuses" },
        { value: "scheduled", label: "Scheduled" },
        { value: "completed", label: "Completed" },
        { value: "overdue", label: "Overdue" },
        { value: "cancelled", label: "Cancelled" }
      ]
    },
    {
      key: "vaccineType",
      label: "Vaccine Type",
      value: selectedVaccineType,
      onChange: setSelectedVaccineType,
      options: [
        { value: "all", label: "All Vaccines" },
        { value: "BCG", label: "BCG" },
        { value: "OPV", label: "OPV (Polio)" },
        { value: "DPT", label: "DPT" },
        { value: "Hepatitis_B", label: "Hepatitis B" },
        { value: "Measles", label: "Measles" },
        { value: "MMR", label: "MMR" },
        { value: "Tetanus", label: "Tetanus" },
        { value: "COVID-19", label: "COVID-19" }
      ]
    },
    {
      key: "dateRange",
      label: "Date Range",
      value: selectedDateRange,
      onChange: setSelectedDateRange,
      options: [
        { value: "all", label: "All Dates" },
        { value: "today", label: "Today" },
        { value: "this_week", label: "This Week" },
        { value: "this_month", label: "This Month" },
        { value: "overdue", label: "Overdue Only" }
      ]
    }
  ];

  // if (!assignedVillages.length) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
  //       <div className="text-center">
  //         <FiShield className="mx-auto h-12 w-12 text-gray-400" />
  //         <h3 className="mt-2 text-sm font-medium text-gray-900">No Assigned Villages</h3>
  //         <p className="mt-1 text-sm text-gray-500">You need to be assigned to villages to manage vaccinations.</p>
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
                <h1 className="text-2xl font-bold text-gray-900">Vaccination Management</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Track and manage vaccination schedules for your assigned villages
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => navigate('/app/vaccinations/schedule')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <FiPlus size={16} />
                  <span>Schedule Vaccination</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <FiShield className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Vaccinations</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <FiCalendar className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Scheduled</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.scheduled || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <FiCheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.completed || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <FiAlertCircle className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Overdue</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.overdue || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <FiActivity className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Villages</p>
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
                    placeholder="Search by patient name, vaccine type, batch number, or village..."
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
                
                {assignedVillages.length > 1 && (
                  <select
                    value={selectedVillage}
                    onChange={(e) => setSelectedVillage(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Villages</option>
                    {assignedVillages.map(village => (
                      <option key={village._id} value={village._id}>
                        {village.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Vaccinations Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-400">
              <div className="flex">
                <FiAlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <AdminTable
            data={filteredVaccinations}
            columns={columns}
            loading={loading}
            emptyState={{
              icon: FiShield,
              title: "No vaccination records found",
              description: "Schedule your first vaccination to get started with immunization tracking."
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

export default VaccinationList;