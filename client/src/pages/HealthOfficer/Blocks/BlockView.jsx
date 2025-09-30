import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiEdit,
  FiMapPin,
  FiUsers,
  FiActivity,
  FiSettings,
  FiMap,
  FiTrendingUp,
  FiCalendar,
  FiPhone,
  FiMail
} from "react-icons/fi";
import { FaBuilding, FaHospital } from "react-icons/fa";
import ConfirmDialog from "../../../components/Admin/ConfirmDialog";
import {
  getBlockById,
  deleteBlock,
  getBlockStaff,
  getBlockVillages,
  getBlockStats,
  generateVillageToken
} from "../../../services/blockService";
import useAuthStore from "../../../store/useAuthStore";
import { getHealthOfficerDistrict, canManageBlock } from "../../../utils/healthOfficerGuard.jsx";

/**
 * BlockView Component
 * Detailed view page for a specific block with comprehensive information display
 */
const BlockView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuthStore();
  
  // Get health officer's district ID
  const districtId = getHealthOfficerDistrict();
  
  // Component state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [blockData, setBlockData] = useState(null);
  const [blockStaff, setBlockStaff] = useState([]);
  const [blockVillages, setBlockVillages] = useState([]);
  const [blockStats, setBlockStats] = useState({});
  const [activeTab, setActiveTab] = useState('overview');
  
  // Action loading states
  const [actionLoading, setActionLoading] = useState(false);
  
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: 'delete',
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

  // Fetch all block data
  useEffect(() => {
    const fetchAllBlockData = async () => {
      if (!id || !districtId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch main block data
        const blockResponse = await getBlockById(id);
        
        if (!blockResponse.success) {
          setError(blockResponse.error || 'Failed to fetch block data');
          return;
        }
        
        const block = blockResponse.data;
        
        // Verify that the block belongs to the health officer's district
        if (block.districtId !== districtId) {
          setError("You don't have permission to view this block. It belongs to a different district.");
          return;
        }
        
        // Check if health officer can manage this block
        if (!canManageBlock(id)) {
          setError("You don't have permission to view this block.");
          return;
        }
        
        setBlockData(block);
        
        // Fetch related data in parallel
        const [staffResponse, villagesResponse, statsResponse] = await Promise.all([
          getBlockStaff(id),
          getBlockVillages(id),
          getBlockStats(id)
        ]);
        
        if (staffResponse.success) {
          setBlockStaff(staffResponse.data);
        }
        
        if (villagesResponse.success) {
          setBlockVillages(villagesResponse.data);
        }
        
        if (statsResponse.success) {
          setBlockStats(statsResponse.data);
        }
        
      } catch (err) {
        console.error('Error fetching block data:', err);
        setError('An unexpected error occurred while fetching block data');
      } finally {
        setLoading(false);
      }
    };

    fetchAllBlockData();
  }, [id, districtId]);

  // Handle delete block
  const handleDeleteBlock = async () => {
    setActionLoading(true);
    
    try {
      const response = await deleteBlock(id);
      
      if (response.success) {
        // Show success toast notification
        console.log("Block deleted successfully");
        navigate('/app/blocks');
      } else {
        setError(response.error || 'Failed to delete block');
      }
    } catch (err) {
      console.error('Error deleting block:', err);
      setError('An unexpected error occurred while deleting the block');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle generate village token
  const handleGenerateToken = async () => {
    setActionLoading(true);
    
    try {
      const tokenData = {
        villageName: "New Village",
        population: 1000,
        coordinates: {
          latitude: blockData.geographicBoundaries?.coordinates?.latitude || 0,
          longitude: blockData.geographicBoundaries?.coordinates?.longitude || 0
        }
      };
      
      const response = await generateVillageToken(id, tokenData);
      
      if (response.success) {
        // Show success toast with token details
        console.log("Village token generated:", response.data);
        // Refresh block data to show updated tokens
        window.location.reload();
      } else {
        setError(response.error || 'Failed to generate village token');
      }
    } catch (err) {
      console.error('Error generating village token:', err);
      setError('An unexpected error occurred while generating village token');
    } finally {
      setActionLoading(false);
    }
  };

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: FiActivity },
    { id: 'geography', label: 'Geography', icon: FiMap },
    { id: 'demographics', label: 'Demographics', icon: FiUsers },
    { id: 'infrastructure', label: 'Infrastructure', icon: FaHospital },
    { id: 'staff', label: 'Staff', icon: FiUsers },
    { id: 'villages', label: 'Villages', icon: FiMapPin },
    { id: 'settings', label: 'Settings', icon: FiSettings }
  ];

  // Loading state
  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading block details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (!districtId || error || !blockData) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {!districtId ? "District Not Assigned" : error ? "Error" : "Block Not Found"}
            </h2>
            <p className="text-gray-600 mb-4">
              {error || (!districtId ? "You need to be assigned to a district to view blocks." : "The requested block could not be found.")}
            </p>
            <button
              onClick={() => navigate('/app/blocks')}
              className="text-blue-600 hover:text-blue-700"
            >
              Return to Blocks
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
              onClick={() => navigate('/app/blocks')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <FiArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{blockData.name}</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                <div className="flex items-center space-x-2">
                  <span>Block ID:</span>
                  <span className="font-mono text-gray-900">{blockData._id}</span>
                </div>
                <span>•</span>
                <div className="flex items-center space-x-2">
                  <span>District:</span>
                  <span className="font-medium text-blue-600">
                    {user?.roleInfo?.hierarchy?.district?.name}
                  </span>
                </div>
                <span>•</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  blockData.status === 'active' 
                    ? 'bg-green-100 text-green-800'
                    : blockData.status === 'inactive'
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {blockData.status}
                </span>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(`/app/blocks/${id}/edit`)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FiEdit size={16} />
              <span>Edit</span>
            </button>
            
            <button
              onClick={() => {
                setConfirmDialog({
                  isOpen: true,
                  type: 'info',
                  title: 'Generate Village Token',
                  message: 'This will generate a new village registration token for this block. Continue?',
                  onConfirm: () => {
                    handleGenerateToken();
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                  }
                });
              }}
              disabled={actionLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <FiMapPin size={16} />
              <span>Generate Village Token</span>
            </button>
            
            <button
              onClick={() => {
                setConfirmDialog({
                  isOpen: true,
                  type: 'delete',
                  title: 'Delete Block',
                  message: `Are you sure you want to delete "${blockData.name}"? This action cannot be undone and will affect all associated villages and staff.`,
                  onConfirm: () => {
                    handleDeleteBlock();
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                  }
                });
              }}
              disabled={actionLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {actionLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Delete</span>
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500">
          <button onClick={() => navigate('/app')} className="hover:text-gray-700">Dashboard</button>
          <span>/</span>
          <button onClick={() => navigate('/app/blocks')} className="hover:text-gray-700">Block Management</button>
          <span>/</span>
          <span className="text-gray-900">{blockData.name}</span>
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
              <p className="text-sm font-medium text-gray-600">Total Villages</p>
              <p className="text-2xl font-bold text-gray-900">
                {blockData.demographics?.totalVillages || blockVillages.length || 0}
              </p>
            </div>
            <FiMapPin className="text-blue-600" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Population</p>
              <p className="text-2xl font-bold text-green-600">
                {blockData.demographics?.totalPopulation?.toLocaleString() || 0}
              </p>
            </div>
            <FiUsers className="text-green-600" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Staff Members</p>
              <p className="text-2xl font-bold text-indigo-600">
                {blockStaff.length}
              </p>
            </div>
            <FiUsers className="text-indigo-600" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Health Centers</p>
              <p className="text-2xl font-bold text-purple-600">
                {(blockData.healthInfrastructure?.phcs?.total || 0) + 
                 (blockData.healthInfrastructure?.subCenters?.total || 0)}
              </p>
            </div>
            <FaHospital className="text-purple-600" size={24} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Block Officer Info */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Block Officer</h3>
                  {blockData.blockOfficer ? (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium">
                            {blockData.blockOfficer.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{blockData.blockOfficer.name}</p>
                          <p className="text-sm text-gray-600">{blockData.blockOfficer.roleInfo?.role}</p>
                        </div>
                      </div>
                      {blockData.blockOfficer.contact && (
                        <div className="space-y-2">
                          {blockData.blockOfficer.contact.phone && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <FiPhone size={14} />
                              <span>{blockData.blockOfficer.contact.phone}</span>
                            </div>
                          )}
                          {blockData.blockOfficer.email && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <FiMail size={14} />
                              <span>{blockData.blockOfficer.email}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500">No block officer assigned</p>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Households</span>
                      <span className="font-medium">{blockData.demographics?.totalHouseholds?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Literacy Rate</span>
                      <span className="font-medium">{blockData.demographics?.literacyRate || 'N/A'}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Area</span>
                      <span className="font-medium">{blockData.geographicBoundaries?.area || 'N/A'} sq km</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Headquarters</span>
                      <span className="font-medium">{blockData.headquarters || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-sm">
                    <FiCalendar className="text-gray-400" size={16} />
                    <span className="text-gray-600">Block created:</span>
                    <span className="font-medium">
                      {new Date(blockData.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {blockData.updatedAt && (
                    <div className="flex items-center space-x-3 text-sm">
                      <FiActivity className="text-gray-400" size={16} />
                      <span className="text-gray-600">Last updated:</span>
                      <span className="font-medium">
                        {new Date(blockData.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Geography Tab */}
          {activeTab === 'geography' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Coordinates</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Latitude:</span>
                      <span className="font-medium font-mono">
                        {blockData.geographicBoundaries?.coordinates?.latitude || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Longitude:</span>
                      <span className="font-medium font-mono">
                        {blockData.geographicBoundaries?.coordinates?.longitude || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Area Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Area:</span>
                      <span className="font-medium">
                        {blockData.geographicBoundaries?.area || 'N/A'} sq km
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Headquarters:</span>
                      <span className="font-medium">{blockData.headquarters || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {blockData.geographicBoundaries?.boundaryDescription && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Boundary Description</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{blockData.geographicBoundaries.boundaryDescription}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Demographics Tab */}
          {activeTab === 'demographics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <p className="text-sm text-gray-600 mb-2">Total Population</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {blockData.demographics?.totalPopulation?.toLocaleString() || 0}
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <p className="text-sm text-gray-600 mb-2">Rural Population</p>
                  <p className="text-2xl font-bold text-green-600">
                    {blockData.demographics?.ruralPopulation?.toLocaleString() || 0}
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <p className="text-sm text-gray-600 mb-2">Urban Population</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {blockData.demographics?.urbanPopulation?.toLocaleString() || 0}
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <p className="text-sm text-gray-600 mb-2">Total Households</p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {blockData.demographics?.totalHouseholds?.toLocaleString() || 0}
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <p className="text-sm text-gray-600 mb-2">Total Villages</p>
                  <p className="text-2xl font-bold text-red-600">
                    {blockData.demographics?.totalVillages || 0}
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <p className="text-sm text-gray-600 mb-2">Literacy Rate</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {blockData.demographics?.literacyRate || 0}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Infrastructure Tab */}
          {activeTab === 'infrastructure' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Primary Health Centers</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total PHCs:</span>
                      <span className="font-medium">
                        {blockData.healthInfrastructure?.phcs?.total || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Functional PHCs:</span>
                      <span className="font-medium text-green-600">
                        {blockData.healthInfrastructure?.phcs?.functional || 0}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Sub Centers</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Sub Centers:</span>
                      <span className="font-medium">
                        {blockData.healthInfrastructure?.subCenters?.total || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Functional Sub Centers:</span>
                      <span className="font-medium text-green-600">
                        {blockData.healthInfrastructure?.subCenters?.functional || 0}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Other Facilities</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hospitals:</span>
                      <span className="font-medium">
                        {blockData.healthInfrastructure?.hospitals || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dispensaries:</span>
                      <span className="font-medium">
                        {blockData.healthInfrastructure?.dispensaries || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Staff Tab */}
          {activeTab === 'staff' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Assigned Staff</h3>
                <button
                  onClick={() => navigate('/app/staff/assign')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Assign Staff
                </button>
              </div>
              
              {blockStaff.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {blockStaff.map((staff) => (
                    <div key={staff._id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {staff.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{staff.name}</p>
                          <p className="text-sm text-gray-600">{staff.role}</p>
                        </div>
                      </div>
                      {staff.assignedVillages && (
                        <p className="text-sm text-gray-600">
                          Villages: {staff.assignedVillages.length}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FiUsers className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Staff Assigned</h3>
                  <p className="text-gray-600 mb-4">No staff members have been assigned to this block yet.</p>
                  <button
                    onClick={() => navigate('/app/staff/assign')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Assign Staff
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Villages Tab */}
          {activeTab === 'villages' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Villages</h3>
                <button
                  onClick={() => {
                    setConfirmDialog({
                      isOpen: true,
                      type: 'info',
                      title: 'Generate Village Token',
                      message: 'Generate a new village registration token for this block?',
                      onConfirm: () => {
                        handleGenerateToken();
                        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                      }
                    });
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Generate Village Token
                </button>
              </div>
              
              {blockVillages.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {blockVillages.map((village) => (
                    <div key={village._id} className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">{village.name}</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Population: {village.population?.toLocaleString() || 'N/A'}</p>
                        <p>Households: {village.households || 'N/A'}</p>
                        <p>Status: <span className={`px-2 py-1 rounded-full text-xs ${
                          village.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>{village.status}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FiMapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Villages Registered</h3>
                  <p className="text-gray-600 mb-4">No villages have been registered under this block yet.</p>
                  <button
                    onClick={() => {
                      setConfirmDialog({
                        isOpen: true,
                        type: 'info',
                        title: 'Generate Village Token',
                        message: 'Generate a village registration token to enable villages to register under this block?',
                        onConfirm: () => {
                          handleGenerateToken();
                          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                        }
                      });
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Generate Village Token
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Village Registration Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Requires Approval</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      blockData.villageRegistration?.requiresApproval 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {blockData.villageRegistration?.requiresApproval ? 'Yes' : 'No'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Auto-generate Tokens</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      blockData.villageRegistration?.autoGenerateTokens 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {blockData.villageRegistration?.autoGenerateTokens ? 'Yes' : 'No'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Max Villages per Token</span>
                    <span className="font-medium">
                      {blockData.villageRegistration?.maxVillagesPerToken || 5}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Token Expiry Days</span>
                    <span className="font-medium">
                      {blockData.villageRegistration?.tokenExpiryDays || 30} days
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Block Status</h3>
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700">Current Status:</span>
                  <span className={`px-3 py-1 text-sm rounded-full ${
                    blockData.status === 'active' 
                      ? 'bg-green-100 text-green-800'
                      : blockData.status === 'inactive'
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {blockData.status}
                  </span>
                </div>
              </div>
            </div>
          )}
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

export default BlockView;