import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  Calendar, 
  User, 
  Activity, 
  Heart, 
  Scale, 
  Thermometer,
  BarChart3,
  PieChart,
  LineChart,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import personalHealthService from '../../services/personalHealthService';
import familyService from '../../services/familyService';
import { useUserGuard } from '../../utils/userGuard';
import { toast } from 'react-toastify';

const HealthTrends = () => {
  const [trendsData, setTrendsData] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    personId: 'all',
    timeRange: '6months',
    metricType: 'all'
  });
  const { getUserId } = useUserGuard();

  useEffect(() => {
    loadFamilyMembers();
  }, []);

  useEffect(() => {
    loadTrendsData();
  }, [filters]);

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

  const loadTrendsData = async () => {
    try {
      setLoading(true);
      const userId = getUserId();
      
      const params = {
        timeRange: filters.timeRange,
        ...(filters.personId !== 'all' && { personId: filters.personId }),
        ...(filters.metricType !== 'all' && { metricType: filters.metricType })
      };

      const result = await personalHealthService.getHealthTrends(userId, params);
      
      if (result.success) {
        setTrendsData(result.data);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error loading health trends:', error);
      toast.error('Failed to load health trends');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getMemberName = (memberId) => {
    const member = familyMembers.find(m => m._id === memberId);
    return member?.name || 'Unknown';
  };

  const getMetricIcon = (metric) => {
    const icons = {
      'weight': Scale,
      'blood_pressure': Heart,
      'heart_rate': Activity,
      'temperature': Thermometer,
      'general': TrendingUp
    };
    const IconComponent = icons[metric] || TrendingUp;
    return <IconComponent className="h-5 w-5" />;
  };

  const getMetricColor = (metric) => {
    const colors = {
      'weight': 'text-blue-600',
      'blood_pressure': 'text-red-600',
      'heart_rate': 'text-green-600',
      'temperature': 'text-orange-600',
      'general': 'text-gray-600'
    };
    return colors[metric] || colors['general'];
  };

  const formatTrendValue = (value, metric) => {
    if (!value) return 'N/A';
    
    const units = {
      'weight': 'kg',
      'blood_pressure': 'mmHg',
      'heart_rate': 'bpm',
      'temperature': '°F',
    };
    
    return `${value} ${units[metric] || ''}`;
  };

  const getTrendDirection = (trend) => {
    if (!trend) return 'stable';
    if (trend > 0) return 'increasing';
    if (trend < 0) return 'decreasing';
    return 'stable';
  };

  const getTrendColor = (direction, metric) => {
    // For some metrics, increasing might be bad (weight, blood pressure)
    // For others, it might be good (exercise frequency)
    const badIncreasing = ['weight', 'blood_pressure', 'temperature'];
    
    if (direction === 'stable') return 'text-gray-600';
    
    if (badIncreasing.includes(metric)) {
      return direction === 'increasing' ? 'text-red-600' : 'text-green-600';
    } else {
      return direction === 'increasing' ? 'text-green-600' : 'text-red-600';
    }
  };

  const exportTrends = async () => {
    try {
      toast.info('Export feature coming soon');
    } catch (error) {
      toast.error('Failed to export trends data');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
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
          <TrendingUp className="h-8 w-8 text-blue-600 mr-3" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Health Trends</h1>
            <p className="text-gray-600 mt-1">Analyze health patterns and progress over time</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={loadTrendsData}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={exportTrends}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Family Member
            </label>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Range
            </label>
            <select
              value={filters.timeRange}
              onChange={(e) => handleFilterChange('timeRange', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="1month">Last Month</option>
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="1year">Last Year</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Metric Type
            </label>
            <select
              value={filters.metricType}
              onChange={(e) => handleFilterChange('metricType', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Metrics</option>
              <option value="weight">Weight</option>
              <option value="blood_pressure">Blood Pressure</option>
              <option value="heart_rate">Heart Rate</option>
              <option value="temperature">Temperature</option>
              <option value="exercise">Exercise</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {trendsData?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {Object.entries(trendsData.summary).map(([metric, data]) => (
            <div key={metric} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg bg-gray-50 ${getMetricColor(metric)}`}>
                  {getMetricIcon(metric)}
                </div>
                <div className={`text-sm font-medium ${getTrendColor(getTrendDirection(data.trend), metric)}`}>
                  {getTrendDirection(data.trend) === 'increasing' && '↗'}
                  {getTrendDirection(data.trend) === 'decreasing' && '↘'}
                  {getTrendDirection(data.trend) === 'stable' && '→'}
                  {Math.abs(data.trend || 0).toFixed(1)}%
                </div>
              </div>
              <div className="mb-2">
                <h3 className="text-lg font-semibold text-gray-900 capitalize">
                  {metric.replace('_', ' ')}
                </h3>
                <p className="text-2xl font-bold text-gray-900">
                  {formatTrendValue(data.current, metric)}
                </p>
              </div>
              <p className="text-sm text-gray-600">
                Avg: {formatTrendValue(data.average, metric)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Timeline Chart */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Health Metrics Over Time</h3>
            <LineChart className="h-5 w-5 text-gray-400" />
          </div>
          
          {trendsData?.timeline && trendsData.timeline.length > 0 ? (
            <div className="space-y-4">
              {/* This would typically render a proper chart library */}
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Interactive chart visualization</p>
                  <p className="text-sm text-gray-500">Chart library integration coming soon</p>
                </div>
              </div>
              
              {/* Data points summary */}
              <div className="text-sm text-gray-600">
                <p>Data points available: {trendsData.timeline.length}</p>
                <p>Date range: {filters.timeRange}</p>
              </div>
            </div>
          ) : (
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <LineChart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No timeline data available</p>
                <p className="text-sm text-gray-500">Add health records to see trends</p>
              </div>
            </div>
          )}
        </div>

        {/* Distribution Chart */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Health Record Types</h3>
            <PieChart className="h-5 w-5 text-gray-400" />
          </div>
          
          {trendsData?.distribution && Object.keys(trendsData.distribution).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(trendsData.distribution).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-700 capitalize">
                      {type.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No distribution data available</p>
                <p className="text-sm text-gray-500">Add health records to see distribution</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Trends */}
      {trendsData?.recentTrends && trendsData.recentTrends.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Health Trends</h3>
          <div className="space-y-4">
            {trendsData.recentTrends.map((trend, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg bg-white mr-4 ${getMetricColor(trend.metric)}`}>
                    {getMetricIcon(trend.metric)}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 capitalize">
                      {trend.metric.replace('_', ' ')}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {getMemberName(trend.personId)} • {new Date(trend.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    {formatTrendValue(trend.value, trend.metric)}
                  </div>
                  <div className={`text-sm ${getTrendColor(getTrendDirection(trend.change), trend.metric)}`}>
                    {trend.change > 0 ? '+' : ''}{trend.change}% from last
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights and Recommendations */}
      {trendsData?.insights && trendsData.insights.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Health Insights</h3>
          <div className="space-y-3">
            {trendsData.insights.map((insight, index) => (
              <div key={index} className="flex items-start p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Activity className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">{insight.title}</h4>
                  <p className="text-sm text-blue-800 mt-1">{insight.description}</p>
                  {insight.recommendation && (
                    <p className="text-sm text-blue-700 mt-2">
                      <strong>Recommendation:</strong> {insight.recommendation}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!trendsData || (!trendsData.summary && !trendsData.timeline && !trendsData.distribution) && (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Trend Data Available</h3>
          <p className="text-gray-600 mb-6">
            Start adding health records to see trends and insights about your health patterns.
          </p>
          <Link
            to="/app/health-records/create"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg inline-flex items-center transition-colors"
          >
            Add Health Record
          </Link>
        </div>
      )}
    </div>
  );
};

export default HealthTrends;