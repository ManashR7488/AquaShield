import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiPlus, FiSearch, FiFilter, FiRefreshCw, FiEye, FiEdit2, FiAlertTriangle, FiActivity, FiClock, FiUser } from 'react-icons/fi';
import healthObservationService from '../../../services/healthObservationService';
import useAuthStore from '../../../store/useAuthStore';
import { getVolunteerAreas } from '../../../utils/volunteerGuard.jsx';
import { toast } from 'react-toastify';

/**
 * List view for all health observations recorded by volunteers
 * Includes filtering, search, and quick actions
 */
const HealthObservationList = () => {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const [observations, setObservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    severity: 'all',
    symptomType: 'all',
    status: 'all',
    dateRange: 'all'
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const observationsPerPage = 10;

  useEffect(() => {
    loadObservations();
  }, [currentPage, filters, searchTerm]);

  /**
   * Load health observations with current filters and pagination
   */
  const loadObservations = async () => {
    try {
      setIsLoading(true);
      
      // Get volunteer areas for filtering
      const volunteerAreas = getVolunteerAreas(user);
      
      const params = {
        page: currentPage,
        limit: observationsPerPage,
        search: searchTerm,
        areaIds: volunteerAreas,
        ...filters
      };

      const response = await healthObservationService.getAllHealthObservations(params);
      
      if (response.success) {
        setObservations(response.data.observations || []);
        setTotalPages(Math.ceil((response.data.total || 0) / observationsPerPage));
      } else {
        throw new Error(response.message || 'Failed to load observations');
      }
    } catch (error) {
      console.error('Error loading observations:', error);
    //   toast.error('Failed to load health observations');
      setObservations([]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle search input changes
   */
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  /**
   * Handle filter changes
   */
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  /**
   * Navigate to observation details
   */
  const handleViewObservation = (observationId) => {
    navigate(`/app/observations/${observationId}`);
  };

  /**
   * Navigate to edit observation (if allowed)
   */
  const handleEditObservation = (observationId) => {
    navigate(`/app/observations/${observationId}/edit`);
  };

  /**
   * Get severity badge styling
   */
  const getSeverityBadge = (severity) => {
    const styles = {
      mild: 'bg-green-100 text-green-800',
      moderate: 'bg-yellow-100 text-yellow-800',
      severe: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[severity] || styles.mild}`;
  };

  /**
   * Get status badge styling
   */
  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-red-100 text-red-800',
      monitoring: 'bg-yellow-100 text-yellow-800',
      recovered: 'bg-green-100 text-green-800',
      resolved: 'bg-blue-100 text-blue-800'
    };
    
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.active}`;
  };

  /**
   * Get symptom type badge styling
   */
  const getSymptomBadge = (type) => {
    const styles = {
      fever: 'bg-red-100 text-red-800',
      respiratory: 'bg-blue-100 text-blue-800',
      gastrointestinal: 'bg-green-100 text-green-800',
      skin: 'bg-purple-100 text-purple-800',
      neurological: 'bg-indigo-100 text-indigo-800',
      other: 'bg-gray-100 text-gray-800'
    };
    
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[type] || styles.other}`;
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Render pagination controls
   */
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        pages.push(
          <button
            key={i}
            onClick={() => setCurrentPage(i)}
            className={`px-3 py-2 text-sm ${
              currentPage === i
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } border border-gray-300`}
          >
            {i}
          </button>
        );
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        pages.push(
          <span key={i} className="px-3 py-2 text-sm text-gray-500">
            ...
          </span>
        );
      }
    }

    return (
      <div className="flex items-center justify-center space-x-1 mt-6">
        <button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-3 py-2 text-sm bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        {pages}
        <button
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-2 text-sm bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Health Observations
              </h1>
              <p className="text-gray-600 mt-1">
                Monitor and track community health symptoms and conditions
              </p>
            </div>
            <Link
              to="/app/observations/new"
              className="mt-4 md:mt-0 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiPlus className="w-4 h-4" />
              New Observation
            </Link>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search observations by patient name, symptoms, or location..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3">
              <select
                value={filters.severity}
                onChange={(e) => handleFilterChange('severity', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Severity</option>
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
                <option value="critical">Critical</option>
              </select>

              <select
                value={filters.symptomType}
                onChange={(e) => handleFilterChange('symptomType', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="fever">Fever</option>
                <option value="respiratory">Respiratory</option>
                <option value="gastrointestinal">Gastrointestinal</option>
                <option value="skin">Skin Conditions</option>
                <option value="neurological">Neurological</option>
                <option value="other">Other</option>
              </select>

              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="monitoring">Monitoring</option>
                <option value="recovered">Recovered</option>
                <option value="resolved">Resolved</option>
              </select>

              <button
                onClick={loadObservations}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <FiRefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Observations List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <FiRefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading health observations...</p>
            </div>
          ) : observations.length === 0 ? (
            <div className="p-8 text-center">
              <FiActivity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No health observations found</p>
              <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Symptoms & Severity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {observations.map((observation) => (
                      <tr key={observation._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-start">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {observation.patientInfo?.name || 'Anonymous'}
                              </p>
                              <p className="text-xs text-gray-500">
                                Age: {observation.patientInfo?.age || 'N/A'} | 
                                Gender: {observation.patientInfo?.gender || 'N/A'}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <FiUser className="w-3 h-3 text-gray-400" />
                                <p className="text-xs text-gray-500">
                                  {observation.observedBy?.name || 'Unknown'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <span className={getSymptomBadge(observation.symptomType)}>
                              {observation.symptomType}
                            </span>
                            <div>
                              <span className={getSeverityBadge(observation.severity)}>
                                {observation.severity}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-1">
                              {observation.symptoms?.join(', ') || 'No symptoms listed'}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <FiActivity className="w-3 h-3 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {observation.location?.address || observation.location}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={getStatusBadge(observation.status)}>
                            {observation.status?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <FiClock className="w-3 h-3 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {formatDate(observation.observationDate || observation.createdAt)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewObservation(observation._id)}
                              className="text-blue-600 hover:text-blue-700"
                              title="View Details"
                            >
                              <FiEye className="w-4 h-4" />
                            </button>
                            {(observation.status === 'active' || observation.status === 'monitoring') && (
                              <button
                                onClick={() => handleEditObservation(observation._id)}
                                className="text-gray-600 hover:text-gray-700"
                                title="Edit Observation"
                              >
                                <FiEdit2 className="w-4 h-4" />
                              </button>
                            )}
                            {observation.severity === 'critical' && (
                              <FiAlertTriangle className="w-4 h-4 text-red-500" title="Critical" />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden divide-y divide-gray-200">
                {observations.map((observation) => (
                  <div key={observation._id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          {observation.patientInfo?.name || 'Anonymous'}
                        </p>
                        <p className="text-xs text-gray-500 mb-1">
                          Age: {observation.patientInfo?.age || 'N/A'} | Gender: {observation.patientInfo?.gender || 'N/A'}
                        </p>
                        <div className="flex items-center gap-2">
                          <FiUser className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {observation.observedBy?.name || 'Unknown'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <button
                          onClick={() => handleViewObservation(observation._id)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                        {(observation.status === 'active' || observation.status === 'monitoring') && (
                          <button
                            onClick={() => handleEditObservation(observation._id)}
                            className="text-gray-600 hover:text-gray-700"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className={getSymptomBadge(observation.symptomType)}>
                        {observation.symptomType}
                      </span>
                      <span className={getSeverityBadge(observation.severity)}>
                        {observation.severity}
                      </span>
                      <span className={getStatusBadge(observation.status)}>
                        {observation.status?.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                      {observation.symptoms?.join(', ') || 'No symptoms listed'}
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <FiActivity className="w-3 h-3" />
                        <span>{observation.location?.address || observation.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FiClock className="w-3 h-3" />
                        <span>{formatDate(observation.observationDate || observation.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        {renderPagination()}
      </div>
    </div>
  );
};

export default HealthObservationList;