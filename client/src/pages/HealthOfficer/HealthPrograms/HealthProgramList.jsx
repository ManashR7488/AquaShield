import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FiPlus, 
  FiSearch, 
  FiFilter, 
  FiUsers, 
  FiCalendar,
  FiActivity,
  FiTrendingUp,
  FiDownload
} from "react-icons/fi";
import { FaHeart, FaStethoscope } from "react-icons/fa";
import AdminTable from "../../../components/Admin/AdminTable";
import ConfirmDialog from "../../../components/Admin/ConfirmDialog";
import {
  getAllHealthPrograms,
  deleteHealthProgram,
  updateProgramStatus,
  getActiveProgramsSummary
} from "../../../services/healthProgramService";
import useAuthStore from "../../../store/useAuthStore";
import { getHealthOfficerDistrict } from "../../../utils/healthOfficerGuard.jsx";

/**
 * HealthProgramList Component
 * Main listing page for health programs within the health officer's district
 */
const HealthProgramList = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Get health officer's district ID
  const districtId = getHealthOfficerDistrict();
  
  // Component state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [filteredPrograms, setFilteredPrograms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [stats, setStats] = useState({});
  
  // Action loading states
  const [actionLoading, setActionLoading] = useState(false);
  
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
    programId: null
  });

  // Check if user is health officer
  useEffect(() => {
    if (user && user.roleInfo?.role !== 'health_official') {
      navigate('/app');
    }
  }, [user, navigate]);

  // Fetch health programs and statistics
  useEffect(() => {
    const fetchProgramsAndStats = async () => {
      if (!districtId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch programs and stats in parallel
        const [programsResponse] = await Promise.all([
          getAllHealthPrograms(districtId, { 
            page: currentPage,
            limit: itemsPerPage,
            search: searchTerm,
            type: selectedType,
            status: selectedStatus,
            sortBy: 'createdAt',
            sortOrder: 'desc'
          })
        ]);
        
        if (programsResponse.success) {
          setPrograms(programsResponse.data);
          setFilteredPrograms(programsResponse.data);
          // Set stats from the programs response which includes stats
          setStats(programsResponse.stats || {});
        } else {
          setError(programsResponse.error || 'Failed to fetch health programs');
        }
        
      } catch (err) {
        console.error('Error fetching health programs:', err);
        setError('An unexpected error occurred while fetching health programs');
      } finally {
        setLoading(false);
      }
    };

    fetchProgramsAndStats();
  }, [districtId]);

  // Filter and search programs
  useEffect(() => {
    let filtered = programs;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(program =>
        program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        program.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        program.type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(program => program.status === statusFilter);
    }
    
    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(program => program.type === typeFilter);
    }
    
    setFilteredPrograms(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [programs, searchTerm, statusFilter, typeFilter]);

  // Handle program deletion
  const handleDeleteProgram = async (programId) => {
    setActionLoading(true);
    
    try {
      const response = await deleteHealthProgram(programId);
      
      if (response.success) {
        // Remove program from state
        setPrograms(prev => prev.filter(program => program._id !== programId));
        // Show success toast notification
        console.log("Program deleted successfully");
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

  // Handle program status update
  const handleStatusUpdate = async (programId, newStatus) => {
    setActionLoading(true);
    
    try {
      const response = await updateProgramStatus(programId, newStatus);
      
      if (response.success) {
        // Update program status in state
        setPrograms(prev => prev.map(program => 
          program._id === programId 
            ? { ...program, status: newStatus }
            : program
        ));
        // Show success toast notification
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

  // Table columns configuration
  const columns = [
    {
      header: 'Program',
      accessor: 'name',
      render: (program) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              program.type === 'vaccination' ? 'bg-blue-100' :
              program.type === 'health_screening' ? 'bg-green-100' :
              program.type === 'awareness' ? 'bg-yellow-100' :
              program.type === 'water_quality' ? 'bg-cyan-100' :
              'bg-gray-100'
            }`}>
              {program.type === 'vaccination' ? <FaStethoscope className="text-blue-600" size={14} /> :
               program.type === 'health_screening' ? <FaHeart className="text-green-600" size={14} /> :
               program.type === 'awareness' ? <FiActivity className="text-yellow-600" size={14} /> :
               program.type === 'water_quality' ? <FiActivity className="text-cyan-600" size={14} /> :
               <FiActivity className="text-gray-600" size={14} />}
            </div>
          </div>
          <div>
            <p className="font-medium text-gray-900">{program.name}</p>
            <p className="text-sm text-gray-500 capitalize">{program.type?.replace('_', ' ')}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (program) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          program.status === 'active' 
            ? 'bg-green-100 text-green-800'
            : program.status === 'planned'
            ? 'bg-blue-100 text-blue-800'
            : program.status === 'completed'
            ? 'bg-gray-100 text-gray-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {program.status}
        </span>
      )
    },
    {
      header: 'Duration',
      accessor: 'duration',
      render: (program) => (
        <div className="text-sm">
          <div className="flex items-center space-x-1 text-gray-900">
            <FiCalendar size={14} />
            <span>
              {program.startDate ? new Date(program.startDate).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          <div className="text-gray-500 text-xs">
            to {program.endDate ? new Date(program.endDate).toLocaleDateString() : 'Ongoing'}
          </div>
        </div>
      )
    },
    {
      header: 'Participants',
      accessor: 'participants',
      render: (program) => (
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 text-gray-900">
            <FiUsers size={14} />
            <span className="font-medium">{program.participantCount || 0}</span>
          </div>
          <div className="text-xs text-gray-500">
            Target: {program.targetParticipants || 'N/A'}
          </div>
        </div>
      )
    },
    {
      header: 'Budget',
      accessor: 'budget',
      render: (program) => (
        <div className="text-right">
          <div className="text-gray-900 font-medium">
            ₹{program.budget?.allocated?.toLocaleString() || 'N/A'}
          </div>
          <div className="text-xs text-gray-500">
            Used: ₹{program.budget?.spent?.toLocaleString() || '0'}
          </div>
        </div>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (program) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate(`/app/health-programs/${program._id}`)}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            View
          </button>
          <button
            onClick={() => navigate(`/app/health-programs/${program._id}/edit`)}
            className="text-indigo-600 hover:text-indigo-700 text-sm"
          >
            Edit
          </button>
          
          {/* Status Toggle */}
          {program.status === 'active' ? (
            <button
              onClick={() => {
                setConfirmDialog({
                  isOpen: true,
                  type: 'warning',
                  title: 'Pause Program',
                  message: `Are you sure you want to pause "${program.name}"? This will stop all active activities.`,
                  onConfirm: () => {
                    handleStatusUpdate(program._id, 'paused');
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                  },
                  programId: program._id
                });
              }}
              disabled={actionLoading}
              className="text-yellow-600 hover:text-yellow-700 text-sm"
            >
              Pause
            </button>
          ) : program.status === 'paused' ? (
            <button
              onClick={() => {
                setConfirmDialog({
                  isOpen: true,
                  type: 'info',
                  title: 'Resume Program',
                  message: `Are you sure you want to resume "${program.name}"?`,
                  onConfirm: () => {
                    handleStatusUpdate(program._id, 'active');
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                  },
                  programId: program._id
                });
              }}
              disabled={actionLoading}
              className="text-green-600 hover:text-green-700 text-sm"
            >
              Resume
            </button>
          ) : null}
          
          <button
            onClick={() => {
              setConfirmDialog({
                isOpen: true,
                type: 'delete',
                title: 'Delete Program',
                message: `Are you sure you want to delete "${program.name}"? This action cannot be undone and will remove all associated data.`,
                onConfirm: () => {
                  handleDeleteProgram(program._id);
                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                },
                programId: program._id
              });
            }}
            disabled={actionLoading}
            className="text-red-600 hover:text-red-700 text-sm"
          >
            Delete
          </button>
        </div>
      )
    }
  ];

  // Pagination calculations
  const totalPages = Math.ceil(filteredPrograms.length / itemsPerPage);
  const paginatedPrograms = filteredPrograms.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Error state for no district
  if (!districtId) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">District Not Assigned</h2>
            <p className="text-gray-600 mb-4">You need to be assigned to a district to manage health programs.</p>
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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Health Program Management</h1>
            <p className="text-gray-600 mt-1">
              Manage and monitor health programs in{' '}
              <span className="font-medium text-blue-600">
                {user?.roleInfo?.hierarchy?.district?.name}
              </span>{' '}
              district
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/app/health-programs/new')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiPlus size={16} />
              <span>New Program</span>
            </button>
            
            <button
              onClick={() => {
                // TODO: Implement export functionality
                console.log('Export programs data');
              }}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FiDownload size={16} />
              <span>Export</span>
            </button>
          </div>
        </div>
        
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500">
          <button onClick={() => navigate('/app')} className="hover:text-gray-700">Dashboard</button>
          <span>/</span>
          <span className="text-gray-900">Health Program Management</span>
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
              <p className="text-sm font-medium text-gray-600">Total Programs</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.totalPrograms || programs.length || 0}
              </p>
            </div>
            <FiActivity className="text-blue-600" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Programs</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.activePrograms || programs.filter(p => p.status === 'active').length || 0}
              </p>
            </div>
            <FiTrendingUp className="text-green-600" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Participants</p>
              <p className="text-2xl font-bold text-indigo-600">
                {stats.totalParticipants || programs.reduce((sum, p) => sum + (p.participantCount || 0), 0) || 0}
              </p>
            </div>
            <FiUsers className="text-indigo-600" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Budget</p>
              <p className="text-2xl font-bold text-purple-600">
                ₹{((stats.totalBudget || programs.reduce((sum, p) => sum + (p.budget?.allocated || 0), 0)) / 100000).toFixed(1)}L
              </p>
            </div>
            <FaHeart className="text-purple-600" size={24} />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search programs by name, type, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            {/* Filters */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FiFilter size={16} className="text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="planned">Planned</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="vaccination">Vaccination</option>
                <option value="health_screening">Health Screening</option>
                <option value="awareness">Awareness Campaign</option>
                <option value="water_quality">Water Quality Program</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
          <p className="text-sm text-gray-600">
            Showing {paginatedPrograms.length} of {filteredPrograms.length} programs
            {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setTypeFilter('all');
                }}
                className="ml-2 text-blue-600 hover:text-blue-700"
              >
                Clear filters
              </button>
            )}
          </p>
        </div>
      </div>

      {/* Programs Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading health programs...</p>
            </div>
          </div>
        ) : filteredPrograms.length === 0 ? (
          <div className="text-center py-12">
            <FiActivity className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {programs.length === 0 ? 'No Programs Created' : 'No Programs Found'}
            </h3>
            <p className="text-gray-600 mb-4">
              {programs.length === 0 
                ? 'Get started by creating your first health program.'
                : 'Try adjusting your search or filter criteria.'}
            </p>
            {programs.length === 0 && (
              <button
                onClick={() => navigate('/app/health-programs/new')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Program
              </button>
            )}
          </div>
        ) : (
          <>
            <AdminTable
              columns={columns}
              data={paginatedPrograms}
              loading={loading}
            />
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredPrograms.length)} of {filteredPrograms.length} results
                  </p>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
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

export default HealthProgramList;