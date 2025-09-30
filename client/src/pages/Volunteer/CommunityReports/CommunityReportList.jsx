import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiPlus, FiSearch, FiFilter, FiRefreshCw, FiEye, FiEdit2, FiAlertTriangle, FiMapPin, FiClock, FiUser } from 'react-icons/fi';
import communityReportService from '../../../services/communityReportService';
import useAuthStore from '../../../store/useAuthStore';
import { getVolunteerAreas } from '../../../utils/volunteerGuard.jsx';
import { toast } from 'react-toastify';

/**
 * List view for all community reports submitted by volunteers
 * Includes filtering, search, and quick actions
 */
const CommunityReportList = () => {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    type: 'all',
    dateRange: 'all'
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const reportsPerPage = 10;

  useEffect(() => {
    loadReports();
  }, [currentPage, filters, searchTerm]);

  /**
   * Load community reports with current filters and pagination
   */
  const loadReports = async () => {
    try {
      setIsLoading(true);
      
      // Get volunteer areas for filtering
      const volunteerAreas = getVolunteerAreas(user);
      
      const params = {
        page: currentPage,
        limit: reportsPerPage,
        search: searchTerm,
        areaIds: volunteerAreas,
        ...filters
      };

      const response = await communityReportService.getAllCommunityReports(params);
      
      if (response.success) {
        setReports(response.data.reports || []);
        setTotalPages(Math.ceil((response.data.total || 0) / reportsPerPage));
      } else {
        throw new Error(response.message || 'Failed to load reports');
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    //   toast.error('Failed to load community reports');
      setReports([]);
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
   * Navigate to report details
   */
  const handleViewReport = (reportId) => {
    navigate(`/app/community-reports/${reportId}`);
  };

  /**
   * Navigate to edit report (if allowed)
   */
  const handleEditReport = (reportId) => {
    navigate(`/app/community-reports/${reportId}/edit`);
  };

  /**
   * Get priority badge styling
   */
  const getPriorityBadge = (priority) => {
    const styles = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[priority] || styles.low}`;
  };

  /**
   * Get status badge styling
   */
  const getStatusBadge = (status) => {
    const styles = {
      submitted: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.submitted}`;
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
                Community Reports
              </h1>
              <p className="text-gray-600 mt-1">
                Manage and track community issues and concerns
              </p>
            </div>
            <Link
              to="/app/community-reports/new"
              className="mt-4 md:mt-0 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiPlus className="w-4 h-4" />
              New Report
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
                  placeholder="Search reports by description, location, or type..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3">
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="submitted">Submitted</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
              </select>

              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>

              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="infrastructure">Infrastructure</option>
                <option value="health">Health</option>
                <option value="sanitation">Sanitation</option>
                <option value="water">Water</option>
                <option value="electricity">Electricity</option>
                <option value="other">Other</option>
              </select>

              <button
                onClick={loadReports}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <FiRefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <FiRefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading community reports...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="p-8 text-center">
              <FiMapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No community reports found</p>
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
                        Report Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type & Priority
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
                    {reports.map((report) => (
                      <tr key={report._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-start">
                            <div>
                              <p className="text-sm font-medium text-gray-900 line-clamp-2">
                                {report.issueDescription || report.description}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <FiUser className="w-3 h-3 text-gray-400" />
                                <p className="text-xs text-gray-500">
                                  {report.submittedBy?.name || 'Unknown'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {report.reportType || report.type}
                            </span>
                            <div>
                              <span className={getPriorityBadge(report.priority)}>
                                {report.priority}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <FiMapPin className="w-3 h-3 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {report.location?.address || report.location}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={getStatusBadge(report.status)}>
                            {report.status?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <FiClock className="w-3 h-3 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {formatDate(report.createdAt)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewReport(report._id)}
                              className="text-blue-600 hover:text-blue-700"
                              title="View Details"
                            >
                              <FiEye className="w-4 h-4" />
                            </button>
                            {(report.status === 'submitted' || report.status === 'rejected') && (
                              <button
                                onClick={() => handleEditReport(report._id)}
                                className="text-gray-600 hover:text-gray-700"
                                title="Edit Report"
                              >
                                <FiEdit2 className="w-4 h-4" />
                              </button>
                            )}
                            {report.priority === 'urgent' && (
                              <FiAlertTriangle className="w-4 h-4 text-red-500" title="Urgent" />
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
                {reports.map((report) => (
                  <div key={report._id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                          {report.issueDescription || report.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <FiUser className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {report.submittedBy?.name || 'Unknown'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <button
                          onClick={() => handleViewReport(report._id)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                        {(report.status === 'submitted' || report.status === 'rejected') && (
                          <button
                            onClick={() => handleEditReport(report._id)}
                            className="text-gray-600 hover:text-gray-700"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {report.reportType || report.type}
                      </span>
                      <span className={getPriorityBadge(report.priority)}>
                        {report.priority}
                      </span>
                      <span className={getStatusBadge(report.status)}>
                        {report.status?.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <FiMapPin className="w-3 h-3" />
                        <span>{report.location?.address || report.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FiClock className="w-3 h-3" />
                        <span>{formatDate(report.createdAt)}</span>
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

export default CommunityReportList;