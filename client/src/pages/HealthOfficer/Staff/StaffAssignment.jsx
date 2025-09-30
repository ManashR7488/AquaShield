import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FiArrowLeft,
  FiUsers,
  FiMapPin,
  FiSave,
  FiRefreshCw,
  FiInfo,
  FiCheckCircle,
  FiAlertCircle
} from "react-icons/fi";
import { FaUserMd } from "react-icons/fa";
import ConfirmDialog from "../../../components/Admin/ConfirmDialog";
import {
  getAllUsers
} from "../../../services/userService";
import {
  getAllBlocks,
  assignStaffToBlock,
  removeStaffFromBlock,
  getBlockStaff
} from "../../../services/blockService";
import useAuthStore from "../../../store/useAuthStore";
import { getHealthOfficerDistrict } from "../../../utils/healthOfficerGuard.jsx";

/**
 * StaffAssignment Component
 * Bulk assignment interface for managing staff assignments across blocks
 */
const StaffAssignment = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Get health officer's district ID
  const districtId = getHealthOfficerDistrict();
  
  // Component state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [staff, setStaff] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [originalAssignments, setOriginalAssignments] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  
  // Action loading states
  const [saving, setSaving] = useState(false);
  
  // View options
  const [viewMode, setViewMode] = useState('staff'); // 'staff' or 'block'
  const [selectedRole, setSelectedRole] = useState('all');
  
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

  // Fetch staff, blocks, and current assignments
  useEffect(() => {
    const fetchData = async () => {
      if (!districtId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch all staff and blocks in parallel
        const [staffResponse, blocksResponse] = await Promise.all([
          getAllUsers({ 
            districtId,
            roles: ['block_officer', 'asha_worker', 'anganwadi_worker', 'health_worker', 'nurse', 'doctor']
          }),
          getAllBlocks({ districtId })
        ]);
        
        if (staffResponse.success && blocksResponse.success) {
          setStaff(staffResponse.data);
          setBlocks(blocksResponse.data);
          
          // Fetch current assignments for all blocks
          const assignmentsMap = {};
          
          await Promise.all(
            blocksResponse.data.map(async (block) => {
              try {
                const staffResponse = await getBlockStaff(block._id);
                if (staffResponse.success) {
                  assignmentsMap[block._id] = staffResponse.data.map(member => member._id);
                } else {
                  assignmentsMap[block._id] = [];
                }
              } catch (err) {
                console.error(`Error fetching staff for block ${block.name}:`, err);
                assignmentsMap[block._id] = [];
              }
            })
          );
          
          setAssignments(assignmentsMap);
          setOriginalAssignments({ ...assignmentsMap });
          
        } else {
          setError('Failed to fetch staff and blocks data');
        }
        
      } catch (err) {
        console.error('Error fetching assignment data:', err);
        setError('An unexpected error occurred while fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [districtId]);

  // Check for changes
  useEffect(() => {
    const hasChanges = Object.keys(assignments).some(blockId => {
      const current = assignments[blockId] || [];
      const original = originalAssignments[blockId] || [];
      
      return current.length !== original.length || 
             !current.every(id => original.includes(id));
    });
    
    setHasChanges(hasChanges);
  }, [assignments, originalAssignments]);

  // Handle staff assignment toggle
  const handleAssignmentToggle = (blockId, staffId) => {
    setAssignments(prev => {
      const blockAssignments = prev[blockId] || [];
      const isAssigned = blockAssignments.includes(staffId);
      
      if (isAssigned) {
        return {
          ...prev,
          [blockId]: blockAssignments.filter(id => id !== staffId)
        };
      } else {
        return {
          ...prev,
          [blockId]: [...blockAssignments, staffId]
        };
      }
    });
  };

  // Handle bulk assignment for a staff member to multiple blocks
  const handleBulkStaffAssignment = (staffId, blockIds) => {
    setAssignments(prev => {
      const newAssignments = { ...prev };
      
      // Remove staff from all blocks first
      Object.keys(newAssignments).forEach(blockId => {
        newAssignments[blockId] = newAssignments[blockId].filter(id => id !== staffId);
      });
      
      // Add staff to selected blocks
      blockIds.forEach(blockId => {
        if (!newAssignments[blockId]) {
          newAssignments[blockId] = [];
        }
        if (!newAssignments[blockId].includes(staffId)) {
          newAssignments[blockId].push(staffId);
        }
      });
      
      return newAssignments;
    });
  };

  // Handle bulk assignment for a block to multiple staff
  const handleBulkBlockAssignment = (blockId, staffIds) => {
    setAssignments(prev => ({
      ...prev,
      [blockId]: staffIds
    }));
  };

  // Save all assignments
  const handleSaveAssignments = async () => {
    setSaving(true);
    
    try {
      const promises = [];
      
      // Process each block's assignments
      Object.keys(assignments).forEach(blockId => {
        const currentStaff = assignments[blockId] || [];
        const originalStaff = originalAssignments[blockId] || [];
        
        // Find staff to add and remove
        const toAdd = currentStaff.filter(id => !originalStaff.includes(id));
        const toRemove = originalStaff.filter(id => !currentStaff.includes(id));
        
        // Add new assignments
        toAdd.forEach(staffId => {
          const member = staff.find(s => s._id === staffId);
          const role = member?.roleInfo?.role || 'asha_worker';
          promises.push(assignStaffToBlock(blockId, { staffId, role }));
        });
        
        // Remove old assignments
        toRemove.forEach(staffId => {
          promises.push(removeStaffFromBlock(blockId, staffId));
        });
      });
      
      await Promise.all(promises);
      
      // Update original assignments to match current
      setOriginalAssignments({ ...assignments });
      
      console.log("All assignments saved successfully");
      
    } catch (err) {
      console.error('Error saving assignments:', err);
      setError('Failed to save some assignments. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Reset assignments to original state
  const handleResetAssignments = () => {
    setAssignments({ ...originalAssignments });
  };

  // Get staff member's current assignments
  const getStaffAssignments = (staffId) => {
    return Object.keys(assignments).filter(blockId => 
      assignments[blockId]?.includes(staffId)
    );
  };

  // Get filtered staff based on role
  const filteredStaff = selectedRole === 'all' 
    ? staff 
    : staff.filter(member => member.roleInfo?.role === selectedRole);

  // Error state for no district
  if (!districtId) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">District Not Assigned</h2>
            <p className="text-gray-600 mb-4">You need to be assigned to a district to manage staff assignments.</p>
            <button
              onClick={() => navigate('/app/staff')}
              className="text-blue-600 hover:text-blue-700"
            >
              Return to Staff Management
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
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/app/staff')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <FiArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bulk Staff Assignment</h1>
              <p className="text-gray-600 mt-1">
                Manage staff assignments across blocks in{' '}
                <span className="font-medium text-blue-600">
                  {user?.roleInfo?.hierarchy?.district?.name}
                </span>{' '}
                district
              </p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {hasChanges && (
              <button
                onClick={handleResetAssignments}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FiRefreshCw size={16} />
                <span>Reset</span>
              </button>
            )}
            
            <button
              onClick={() => {
                if (hasChanges) {
                  setConfirmDialog({
                    isOpen: true,
                    type: 'info',
                    title: 'Save Assignments',
                    message: 'Are you sure you want to save all assignment changes? This will update staff assignments across all blocks.',
                    onConfirm: () => {
                      handleSaveAssignments();
                      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                    }
                  });
                } else {
                  console.log('No changes to save');
                }
              }}
              disabled={!hasChanges || saving}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                hasChanges 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <FiSave size={16} />
              )}
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
        
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500">
          <button onClick={() => navigate('/app')} className="hover:text-gray-700">Dashboard</button>
          <span>/</span>
          <button onClick={() => navigate('/app/staff')} className="hover:text-gray-700">Staff Management</button>
          <span>/</span>
          <span className="text-gray-900">Bulk Assignment</span>
        </nav>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Changes Indicator */}
      {hasChanges && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <FiAlertCircle className="text-yellow-600" size={20} />
            <div>
              <p className="text-yellow-800 font-medium">You have unsaved changes</p>
              <p className="text-yellow-700 text-sm">Don't forget to save your assignment changes before leaving this page.</p>
            </div>
          </div>
        </div>
      )}

      {/* View Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">View by:</span>
                <select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="staff">Staff Member</option>
                  <option value="block">Block</option>
                </select>
              </div>
              
              {viewMode === 'staff' && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Filter by role:</span>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
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
              )}
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <FiUsers size={14} />
                <span>{staff.length} Staff</span>
              </div>
              <div className="flex items-center space-x-1">
                <FiMapPin size={14} />
                <span>{blocks.length} Blocks</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading assignment data...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Staff-centric View */}
          {viewMode === 'staff' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Staff Assignments</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Assign staff members to blocks by checking the boxes
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Staff Member
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Block Assignments
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStaff.map(member => {
                      const memberAssignments = getStaffAssignments(member._id);
                      
                      return (
                        <tr key={member._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 text-sm font-medium">
                                  {member.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{member.name}</p>
                                <p className="text-sm text-gray-500">{member.email}</p>
                              </div>
                            </div>
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900 capitalize">
                              {member.roleInfo?.role?.replace('_', ' ')}
                            </span>
                          </td>
                          
                          <td className="px-6 py-4">
                            <div className="grid grid-cols-3 gap-2">
                              {blocks.map(block => (
                                <label key={block._id} className="flex items-center space-x-2 text-sm">
                                  <input
                                    type="checkbox"
                                    checked={assignments[block._id]?.includes(member._id) || false}
                                    onChange={() => handleAssignmentToggle(block._id, member._id)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-gray-700 truncate">{block.name}</span>
                                </label>
                              ))}
                            </div>
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => handleBulkStaffAssignment(member._id, blocks.map(b => b._id))}
                                className="text-blue-600 hover:text-blue-700 text-sm"
                              >
                                Assign All
                              </button>
                              <span className="text-gray-300">|</span>
                              <button
                                onClick={() => handleBulkStaffAssignment(member._id, [])}
                                className="text-red-600 hover:text-red-700 text-sm"
                              >
                                Remove All
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Block-centric View */}
          {viewMode === 'block' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {blocks.map(block => {
                const blockStaff = assignments[block._id] || [];
                
                return (
                  <div key={block._id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{block.name}</h3>
                          <p className="text-sm text-gray-600">
                            {blockStaff.length} assigned staff members
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleBulkBlockAssignment(block._id, staff.map(s => s._id))}
                            className="text-blue-600 hover:text-blue-700 text-sm"
                          >
                            Assign All
                          </button>
                          <button
                            onClick={() => handleBulkBlockAssignment(block._id, [])}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Remove All
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {staff.map(member => {
                          const isAssigned = blockStaff.includes(member._id);
                          
                          return (
                            <label key={member._id} className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50">
                              <input
                                type="checkbox"
                                checked={isAssigned}
                                onChange={() => handleAssignmentToggle(block._id, member._id)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{member.name}</p>
                                <p className="text-xs text-gray-500 capitalize">
                                  {member.roleInfo?.role?.replace('_', ' ')}
                                </p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Help Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <FiInfo className="text-blue-600 flex-shrink-0 mt-1" size={20} />
          <div>
            <h3 className="text-lg font-medium text-blue-900 mb-2">Assignment Tips</h3>
            <div className="text-blue-800 space-y-2 text-sm">
              <p><strong>Staff View:</strong> Assign individual staff members to multiple blocks</p>
              <p><strong>Block View:</strong> Assign multiple staff members to individual blocks</p>
              <p><strong>Bulk Actions:</strong> Use "Assign All" or "Remove All" for quick assignments</p>
              <p><strong>Save Changes:</strong> Don't forget to save your changes before leaving the page</p>
            </div>
          </div>
        </div>
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

export default StaffAssignment;