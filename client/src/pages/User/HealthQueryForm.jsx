import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  MessageCircle, 
  Calendar, 
  User, 
  Clock, 
  CheckCircle,
  AlertCircle,
  FileText,
  Download,
  Share2,
  Bot,
  UserCheck,
  Edit2,
  MessageSquare,
  Heart,
  Stethoscope
} from 'lucide-react';
import healthQueryService from '../../services/healthQueryService';
import familyService from '../../services/familyService';
import { useUserGuard } from '../../utils/userGuard.jsx';
import  useAiStore  from '../../store/useAiStore';
import { toast } from 'react-toastify';

const HealthQueryForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getUserId } = useUserGuard();
  const { sendMessage, messages, isLoading } = useAiStore();

  const [query, setQuery] = useState(null);
  const [response, setResponse] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    loadHealthQuery();
    loadFamilyMembers();
  }, [id]);

  const loadHealthQuery = async () => {
    try {
      setLoading(true);
      const result = await healthQueryService.getHealthQueryById(id);
      if (result.success) {
        setQuery(result.data);
        
        // Load response if available
        if (result.data.hasResponse) {
          loadQueryResponse();
        }
      } else {
        toast.error(result.message);
        navigate('/app/health-queries');
      }
    } catch (error) {
      console.error('Error loading health query:', error);
      toast.error('Failed to load health query');
      navigate('/app/health-queries');
    } finally {
      setLoading(false);
    }
  };

  const loadQueryResponse = async () => {
    try {
      const result = await healthQueryService.getQueryResponse(id);
      if (result.success) {
        setResponse(result.data);
      }
    } catch (error) {
      console.error('Error loading query response:', error);
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

  const handleAskFollowUp = async () => {
    if (!followUpQuestion.trim()) {
      toast.error('Please enter a follow-up question');
      return;
    }

    try {
      // Construct context for AI
      const context = `
        Original Query: ${query.title}
        Description: ${query.description}
        Symptoms: ${query.symptoms?.join(', ') || 'None'}
        Current Medications: ${query.medications?.join(', ') || 'None'}
        Medical History: ${query.medicalHistory || 'None'}
        
        Follow-up Question: ${followUpQuestion}
      `;

      await sendMessage(context, 'health');
      setFollowUpQuestion('');
      setActiveTab('ai-chat');
    } catch (error) {
      toast.error('Failed to send follow-up question');
    }
  };

  const markAsResolved = async () => {
    try {
      const result = await healthQueryService.markQueryResolved(id);
      if (result.success) {
        toast.success('Query marked as resolved');
        setQuery(prev => ({ ...prev, status: 'resolved' }));
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error marking query as resolved:', error);
      toast.error('Failed to mark query as resolved');
    }
  };

  const getQueryTypeIcon = (type) => {
    const icons = {
      'general_health': MessageCircle,
      'symptoms': AlertCircle,
      'medications': Bot,
      'emergency': AlertCircle,
      'family_health': User
    };
    const IconComponent = icons[type] || MessageCircle;
    return <IconComponent className="h-6 w-6" />;
  };

  const getQueryTypeColor = (type) => {
    const colors = {
      'general_health': 'bg-blue-100 text-blue-800 border-blue-200',
      'symptoms': 'bg-orange-100 text-orange-800 border-orange-200',
      'medications': 'bg-purple-100 text-purple-800 border-purple-200',
      'emergency': 'bg-red-100 text-red-800 border-red-200',
      'family_health': 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[type] || colors['general_health'];
  };

  const getUrgencyColor = (urgency) => {
    const colors = {
      'low': 'bg-green-100 text-green-800 border-green-200',
      'medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'high': 'bg-orange-100 text-orange-800 border-orange-200',
      'emergency': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[urgency] || colors['low'];
  };

  const getStatusIcon = (status) => {
    const icons = {
      'pending': Clock,
      'in_progress': MessageSquare,
      'answered': CheckCircle,
      'resolved': CheckCircle
    };
    const IconComponent = icons[status] || Clock;
    return <IconComponent className="h-5 w-5" />;
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'text-yellow-600',
      'in_progress': 'text-blue-600',
      'answered': 'text-green-600',
      'resolved': 'text-gray-600'
    };
    return colors[status] || colors['pending'];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMemberName = (memberId) => {
    const member = familyMembers.find(m => m._id === memberId);
    return member?.name || 'Unknown';
  };

  const downloadDocument = (document, index) => {
    // This would typically create a download link
    toast.info('Document download feature coming soon');
  };

  const shareQuery = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: query.title,
          text: query.description,
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

  if (!query) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Query Not Found</h2>
        <p className="text-gray-600 mb-4">The requested health query could not be found.</p>
        <Link to="/app/health-queries" className="bg-blue-600 text-white px-4 py-2 rounded-lg">
          Back to Health Queries
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
            onClick={() => navigate('/app/health-queries')}
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-6 w-6 text-gray-600" />
          </button>
          <div className="flex items-center">
            {getQueryTypeIcon(query.queryType)}
            <div className="ml-3">
              <h1 className="text-3xl font-bold text-gray-900">{query.title}</h1>
              <p className="text-gray-600">Health Query Details</p>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={shareQuery}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </button>
          <Link
            to={`/app/health-queries/edit/${id}`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </Link>
          {query.status !== 'resolved' && (
            <button
              onClick={markAsResolved}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Resolved
            </button>
          )}
        </div>
      </div>

      {/* Query Overview */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="text-sm font-medium text-gray-500">Query Type</label>
            <div className="mt-1">
              <span className={`px-3 py-2 rounded-lg text-sm font-medium border ${getQueryTypeColor(query.queryType)}`}>
                {query.queryType.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Status</label>
            <div className={`mt-1 flex items-center ${getStatusColor(query.status)}`}>
              {getStatusIcon(query.status)}
              <span className="ml-2 font-medium capitalize">{query.status.replace('_', ' ')}</span>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Urgency</label>
            <div className="mt-1">
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(query.urgency)}`}>
                {query.urgency.toUpperCase()}
              </span>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">About</label>
            <div className="mt-1 flex items-center">
              <User className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-gray-900">{getMemberName(query.personId)}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Question Description</h3>
          <p className="text-gray-700 leading-relaxed">{query.description}</p>
        </div>

        {/* Symptoms */}
        {query.symptoms && query.symptoms.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Reported Symptoms</h3>
            <div className="flex flex-wrap gap-2">
              {query.symptoms.map((symptom, index) => (
                <span key={index} className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                  {symptom}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Medications */}
        {query.medications && query.medications.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Current Medications</h3>
            <div className="flex flex-wrap gap-2">
              {query.medications.map((medication, index) => (
                <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {medication}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Medical History */}
        {query.medicalHistory && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Medical History</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-700">{query.medicalHistory}</p>
            </div>
          </div>
        )}

        {/* Documents */}
        {query.documents && query.documents.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Attached Documents</h3>
            <div className="space-y-3">
              {query.documents.map((document, index) => (
                <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between">
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
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm flex items-center transition-colors"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Query Metadata */}
        <div className="border-t pt-4 mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              <span>Submitted: {formatDate(query.createdAt)}</span>
            </div>
            {query.updatedAt && query.updatedAt !== query.createdAt && (
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                <span>Last updated: {formatDate(query.updatedAt)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'details', label: 'Query Details', icon: MessageCircle },
              { id: 'response', label: 'Expert Response', icon: UserCheck },
              { id: 'ai-chat', label: 'AI Assistant', icon: Bot }
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
                {tab.id === 'response' && response && (
                  <span className="ml-2 bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">
                    Available
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Query Details Tab */}
          {activeTab === 'details' && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Complete Query Information</h4>
              <p className="text-gray-600">
                All the details about your health query are displayed above. You can edit this information
                or mark the query as resolved when you're satisfied with the responses received.
              </p>
            </div>
          )}

          {/* Expert Response Tab */}
          {activeTab === 'response' && (
            <div>
              {response ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <UserCheck className="h-5 w-5 text-green-600 mr-2" />
                      <h4 className="font-semibold text-green-900">Expert Response Available</h4>
                    </div>
                    <div className="text-gray-700">
                      <p className="mb-2"><strong>Response from:</strong> {response.expertName || 'Medical Expert'}</p>
                      <p className="mb-4"><strong>Date:</strong> {formatDate(response.responseDate)}</p>
                      <div className="bg-white p-4 rounded border">
                        {response.content}
                      </div>
                    </div>
                  </div>
                  
                  {response.recommendations && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h5 className="font-semibold text-blue-900 mb-2">Recommendations</h5>
                      <ul className="list-disc list-inside text-blue-800 space-y-1">
                        {response.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="font-medium text-gray-900 mb-2">No Expert Response Yet</h4>
                  <p className="text-gray-600">
                    Your query is being reviewed by medical experts. You'll be notified when a response is available.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* AI Chat Tab */}
          {activeTab === 'ai-chat' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Bot className="h-5 w-5 text-blue-600 mr-2" />
                  <h4 className="font-semibold text-blue-900">AI Health Assistant</h4>
                </div>
                <p className="text-blue-800 text-sm">
                  Ask follow-up questions about your health query and get immediate AI-powered insights.
                </p>
              </div>

              {/* AI Chat Messages */}
              {messages.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                  {messages.map((message, index) => (
                    <div key={index} className={`mb-4 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                      <div className={`inline-block p-3 rounded-lg max-w-xs lg:max-w-md ${
                        message.sender === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white border border-gray-200'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-75 mt-1">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Follow-up Question Input */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={followUpQuestion}
                  onChange={(e) => setFollowUpQuestion(e.target.value)}
                  placeholder="Ask a follow-up question..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !isLoading) {
                      handleAskFollowUp();
                    }
                  }}
                />
                <button
                  onClick={handleAskFollowUp}
                  disabled={isLoading || !followUpQuestion.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <MessageSquare className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/app/health-queries/create"
            className="bg-blue-50 hover:bg-blue-100 text-blue-700 p-4 rounded-lg text-center transition-colors"
          >
            <MessageCircle className="h-6 w-6 mx-auto mb-2" />
            <div className="font-medium">Ask New Question</div>
            <div className="text-sm text-blue-600">Submit another health query</div>
          </Link>
          
          <Link
            to={`/app/health-records/create?personId=${query.personId}`}
            className="bg-green-50 hover:bg-green-100 text-green-700 p-4 rounded-lg text-center transition-colors"
          >
            <Stethoscope className="h-6 w-6 mx-auto mb-2" />
            <div className="font-medium">Add Health Record</div>
            <div className="text-sm text-green-600">Record health information</div>
          </Link>
          
          <Link
            to={`/app/family/${query.personId}`}
            className="bg-purple-50 hover:bg-purple-100 text-purple-700 p-4 rounded-lg text-center transition-colors"
          >
            <Heart className="h-6 w-6 mx-auto mb-2" />
            <div className="font-medium">View Profile</div>
            <div className="text-sm text-purple-600">See {getMemberName(query.personId)}'s profile</div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HealthQueryForm;