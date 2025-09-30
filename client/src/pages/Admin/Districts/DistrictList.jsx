import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiPlus,
  FiMapPin,
  FiUsers,
  FiActivity,
} from "react-icons/fi";
import { FaBuilding } from "react-icons/fa";
import AdminTable from "../../../components/Admin/AdminTable";
import {
  getAllDistricts,
  deleteDistrict,
  updateDistrictStatus,
} from "../../../services/districtService";
import useAuthStore from "../../../store/useAuthStore";

/**
 * DistrictList Component
 * Main district listing page with table view, search, filtering, and actions
 */
const DistrictList = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    search: "",
    state: "",
    status: "",
  });
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    totalBlocks: 0,
  });

  // Check admin access
  useEffect(() => {
    if (!user || user.roleInfo?.role !== "admin") {
      navigate("/app");
      return;
    }
  }, [user, navigate]);

  // Fetch districts data
  const fetchDistricts = async (page = 1) => {
    setLoading(true);
    try {
      const response = await getAllDistricts({
        page,
        limit: 10,
        search: filters.search,
        state: filters.state,
        status: filters.status,
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      if (response.success) {
        setDistricts(response.data);
        setCurrentPage(response.pagination.currentPage);
        setTotalPages(response.pagination.totalPages);

        // Calculate stats from data
        const total = response.data.length;
        const active = response.data.filter(
          (d) => d.status === "active"
        ).length;
        const inactive = response.data.filter(
          (d) => d.status === "inactive"
        ).length;
        const totalBlocks = response.data.reduce(
          (sum, d) => sum + (d.totalBlocks || 0),
          0
        );

        setStats({ total, active, inactive, totalBlocks });
      }
    } catch (error) {
      console.error("Error fetching districts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDistricts(currentPage);
  }, [currentPage, filters]);

  // Handle search and filter changes
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Handle district actions
  const handleView = (district) => {
    navigate(`/app/districts/${district._id}`);
  };

  const handleEdit = (district) => {
    navigate(`/app/districts/${district._id}/edit`);
  };

  const handleDelete = async (district) => {
    try {
      const response = await deleteDistrict(district._id);
      if (response.success) {
        // Refresh the list
        fetchDistricts(currentPage);
        // TODO: Show success notification
      } else {
        // TODO: Show error notification
        console.error("Delete failed:", response.message);
      }
    } catch (error) {
      console.error("Error deleting district:", error);
      // TODO: Show error notification
    }
  };

  const handleCreateNew = () => {
    navigate("/app/districts/new");
  };

  // Define table columns
  const columns = [
    {
      header: "District Name",
      accessor: "name",
      render: (district) => (
        <div className="flex items-center">
          <FiMapPin className="w-4 h-4 text-gray-400 mr-2" />
          <div>
            <div className="font-medium text-gray-900">{district.name}</div>
            <div className="text-sm text-gray-500">{district.code}</div>
          </div>
        </div>
      ),
    },
    {
      header: "State",
      accessor: "state",
    },
    {
      header: "District Officer",
      accessor: "districtOfficer",
      render: (district) => (
        <div>
          <div className="text-sm text-gray-900">
            {district.districtOfficer?.name || "Not Assigned"}
          </div>
          <div className="text-xs text-gray-500">
            {district.districtOfficer?.email || ""}
          </div>
        </div>
      ),
    },
    {
      header: "Demographics",
      accessor: "demographics",
      render: (district) => (
        <div className="text-sm">
          <div className="flex items-center text-gray-900">
            <FiUsers className="w-3 h-3 mr-1" />
            {district.demographics?.totalPopulation?.toLocaleString() || "N/A"}
          </div>
          <div className="text-xs text-gray-500">
            Rural: {district.demographics?.ruralPercentage || 0}%
          </div>
        </div>
      ),
    },
    {
      header: "Health Infrastructure",
      accessor: "healthInfrastructure",
      render: (district) => (
        <div className="text-sm">
          <div className="flex items-center text-gray-900">
            <FaBuilding className="w-3 h-3 mr-1" />
            {district.healthInfrastructure?.primaryHealthCenters || 0} PHCs
          </div>
          <div className="text-xs text-gray-500">
            {district.healthInfrastructure?.communityHealthCenters || 0} CHCs
          </div>
        </div>
      ),
    },
    {
      header: "Blocks",
      accessor: "totalBlocks",
      render: (district) => (
        <div className="text-sm text-gray-900">{district.totalBlocks || 0}</div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      type: "badge",
      getBadgeClass: (status) => {
        return status === "active"
          ? "bg-green-100 text-green-800"
          : "bg-red-100 text-red-800";
      },
    },
  ];

  // Statistics cards data
  const statsCards = [
    {
      title: "Total Districts",
      value: stats.total,
      icon: FiMapPin,
      color: "blue",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      textColor: "text-blue-600",
    },
    {
      title: "Active Districts",
      value: stats.active,
      icon: FiActivity,
      color: "green",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      textColor: "text-green-600",
    },
    {
      title: "Inactive Districts",
      value: stats.inactive,
      icon: FiActivity,
      color: "red",
      bgColor: "bg-red-50",
      iconColor: "text-red-600",
      textColor: "text-red-600",
    },
    {
      title: "Total Blocks",
      value: stats.totalBlocks,
      icon: FaBuilding,
      color: "purple",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
      textColor: "text-purple-600",
    },
  ];

  const indianStates = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
  ];

  if (!user || user.roleInfo?.role !== "admin") {
    return null;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              District Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage districts and their administrative settings
            </p>
          </div>
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <FiPlus className="w-4 h-4 mr-2" />
            Create New District
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {statsCards.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={index}
              className={`${stat.bgColor} rounded-lg p-6 border border-gray-200`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </p>
                  <p className={`text-2xl font-bold ${stat.textColor}`}>
                    {stat.value}
                  </p>
                </div>
                <IconComponent className={`w-8 h-8 ${stat.iconColor}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Districts
            </label>
            <input
              type="text"
              placeholder="Search by name or code..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="min-w-40">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State
            </label>
            <select
              value={filters.state}
              onChange={(e) => handleFilterChange("state", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All States</option>
              {indianStates.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-32">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Districts Table */}
      <AdminTable
        columns={columns}
        data={districts}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        actions={["view", "edit", "delete"]}
        emptyMessage="No districts found"
        searchable={false} // Search is handled by filters above
      />
    </div>
  );
};

export default DistrictList;
