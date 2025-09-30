import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FiPlus, 
  FiSearch, 
  FiFilter, 
  FiUsers,
  FiMapPin,
  FiMail,
  FiPhone,
  FiUserCheck,
  FiUserX,
  FiDownload
} from "react-icons/fi";
import { FaUserMd } from "react-icons/fa";
import AdminTable from "../../../components/Admin/AdminTable";
import ConfirmDialog from "../../../components/Admin/ConfirmDialog";
import {
  getAllUsers,
  getUserById,
  updateUser
} from "../../../services/userService";
import {
  getBlockStaff,
  assignStaffToBlock,
  removeStaffFromBlock
} from "../../../services/blockService";
import { getAllBlocks } from "../../../services/blockService";
import useAuthStore from "../../../store/useAuthStore";
import { getHealthOfficerDistrict } from "../../../utils/healthOfficerGuard.jsx";

/**
 * StaffList Component
 * Management page for viewing and assigning district staff
 */
const StaffList = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Get health officer's district ID
  const districtId = getHealthOfficerDistrict();
  
  // Component state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [staff, setStaff] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [blockFilter, setBlockFilter] = useState('all');
  
  // Action loading states
  const [actionLoading, setActionLoading] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Assignment modal state
  const [assignmentModal, setAssignmentModal] = useState({
    isOpen: false,
    staffId: null,
    staffName: '',
    selectedBlocks: []
  });
  
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: null
  });

  // Check if user is health officer
  useEffect(() => {
    if (user && user.roleInfo?.role !== 'health_official') {
      navigate('/app');
    }
  }, [user, navigate]);

  // Fetch staff and blocks data
  useEffect(() => {
    const fetchStaffAndBlocks = async () => {
      if (!districtId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch all staff in the district
        const staffResponse = await getAllUsers({ 
          districtId,
          limit: 100 // Get all staff without pagination for now
        });
        
        // Fetch all blocks in the district
        const blocksResponse = await getAllBlocks(districtId);
        
        if (staffResponse.success) {
          // Enrich staff data with block assignments
          const enrichedStaff = await Promise.all(
            staffResponse.data.map(async (member) => {
              try {
                // Get blocks assigned to this staff member
                const assignedBlocks = [];
                // This would typically be part of the user data or fetched separately
                // For now, we'll use a placeholder approach
                
                return {
                  ...member,
                  assignedBlocks,
                  totalAssignments: assignedBlocks.length
                };
              } catch (err) {
                console.error(`Error fetching assignments for ${member.name}:`, err);
                return {
                  ...member,
                  assignedBlocks: [],
                  totalAssignments: 0
                };
              }
            })
          );
          
          setStaff(enrichedStaff);
          setFilteredStaff(enrichedStaff);
        } else {
          setError(staffResponse.error || 'Failed to fetch staff data');
        }
        
        if (blocksResponse.success) {
          setBlocks(blocksResponse.data);
        }
        
      } catch (err) {
        console.error('Error fetching staff and blocks:', err);
        setError('An unexpected error occurred while fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchStaffAndBlocks();
  }, [districtId]);

  // Filter and search staff
  useEffect(() => {
    let filtered = staff;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.roleInfo?.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.contact?.phone?.includes(searchTerm)
      );
    }
    
    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(member => member.roleInfo?.role === roleFilter);
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(member => {
        if (statusFilter === 'assigned') {
          return member.totalAssignments > 0;
        } else if (statusFilter === 'unassigned') {
          return member.totalAssignments === 0;
        }
        return true;
      });
    }
    
    // Apply block filter
    if (blockFilter !== 'all') {
      filtered = filtered.filter(member => 
        member.assignedBlocks?.some(block => block._id === blockFilter)
      );
    }
    
    setFilteredStaff(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [staff, searchTerm, roleFilter, statusFilter, blockFilter]);

  // Handle staff assignment to blocks
  const handleStaffAssignment = async (staffId, blockIds) => {
    setActionLoading(true);
    
    try {
      // Remove from all current blocks first (if any)
      const staffMember = staff.find(s => s._id === staffId);
      if (staffMember?.assignedBlocks?.length > 0) {
        await Promise.all(
          staffMember.assignedBlocks.map(block =>
            removeStaffFromBlock(block._id, staffId)
          )
        );
      }
      
      // Assign to new blocks
      const role = staffMember?.roleInfo?.role || 'asha_worker';
      await Promise.all(
        blockIds.map(blockId =>
          assignStaffToBlock(blockId, { staffId, role })
        )
      );
      
      // Update local state
      setStaff(prev => prev.map(member => {
        if (member._id === staffId) {
          const assignedBlocks = blocks.filter(block => blockIds.includes(block._id));
          return {
            ...member,
            assignedBlocks,
            totalAssignments: assignedBlocks.length
          };
        }
        return member;
      }));
      
      console.log("Staff assignment updated successfully");
      setAssignmentModal({ isOpen: false, staffId: null, staffName: '', selectedBlocks: [] });
      
    } catch (err) {
      console.error('Error updating staff assignment:', err);
      setError('Failed to update staff assignment');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle remove staff from all assignments
  const handleRemoveAllAssignments = async (staffId) => {
    setActionLoading(true);
    
    try {
      const staffMember = staff.find(s => s._id === staffId);
      
      if (staffMember?.assignedBlocks?.length > 0) {
        await Promise.all(
          staffMember.assignedBlocks.map(block =>
            removeStaffFromBlock(block._id, staffId)
          )
        );
        
        // Update local state
        setStaff(prev => prev.map(member => {
          if (member._id === staffId) {
            return {
              ...member,
              assignedBlocks: [],
              totalAssignments: 0
            };
          }
          return member;
        }));
        
        console.log("All staff assignments removed successfully");
      }
      
    } catch (err) {
      console.error('Error removing staff assignments:', err);
      setError('Failed to remove staff assignments');
    } finally {
      setActionLoading(false);
    }
  };

  // Table columns configuration
  const columns = [
    {
      header: 'Staff Member',
      accessor: 'name',
      render: (member) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-sm font-medium">
                {member.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div>
            <p className="font-medium text-gray-900">{member.name}</p>
            <p className="text-sm text-gray-500">ID: {member._id}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Role',
      accessor: 'role',
      render: (member) => (
        <div className="text-sm">
          <p className="font-medium text-gray-900 capitalize">
            {member.roleInfo?.role?.replace('_', ' ')}
          </p>
          <p className="text-gray-500">
            {member.roleInfo?.hierarchy?.department || 'Health Department'}
          </p>
        </div>
      )
    },
    {
      header: 'Contact',
      accessor: 'contact',
      render: (member) => (
        <div className="text-sm space-y-1">
          {member.contact?.phone && (
            <div className="flex items-center space-x-1">
              <FiPhone size={12} className="text-gray-400" />
              <span className="text-gray-900">{member.contact.phone}</span>
            </div>
          )}
          {member.email && (
            <div className="flex items-center space-x-1">
              <FiMail size={12} className="text-gray-400" />
              <span className="text-gray-600">{member.email}</span>
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Block Assignments',
      accessor: 'assignments',
      render: (member) => (
        <div className="text-sm">
          <div className="flex items-center space-x-1 text-gray-900 mb-1">
            <FiMapPin size={14} />
            <span className="font-medium">{member.totalAssignments}</span>
            <span className="text-gray-500">blocks</span>
          </div>
          {member.assignedBlocks?.length > 0 && (
            <div className="space-y-1">
              {member.assignedBlocks.slice(0, 2).map(block => (
                <div key={block._id} className="text-xs text-gray-600">
                  {block.name}
                </div>
              ))}
              {member.assignedBlocks.length > 2 && (
                <div className="text-xs text-gray-500">
                  +{member.assignedBlocks.length - 2} more
                </div>
              )}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (member) => {
        const isAssigned = member.totalAssignments > 0;
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            isAssigned 
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {isAssigned ? 'Assigned' : 'Unassigned'}
          </span>
        );
      }
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (member) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setAssignmentModal({
                isOpen: true,
                staffId: member._id,
                staffName: member.name,
                selectedBlocks: member.assignedBlocks?.map(block => block._id) || []
              });
            }}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            Assign
          </button>
          
          {member.totalAssignments > 0 && (
            <button
              onClick={() => {
                setConfirmDialog({
                  isOpen: true,
                  type: 'warning',
                  title: 'Remove All Assignments',
                  message: `Are you sure you want to remove ${member.name} from all block assignments?`,
                  onConfirm: () => {
                    handleRemoveAllAssignments(member._id);
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                  }
                });
              }}
              disabled={actionLoading}
              className="text-red-600 hover:text-red-700 text-sm"
            >
              Remove
            </button>
          )}
        </div>
      )
    }
  ];

  // Pagination calculations
  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);
  const paginatedStaff = filteredStaff.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Error state for no district
  if (!districtId) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">District Not Assigned</h2>
            <p className="text-gray-600 mb-4">You need to be assigned to a district to manage staff.</p>
            <button
              onClick={() => navigate('/app')}
              className="text-blue-600 hover:text-blue-700"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
            <p className="text-gray-600 mt-1">
              Manage and assign staff members in{' '}
              <span className="font-medium text-blue-600">
                {user?.roleInfo?.hierarchy?.district?.name}
              </span>{' '}
              district
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/app/staff/assign')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiPlus size={16} />
              <span>Bulk Assignment</span>
            </button>
            
            <button
              onClick={() => {
                // TODO: Implement export functionality
                console.log('Export staff data');
              }}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FiDownload size={16} />
              <span>Export</span>
            </button>
          </div>
        </div>
        
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500">
          <button onClick={() => navigate('/app')} className="hover:text-gray-700">Dashboard</button>
          <span>/</span>
          <span className="text-gray-900">Staff Management</span>
        </nav>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Staff</p>
              <p className="text-2xl font-bold text-blue-600">
                {staff.length}
              </p>
            </div>
            <FiUsers className="text-blue-600" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Assigned Staff</p>
              <p className="text-2xl font-bold text-green-600">
                {staff.filter(s => s.totalAssignments > 0).length}
              </p>
            </div>
            <FiUserCheck className="text-green-600" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Unassigned Staff</p>
              <p className="text-2xl font-bold text-yellow-600">
                {staff.filter(s => s.totalAssignments === 0).length}
              </p>
            </div>
            <FiUserX className="text-yellow-600" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Available Blocks</p>
              <p className="text-2xl font-bold text-purple-600">
                {blocks.length}
              </p>
            </div>
            <FiMapPin className="text-purple-600" size={24} />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search staff by name, email, role, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            {/* Filters */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FiFilter size={16} className="text-gray-400" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Roles</option>
                  <option value="block_officer">Block Officer</option>
                  <option value="asha_worker">ASHA Worker</option>
                  <option value="anganwadi_worker">Anganwadi Worker</option>
                  <option value="health_worker">Health Worker</option>
                  <option value="nurse">Nurse</option>
                  <option value="doctor">Doctor</option>
                </select>
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="assigned">Assigned</option>
                <option value="unassigned">Unassigned</option>
              </select>
              
              <select
                value={blockFilter}
                onChange={(e) => setBlockFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Blocks</option>
                {blocks.map(block => (
                  <option key={block._id} value={block._id}>{block.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
          <p className="text-sm text-gray-600">
            Showing {paginatedStaff.length} of {filteredStaff.length} staff members
            {(searchTerm || roleFilter !== 'all' || statusFilter !== 'all' || blockFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('all');
                  setStatusFilter('all');
                  setBlockFilter('all');
                }}
                className="ml-2 text-blue-600 hover:text-blue-700"
              >
                Clear filters
              </button>
            )}
          </p>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading staff members...</p>
            </div>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="text-center py-12">
            <FaUserMd className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {staff.length === 0 ? 'No Staff Members' : 'No Staff Found'}
            </h3>
            <p className="text-gray-600 mb-4">
              {staff.length === 0 
                ? 'No staff members are assigned to your district yet.'
                : 'Try adjusting your search or filter criteria.'}
            </p>
          </div>
        ) : (
          <>
            <AdminTable
              columns={columns}
              data={paginatedStaff}
              loading={loading}
            />
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredStaff.length)} of {filteredStaff.length} results
                  </p>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Assignment Modal */}
      {assignmentModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Assign Blocks to {assignmentModal.staffName}
            </h3>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {blocks.map(block => (
                <label key={block._id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={assignmentModal.selectedBlocks.includes(block._id)}
                    onChange={(e) => {
                      const blockId = block._id;
                      if (e.target.checked) {
                        setAssignmentModal(prev => ({
                          ...prev,
                          selectedBlocks: [...prev.selectedBlocks, blockId]
                        }));
                      } else {
                        setAssignmentModal(prev => ({
                          ...prev,
                          selectedBlocks: prev.selectedBlocks.filter(id => id !== blockId)
                        }));
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{block.name}</span>
                </label>
              ))}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setAssignmentModal({ isOpen: false, staffId: null, staffName: '', selectedBlocks: [] })}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStaffAssignment(assignmentModal.staffId, assignmentModal.selectedBlocks)}
                disabled={actionLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}

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

export default StaffList;