import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FiArrowLeft, 
  FiEdit, 
  FiTrash2, 
  FiMapPin, 
  FiUsers,
  FiCalendar,
  FiMail,
  FiPhone,
  FiActivity,
  FiSettings,
  FiPlus,
  FiKey
} from 'react-icons/fi';
import { FaBuilding } from "react-icons/fa";
import { getDistrictById, deleteDistrict, getDistrictBlocks, generateBlockToken } from '../../../services/districtService';
import useAuthStore  from '../../../store/useAuthStore';
import ConfirmDialog from '../../../components/Admin/ConfirmDialog';

/**
 * DistrictView Component
 * Detailed view page for districts with comprehensive information display
 */
const DistrictView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuthStore();
  
  const [district, setDistrict] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [blocksLoading, setBlocksLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, loading: false });

  // Check admin access
  useEffect(() => {
    if (!user || user.roleInfo?.role !== 'admin') {
      navigate('/app');
      return;
    }
  }, [user, navigate]);

  // Fetch district data
  useEffect(() => {
    const fetchDistrict = async () => {
      if (!id) {
        setError('District ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await getDistrictById(id);
        
        if (response.success) {
          setDistrict(response.data);
          setError(null);
        } else {
          setError(response.message || 'Failed to fetch district');
        }
      } catch (error) {
        console.error('Error fetching district:', error);
        setError('Failed to load district data');
      } finally {
        setLoading(false);
      }
    };

    if (user?.roleInfo?.role === 'admin') {
      fetchDistrict();
    }
  }, [id, user]);

  // Fetch blocks when blocks tab is active
  useEffect(() => {
    const fetchBlocks = async () => {
      if (activeTab === 'blocks' && district && !blocksLoading) {
        try {
          setBlocksLoading(true);
          const response = await getDistrictBlocks(district._id);
          
          if (response.success) {
            setBlocks(response.data);
          }
        } catch (error) {
          console.error('Error fetching blocks:', error);
        } finally {
          setBlocksLoading(false);
        }
      }
    };

    fetchBlocks();
  }, [activeTab, district]);

  const handleEdit = () => {
    navigate(`/app/districts/${id}/edit`);
  };

  const handleDelete = async () => {
    setDeleteConfirmation(prev => ({ ...prev, loading: true }));
    
    try {
      const response = await deleteDistrict(id);
      
      if (response.success) {
        // TODO: Show success notification
        navigate('/app/districts');
      } else {
        // TODO: Show error notification
        console.error('Delete failed:', response.message);
      }
    } catch (error) {
      console.error('Error deleting district:', error);
      // TODO: Show error notification
    } finally {
      setDeleteConfirmation({ isOpen: false, loading: false });
    }
  };

  const handleGenerateToken = async (blockName) => {
    try {
      const response = await generateBlockToken(district._id, blockName);
      
      if (response.success) {
        // TODO: Show success notification with token
        console.log('Token generated:', response.data);
        // Refresh blocks list
        const blocksResponse = await getDistrictBlocks(district._id);
        if (blocksResponse.success) {
          setBlocks(blocksResponse.data);
        }
      } else {
        // TODO: Show error notification
        console.error('Token generation failed:', response.message);
      }
    } catch (error) {
      console.error('Error generating token:', error);
      // TODO: Show error notification
    }
  };

  if (!user || user.roleInfo?.role !== 'admin') {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="animate-pulse">
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-8 h-8 bg-gray-200 rounded"></div>
              <div className="space-y-2">
                <div className="h-6 bg-gray-200 rounded w-48"></div>
                <div className="h-4 bg-gray-200 rounded w-64"></div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-6 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/app/districts')}
            className="inline-flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <FiArrowLeft className="w-4 h-4 mr-1" />
            Back to Districts
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <div className="text-red-600 text-lg font-semibold mb-2">Error Loading District</div>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="space-x-4">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
              <button
                onClick={() => navigate('/app/districts')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!district) {
    return null;
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FiMapPin },
    { id: 'demographics', label: 'Demographics', icon: FiUsers },
    { id: 'infrastructure', label: 'Infrastructure', icon: FaBuilding },
    { id: 'blocks', label: 'Blocks', icon: FiSettings }
  ];

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">District Name</label>
            <p className="text-lg text-gray-900">{district.name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">State</label>
            <p className="text-lg text-gray-900">{district.state}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">District Code</label>
            <p className="text-lg text-gray-900 font-mono">{district.code}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Status</label>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              district.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {district.status}
            </span>
          </div>
          {district.headquarters && (
            <div>
              <label className="text-sm font-medium text-gray-500">Headquarters</label>
              <p className="text-lg text-gray-900">{district.headquarters}</p>
            </div>
          )}
          {district.establishedDate && (
            <div>
              <label className="text-sm font-medium text-gray-500">Established</label>
              <p className="text-lg text-gray-900 flex items-center">
                <FiCalendar className="w-4 h-4 mr-2 text-gray-400" />
                {new Date(district.establishedDate).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
        {district.description && (
          <div className="mt-4">
            <label className="text-sm font-medium text-gray-500">Description</label>
            <p className="text-gray-900 mt-1">{district.description}</p>
          </div>
        )}
      </div>

      {/* District Officer Information */}
      {district.districtOfficer && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">District Officer</h3>
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <FiUsers className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-medium text-gray-900">{district.districtOfficer.name}</h4>
              <div className="flex items-center text-gray-600 mt-1">
                <FiMail className="w-4 h-4 mr-2" />
                {district.districtOfficer.email}
              </div>
              {district.districtOfficer.phone && (
                <div className="flex items-center text-gray-600 mt-1">
                  <FiPhone className="w-4 h-4 mr-2" />
                  {district.districtOfficer.phone}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderDemographicsTab = () => (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Demographics Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {district.demographics?.totalPopulation?.toLocaleString() || 'N/A'}
          </div>
          <div className="text-sm text-gray-600">Total Population</div>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {district.demographics?.ruralPercentage || 'N/A'}%
          </div>
          <div className="text-sm text-gray-600">Rural Population</div>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {district.demographics?.literacyRate || 'N/A'}%
          </div>
          <div className="text-sm text-gray-600">Literacy Rate</div>
        </div>
        <div className="text-center p-4 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">
            {district.demographics?.sexRatio || 'N/A'}
          </div>
          <div className="text-sm text-gray-600">Sex Ratio</div>
        </div>
        <div className="text-center p-4 bg-indigo-50 rounded-lg">
          <div className="text-2xl font-bold text-indigo-600">
            {district.demographics?.populationDensity || 'N/A'}
          </div>
          <div className="text-sm text-gray-600">Population Density (per km²)</div>
        </div>
        <div className="text-center p-4 bg-pink-50 rounded-lg">
          <div className="text-2xl font-bold text-pink-600">
            {district.demographics?.urbanPercentage || 'N/A'}%
          </div>
          <div className="text-sm text-gray-600">Urban Population</div>
        </div>
      </div>
    </div>
  );

  const renderInfrastructureTab = () => (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Health Infrastructure</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(district.healthInfrastructure || {}).map(([key, value]) => {
          const labels = {
            primaryHealthCenters: 'Primary Health Centers',
            communityHealthCenters: 'Community Health Centers',
            subCenters: 'Sub Centers',
            districtHospitals: 'District Hospitals',
            privateHospitals: 'Private Hospitals',
            nursingHomes: 'Nursing Homes',
            diagnosticCenters: 'Diagnostic Centers',
            pharmacies: 'Pharmacies',
            bloodBanks: 'Blood Banks',
            ambulances: 'Ambulances'
          };

          return (
            <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">{labels[key] || key}</span>
              <span className="text-lg font-semibold text-gray-900">{value || 0}</span>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderBlocksTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">District Blocks</h3>
        <button
          onClick={() => handleGenerateToken('New Block')}
          className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
        >
          <FiKey className="w-4 h-4 mr-2" />
          Generate Token
        </button>
      </div>

      {blocksLoading ? (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      ) : blocks.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Block Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {blocks.map((block, index) => (
                <tr key={index}>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{block.name}</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      block.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {block.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {block.createdAt ? new Date(block.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button className="text-blue-600 hover:text-blue-800">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg border border-gray-200 text-center">
          <FiSettings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Blocks Found</h4>
          <p className="text-gray-500 mb-4">This district doesn't have any registered blocks yet.</p>
          <button
            onClick={() => handleGenerateToken('First Block')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <FiPlus className="w-4 h-4 mr-2" />
            Generate First Block Token
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
          <button
            onClick={() => navigate('/app/districts')}
            className="hover:text-blue-600 transition-colors"
          >
            District Management
          </button>
          <span>/</span>
          <span className="text-gray-900">{district.name}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/app/districts')}
              className="inline-flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <FiArrowLeft className="w-4 h-4 mr-1" />
              Back to Districts
            </button>
            <div className="border-l border-gray-300 h-6"></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <FiMapPin className="w-6 h-6 mr-2 text-blue-600" />
                {district.name}
              </h1>
              <p className="text-gray-600 mt-1">{district.state} • {district.code}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleEdit}
              className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <FiEdit className="w-4 h-4 mr-2" />
              Edit
            </button>
            <button
              onClick={() => setDeleteConfirmation({ isOpen: true, loading: false })}
              className="inline-flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <FiTrash2 className="w-4 h-4 mr-2" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Population</p>
              <p className="text-2xl font-bold text-blue-800">
                {district.demographics?.totalPopulation?.toLocaleString() || 'N/A'}
              </p>
            </div>
            <FiUsers className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Health Centers</p>
              <p className="text-2xl font-bold text-green-800">
                {(district.healthInfrastructure?.primaryHealthCenters || 0) + 
                 (district.healthInfrastructure?.communityHealthCenters || 0)}
              </p>
            </div>
            <FaBuilding className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Blocks</p>
              <p className="text-2xl font-bold text-purple-800">{blocks.length}</p>
            </div>
            <FiSettings className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        
        <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600">Status</p>
              <p className="text-2xl font-bold text-yellow-800 capitalize">{district.status}</p>
            </div>
            <FiActivity className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8 border-b border-gray-200">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'demographics' && renderDemographicsTab()}
      {activeTab === 'infrastructure' && renderInfrastructureTab()}
      {activeTab === 'blocks' && renderBlocksTab()}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, loading: false })}
        onConfirm={handleDelete}
        title="Delete District"
        message={`Are you sure you want to delete "${district.name}"? This action cannot be undone and will remove all associated data.`}
        confirmText="Delete District"
        cancelText="Cancel"
        type="danger"
        loading={deleteConfirmation.loading}
      />
    </div>
  );
};

export default DistrictView;