import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  FileText, 
  Calendar, 
  User, 
  Filter, 
  Search, 
  Eye, 
  Edit2, 
  Trash2,
  Activity,
  Heart,
  Thermometer,
  Scale,
  Stethoscope,
  Download
} from 'lucide-react';
import personalHealthService from '../../services/personalHealthService';
import familyService from '../../services/familyService';
import { useUserGuard } from '../../utils/userGuard';
import { toast } from 'react-toastify';

const HealthRecordList = () => {
  const [records, setRecords] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    personId: 'all',
    recordType: 'all',
    dateFrom: '',
    dateTo: '',
    severity: 'all'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });
  const { getUserId } = useUserGuard();

  useEffect(() => {
    loadFamilyMembers();
  }, []);

  useEffect(() => {
    loadHealthRecords();
  }, [filters, pagination.page]);

  const loadFamilyMembers = async () => {
    try {
      const userId = getUserId();
      const result = await familyService.getFamilyMembers(userId);
      if (result.success) {
        // Add current user to the list
        const membersWithSelf = [
          { _id: userId, name: 'Me (Self)', relationship: 'self' },
          ...result.data
        ];
        setFamilyMembers(membersWithSelf);
      }
    } catch (error) {
      console.error('Error loading family members:', error);
    }
  };

  const loadHealthRecords = async () => {
    try {
      setLoading(true);
      const userId = getUserId();
      
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search,
        sortBy: 'date',
        sortOrder: 'desc'
      };

      // Add filters
      if (filters.personId !== 'all') {
        params.personId = filters.personId;
      }
      if (filters.recordType !== 'all') {
        params.recordType = filters.recordType;
      }
      if (filters.dateFrom) {
        params.dateFrom = filters.dateFrom;
      }
      if (filters.dateTo) {
        params.dateTo = filters.dateTo;
      }
      if (filters.severity !== 'all') {
        params.severity = filters.severity;
      }

      const result = await personalHealthService.getPersonalHealthRecords(userId, params);
      
      if (result.success) {
        setRecords(result.data);
        setPagination(prev => ({
          ...prev,
          total: result.total
        }));
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error loading health records:', error);
      toast.error('Failed to load health records');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleDeleteRecord = async (recordId) => {
    if (!window.confirm('Are you sure you want to delete this health record?')) {
      return;
    }

    try {
      const result = await personalHealthService.deleteHealthRecord(recordId);
      if (result.success) {
        toast.success('Health record deleted successfully');
        loadHealthRecords();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error deleting health record:', error);
      toast.error('Failed to delete health record');
    }
  };

  const getRecordTypeIcon = (type) => {
    const icons = {
      'vital_signs': Stethoscope,
      'medical_visit': Heart,
      'lab_result': FileText,
      'medication': Activity,
      'symptom': Thermometer,
      'exercise': Scale,
      'general': FileText
    };
    return icons[type] || FileText;
  };

  const getRecordTypeColor = (type) => {
    const colors = {
      'vital_signs': 'bg-blue-100 text-blue-800',
      'medical_visit': 'bg-green-100 text-green-800',
      'lab_result': 'bg-purple-100 text-purple-800',
      'medication': 'bg-orange-100 text-orange-800',
      'symptom': 'bg-red-100 text-red-800',
      'exercise': 'bg-indigo-100 text-indigo-800',
      'general': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || colors['general'];
  };

  const getSeverityColor = (severity) => {
    const colors = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-red-100 text-red-800'
    };
    return colors[severity] || colors['low'];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getMemberName = (memberId) => {
    const member = familyMembers.find(m => m._id === memberId);
    return member?.name || 'Unknown';
  };

  const exportRecords = async () => {
    try {
      toast.info('Export feature coming soon');
    } catch (error) {
      toast.error('Failed to export records');
    }
  };

  if (loading && records.length === 0) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div className="flex items-center mb-4 sm:mb-0">
          <FileText className="h-8 w-8 text-blue-600 mr-3" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Health Records</h1>
            <p className="text-gray-600 mt-1">Track and manage personal health information</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={exportRecords}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <Link
            to="/app/health-records/create"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Record
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search records..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Person Filter */}
          <div>
            <select
              value={filters.personId}
              onChange={(e) => handleFilterChange('personId', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Members</option>
              {familyMembers.map(member => (
                <option key={member._id} value={member._id}>{member.name}</option>
              ))}
            </select>
          </div>

          {/* Record Type Filter */}
          <div>
            <select
              value={filters.recordType}
              onChange={(e) => handleFilterChange('recordType', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="vital_signs">Vital Signs</option>
              <option value="medical_visit">Medical Visit</option>
              <option value="lab_result">Lab Result</option>
              <option value="medication">Medication</option>
              <option value="symptom">Symptom</option>
              <option value="exercise">Exercise</option>
              <option value="general">General</option>
            </select>
          </div>

          {/* Date From */}
          <div>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Date To */}
          <div>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Records List */}
      {records.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Health Records Found</h3>
          <p className="text-gray-600 mb-6">
            Start tracking your health by adding your first health record.
          </p>
          <Link
            to="/app/health-records/create"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg inline-flex items-center transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add First Record
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record) => {
            const RecordIcon = getRecordTypeIcon(record.recordType);
            return (
              <div key={record._id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start">
                      <div className="mr-4">
                        <RecordIcon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{record.title}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>{formatDate(record.date)}</span>
                          </div>
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            <span>{getMemberName(record.personId)}</span>
                          </div>
                        </div>
                        <p className="text-gray-700 text-sm">{record.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <div className="flex space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRecordTypeColor(record.recordType)}`}>
                          {record.recordType.replace('_', ' ').toUpperCase()}
                        </span>
                        {record.severity && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(record.severity)}`}>
                            {record.severity.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Health Data */}
                  {record.healthData && Object.keys(record.healthData).length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Health Data</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {Object.entries(record.healthData).map(([key, value]) => (
                          <div key={key} className="text-sm">
                            <span className="text-gray-600 capitalize">{key.replace('_', ' ')}: </span>
                            <span className="font-medium text-gray-900">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Documents */}
                  {record.documents && record.documents.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Attached Documents</h4>
                      <div className="flex flex-wrap gap-2">
                        {record.documents.map((doc, index) => (
                          <span key={index} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-sm flex items-center">
                            <FileText className="h-3 w-3 mr-1" />
                            {doc.name || `Document ${index + 1}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Link
                      to={`/app/health-records/${record._id}`}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Link>
                    <Link
                      to={`/app/health-records/${record._id}/edit`}
                      className="bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDeleteRecord(record._id)}
                      className="bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {pagination.total > pagination.limit && (
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} records
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm font-medium text-gray-700">
                    Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                    className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HealthRecordList;