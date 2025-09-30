import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiUsers, FiUserCheck, FiUserX, FiShield, FiMapPin } from 'react-icons/fi';
import AdminTable from '../../../components/Admin/AdminTable';
import ConfirmDialog from '../../../components/Admin/ConfirmDialog';
import { getAllUsers, verifyUser, suspendUser, deleteUser } from '../../../services/userService';
import  useAuthStore  from '../../../store/useAuthStore';

/**
 * UserList Component
 * Main user management page with advanced filtering, search, and user actions
 */
const UserList = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: '',
    verified: '',
    districtId: ''
  });
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    suspended: 0,
    verified: 0,
    pending: 0
  });
  const [actionConfirmation, setActionConfirmation] = useState({
    isOpen: false,
    type: '',
    user: null,
    loading: false
  });

  // Check admin access
  useEffect(() => {
    if (!user || user.roleInfo?.role !== 'admin') {
      navigate('/app');
      return;
    }
  }, [user, navigate]);

  // Fetch users data
  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const response = await getAllUsers({
        page,
        limit: 10,
        search: filters.search,
        role: filters.role,
        status: filters.status,
        verified: filters.verified,
        districtId: filters.districtId,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      if (response.success) {
        setUsers(response.data);
        setCurrentPage(response.pagination.currentPage);
        setTotalPages(response.pagination.totalPages);
        
        // Calculate stats from data
        const total = response.data.length;
        const active = response.data.filter(u => u.accountStatus === 'active').length;
        const suspended = response.data.filter(u => u.accountStatus === 'suspended').length;
        const verified = response.data.filter(u => u.verified === true).length;
        const pending = response.data.filter(u => u.verified === false).length;
        
        setStats({ total, active, suspended, verified, pending });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage, filters]);

  // Handle search and filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Handle user actions
  const handleView = (userData) => {
    navigate(`/app/users/${userData._id}`);
  };

  const handleEdit = (userData) => {
    // TODO: Navigate to user edit page when implemented
    console.log('Edit user:', userData);
  };

  const handleVerify = async (userData) => {
    setActionConfirmation({
      isOpen: true,
      type: 'verify',
      user: userData,
      loading: false
    });
  };

  const handleSuspend = async (userData) => {
    setActionConfirmation({
      isOpen: true,
      type: userData.accountStatus === 'suspended' ? 'activate' : 'suspend',
      user: userData,
      loading: false
    });
  };

  const handleDelete = async (userData) => {
    setActionConfirmation({
      isOpen: true,
      type: 'delete',
      user: userData,
      loading: false
    });
  };

  const handleActionConfirm = async () => {
    const { type, user: targetUser } = actionConfirmation;
    setActionConfirmation(prev => ({ ...prev, loading: true }));

    try {
      let response;
      
      switch (type) {
        case 'verify':
          response = await verifyUser(targetUser._id, {
            verified: true,
            verifiedBy: user._id,
            verificationNotes: 'Verified by admin'
          });
          break;
        
        case 'suspend':
          response = await suspendUser(targetUser._id, {
            suspended: true,
            suspendedBy: user._id,
            suspensionReason: 'Suspended by admin'
          });
          break;
        
        case 'activate':
          response = await suspendUser(targetUser._id, {
            suspended: false,
            suspendedBy: user._id,
            suspensionReason: 'Activated by admin'
          });
          break;
        
        case 'delete':
          response = await deleteUser(targetUser._id);
          break;
        
        default:
          return;
      }

      if (response.success) {
        // Refresh the list
        fetchUsers(currentPage);
        // TODO: Show success notification
        console.log(`User ${type}d successfully`);
      } else {
        // TODO: Show error notification
        console.error(`${type} failed:`, response.message);
      }
    } catch (error) {
      console.error(`Error ${type}ing user:`, error);
      // TODO: Show error notification
    } finally {
      setActionConfirmation({ isOpen: false, type: '', user: null, loading: false });
    }
  };

  const handleCreateNew = () => {
    // TODO: Navigate to user create page when implemented
    console.log('Create new user');
  };

  // Define table columns
  const columns = [
    {
      header: 'User',
      accessor: 'name',
      render: (userData) => (
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <span className="text-sm font-medium text-blue-600">
              {userData.name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-900">{userData.name}</div>
            <div className="text-sm text-gray-500">{userData.email}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Phone',
      accessor: 'phone',
      render: (userData) => (
        <span className="text-sm text-gray-900">{userData.phone || 'Not provided'}</span>
      )
    },
    {
      header: 'Role',
      accessor: 'roleInfo.role',
      type: 'badge',
      getBadgeClass: (role) => {
        const roleColors = {
          'admin': 'bg-purple-100 text-purple-800',
          'health_official': 'bg-blue-100 text-blue-800',
          'block_officer': 'bg-green-100 text-green-800',
          'village_worker': 'bg-yellow-100 text-yellow-800',
          'citizen': 'bg-gray-100 text-gray-800'
        };
        return roleColors[role] || 'bg-gray-100 text-gray-800';
      },
      render: (userData) => {
        const role = userData.roleInfo?.role || 'unknown';
        const roleLabels = {
          'admin': 'Admin',
          'health_official': 'Health Official',
          'block_officer': 'Block Officer',
          'village_worker': 'Village Worker',
          'citizen': 'Citizen'
        };
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            columns[3].getBadgeClass(role)
          }`}>
            {roleLabels[role] || role}
          </span>
        );
      }
    },
    {
      header: 'Assigned Area',
      accessor: 'assignedArea',
      render: (userData) => {
        const hierarchy = userData.roleInfo?.hierarchy;
        if (!hierarchy) return <span className="text-sm text-gray-500">Not assigned</span>;
        
        return (
          <div className="text-sm">
            {hierarchy.district && (
              <div className="flex items-center text-gray-900">
                <FiMapPin className="w-3 h-3 mr-1" />
                {hierarchy.district.name}
              </div>
            )}
            {hierarchy.block && (
              <div className="text-xs text-gray-500">Block: {hierarchy.block.name}</div>
            )}
            {hierarchy.village && (
              <div className="text-xs text-gray-500">Village: {hierarchy.village.name}</div>
            )}
          </div>
        );
      }
    },
    {
      header: 'Status',
      accessor: 'accountStatus',
      type: 'badge',
      getBadgeClass: (status) => {
        return status === 'active' 
          ? 'bg-green-100 text-green-800'
          : status === 'suspended'
          ? 'bg-red-100 text-red-800'
          : 'bg-yellow-100 text-yellow-800';
      }
    },
    {
      header: 'Verification',
      accessor: 'verified',
      render: (userData) => (
        <div className="flex items-center">
          {userData.verified ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <FiUserCheck className="w-3 h-3 mr-1" />
              Verified
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              <FiUserX className="w-3 h-3 mr-1" />
              Pending
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Joined',
      accessor: 'createdAt',
      render: (userData) => (
        <span className="text-sm text-gray-500">
          {userData.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'}
        </span>
      )
    }
  ];

  // Custom actions for users
  const getUserActions = (userData) => {
    const actions = ['view'];
    
    // Add verify action if not verified
    if (!userData.verified) {
      actions.push('verify');
    }
    
    // Add suspend/activate action
    if (userData.accountStatus === 'active') {
      actions.push('suspend');
    } else if (userData.accountStatus === 'suspended') {
      actions.push('activate');
    }
    
    // Add delete action
    actions.push('delete');
    
    return actions;
  };

  // Custom action handlers
  const handleCustomAction = (action, userData) => {
    switch (action) {
      case 'verify':
        handleVerify(userData);
        break;
      case 'suspend':
      case 'activate':
        handleSuspend(userData);
        break;
      default:
        break;
    }
  };

  // Statistics cards data
  const statsCards = [
    {
      title: 'Total Users',
      value: stats.total,
      icon: FiUsers,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-600'
    },
    {
      title: 'Active Users',
      value: stats.active,
      icon: FiUserCheck,
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      textColor: 'text-green-600'
    },
    {
      title: 'Verified Users',
      value: stats.verified,
      icon: FiShield,
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      textColor: 'text-purple-600'
    },
    {
      title: 'Pending Verification',
      value: stats.pending,
      icon: FiUserX,
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      textColor: 'text-yellow-600'
    }
  ];

  const userRoles = [
    { value: 'admin', label: 'Admin' },
    { value: 'health_official', label: 'Health Official' },
    { value: 'block_officer', label: 'Block Officer' },
    { value: 'village_worker', label: 'Village Worker' },
    { value: 'citizen', label: 'Citizen' }
  ];

  if (!user || user.roleInfo?.role !== 'admin') {
    return null;
  }

  // Get confirmation dialog configuration
  const getConfirmationConfig = () => {
    const { type, user: targetUser } = actionConfirmation;
    
    const configs = {
      verify: {
        title: 'Verify User',
        message: `Are you sure you want to verify "${targetUser?.name}"? This will mark them as a verified user.`,
        confirmText: 'Verify User',
        type: 'success'
      },
      suspend: {
        title: 'Suspend User',
        message: `Are you sure you want to suspend "${targetUser?.name}"? They will not be able to access the system.`,
        confirmText: 'Suspend User',
        type: 'warning'
      },
      activate: {
        title: 'Activate User',
        message: `Are you sure you want to activate "${targetUser?.name}"? They will regain access to the system.`,
        confirmText: 'Activate User',
        type: 'success'
      },
      delete: {
        title: 'Delete User',
        message: `Are you sure you want to delete "${targetUser?.name}"? This action cannot be undone and will permanently remove all user data.`,
        confirmText: 'Delete User',
        type: 'danger'
      }
    };
    
    return configs[type] || {};
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">Manage user accounts, roles, and permissions</p>
          </div>
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <FiPlus className="w-4 h-4 mr-2" />
            Create New User
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
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
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
              Search Users
            </label>
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="min-w-40">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Roles</option>
              {userRoles.map(role => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </div>
          <div className="min-w-32">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div className="min-w-32">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Verification
            </label>
            <select
              value={filters.verified}
              onChange={(e) => handleFilterChange('verified', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All</option>
              <option value="true">Verified</option>
              <option value="false">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table with Custom Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <AdminTable
          columns={columns}
          data={users}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          actions={['view', 'edit', 'delete']}
          emptyMessage="No users found"
          searchable={false} // Search is handled by filters above
        />
        
        {/* Custom Action Buttons */}
        {users.length > 0 && (
          <div className="p-4 border-t border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <tbody>
                  {users.map((userData, index) => (
                    <tr key={index} className="border-b border-gray-100 last:border-b-0">
                      <td className="py-2 text-sm text-gray-900 font-medium">
                        {userData.name}
                      </td>
                      <td className="py-2 text-right">
                        <div className="flex justify-end space-x-2">
                          {!userData.verified && (
                            <button
                              onClick={() => handleVerify(userData)}
                              className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                            >
                              <FiUserCheck className="w-3 h-3 mr-1" />
                              Verify
                            </button>
                          )}
                          {userData.accountStatus === 'active' ? (
                            <button
                              onClick={() => handleSuspend(userData)}
                              className="inline-flex items-center px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
                            >
                              <FiUserX className="w-3 h-3 mr-1" />
                              Suspend
                            </button>
                          ) : userData.accountStatus === 'suspended' && (
                            <button
                              onClick={() => handleSuspend(userData)}
                              className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                            >
                              <FiUserCheck className="w-3 h-3 mr-1" />
                              Activate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Action Confirmation Dialog */}
      <ConfirmDialog
        isOpen={actionConfirmation.isOpen}
        onClose={() => setActionConfirmation({ isOpen: false, type: '', user: null, loading: false })}
        onConfirm={handleActionConfirm}
        loading={actionConfirmation.loading}
        {...getConfirmationConfig()}
      />
    </div>
  );
};

export default UserList;