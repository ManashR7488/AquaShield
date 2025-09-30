import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiPlus,
  FiMapPin,
  FiUsers,
  FiActivity,
  FiMap,
} from "react-icons/fi";
import { FaBuilding } from "react-icons/fa";
import AdminTable from "../../../components/Admin/AdminTable";
import ConfirmDialog from "../../../components/Admin/ConfirmDialog";
import {
  getAllBlocks,
  deleteBlock,
  updateBlockStatus,
  getDistrictBlocksSummary,
} from "../../../services/blockService";
import useAuthStore from "../../../store/useAuthStore";
import { getHealthOfficerDistrict } from "../../../utils/healthOfficerGuard.jsx";

/**
 * BlockList Component
 * Main block listing page for health officers to manage blocks within their district
 */
const BlockList = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Get health officer's district ID
  const districtId = getHealthOfficerDistrict();
  
  // State management
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({
    totalBlocks: 0,
    activeBlocks: 0,
    totalVillages: 0,
    totalStaff: 0
  });
  
  // Table state
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [statusFilter, setStatusFilter] = useState("");
  const [officerFilter, setOfficerFilter] = useState("");
  
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: 'delete',
    title: '',
    message: '',
    onConfirm: null
  });

  // Fetch blocks data
  const fetchBlocks = async () => {
    if (!districtId) {
      setError("District information not available");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        status: statusFilter,
        blockOfficer: officerFilter,
        sortBy,
        sortOrder
      };
      
      // Remove empty parameters
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });
      
      const response = await getAllBlocks(districtId, params);
      
      if (response.success) {
        setBlocks(response.data);
      } else {
        setError(response.error);
        setBlocks([]);
      }
    } catch (err) {
      setError("Failed to fetch blocks");
      setBlocks([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch summary data
  const fetchSummary = async () => {
    if (!districtId) return;
    
    try {
      const response = await getDistrictBlocksSummary(districtId);
      if (response.success) {
        setSummary(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch summary:", err);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchBlocks();
    fetchSummary();
  }, [currentPage, itemsPerPage, searchTerm, statusFilter, officerFilter, sortBy, sortOrder, districtId]);

  // Check if user is health officer
  useEffect(() => {
    if (user && user.roleInfo?.role !== 'health_official') {
      navigate('/app');
    }
  }, [user, navigate]);

  // Handle delete block
  const handleDeleteBlock = async (blockId) => {
    try {
      const response = await deleteBlock(blockId);
      
      if (response.success) {
        await fetchBlocks();
        await fetchSummary();
        // Show success toast here if using toast notifications
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError("Failed to delete block");
    }
  };

  // Handle status update
  const handleUpdateStatus = async (blockId, newStatus) => {
    try {
      const response = await updateBlockStatus(blockId, newStatus);
      
      if (response.success) {
        await fetchBlocks();
        await fetchSummary();
        // Show success toast here
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError("Failed to update block status");
    }
  };

  // Table column definitions
  const columns = [
    {
      key: "name",
      label: "Block Name",
      sortable: true,
      render: (block) => (
        <div className="flex items-center space-x-3">
          <FiMap className="text-blue-600" size={16} />
          <div>
            <div className="font-medium text-gray-900">{block.name}</div>
            <div className="text-sm text-gray-500">ID: {block._id}</div>
          </div>
        </div>
      )
    },
    {
      key: "blockOfficer",
      label: "Block Officer",
      render: (block) => (
        <div>
          <div className="font-medium text-gray-900">
            {block.blockOfficer?.name || "Not Assigned"}
          </div>
          <div className="text-sm text-gray-500">
            {block.blockOfficer?.contact?.phone || "No contact"}
          </div>
        </div>
      )
    },
    {
      key: "villages",
      label: "Villages",
      render: (block) => (
        <div className="text-center">
          <div className="font-medium text-gray-900">
            {block.demographics?.totalVillages || 0}
          </div>
          <div className="text-xs text-gray-500">villages</div>
        </div>
      )
    },
    {
      key: "staff",
      label: "Staff",
      render: (block) => {
        const totalStaff = (block.assignedStaff?.ashaWorkers?.length || 0) + 
                          (block.assignedStaff?.volunteers?.length || 0);
        return (
          <div className="text-center">
            <div className="font-medium text-gray-900">{totalStaff}</div>
            <div className="text-xs text-gray-500">
              {block.assignedStaff?.ashaWorkers?.length || 0} ASHA + {" "}
              {block.assignedStaff?.volunteers?.length || 0} Vol
            </div>
          </div>
        );
      }
    },
    {
      key: "population",
      label: "Population",
      render: (block) => (
        <div className="text-center">
          <div className="font-medium text-gray-900">
            {block.demographics?.totalPopulation?.toLocaleString() || 0}
          </div>
          <div className="text-xs text-gray-500">people</div>
        </div>
      )
    },
    {
      key: "status",
      label: "Status",
      render: (block) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          block.status === 'active' 
            ? 'bg-green-100 text-green-800'
            : block.status === 'inactive'
            ? 'bg-yellow-100 text-yellow-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {block.status}
        </span>
      )
    }
  ];

  // Table actions
  const actions = [
    {
      label: "View",
      icon: FiActivity,
      onClick: (block) => navigate(`/app/blocks/${block._id}`),
      variant: "primary"
    },
    {
      label: "Edit",
      icon: FiUsers,
      onClick: (block) => navigate(`/app/blocks/${block._id}/edit`),
      variant: "secondary"
    },
    {
      label: block => block.status === 'active' ? 'Deactivate' : 'Activate',
      icon: FiMapPin,
      onClick: (block) => {
        const newStatus = block.status === 'active' ? 'inactive' : 'active';
        setConfirmDialog({
          isOpen: true,
          type: newStatus === 'active' ? 'activate' : 'deactivate',
          title: `${newStatus === 'active' ? 'Activate' : 'Deactivate'} Block`,
          message: `Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} "${block.name}"?`,
          onConfirm: () => {
            handleUpdateStatus(block._id, newStatus);
            setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          }
        });
      },
      variant: "warning"
    },
    {
      label: "Delete",
      icon: FiMapPin,
      onClick: (block) => {
        setConfirmDialog({
          isOpen: true,
          type: 'delete',
          title: 'Delete Block',
          message: `Are you sure you want to delete "${block.name}"? This action cannot be undone.`,
          onConfirm: () => {
            handleDeleteBlock(block._id);
            setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          }
        });
      },
      variant: "danger"
    }
  ];

  // Filter options
  const filterOptions = [
    {
      key: "status",
      label: "Status",
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { value: "", label: "All Statuses" },
        { value: "pending_approval", label: "Pending Approval" },
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" }
      ]
    }
  ];

  if (!districtId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            District Not Assigned
          </h2>
          <p className="text-gray-600">
            Please contact your administrator to assign you to a district.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Block Management</h1>
            <p className="text-gray-600 mt-1">
              Manage blocks within your district
            </p>
            {user?.roleInfo?.hierarchy?.district && (
              <p className="text-sm text-blue-600 mt-1">
                District: {user.roleInfo.hierarchy.district.name}
              </p>
            )}
          </div>
          <button
            onClick={() => navigate('/app/blocks/new')}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiPlus size={16} />
            <span>Create New Block</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Blocks</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalBlocks}</p>
            </div>
            <FaBuilding className="text-blue-600" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Blocks</p>
              <p className="text-2xl font-bold text-green-600">{summary.activeBlocks}</p>
            </div>
            <FiActivity className="text-green-600" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Villages</p>
              <p className="text-2xl font-bold text-indigo-600">{summary.totalVillages}</p>
            </div>
            <FiMapPin className="text-indigo-600" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Staff</p>
              <p className="text-2xl font-bold text-purple-600">{summary.totalStaff}</p>
            </div>
            <FiUsers className="text-purple-600" size={24} />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Blocks Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <AdminTable
          data={blocks}
          columns={columns}
          actions={actions}
          loading={loading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={(key, order) => {
            setSortBy(key);
            setSortOrder(order);
          }}
          filterOptions={filterOptions}
          emptyMessage="No blocks found in your district"
        />
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

export default BlockList;