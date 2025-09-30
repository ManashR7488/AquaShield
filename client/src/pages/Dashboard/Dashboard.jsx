import React, { useState, useEffect } from "react";
import useAuthStore from "../../store/useAuthStore";
import {
  FiUsers,
  FiMapPin,
  FiActivity,
  FiAlertTriangle,
  FiDroplet,
  FiHeart,
  // FiBarChart3,
  FiTrendingUp,
  FiTrendingDown,
  FiPlus,
  FiEdit,
  FiEye,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiShield,
  FiFlag,
  FiHome,
  FiPhoneCall,
  FiBell,
  FiSettings,
  FiDownload,
  FiUpload,
  FiRefreshCw,
  FiHelpCircle,
} from "react-icons/fi";

const Dashboard = () => {
  const { user } = useAuthStore();
  const [selectedTimeRange, setSelectedTimeRange] = useState("7days");
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Role-based permissions
  const permissions = {
    admin: {
      canCreate: ["districts", "blocks", "villages", "users", "reports"],
      canUpdate: [
        "districts",
        "blocks",
        "villages",
        "users",
        "reports",
        "settings",
      ],
      canView: ["all"],
      hierarchyLevel: "national",
    },
    health_official: {
      canCreate: ["blocks", "users", "reports", "health_programs"],
      canUpdate: ["blocks", "users", "reports", "health_programs"],
      canView: [
        "district",
        "blocks",
        "villages",
        "health_data",
        "water_quality",
      ],
      hierarchyLevel: "district",
    },
    asha_worker: {
      canCreate: ["health_reports", "patient_records", "vaccination_records"],
      canUpdate: ["health_reports", "patient_records", "vaccination_records"],
      canView: ["assigned_villages", "health_data", "water_quality"],
      hierarchyLevel: "block",
    },
    volunteer: {
      canCreate: ["community_reports", "water_tests", "health_observations"],
      canUpdate: ["community_reports", "water_tests"],
      canView: ["assigned_areas", "basic_health_data"],
      hierarchyLevel: "village",
    },
    user: {
      canCreate: [
        "personal_health_records",
        "health_queries",
        "appointment_requests",
      ],
      canUpdate: ["personal_profile", "health_preferences", "own_records"],
      canView: [
        "personal_data",
        "health_tips",
        "nearby_services",
        "public_advisories",
      ],
      hierarchyLevel: "personal",
    },
    community_member: {
      canCreate: ["health_issues", "water_complaints"],
      canUpdate: ["own_records"],
      canView: ["village_data", "health_advisories"],
      hierarchyLevel: "village",
    },
  };

  // Mock data - replace with actual API calls
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const mockData = generateMockData(user?.roleInfo?.role || "user");
        setDashboardData(mockData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, selectedTimeRange]);

  const generateMockData = (role) => {
    const baseData = {
      overview: {
        totalPopulation: 45672,
        healthWorkers: 234,
        activeReports: 12,
        criticalAlerts: 3,
      },
      healthMetrics: {
        waterQualityTests: 156,
        safeWaterSources: 89,
        healthCheckups: 432,
        vaccinationsCovered: 234,
        diseasesCases: 8,
        recoveredCases: 6,
      },
      recentActivity: [
        {
          id: 1,
          type: "water_test",
          message: "Water quality test completed in Village A",
          time: "2 hours ago",
          status: "safe",
        },
        {
          id: 2,
          type: "health_report",
          message: "Monthly health report submitted",
          time: "4 hours ago",
          status: "completed",
        },
        {
          id: 3,
          type: "alert",
          message: "Potential disease outbreak detected",
          time: "6 hours ago",
          status: "critical",
        },
      ],
    };

    // Customize data based on role
    switch (role) {
      case "admin":
        return {
          ...baseData,
          districts: 8,
          blocks: 64,
          villages: 512,
          systemHealth: 99.2,
        };
      case "health_official":
        return {
          ...baseData,
          assignedBlocks: 8,
          assignedVillages: 64,
          healthWorkers: 45,
          pendingApprovals: 12,
        };
      case "user":
        return {
          ...baseData,
          overview: {
            personalHealthScore: 85,
            upcomingAppointments: 2,
            healthTips: 5,
            nearbyServices: 8,
          },
          healthMetrics: {
            lastCheckup: "15 days ago",
            vaccinationStatus: "Up to date",
            healthRecords: 12,
            familyMembers: 4,
          },
          recentActivity: [
            {
              id: 1,
              type: "appointment",
              message: "Appointment scheduled with Dr. Kumar",
              time: "1 day ago",
              status: "scheduled",
            },
            {
              id: 2,
              type: "health_record",
              message: "Health record updated",
              time: "3 days ago",
              status: "completed",
            },
            {
              id: 3,
              type: "tip",
              message: "New health tip available about hydration",
              time: "5 days ago",
              status: "info",
            },
          ],
        };
      default:
        return baseData;
    }
  };

  const getUserPermissions = () => {
    return permissions[user?.roleInfo?.role] || permissions.user;
  };

  const canPerformAction = (action, resource) => {
    const userPermissions = getUserPermissions();
    return (
      userPermissions[action]?.includes(resource) ||
      userPermissions[action]?.includes("all")
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {user?.roleInfo?.role === "admin" &&
                  "System Administrator Dashboard"}
                {user?.roleInfo?.role === "health_official" &&
                  "District Health Officer Dashboard"}
                {user?.roleInfo?.role === "asha_worker" &&
                  "ASHA Worker Dashboard"}
                {user?.roleInfo?.role === "volunteer" &&
                  "Village Volunteer Dashboard"}
                {user?.roleInfo?.role === "user" && "Personal Health Dashboard"}
                {user?.roleInfo?.role === "community_member" &&
                  "Community Member Dashboard"}
                {!user?.roleInfo?.role && "Personal Health Dashboard"}
              </h1>
              <p className="text-gray-600">
                Welcome back, {user?.personalInfo?.firstName}{" "}
                {user?.personalInfo?.lastName}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="24hours">Last 24 Hours</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 3 Months</option>
              </select>
              <button className="bg-teal-600 text-white px-4 py-2 rounded-md text-sm hover:bg-teal-700 transition-colors">
                <FiRefreshCw className="inline mr-2" size={16} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {user?.roleInfo?.role === "user" ? (
            // Personal dashboard stats for normal users
            <>
              <StatCard
                title="Health Score"
                value={`${dashboardData?.overview?.personalHealthScore}%`}
                icon={FiHeart}
                color="bg-green-500"
                trend="+5%"
              />
              <StatCard
                title="Upcoming Appointments"
                value={dashboardData?.overview?.upcomingAppointments}
                icon={FiClock}
                color="bg-blue-500"
                trend="+1"
              />
              <StatCard
                title="Health Tips"
                value={dashboardData?.overview?.healthTips}
                icon={FiBell}
                color="bg-purple-500"
                trend="New"
              />
              <StatCard
                title="Nearby Services"
                value={dashboardData?.overview?.nearbyServices}
                icon={FiMapPin}
                color="bg-teal-500"
                trend="Available"
              />
            </>
          ) : (
            // Default stats for other roles
            <>
              <StatCard
                title="Total Population"
                value={dashboardData?.overview?.totalPopulation?.toLocaleString()}
                icon={FiUsers}
                color="bg-blue-500"
                trend="+2.3%"
              />
              <StatCard
                title="Health Workers"
                value={dashboardData?.overview?.healthWorkers}
                icon={FiHeart}
                color="bg-green-500"
                trend="+5"
              />
              <StatCard
                title="Active Reports"
                value={dashboardData?.overview?.activeReports}
                icon={FiActivity}
                color="bg-purple-500"
                trend="+12"
              />
              <StatCard
                title="Critical Alerts"
                value={dashboardData?.overview?.criticalAlerts}
                icon={FiAlertTriangle}
                color="bg-red-500"
                trend="-2"
                trendDown
              />
            </>
          )}
        </div>

        <div
          className={`grid grid-cols-1 ${
            user?.roleInfo?.role === "user"
              ? "lg:grid-cols-1"
              : "lg:grid-cols-3"
          } gap-6`}
        >
          {/* Main Content Area */}
          <div
            className={`${
              user?.roleInfo?.role === "user" ? "" : "lg:col-span-2"
            } space-y-6`}
          >
            {/* Health Metrics */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  {user?.roleInfo?.role === "user"
                    ? "Personal Health Overview"
                    : "Health Surveillance Metrics"}
                </h2>
                {canPerformAction("canCreate", "reports") && (
                  <button className="bg-teal-600 text-white px-3 py-1 rounded-md text-sm hover:bg-teal-700 transition-colors">
                    <FiPlus className="inline mr-1" size={14} />
                    New Report
                  </button>
                )}
                {canPerformAction("canCreate", "personal_health_records") && (
                  <button className="bg-teal-600 text-white px-3 py-1 rounded-md text-sm hover:bg-teal-700 transition-colors">
                    <FiPlus className="inline mr-1" size={14} />
                    Add Health Record
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {user?.roleInfo?.role === "user" ? (
                  // Personal health metrics for normal users
                  <>
                    <MetricCard
                      title="Last Checkup"
                      value={dashboardData?.healthMetrics?.lastCheckup}
                      subtitle="Last visit"
                      icon={FiHeart}
                      color="text-red-600"
                    />
                    <MetricCard
                      title="Vaccination Status"
                      value={dashboardData?.healthMetrics?.vaccinationStatus}
                      subtitle="Current status"
                      icon={FiShield}
                      color="text-green-600"
                    />
                    <MetricCard
                      title="Health Records"
                      value={dashboardData?.healthMetrics?.healthRecords}
                      subtitle="Total records"
                      icon={FiActivity}
                      color="text-blue-600"
                    />
                  </>
                ) : (
                  // Default metrics for other roles
                  <>
                    <MetricCard
                      title="Water Quality Tests"
                      value={dashboardData?.healthMetrics?.waterQualityTests}
                      subtitle="This month"
                      icon={FiDroplet}
                      color="text-blue-600"
                    />
                    <MetricCard
                      title="Health Checkups"
                      value={dashboardData?.healthMetrics?.healthCheckups}
                      subtitle="This month"
                      icon={FiHeart}
                      color="text-red-600"
                    />
                    <MetricCard
                      title="Vaccinations"
                      value={dashboardData?.healthMetrics?.vaccinationsCovered}
                      subtitle="This month"
                      icon={FiShield}
                      color="text-green-600"
                    />
                  </>
                )}
              </div>

              {/* Role-specific metrics */}
              {user?.roleInfo?.role === "admin" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
                  <MetricCard
                    title="Districts"
                    value={dashboardData?.districts}
                    subtitle="Total managed"
                    icon={FiMapPin}
                    color="text-purple-600"
                  />
                  <MetricCard
                    title="System Health"
                    value={`${dashboardData?.systemHealth}%`}
                    subtitle="Uptime"
                    icon={FiActivity}
                    color="text-green-600"
                  />
                  <MetricCard
                    title="Total Villages"
                    value={dashboardData?.villages}
                    subtitle="Under surveillance"
                    icon={FiHome}
                    color="text-orange-600"
                  />
                </div>
              )}

              {user?.roleInfo?.role === "health_official" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                  <MetricCard
                    title="Assigned Blocks"
                    value={dashboardData?.assignedBlocks}
                    subtitle="Under supervision"
                    icon={FiMapPin}
                    color="text-purple-600"
                  />
                  <MetricCard
                    title="Pending Approvals"
                    value={dashboardData?.pendingApprovals}
                    subtitle="Require action"
                    icon={FiClock}
                    color="text-orange-600"
                  />
                </div>
              )}

              {/* User-specific additional metrics */}
              {user?.roleInfo?.role === "user" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                  <MetricCard
                    title="Family Members"
                    value={dashboardData?.healthMetrics?.familyMembers}
                    subtitle="Under care"
                    icon={FiUsers}
                    color="text-purple-600"
                  />
                  <MetricCard
                    title="Emergency Contacts"
                    value="3"
                    subtitle="Available"
                    icon={FiPhoneCall}
                    color="text-orange-600"
                  />
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {user?.roleInfo?.role === "user"
                  ? "Recent Health Activity"
                  : "Recent Activity"}
              </h2>
              <div className="space-y-4">
                {dashboardData?.recentActivity?.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            </div>

            {/* Personal Information Section - Only for users */}
            {user?.roleInfo?.role === "user" && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                  Personal Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Full Name
                      </label>
                      <p className="text-base text-gray-900">
                        {user?.personalInfo?.firstName}{" "}
                        {user?.personalInfo?.lastName}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Age
                      </label>
                      <p className="text-base text-gray-900">
                        {user?.personalInfo?.age || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Gender
                      </label>
                      <p className="text-base text-gray-900 capitalize">
                        {user?.personalInfo?.gender || "Not specified"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Phone Number
                      </label>
                      <p className="text-base text-gray-900">
                        {user?.authentication?.phone || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Email
                      </label>
                      <p className="text-base text-gray-900">
                        {user?.authentication?.email || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Location
                      </label>
                      <p className="text-base text-gray-900">
                        {user?.contactInfo?.currentAddress?.village ||
                          "Not specified"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Family Members Section - Only for users */}
            {user?.roleInfo?.role === "user" && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Family Members
                  </h2>
                  <button className="text-teal-600 hover:text-teal-700 text-sm font-medium">
                    <FiPlus className="inline mr-1" size={14} />
                    Add Member
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <FiUsers className="text-blue-600" size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Spouse
                        </p>
                        <p className="text-xs text-gray-500">
                          Last checkup: 2 months ago
                        </p>
                      </div>
                    </div>
                    <FiEye
                      className="text-gray-400 hover:text-gray-600 cursor-pointer"
                      size={16}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <FiUsers className="text-green-600" size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Child (Age 8)
                        </p>
                        <p className="text-xs text-gray-500">
                          Vaccinations up to date
                        </p>
                      </div>
                    </div>
                    <FiEye
                      className="text-gray-400 hover:text-gray-600 cursor-pointer"
                      size={16}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <FiUsers className="text-purple-600" size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Child (Age 5)
                        </p>
                        <p className="text-xs text-gray-500">
                          Next checkup due
                        </p>
                      </div>
                    </div>
                    <FiEye
                      className="text-gray-400 hover:text-gray-600 cursor-pointer"
                      size={16}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Personal Quick Actions - Only for users */}
            {user?.roleInfo?.role === "user" && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Quick Actions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                    <FiHeart className="text-blue-600 mb-2" size={24} />
                    <span className="text-sm font-medium text-blue-900">
                      Add Health Record
                    </span>
                  </button>
                  <button className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                    <FiClock className="text-green-600 mb-2" size={24} />
                    <span className="text-sm font-medium text-green-900">
                      Book Appointment
                    </span>
                  </button>
                  <button className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                    <FiHelpCircle className="text-purple-600 mb-2" size={24} />
                    <span className="text-sm font-medium text-purple-900">
                      Ask Health Query
                    </span>
                  </button>
                </div>
                <div className="mt-4">
                  <button className="w-full flex items-center justify-center p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
                    <FiAlertTriangle className="text-red-600 mr-2" size={20} />
                    <span className="text-red-900 font-medium">
                      Report Emergency
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Only for non-user roles */}
          {user?.roleInfo?.role !== "user" && (
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  {canPerformAction("canCreate", "personal_health_records") && (
                    <QuickActionButton
                      icon={FiHeart}
                      label="Add Health Record"
                      onClick={() =>
                        console.log("Create personal health record")
                      }
                    />
                  )}
                  {canPerformAction("canCreate", "appointment_requests") && (
                    <QuickActionButton
                      icon={FiClock}
                      label="Book Appointment"
                      onClick={() => console.log("Book appointment")}
                    />
                  )}
                  {canPerformAction("canCreate", "health_queries") && (
                    <QuickActionButton
                      icon={FiHelpCircle}
                      label="Ask Health Query"
                      onClick={() => console.log("Create health query")}
                    />
                  )}
                  {canPerformAction("canCreate", "health_reports") && (
                    <QuickActionButton
                      icon={FiHeart}
                      label="Health Report"
                      onClick={() => console.log("Create health report")}
                    />
                  )}
                  {canPerformAction("canCreate", "water_tests") && (
                    <QuickActionButton
                      icon={FiDroplet}
                      label="Water Test"
                      onClick={() => console.log("Create water test")}
                    />
                  )}
                  {canPerformAction("canCreate", "users") && (
                    <QuickActionButton
                      icon={FiUsers}
                      label="Add User"
                      onClick={() => console.log("Add user")}
                    />
                  )}
                  <QuickActionButton
                    icon={FiAlertTriangle}
                    label="Emergency Alert"
                    onClick={() => console.log("Create alert")}
                    urgent
                  />
                </div>
              </div>

              {/* Notifications */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Notifications
                </h3>
                <div className="space-y-3">
                  <NotificationItem
                    type="alert"
                    message="Water contamination detected in Village B"
                    time="1 hour ago"
                  />
                  <NotificationItem
                    type="success"
                    message="Monthly report approved"
                    time="3 hours ago"
                  />
                  <NotificationItem
                    type="info"
                    message="New health worker assigned to your area"
                    time="1 day ago"
                  />
                </div>
              </div>

              {/* Coverage Map */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Coverage Area
                </h3>
                <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <FiMapPin size={32} className="mx-auto mb-2" />
                    <p className="text-sm">Interactive Map</p>
                    <p className="text-xs">Coverage visualization</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper Components
const StatCard = ({ title, value, icon: Icon, color, trend, trendDown }) => (
  <div className="bg-white rounded-lg shadow-sm border p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {trend && (
          <p
            className={`text-sm flex items-center mt-2 ${
              trendDown ? "text-red-600" : "text-green-600"
            }`}
          >
            {trendDown ? (
              <FiTrendingDown size={14} />
            ) : (
              <FiTrendingUp size={14} />
            )}
            <span className="ml-1">{trend}</span>
          </p>
        )}
      </div>
      <div
        className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}
      >
        <Icon className="text-white" size={24} />
      </div>
    </div>
  </div>
);

const MetricCard = ({ title, value, subtitle, icon: Icon, color }) => (
  <div className="text-center">
    <Icon className={`mx-auto mb-2 ${color}`} size={24} />
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-sm font-medium text-gray-900">{title}</p>
    <p className="text-xs text-gray-500">{subtitle}</p>
  </div>
);

const ActivityItem = ({ activity }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "critical":
        return "text-red-600 bg-red-100";
      case "safe":
        return "text-green-600 bg-green-100";
      case "completed":
        return "text-blue-600 bg-blue-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
      <div
        className={`w-2 h-2 rounded-full mt-2 ${
          getStatusColor(activity.status).split(" ")[1]
        }`}
      ></div>
      <div className="flex-1">
        <p className="text-sm text-gray-900">{activity.message}</p>
        <p className="text-xs text-gray-500">{activity.time}</p>
      </div>
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
          activity.status
        )}`}
      >
        {activity.status}
      </span>
    </div>
  );
};

const QuickActionButton = ({ icon: Icon, label, onClick, urgent = false }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left hover:bg-gray-50 transition-colors ${
      urgent ? "border border-red-200 bg-red-50" : ""
    }`}
  >
    <Icon className={urgent ? "text-red-600" : "text-gray-600"} size={16} />
    <span className={`text-sm ${urgent ? "text-red-900" : "text-gray-900"}`}>
      {label}
    </span>
  </button>
);

const NotificationItem = ({ type, message, time }) => {
  const getIcon = () => {
    switch (type) {
      case "alert":
        return <FiAlertTriangle className="text-red-500" size={16} />;
      case "success":
        return <FiCheckCircle className="text-green-500" size={16} />;
      default:
        return <FiBell className="text-blue-500" size={16} />;
    }
  };

  return (
    <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
      {getIcon()}
      <div className="flex-1">
        <p className="text-sm text-gray-900">{message}</p>
        <p className="text-xs text-gray-500">{time}</p>
      </div>
    </div>
  );
};

export default Dashboard;
