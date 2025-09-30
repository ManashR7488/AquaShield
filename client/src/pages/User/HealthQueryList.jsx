import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  MessageCircle, 
  Calendar, 
  User, 
  Clock, 
  AlertCircle,
  CheckCircle,
  Search,
  Filter,
  Eye,
  MessageSquare,
  Bot,
  UserCheck
} from 'lucide-react';
import healthQueryService from '../../services/healthQueryService';
import familyService from '../../services/familyService';
import { useUserGuard } from '../../utils/userGuard';
import { toast } from 'react-toastify';

const HealthQueryList = () => {
  const [queries, setQueries] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    queryType: 'all',
    status: 'all',
    urgency: 'all',
    dateFrom: '',
    dateTo: ''
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
    loadHealthQueries();
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

  const loadHealthQueries = async () => {
    try {
      setLoading(true);
      const userId = getUserId();
      
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      // Add filters
      if (filters.queryType !== 'all') {
        params.queryType = filters.queryType;
      }
      if (filters.status !== 'all') {
        params.status = filters.status;
      }
      if (filters.urgency !== 'all') {
        params.urgency = filters.urgency;
      }
      if (filters.dateFrom) {
        params.dateFrom = filters.dateFrom;
      }
      if (filters.dateTo) {
        params.dateTo = filters.dateTo;
      }

      const result = await healthQueryService.getHealthQueries(userId, params);
      
      if (result.success) {
        setQueries(result.data);
        setPagination(prev => ({
          ...prev,
          total: result.total
        }));
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error loading health queries:', error);
      toast.error('Failed to load health queries');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const markAsResolved = async (queryId) => {
    try {
      const result = await healthQueryService.markQueryResolved(queryId);
      if (result.success) {
        toast.success('Query marked as resolved');
        loadHealthQueries();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error marking query as resolved:', error);
      toast.error('Failed to mark query as resolved');
    }
  };

  const getQueryTypeIcon = (type) => {
    const icons = {
      'general_health': MessageCircle,
      'symptoms': AlertCircle,
      'medications': Bot,
      'emergency': AlertCircle,
      'family_health': User
    };
    const IconComponent = icons[type] || MessageCircle;
    return <IconComponent className="h-5 w-5" />;
  };

  const getQueryTypeColor = (type) => {
    const colors = {
      'general_health': 'bg-blue-100 text-blue-800',
      'symptoms': 'bg-orange-100 text-orange-800',
      'medications': 'bg-purple-100 text-purple-800',
      'emergency': 'bg-red-100 text-red-800',
      'family_health': 'bg-green-100 text-green-800'
    };
    return colors[type] || colors['general_health'];
  };

  const getUrgencyColor = (urgency) => {
    const colors = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-orange-100 text-orange-800',
      'emergency': 'bg-red-100 text-red-800'
    };
    return colors[urgency] || colors['low'];
  };

  const getStatusIcon = (status) => {
    const icons = {
      'pending': Clock,
      'in_progress': MessageSquare,
      'answered': CheckCircle,
      'resolved': CheckCircle
    };
    const IconComponent = icons[status] || Clock;
    return <IconComponent className="h-4 w-4" />;
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'text-yellow-600',
      'in_progress': 'text-blue-600',
      'answered': 'text-green-600',
      'resolved': 'text-gray-600'
    };
    return colors[status] || colors['pending'];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getMemberName = (memberId) => {
    const member = familyMembers.find(m => m._id === memberId);
    return member?.name || 'Unknown';
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}w ago`;
  };

  if (loading && queries.length === 0) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
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
          <MessageCircle className="h-8 w-8 text-blue-600 mr-3" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Health Queries</h1>
            <p className="text-gray-600 mt-1">Ask health questions and get expert advice</p>
          </div>
        </div>
        <Link
          to="/app/user/health-queries/create"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ask Question
        </Link>
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
                placeholder="Search queries..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Query Type */}
          <div>
            <select
              value={filters.queryType}
              onChange={(e) => handleFilterChange('queryType', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="general_health">General Health</option>
              <option value="symptoms">Symptoms</option>
              <option value="medications">Medications</option>
              <option value="emergency">Emergency</option>
              <option value="family_health">Family Health</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="answered">Answered</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          {/* Urgency */}
          <div>
            <select
              value={filters.urgency}
              onChange={(e) => handleFilterChange('urgency', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="From date"
            />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {queries.filter(q => q.status === 'pending').length}
          </div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {queries.filter(q => q.status === 'answered').length}
          </div>
          <div className="text-sm text-gray-600">Answered</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
          <div className="text-2xl font-bold text-red-600">
            {queries.filter(q => q.urgency === 'emergency').length}
          </div>
          <div className="text-sm text-gray-600">Emergency</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
          <div className="text-2xl font-bold text-gray-600">
            {queries.filter(q => q.status === 'resolved').length}
          </div>
          <div className="text-sm text-gray-600">Resolved</div>
        </div>
      </div>

      {/* Queries List */}
      {queries.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Health Queries Yet</h3>
          <p className="text-gray-600 mb-6">
            Start by asking your first health question to get expert advice.
          </p>
          <Link
            to="/app/user/health-queries/create"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg inline-flex items-center transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Ask First Question
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {queries.map((query) => {
            const QueryTypeIcon = getQueryTypeIcon(query.queryType);
            const StatusIcon = getStatusIcon(query.status);
            
            return (
              <div key={query._id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start flex-1">
                      <div className="mr-4 mt-1">
                        <QueryTypeIcon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate pr-4">
                            {query.title}
                          </h3>
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getQueryTypeColor(query.queryType)}`}>
                              {query.queryType.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(query.urgency)}`}>
                              {query.urgency.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>{formatDate(query.createdAt)}</span>
                          </div>
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            <span>{getMemberName(query.personId)}</span>
                          </div>
                          <div className={`flex items-center ${getStatusColor(query.status)}`}>
                            <StatusIcon />
                            <span className="ml-1 capitalize">{query.status.replace('_', ' ')}</span>
                          </div>
                          <span className="text-gray-500">
                            {formatTimeAgo(query.createdAt)}
                          </span>
                        </div>
                        
                        <p className="text-gray-700 text-sm line-clamp-2 mb-4">{query.description}</p>

                        {/* Symptoms */}
                        {query.symptoms && query.symptoms.length > 0 && (
                          <div className="mb-3">
                            <span className="text-xs text-gray-500">Symptoms: </span>
                            <div className="inline-flex flex-wrap gap-1 mt-1">
                              {query.symptoms.slice(0, 3).map((symptom, index) => (
                                <span key={index} className="bg-red-50 text-red-700 px-2 py-1 rounded text-xs">
                                  {symptom}
                                </span>
                              ))}
                              {query.symptoms.length > 3 && (
                                <span className="bg-gray-50 text-gray-600 px-2 py-1 rounded text-xs">
                                  +{query.symptoms.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Response Status */}
                        {query.hasResponse && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                            <div className="flex items-center text-green-800">
                              <UserCheck className="h-4 w-4 mr-2" />
                              <span className="text-sm font-medium">Expert response available</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      <Link
                        to={`/app/user/health-queries/${query._id}`}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Link>
                      
                      {query.hasResponse && (
                        <Link
                          to={`/app/user/health-queries/${query._id}#response`}
                          className="bg-green-50 hover:bg-green-100 text-green-700 px-3 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          View Response
                        </Link>
                      )}
                      
                      {query.status !== 'resolved' && (
                        <button
                          onClick={() => markAsResolved(query._id)}
                          className="bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark Resolved
                        </button>
                      )}
                    </div>

                    {/* Urgency Indicator */}
                    {query.urgency === 'emergency' && (
                      <div className="flex items-center text-red-600">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        <span className="text-xs font-medium">URGENT</span>
                      </div>
                    )}
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
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} queries
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

export default HealthQueryList;