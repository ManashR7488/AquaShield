import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FiArrowLeft, 
  FiEdit, 
  FiTrash2, 
  FiUser, 
  FiMail, 
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiShield,
  FiUserCheck,
  FiUserX,
  FiSettings,
  FiActivity,
  FiClock,
  FiSmartphone
} from 'react-icons/fi';
import { getUserById, verifyUser, suspendUser, deleteUser } from '../../../services/userService';
import useAuthStore  from '../../../store/useAuthStore';
import ConfirmDialog from '../../../components/Admin/ConfirmDialog';

/**
 * UserView Component
 * Detailed view page for users with comprehensive information display
 */
const UserView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuthStore();
  
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [actionConfirmation, setActionConfirmation] = useState({
    isOpen: false,
    type: '',
    loading: false
  });

  // Check admin access
  useEffect(() => {
    if (!user || user.roleInfo?.role !== 'admin') {
      navigate('/app');
      return;
    }
  }, [user, navigate]);

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      if (!id) {
        setError('User ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await getUserById(id);
        
        if (response.success) {
          setUserData(response.data);
          setError(null);
        } else {
          setError(response.message || 'Failed to fetch user');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    if (user?.roleInfo?.role === 'admin') {
      fetchUser();
    }
  }, [id, user]);

  const handleEdit = () => {
    // TODO: Navigate to user edit page when implemented
    console.log('Edit user:', userData);
  };

  const handleVerify = () => {
    setActionConfirmation({
      isOpen: true,
      type: 'verify',
      loading: false
    });
  };

  const handleSuspend = () => {
    setActionConfirmation({
      isOpen: true,
      type: userData.accountStatus === 'suspended' ? 'activate' : 'suspend',
      loading: false
    });
  };

  const handleDelete = () => {
    setActionConfirmation({
      isOpen: true,
      type: 'delete',
      loading: false
    });
  };

  const handleActionConfirm = async () => {
    const { type } = actionConfirmation;
    setActionConfirmation(prev => ({ ...prev, loading: true }));

    try {
      let response;
      
      switch (type) {
        case 'verify':
          response = await verifyUser(userData._id, {
            verified: true,
            verifiedBy: user._id,
            verificationNotes: 'Verified by admin'
          });
          break;
        
        case 'suspend':
          response = await suspendUser(userData._id, {
            suspended: true,
            suspendedBy: user._id,
            suspensionReason: 'Suspended by admin'
          });
          break;
        
        case 'activate':
          response = await suspendUser(userData._id, {
            suspended: false,
            suspendedBy: user._id,
            suspensionReason: 'Activated by admin'
          });
          break;
        
        case 'delete':
          response = await deleteUser(userData._id);
          if (response.success) {
            navigate('/app/users');
            return;
          }
          break;
        
        default:
          return;
      }

      if (response.success) {
        // Update local user data
        setUserData(response.data || userData);
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
      setActionConfirmation({ isOpen: false, type: '', loading: false });
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
              <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
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
            onClick={() => navigate('/app/users')}
            className="inline-flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <FiArrowLeft className="w-4 h-4 mr-1" />
            Back to Users
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <div className="text-red-600 text-lg font-semibold mb-2">Error Loading User</div>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="space-x-4">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
              <button
                onClick={() => navigate('/app/users')}
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

  if (!userData) {
    return null;
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FiUser },
    { id: 'personal', label: 'Personal Info', icon: FiSettings },
    { id: 'professional', label: 'Professional', icon: FiShield },
    { id: 'activity', label: 'Activity', icon: FiActivity }
  ];

  const getRoleBadgeClass = (role) => {
    const roleColors = {
      'admin': 'bg-purple-100 text-purple-800',
      'health_official': 'bg-blue-100 text-blue-800',
      'block_officer': 'bg-green-100 text-green-800',
      'village_worker': 'bg-yellow-100 text-yellow-800',
      'citizen': 'bg-gray-100 text-gray-800'
    };
    return roleColors[role] || 'bg-gray-100 text-gray-800';
  };

  const getRoleLabel = (role) => {
    const roleLabels = {
      'admin': 'Admin',
      'health_official': 'Health Official',
      'block_officer': 'Block Officer',
      'village_worker': 'Village Worker',
      'citizen': 'Citizen'
    };
    return roleLabels[role] || role;
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Full Name</label>
            <p className="text-lg text-gray-900">{userData.name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Email</label>
            <p className="text-lg text-gray-900 flex items-center">
              <FiMail className="w-4 h-4 mr-2 text-gray-400" />
              {userData.email}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Phone</label>
            <p className="text-lg text-gray-900 flex items-center">
              <FiPhone className="w-4 h-4 mr-2 text-gray-400" />
              {userData.phone || 'Not provided'}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Role</label>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              getRoleBadgeClass(userData.roleInfo?.role)
            }`}>
              {getRoleLabel(userData.roleInfo?.role)}
            </span>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Account Status</label>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              userData.accountStatus === 'active' 
                ? 'bg-green-100 text-green-800'
                : userData.accountStatus === 'suspended'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {userData.accountStatus}
            </span>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Verification Status</label>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              userData.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {userData.verified ? (
                <>
                  <FiUserCheck className="w-3 h-3 mr-1" />
                  Verified
                </>
              ) : (
                <>
                  <FiUserX className="w-3 h-3 mr-1" />
                  Pending
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Role & Hierarchy */}
      {userData.roleInfo?.hierarchy && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment & Hierarchy</h3>
          <div className="space-y-3">
            {userData.roleInfo.hierarchy.district && (
              <div className="flex items-center">
                <FiMapPin className="w-4 h-4 text-blue-500 mr-3" />
                <div>
                  <span className="text-sm text-gray-500">District: </span>
                  <span className="text-gray-900 font-medium">{userData.roleInfo.hierarchy.district.name}</span>
                </div>
              </div>
            )}
            {userData.roleInfo.hierarchy.block && (
              <div className="flex items-center">
                <FiMapPin className="w-4 h-4 text-green-500 mr-3" />
                <div>
                  <span className="text-sm text-gray-500">Block: </span>
                  <span className="text-gray-900 font-medium">{userData.roleInfo.hierarchy.block.name}</span>
                </div>
              </div>
            )}
            {userData.roleInfo.hierarchy.village && (
              <div className="flex items-center">
                <FiMapPin className="w-4 h-4 text-yellow-500 mr-3" />
                <div>
                  <span className="text-sm text-gray-500">Village: </span>
                  <span className="text-gray-900 font-medium">{userData.roleInfo.hierarchy.village.name}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderPersonalTab = () => (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {userData.personalInfo?.dateOfBirth && (
          <div>
            <label className="text-sm font-medium text-gray-500">Date of Birth</label>
            <p className="text-lg text-gray-900 flex items-center">
              <FiCalendar className="w-4 h-4 mr-2 text-gray-400" />
              {new Date(userData.personalInfo.dateOfBirth).toLocaleDateString()}
            </p>
          </div>
        )}
        {userData.personalInfo?.gender && (
          <div>
            <label className="text-sm font-medium text-gray-500">Gender</label>
            <p className="text-lg text-gray-900">{userData.personalInfo.gender}</p>
          </div>
        )}
        {userData.personalInfo?.aadharNumber && (
          <div>
            <label className="text-sm font-medium text-gray-500">Aadhar Number</label>
            <p className="text-lg text-gray-900 font-mono">
              {userData.personalInfo.aadharNumber.replace(/(\d{4})/g, '$1 ').trim()}
            </p>
          </div>
        )}
        {userData.personalInfo?.panNumber && (
          <div>
            <label className="text-sm font-medium text-gray-500">PAN Number</label>
            <p className="text-lg text-gray-900 font-mono">{userData.personalInfo.panNumber}</p>
          </div>
        )}
        {userData.contactInfo?.alternatePhone && (
          <div>
            <label className="text-sm font-medium text-gray-500">Alternate Phone</label>
            <p className="text-lg text-gray-900 flex items-center">
              <FiPhone className="w-4 h-4 mr-2 text-gray-400" />
              {userData.contactInfo.alternatePhone}
            </p>
          </div>
        )}
        {userData.contactInfo?.emergencyContact && (
          <div>
            <label className="text-sm font-medium text-gray-500">Emergency Contact</label>
            <p className="text-lg text-gray-900">{userData.contactInfo.emergencyContact}</p>
          </div>
        )}
      </div>
      
      {userData.contactInfo?.address && (
        <div className="mt-6">
          <label className="text-sm font-medium text-gray-500">Address</label>
          <div className="mt-2 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-900">{userData.contactInfo.address.street}</p>
            <p className="text-gray-600">
              {userData.contactInfo.address.city}, {userData.contactInfo.address.state} - {userData.contactInfo.address.pincode}
            </p>
            {userData.contactInfo.address.country && (
              <p className="text-gray-600">{userData.contactInfo.address.country}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderProfessionalTab = () => (
    <div className="space-y-6">
      {/* Professional Information */}
      {userData.professionalInfo && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userData.professionalInfo.employeeId && (
              <div>
                <label className="text-sm font-medium text-gray-500">Employee ID</label>
                <p className="text-lg text-gray-900 font-mono">{userData.professionalInfo.employeeId}</p>
              </div>
            )}
            {userData.professionalInfo.department && (
              <div>
                <label className="text-sm font-medium text-gray-500">Department</label>
                <p className="text-lg text-gray-900">{userData.professionalInfo.department}</p>
              </div>
            )}
            {userData.professionalInfo.designation && (
              <div>
                <label className="text-sm font-medium text-gray-500">Designation</label>
                <p className="text-lg text-gray-900">{userData.professionalInfo.designation}</p>
              </div>
            )}
            {userData.professionalInfo.joiningDate && (
              <div>
                <label className="text-sm font-medium text-gray-500">Joining Date</label>
                <p className="text-lg text-gray-900 flex items-center">
                  <FiCalendar className="w-4 h-4 mr-2 text-gray-400" />
                  {new Date(userData.professionalInfo.joiningDate).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
          
          {userData.professionalInfo.qualifications && userData.professionalInfo.qualifications.length > 0 && (
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-500">Qualifications</label>
              <div className="mt-2 space-y-2">
                {userData.professionalInfo.qualifications.map((qualification, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900">{qualification.degree}</p>
                    <p className="text-sm text-gray-600">{qualification.institution}</p>
                    {qualification.year && (
                      <p className="text-sm text-gray-500">Year: {qualification.year}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {userData.professionalInfo.certifications && userData.professionalInfo.certifications.length > 0 && (
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-500">Certifications</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {userData.professionalInfo.certifications.map((certification, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                    {certification}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Verification Details */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Details</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700">Account Verification</span>
            <span className={`px-2 py-1 text-xs rounded-full ${
              userData.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {userData.verified ? 'Verified' : 'Pending'}
            </span>
          </div>
          
          {userData.verificationDate && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Verification Date</span>
              <span className="text-gray-900">
                {new Date(userData.verificationDate).toLocaleDateString()}
              </span>
            </div>
          )}
          
          {userData.verifiedBy && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Verified By</span>
              <span className="text-gray-900">{userData.verifiedBy.name || userData.verifiedBy}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderActivityTab = () => (
    <div className="space-y-6">
      {/* Account Timeline */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Timeline</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <FiUser className="w-4 h-4 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-gray-900">Account Created</p>
              <p className="text-xs text-gray-500">
                {userData.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
          
          {userData.lastLogin && (
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <FiClock className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Last Login</p>
                <p className="text-xs text-gray-500">
                  {new Date(userData.lastLogin).toLocaleString()}
                </p>
              </div>
            </div>
          )}
          
          {userData.updatedAt && (
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <FiSettings className="w-4 h-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Profile Updated</p>
                <p className="text-xs text-gray-500">
                  {new Date(userData.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Device Information */}
      {userData.deviceInfo && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userData.deviceInfo.deviceId && (
              <div>
                <label className="text-sm font-medium text-gray-500">Device ID</label>
                <p className="text-sm text-gray-900 font-mono break-all">{userData.deviceInfo.deviceId}</p>
              </div>
            )}
            {userData.deviceInfo.platform && (
              <div>
                <label className="text-sm font-medium text-gray-500">Platform</label>
                <p className="text-sm text-gray-900 flex items-center">
                  <FiSmartphone className="w-4 h-4 mr-2 text-gray-400" />
                  {userData.deviceInfo.platform}
                </p>
              </div>
            )}
            {userData.deviceInfo.appVersion && (
              <div>
                <label className="text-sm font-medium text-gray-500">App Version</label>
                <p className="text-sm text-gray-900">{userData.deviceInfo.appVersion}</p>
              </div>
            )}
            {userData.deviceInfo.lastSeen && (
              <div>
                <label className="text-sm font-medium text-gray-500">Last Seen</label>
                <p className="text-sm text-gray-900">
                  {new Date(userData.deviceInfo.lastSeen).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // Get confirmation dialog configuration
  const getConfirmationConfig = () => {
    const { type } = actionConfirmation;
    
    const configs = {
      verify: {
        title: 'Verify User',
        message: `Are you sure you want to verify "${userData.name}"? This will mark them as a verified user.`,
        confirmText: 'Verify User',
        type: 'success'
      },
      suspend: {
        title: 'Suspend User',
        message: `Are you sure you want to suspend "${userData.name}"? They will not be able to access the system.`,
        confirmText: 'Suspend User',
        type: 'warning'
      },
      activate: {
        title: 'Activate User',
        message: `Are you sure you want to activate "${userData.name}"? They will regain access to the system.`,
        confirmText: 'Activate User',
        type: 'success'
      },
      delete: {
        title: 'Delete User',
        message: `Are you sure you want to delete "${userData.name}"? This action cannot be undone and will permanently remove all user data.`,
        confirmText: 'Delete User',
        type: 'danger'
      }
    };
    
    return configs[type] || {};
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
          <button
            onClick={() => navigate('/app/users')}
            className="hover:text-blue-600 transition-colors"
          >
            User Management
          </button>
          <span>/</span>
          <span className="text-gray-900">{userData.name}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/app/users')}
              className="inline-flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <FiArrowLeft className="w-4 h-4 mr-1" />
              Back to Users
            </button>
            <div className="border-l border-gray-300 h-6"></div>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-semibold text-blue-600">
                  {userData.name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{userData.name}</h1>
                <p className="text-gray-600">{userData.email}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {!userData.verified && (
              <button
                onClick={handleVerify}
                className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                <FiUserCheck className="w-4 h-4 mr-2" />
                Verify
              </button>
            )}
            <button
              onClick={handleSuspend}
              className={`inline-flex items-center px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                userData.accountStatus === 'suspended'
                  ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                  : 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500'
              }`}
            >
              {userData.accountStatus === 'suspended' ? (
                <>
                  <FiUserCheck className="w-4 h-4 mr-2" />
                  Activate
                </>
              ) : (
                <>
                  <FiUserX className="w-4 h-4 mr-2" />
                  Suspend
                </>
              )}
            </button>
            <button
              onClick={handleEdit}
              className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <FiEdit className="w-4 h-4 mr-2" />
              Edit
            </button>
            <button
              onClick={handleDelete}
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
        <div className={`p-6 rounded-lg border ${
          userData.roleInfo?.role === 'admin' ? 'bg-purple-50 border-purple-200' : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Role</p>
              <p className="text-lg font-bold text-gray-800">
                {getRoleLabel(userData.roleInfo?.role)}
              </p>
            </div>
            <FiShield className="w-8 h-8 text-gray-600" />
          </div>
        </div>
        
        <div className={`p-6 rounded-lg border ${
          userData.verified ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Verification</p>
              <p className="text-lg font-bold text-gray-800">
                {userData.verified ? 'Verified' : 'Pending'}
              </p>
            </div>
            {userData.verified ? (
              <FiUserCheck className="w-8 h-8 text-green-600" />
            ) : (
              <FiUserX className="w-8 h-8 text-yellow-600" />
            )}
          </div>
        </div>
        
        <div className={`p-6 rounded-lg border ${
          userData.accountStatus === 'active' 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Status</p>
              <p className="text-lg font-bold text-gray-800 capitalize">{userData.accountStatus}</p>
            </div>
            <FiActivity className={`w-8 h-8 ${
              userData.accountStatus === 'active' ? 'text-green-600' : 'text-red-600'
            }`} />
          </div>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Member Since</p>
              <p className="text-lg font-bold text-gray-800">
                {userData.createdAt ? new Date(userData.createdAt).getFullYear() : 'N/A'}
              </p>
            </div>
            <FiCalendar className="w-8 h-8 text-gray-600" />
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
      {activeTab === 'personal' && renderPersonalTab()}
      {activeTab === 'professional' && renderProfessionalTab()}
      {activeTab === 'activity' && renderActivityTab()}

      {/* Action Confirmation Dialog */}
      <ConfirmDialog
        isOpen={actionConfirmation.isOpen}
        onClose={() => setActionConfirmation({ isOpen: false, type: '', loading: false })}
        onConfirm={handleActionConfirm}
        loading={actionConfirmation.loading}
        {...getConfirmationConfig()}
      />
    </div>
  );
};

export default UserView;