import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUsers, FiDroplet, FiActivity, FiAlertCircle, FiBarChart3, FiPlus, FiRefreshCw } from 'react-icons/fi';
import { communityReportService } from '../../services/communityReportService';
import { waterTestService } from '../../services/waterTestService';
import { healthObservationService } from '../../services/healthObservationService';
import { useAuthStore } from '../../store/useAuthStore';
import { toast } from 'react-hot-toast';

/**
 * Main dashboard for volunteer users
 * Provides overview of all volunteer activities and quick access to main functions
 */
const VolunteerDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState({
    communityReports: {
      total: 0,
      pending: 0,
      urgent: 0,
      thisWeek: 0
    },
    waterTests: {
      total: 0,
      pending: 0,
      contaminated: 0,
      thisWeek: 0
    },
    healthObservations: {
      total: 0,
      symptoms: 0,
      alerts: 0,
      thisWeek: 0
    }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  /**
   * Load dashboard statistics from all services
   */
  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Load community reports summary
      const communityReportsData = await communityReportService.getCommunityReportsSummary();
      
      // Load water tests summary
      const waterTestsData = await waterTestService.getWaterTestsSummary();
      
      // Load health observations summary
      const healthObservationsData = await healthObservationService.getHealthObservationsSummary();

      setDashboardData({
        communityReports: communityReportsData.data || {
          total: 0,
          pending: 0,
          urgent: 0,
          thisWeek: 0
        },
        waterTests: waterTestsData.data || {
          total: 0,
          pending: 0,
          contaminated: 0,
          thisWeek: 0
        },
        healthObservations: healthObservationsData.data || {
          total: 0,
          symptoms: 0,
          alerts: 0,
          thisWeek: 0
        }
      });

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Quick action handlers for creating new entries
   */
  const handleQuickAction = (type) => {
    switch (type) {
      case 'community-report':
        navigate('/volunteer/community-reports/create');
        break;
      case 'water-test':
        navigate('/volunteer/water-tests/create');
        break;
      case 'health-observation':
        navigate('/volunteer/health-observations/create');
        break;
      default:
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FiRefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Welcome, {user?.name}
              </h1>
              <p className="text-gray-600 mt-1">
                Volunteer Dashboard - {user?.village || 'Village'}
              </p>
              {lastUpdated && (
                <p className="text-sm text-gray-500 mt-1">
                  Last updated: {lastUpdated.toLocaleString()}
                </p>
              )}
            </div>
            <button
              onClick={loadDashboardData}
              className="mt-4 md:mt-0 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiRefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => handleQuickAction('community-report')}
              className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left"
            >
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <FiUsers className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Report Community Issue</p>
                <p className="text-sm text-gray-600">Submit a new community report</p>
              </div>
            </button>

            <button
              onClick={() => handleQuickAction('water-test')}
              className="flex items-center gap-3 p-4 bg-cyan-50 hover:bg-cyan-100 rounded-lg transition-colors text-left"
            >
              <div className="w-10 h-10 bg-cyan-600 rounded-lg flex items-center justify-center">
                <FiDroplet className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Conduct Water Test</p>
                <p className="text-sm text-gray-600">Record water quality test</p>
              </div>
            </button>

            <button
              onClick={() => handleQuickAction('health-observation')}
              className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left"
            >
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <FiActivity className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Health Observation</p>
                <p className="text-sm text-gray-600">Record health symptoms</p>
              </div>
            </button>
          </div>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Community Reports Stats */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FiUsers className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Community Reports</h3>
              </div>
              <Link
                to="/volunteer/community-reports"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View All
              </Link>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Reports</span>
                <span className="font-semibold text-gray-900">{dashboardData.communityReports.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pending</span>
                <span className="font-semibold text-orange-600">{dashboardData.communityReports.pending}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Urgent</span>
                <span className="font-semibold text-red-600">{dashboardData.communityReports.urgent}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">This Week</span>
                <span className="font-semibold text-green-600">{dashboardData.communityReports.thisWeek}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <Link
                to="/volunteer/community-reports/create"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                <FiPlus className="w-4 h-4" />
                New Report
              </Link>
            </div>
          </div>

          {/* Water Tests Stats */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                  <FiDroplet className="w-5 h-5 text-cyan-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Water Tests</h3>
              </div>
              <Link
                to="/volunteer/water-tests"
                className="text-cyan-600 hover:text-cyan-700 text-sm font-medium"
              >
                View All
              </Link>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Tests</span>
                <span className="font-semibold text-gray-900">{dashboardData.waterTests.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pending</span>
                <span className="font-semibold text-orange-600">{dashboardData.waterTests.pending}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Contaminated</span>
                <span className="font-semibold text-red-600">{dashboardData.waterTests.contaminated}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">This Week</span>
                <span className="font-semibold text-green-600">{dashboardData.waterTests.thisWeek}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <Link
                to="/volunteer/water-tests/create"
                className="flex items-center gap-2 text-cyan-600 hover:text-cyan-700 text-sm font-medium"
              >
                <FiPlus className="w-4 h-4" />
                New Test
              </Link>
            </div>
          </div>

          {/* Health Observations Stats */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <FiActivity className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Health Observations</h3>
              </div>
              <Link
                to="/volunteer/health-observations"
                className="text-green-600 hover:text-green-700 text-sm font-medium"
              >
                View All
              </Link>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Observations</span>
                <span className="font-semibold text-gray-900">{dashboardData.healthObservations.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Symptoms Tracked</span>
                <span className="font-semibold text-orange-600">{dashboardData.healthObservations.symptoms}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Health Alerts</span>
                <span className="font-semibold text-red-600">{dashboardData.healthObservations.alerts}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">This Week</span>
                <span className="font-semibold text-green-600">{dashboardData.healthObservations.thisWeek}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <Link
                to="/volunteer/health-observations/create"
                className="flex items-center gap-2 text-green-600 hover:text-green-700 text-sm font-medium"
              >
                <FiPlus className="w-4 h-4" />
                New Observation
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All Activity
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-3 bg-blue-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FiUsers className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Community report submitted for water supply issue
                </p>
                <p className="text-xs text-gray-600">2 hours ago</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-3 bg-cyan-50 rounded-lg">
              <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FiDroplet className="w-4 h-4 text-cyan-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Water test completed for Main Well
                </p>
                <p className="text-xs text-gray-600">1 day ago</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-3 bg-green-50 rounded-lg">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FiActivity className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Health observation recorded for fever symptoms
                </p>
                <p className="text-xs text-gray-600">2 days ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolunteerDashboard;