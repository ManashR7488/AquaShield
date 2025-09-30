import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit2, 
  Heart, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Users, 
  AlertCircle,
  Activity,
  Pill,
  FileText,
  Plus,
  Trash2,
  Download
} from 'lucide-react';
import familyService from '../../services/familyService';
import personalHealthService from '../../services/personalHealthService';
import { useUserGuard } from '../../utils/userGuard';
import { toast } from 'react-toastify';

const FamilyMemberProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getUserId } = useUserGuard();

  const [member, setMember] = useState(null);
  const [healthSummary, setHealthSummary] = useState(null);
  const [recentRecords, setRecentRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadMemberData();
  }, [id]);

  const loadMemberData = async () => {
    try {
      setLoading(true);
      const userId = getUserId();

      // Load family member details
      const memberResult = await familyService.getFamilyMemberById(id);
      if (!memberResult.success) {
        toast.error(memberResult.message);
        navigate('/app/user/family');
        return;
      }

      setMember(memberResult.data);

      // Load health summary by getting health records and deriving summary
      const summaryResult = await familyService.getFamilyHealthRecords(id);
      if (summaryResult.success) {
        // Derive health summary from records
        const records = summaryResult.data;
        const healthSummaryData = {
          totalRecords: records.length,
          lastCheckup: records.find(r => r.type === 'checkup')?.date || null,
          recentConditions: records
            .filter(r => r.conditions && r.conditions.length > 0)
            .slice(0, 3)
            .map(r => r.conditions)
            .flat(),
          currentMedications: records
            .filter(r => r.medications && r.medications.length > 0)
            .slice(0, 3)
            .map(r => r.medications)
            .flat()
        };
        setHealthSummary(healthSummaryData);
      }

      // Load recent health records
      const recordsResult = await personalHealthService.getPersonalHealthRecords(userId, {
        personId: id,
        limit: 5,
        sortBy: 'date',
        sortOrder: 'desc'
      });
      if (recordsResult.success) {
        setRecentRecords(recordsResult.data);
      }

    } catch (error) {
      console.error('Error loading member data:', error);
      toast.error('Failed to load family member data');
      navigate('/app/user/family');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!window.confirm('Are you sure you want to remove this family member? This action cannot be undone.')) {
      return;
    }

    try {
      const result = await familyService.deleteFamilyMember(id);
      if (result.success) {
        toast.success('Family member removed successfully');
        navigate('/app/user/family');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error deleting family member:', error);
      toast.error('Failed to remove family member');
    }
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getHealthStatusColor = (status) => {
    const colors = {
      'good': 'bg-green-100 text-green-800 border-green-200',
      'fair': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'poor': 'bg-red-100 text-red-800 border-red-200',
      'unknown': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || colors['unknown'];
  };

  const getRelationshipIcon = (relationship) => {
    const icons = {
      'spouse': '💑',
      'child': '👶',
      'parent': '👨‍👩‍👧‍👦',
      'sibling': '👫',
      'grandparent': '👴👵',
      'grandchild': '👶',
      'other': '👤'
    };
    return icons[relationship] || icons['other'];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const exportHealthData = async () => {
    try {
      // This would typically generate a PDF or CSV export
      toast.info('Health data export feature coming soon');
    } catch (error) {
      toast.error('Failed to export health data');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="bg-gray-200 h-64 rounded-lg mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Member Not Found</h2>
        <p className="text-gray-600 mb-4">The requested family member could not be found.</p>
        <Link to="/app/user/family" className="bg-blue-600 text-white px-4 py-2 rounded-lg">
          Back to Family
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/app/user/family')}
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-6 w-6 text-gray-600" />
          </button>
          <div className="flex items-center">
            <div className="text-4xl mr-4">
              {getRelationshipIcon(member.relationship)}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{member.name}</h1>
              <p className="text-gray-600 capitalize">{member.relationship}</p>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={exportHealthData}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </button>
          <Link
            to={`/app/user/family/${id}/edit`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </Link>
          <button
            onClick={handleDeleteMember}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Remove
          </button>
        </div>
      </div>

      {/* Member Overview Card */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Profile Image and Basic Info */}
          <div className="flex items-center">
            {member.profileImage ? (
              <img
                src={member.profileImage}
                alt={member.name}
                className="h-20 w-20 rounded-full object-cover border-4 border-gray-200 mr-4"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-lg">{member.name}</h3>
              <p className="text-gray-600">{member.gender}</p>
              <p className="text-sm text-gray-500">
                Age: {calculateAge(member.dateOfBirth)} years
              </p>
            </div>
          </div>

          {/* Health Status */}
          <div className="text-center">
            <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getHealthStatusColor(member.healthStatus)}`}>
              {member.healthStatus.charAt(0).toUpperCase() + member.healthStatus.slice(1)} Health
            </span>
            {member.bloodGroup && (
              <p className="text-sm text-gray-600 mt-2">
                Blood Group: <span className="font-medium">{member.bloodGroup}</span>
              </p>
            )}
          </div>

          {/* Contact Information */}
          <div className="space-y-2">
            {member.phone && (
              <div className="flex items-center text-sm">
                <Phone className="h-4 w-4 text-gray-400 mr-2" />
                <span>{member.phone}</span>
              </div>
            )}
            {member.email && (
              <div className="flex items-center text-sm">
                <Mail className="h-4 w-4 text-gray-400 mr-2" />
                <span>{member.email}</span>
              </div>
            )}
            {member.emergencyContact && (
              <div className="flex items-center text-sm">
                <AlertCircle className="h-4 w-4 text-red-400 mr-2" />
                <span>Emergency: {member.emergencyContact}</span>
              </div>
            )}
          </div>

          {/* Key Dates */}
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <Calendar className="h-4 w-4 text-gray-400 mr-2" />
              <span>DOB: {formatDate(member.dateOfBirth)}</span>
            </div>
            <div className="flex items-center text-sm">
              <Users className="h-4 w-4 text-gray-400 mr-2" />
              <span>Added: {formatDate(member.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: Heart },
              { id: 'conditions', label: 'Medical Conditions', icon: AlertCircle },
              { id: 'medications', label: 'Medications', icon: Pill },
              { id: 'records', label: 'Health Records', icon: FileText }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Address */}
              {member.address && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Address
                  </h4>
                  <p className="text-gray-700">{member.address}</p>
                </div>
              )}

              {/* Health Summary */}
              {healthSummary && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <Activity className="h-4 w-4 mr-2" />
                    Health Summary
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{healthSummary.totalRecords || 0}</div>
                      <div className="text-sm text-gray-600">Total Records</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{healthSummary.recentVisits || 0}</div>
                      <div className="text-sm text-gray-600">Recent Visits</div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{healthSummary.activeConditions || 0}</div>
                      <div className="text-sm text-gray-600">Active Conditions</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Medical Conditions Tab */}
          {activeTab === 'conditions' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-gray-900">Medical Conditions & Allergies</h4>
                <Link
                  to={`/app/user/family/${id}/edit`}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </Link>
              </div>

              {/* Medical Conditions */}
              <div>
                <h5 className="font-medium text-gray-800 mb-2">Medical Conditions</h5>
                {member.medicalConditions && member.medicalConditions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {member.medicalConditions.map((condition, index) => (
                      <span key={index} className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
                        {condition}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No medical conditions recorded</p>
                )}
              </div>

              {/* Allergies */}
              <div>
                <h5 className="font-medium text-gray-800 mb-2">Allergies</h5>
                {member.allergies && member.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {member.allergies.map((allergy, index) => (
                      <span key={index} className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                        {allergy}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No allergies recorded</p>
                )}
              </div>
            </div>
          )}

          {/* Medications Tab */}
          {activeTab === 'medications' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-gray-900">Current Medications</h4>
                <Link
                  to={`/app/user/family/${id}/edit`}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </Link>
              </div>

              {member.medications && member.medications.length > 0 ? (
                <div className="space-y-3">
                  {member.medications.map((medication, index) => (
                    <div key={index} className="bg-blue-50 p-4 rounded-lg flex items-center">
                      <Pill className="h-5 w-5 text-blue-600 mr-3" />
                      <span className="text-gray-800">{medication}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No medications recorded</p>
                  <Link
                    to={`/app/user/family/${id}/edit`}
                    className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add medications
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Health Records Tab */}
          {activeTab === 'records' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-gray-900">Recent Health Records</h4>
                <Link
                  to={`/app/health-records/create?personId=${id}`}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center text-sm transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Record
                </Link>
              </div>

              {recentRecords.length > 0 ? (
                <div className="space-y-3">
                  {recentRecords.map(record => (
                    <div key={record._id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium text-gray-900">{record.title}</h5>
                        <span className="text-xs text-gray-500">{formatDate(record.date)}</span>
                      </div>
                      <p className="text-gray-600 text-sm">{record.description}</p>
                      {record.recordType && (
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-2">
                          {record.recordType}
                        </span>
                      )}
                    </div>
                  ))}
                  <div className="text-center">
                    <Link
                      to={`/app/health-records?personId=${id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View All Records →
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No health records found</p>
                  <Link
                    to={`/app/health-records/create?personId=${id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add first record
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FamilyMemberProfile;
