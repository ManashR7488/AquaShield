import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit2, 
  Calendar, 
  User, 
  FileText, 
  Download, 
  Trash2,
  Stethoscope,
  Heart,
  Activity,
  Thermometer,
  Scale,
  ExternalLink,
  Share2,
  Printer as Print
} from 'lucide-react';
import personalHealthService from '../../services/personalHealthService';
import familyService from '../../services/familyService';
import { useUserGuard } from '../../utils/userGuard';
import { toast } from 'react-toastify';

const ViewHealthRecord = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getUserId } = useUserGuard();

  const [record, setRecord] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHealthRecord();
    loadFamilyMembers();
  }, [id]);

  const loadHealthRecord = async () => {
    try {
      setLoading(true);
      const result = await personalHealthService.getHealthRecordById(id);
      if (result.success) {
        setRecord(result.data);
      } else {
        toast.error(result.message);
        navigate('/app/health-records');
      }
    } catch (error) {
      console.error('Error loading health record:', error);
      toast.error('Failed to load health record');
      navigate('/app/health-records');
    } finally {
      setLoading(false);
    }
  };

  const loadFamilyMembers = async () => {
    try {
      const userId = getUserId();
      const result = await familyService.getFamilyMembers(userId);
      if (result.success) {
        // Add current user to the list
        const membersWithSelf = [
          { _id: userId, name: 'Me (Self)', relationship: 'self' },
          ...result.data
        ];
        setFamilyMembers(membersWithSelf);
      }
    } catch (error) {
      console.error('Error loading family members:', error);
    }
  };

  const handleDeleteRecord = async () => {
    if (!window.confirm('Are you sure you want to delete this health record? This action cannot be undone.')) {
      return;
    }

    try {
      const result = await personalHealthService.deleteHealthRecord(id);
      if (result.success) {
        toast.success('Health record deleted successfully');
        navigate('/app/health-records');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error deleting health record:', error);
      toast.error('Failed to delete health record');
    }
  };

  const getRecordTypeIcon = (type) => {
    const icons = {
      'vital_signs': Stethoscope,
      'medical_visit': Heart,
      'lab_result': FileText,
      'medication': Activity,
      'symptom': Thermometer,
      'exercise': Scale,
      'general': FileText
    };
    const IconComponent = icons[type] || FileText;
    return <IconComponent className="h-6 w-6" />;
  };

  const getRecordTypeColor = (type) => {
    const colors = {
      'vital_signs': 'bg-blue-100 text-blue-800 border-blue-200',
      'medical_visit': 'bg-green-100 text-green-800 border-green-200',
      'lab_result': 'bg-purple-100 text-purple-800 border-purple-200',
      'medication': 'bg-orange-100 text-orange-800 border-orange-200',
      'symptom': 'bg-red-100 text-red-800 border-red-200',
      'exercise': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'general': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[type] || colors['general'];
  };

  const getSeverityColor = (severity) => {
    const colors = {
      'low': 'bg-green-100 text-green-800 border-green-200',
      'medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'high': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[severity] || colors['low'];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getMemberName = (memberId) => {
    const member = familyMembers.find(m => m._id === memberId);
    return member?.name || 'Unknown';
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: record.title,
          text: record.description,
          url: window.location.href
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  const downloadDocument = (document, index) => {
    // This would typically create a download link
    toast.info('Document download feature coming soon');
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

  if (!record) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Record Not Found</h2>
        <p className="text-gray-600 mb-4">The requested health record could not be found.</p>
        <Link to="/app/health-records" className="bg-blue-600 text-white px-4 py-2 rounded-lg">
          Back to Health Records
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto print:max-w-full print:p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 print:mb-4">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/app/health-records')}
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors print:hidden"
          >
            <ArrowLeft className="h-6 w-6 text-gray-600" />
          </button>
          <div className="flex items-center">
            {getRecordTypeIcon(record.recordType)}
            <div className="ml-3">
              <h1 className="text-3xl font-bold text-gray-900 print:text-2xl">{record.title}</h1>
              <p className="text-gray-600">Health Record Details</p>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2 print:hidden">
          <button
            onClick={handleShare}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </button>
          <button
            onClick={handlePrint}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <Print className="h-4 w-4 mr-2" />
            Print
          </button>
          <Link
            to={`/app/health-records/${id}/edit`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </Link>
          <button
            onClick={handleDeleteRecord}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Record Overview */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6 print:shadow-none print:border print:border-gray-300">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="text-sm font-medium text-gray-500">Record Type</label>
            <div className="mt-1">
              <span className={`px-3 py-2 rounded-lg text-sm font-medium border ${getRecordTypeColor(record.recordType)}`}>
                {record.recordType.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Date</label>
            <div className="mt-1 flex items-center">
              <Calendar className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-gray-900">{formatDate(record.date)}</span>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Person</label>
            <div className="mt-1 flex items-center">
              <User className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-gray-900">{getMemberName(record.personId)}</span>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Severity</label>
            <div className="mt-1">
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(record.severity)}`}>
                {record.severity.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
          <p className="text-gray-700 leading-relaxed">{record.description || 'No description provided'}</p>
        </div>

        {/* Health Data */}
        {record.healthData && Object.keys(record.healthData).length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Health Data</h3>
            <div className="bg-gray-50 rounded-lg p-4 print:bg-gray-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(record.healthData).map(([key, value]) => (
                  <div key={key} className="bg-white p-3 rounded-lg print:border">
                    <div className="text-sm font-medium text-gray-600 capitalize">
                      {key.replace(/_/g, ' ')}
                    </div>
                    <div className="text-lg font-bold text-gray-900 mt-1">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Symptoms */}
        {record.symptoms && record.symptoms.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Symptoms</h3>
            <div className="flex flex-wrap gap-2">
              {record.symptoms.map((symptom, index) => (
                <span key={index} className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                  {symptom}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Medications */}
        {record.medications && record.medications.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Related Medications</h3>
            <div className="flex flex-wrap gap-2">
              {record.medications.map((medication, index) => (
                <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {medication}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Additional Notes */}
        {record.notes && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Additional Notes</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 print:bg-yellow-100">
              <p className="text-gray-700 leading-relaxed">{record.notes}</p>
            </div>
          </div>
        )}

        {/* Documents */}
        {record.documents && record.documents.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Attached Documents</h3>
            <div className="space-y-3">
              {record.documents.map((document, index) => (
                <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between print:bg-gray-100">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {document.name || `Document ${index + 1}`}
                      </div>
                      <div className="text-sm text-gray-500">
                        {document.type || 'Unknown type'} 
                        {document.size && ` • ${(document.size / 1024 / 1024).toFixed(2)} MB`}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => downloadDocument(document, index)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm flex items-center transition-colors print:hidden"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Record Metadata */}
        <div className="border-t pt-4 mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Created: </span>
              {formatDate(record.createdAt)}
            </div>
            {record.updatedAt && record.updatedAt !== record.createdAt && (
              <div>
                <span className="font-medium">Last Updated: </span>
                {formatDate(record.updatedAt)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons (Print version) */}
      <div className="hidden print:block text-center text-sm text-gray-600 mt-8">
        <p>This health record was generated from the Family Health Management System</p>
        <p>Date printed: {new Date().toLocaleDateString()}</p>
      </div>

      {/* Related Records */}
      <div className="bg-white rounded-lg shadow-sm border p-6 print:hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to={`/app/health-records/create?personId=${record.personId}`}
            className="bg-blue-50 hover:bg-blue-100 text-blue-700 p-4 rounded-lg text-center transition-colors"
          >
            <FileText className="h-6 w-6 mx-auto mb-2" />
            <div className="font-medium">Add New Record</div>
            <div className="text-sm text-blue-600">For {getMemberName(record.personId)}</div>
          </Link>
          
          <Link
            to={`/app/health-records?personId=${record.personId}`}
            className="bg-green-50 hover:bg-green-100 text-green-700 p-4 rounded-lg text-center transition-colors"
          >
            <Activity className="h-6 w-6 mx-auto mb-2" />
            <div className="font-medium">View All Records</div>
            <div className="text-sm text-green-600">For {getMemberName(record.personId)}</div>
          </Link>
          
          <Link
            to="/app/health-queries/create"
            className="bg-purple-50 hover:bg-purple-100 text-purple-700 p-4 rounded-lg text-center transition-colors"
          >
            <Heart className="h-6 w-6 mx-auto mb-2" />
            <div className="font-medium">Ask Health Question</div>
            <div className="text-sm text-purple-600">Get expert advice</div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ViewHealthRecord;