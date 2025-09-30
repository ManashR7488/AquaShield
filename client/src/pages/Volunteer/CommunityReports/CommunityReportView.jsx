import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiMapPin, FiClock, FiUser, FiPhone, FiEdit2, FiAlertCircle, FiCheckCircle, FiImage, FiDownload } from 'react-icons/fi';
import communityReportService from '../../../services/communityReportService';
import useAuthStore from '../../../store/useAuthStore';
import { toast } from 'react-toastify';

/**
 * Detailed view component for a single community report
 * Shows all report information with status updates and actions
 */
const CommunityReportView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (id) {
      loadReport();
    }
  }, [id]);

  /**
   * Load report details
   */
  const loadReport = async () => {
    try {
      setIsLoading(true);
      const response = await communityReportService.getCommunityReportById(id);
      
      if (response.success) {
        setReport(response.data);
      } else {
        throw new Error(response.message || 'Failed to load report');
      }
    } catch (error) {
      console.error('Error loading report:', error);
      // toast.error('Failed to load report details');
      navigate('/app/reports');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Get priority badge styling
   */
  const getPriorityBadge = (priority) => {
    const styles = {
      low: 'bg-gray-100 text-gray-800 border-gray-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      urgent: 'bg-red-100 text-red-800 border-red-200'
    };
    
    return `inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${styles[priority] || styles.low}`;
  };

  /**
   * Get status badge styling
   */
  const getStatusBadge = (status) => {
    const styles = {
      submitted: 'bg-blue-100 text-blue-800 border-blue-200',
      in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      resolved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200'
    };
    
    const icons = {
      submitted: FiClock,
      in_progress: FiAlertCircle,
      resolved: FiCheckCircle,
      rejected: FiAlertCircle
    };
    
    const Icon = icons[status] || FiClock;
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${styles[status] || styles.submitted}`}>
        <Icon className="w-3 h-3" />
        {status?.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  /**
   * Get type badge styling
   */
  const getTypeBadge = (type) => {
    const styles = {
      infrastructure: 'bg-blue-100 text-blue-800',
      health: 'bg-red-100 text-red-800',
      sanitation: 'bg-green-100 text-green-800',
      water: 'bg-cyan-100 text-cyan-800',
      electricity: 'bg-yellow-100 text-yellow-800',
      safety: 'bg-purple-100 text-purple-800',
      environment: 'bg-emerald-100 text-emerald-800',
      other: 'bg-gray-100 text-gray-800'
    };
    
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[type] || styles.other}`;
  };

  /**
   * Download image
   */
  const downloadImage = (imageUrl, filename) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename || 'report-image.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Open location in maps
   */
  const openInMaps = () => {
    if (report?.coordinates?.latitude && report?.coordinates?.longitude) {
      const mapsUrl = `https://www.google.com/maps?q=${report.coordinates.latitude},${report.coordinates.longitude}`;
      window.open(mapsUrl, '_blank');
    } else {
      toast.error('GPS coordinates not available');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading report details...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Report not found</p>
          <Link
            to="/app/reports"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Back to Reports
          </Link>
        </div>
      </div>
    );
  }

  const canEdit = report.status === 'submitted' || report.status === 'rejected';

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/app/reports')}
                className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <FiArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Community Report Details
                </h1>
                <p className="text-gray-600 mt-1">
                  Report ID: {report._id}
                </p>
              </div>
            </div>
            
            {canEdit && (
              <Link
                to={`/volunteer/community-reports/edit/${report._id}`}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiEdit2 className="w-4 h-4" />
                Edit Report
              </Link>
            )}
          </div>
        </div>

        {/* Status and Priority */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {getStatusBadge(report.status)}
            <span className={getPriorityBadge(report.priority)}>
              {report.priority?.toUpperCase()} PRIORITY
            </span>
            <span className={getTypeBadge(report.type)}>
              {report.type?.replace('_', ' ').toUpperCase()}
            </span>
            {report.immediateAction && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium border border-red-200">
                <FiAlertCircle className="w-3 h-3" />
                IMMEDIATE ACTION REQUIRED
              </span>
            )}
          </div>
        </div>

        {/* Report Details */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Information</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
              <p className="text-gray-900 leading-relaxed">{report.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Location</h3>
                <div className="flex items-start gap-2">
                  <FiMapPin className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-gray-900">{report.location}</p>
                    {report.coordinates?.latitude && report.coordinates?.longitude && (
                      <button
                        onClick={openInMaps}
                        className="text-blue-600 hover:text-blue-700 text-sm mt-1"
                      >
                        View on Maps ({report.coordinates.latitude.toFixed(6)}, {report.coordinates.longitude.toFixed(6)})
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Village</h3>
                <p className="text-gray-900">{report.village || 'Not specified'}</p>
              </div>
            </div>

            {report.affectedPeople && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">People Affected</h3>
                <p className="text-gray-900">{report.affectedPeople} people</p>
              </div>
            )}

            {report.additionalNotes && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Additional Notes</h3>
                <p className="text-gray-900 leading-relaxed">{report.additionalNotes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <FiUser className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Contact Person</p>
                <p className="font-medium text-gray-900">{report.contactInfo?.name || 'Not provided'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <FiPhone className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Phone Number</p>
                <p className="font-medium text-gray-900">
                  {report.contactInfo?.phone ? (
                    <a href={`tel:${report.contactInfo.phone}`} className="text-blue-600 hover:text-blue-700">
                      {report.contactInfo.phone}
                    </a>
                  ) : (
                    'Not provided'
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Submitted By */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Submission Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <FiUser className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Submitted By</p>
                <p className="font-medium text-gray-900">
                  {report.submittedBy?.name || user?.name || 'Unknown'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <FiClock className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Submission Date</p>
                <p className="font-medium text-gray-900">{formatDate(report.createdAt)}</p>
              </div>
            </div>
          </div>

          {report.updatedAt && report.updatedAt !== report.createdAt && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <FiClock className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Last Updated</p>
                  <p className="font-medium text-gray-900">{formatDate(report.updatedAt)}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Images */}
        {report.images && report.images.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Attached Images ({report.images.length})
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {report.images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image}
                    alt={`Report image ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg border border-gray-200"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition-all duration-200 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                      <button
                        onClick={() => window.open(image, '_blank')}
                        className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                        title="View Full Size"
                      >
                        <FiImage className="w-4 h-4 text-gray-700" />
                      </button>
                      <button
                        onClick={() => downloadImage(image, `report-${report._id}-image-${index + 1}.jpg`)}
                        className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                        title="Download Image"
                      >
                        <FiDownload className="w-4 h-4 text-gray-700" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status History */}
        {report.statusHistory && report.statusHistory.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Status History</h2>
            
            <div className="space-y-4">
              {report.statusHistory.map((history, index) => (
                <div key={index} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    {getStatusBadge(history.status)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{history.comment || 'Status updated'}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span>By: {history.updatedBy?.name || 'System'}</span>
                      <span>Date: {formatDate(history.date)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <Link
              to="/app/reports"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <FiArrowLeft className="w-4 h-4" />
              Back to Reports
            </Link>

            {canEdit && (
              <Link
                to={`/volunteer/community-reports/edit/${report._id}`}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiEdit2 className="w-4 h-4" />
                Edit Report
              </Link>
            )}

            <Link
              to="/app/reports/new"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Create New Report
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityReportView;