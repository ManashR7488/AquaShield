import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Send, 
  MessageCircle, 
  User, 
  Calendar, 
  Upload, 
  X, 
  AlertCircle,
  Plus,
  Bot,
  Stethoscope
} from 'lucide-react';
import healthQueryService from '../../services/healthQueryService';
import familyService from '../../services/familyService';
import { useUserGuard } from '../../utils/userGuard';
import { toast } from 'react-toastify';

const CreateHealthQuery = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // For edit mode
  const { getUserId } = useUserGuard();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    queryType: 'general_health',
    title: '',
    description: '',
    urgency: 'low',
    personId: '',
    symptoms: [],
    medications: [],
    medicalHistory: '',
    documents: []
  });

  const [familyMembers, setFamilyMembers] = useState([]);
  const [newSymptom, setNewSymptom] = useState('');
  const [newMedication, setNewMedication] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);

  // Common health questions for suggestions
  const commonQuestions = {
    general_health: [
      "What are the recommended health screenings for my age?",
      "How can I maintain a healthy lifestyle?",
      "What vaccinations do I need?",
      "How often should I have a health check-up?"
    ],
    symptoms: [
      "I have been experiencing persistent headaches",
      "I've had a fever for the past few days",
      "I'm having trouble sleeping recently",
      "I've been feeling unusually tired lately"
    ],
    medications: [
      "What are the side effects of my current medication?",
      "Can I take these medications together?",
      "What should I do if I miss a dose?",
      "Are there natural alternatives to my medication?"
    ],
    family_health: [
      "My child has been having recurring stomach aches",
      "What are the signs of illness I should watch for in elderly parents?",
      "How can I help my family member manage their chronic condition?",
      "What preventive measures should my family take?"
    ]
  };

  useEffect(() => {
    loadFamilyMembers();
    if (isEditMode) {
      loadHealthQuery();
    } else {
      loadSuggestedQuestions();
    }
  }, []);

  useEffect(() => {
    // Update suggested questions when query type changes
    if (!isEditMode) {
      setSuggestedQuestions(commonQuestions[formData.queryType] || []);
    }
  }, [formData.queryType, isEditMode]);

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
        
        // Set default person to current user
        if (!isEditMode) {
          setFormData(prev => ({ ...prev, personId: userId }));
        }
      }
    } catch (error) {
      console.error('Error loading family members:', error);
    }
  };

  const loadHealthQuery = async () => {
    try {
      setInitialLoading(true);
      const result = await healthQueryService.getHealthQueryById(id);
      if (result.success) {
        const query = result.data;
        setFormData({
          queryType: query.queryType || 'general_health',
          title: query.title || '',
          description: query.description || '',
          urgency: query.urgency || 'low',
          personId: query.personId || '',
          symptoms: query.symptoms || [],
          medications: query.medications || [],
          medicalHistory: query.medicalHistory || '',
          documents: []
        });
      } else {
        toast.error(result.message);
        navigate('/app/user/health-queries');
      }
    } catch (error) {
      console.error('Error loading health query:', error);
      toast.error('Failed to load health query');
      navigate('/app/user/health-queries');
    } finally {
      setInitialLoading(false);
    }
  };

  const loadSuggestedQuestions = async () => {
    try {
      const userId = getUserId();
      const result = await healthQueryService.getSuggestedQuestions(userId);
      if (result.success && result.data.length > 0) {
        setSuggestedQuestions(result.data);
      } else {
        setSuggestedQuestions(commonQuestions.general_health);
      }
    } catch (error) {
      console.error('Error loading suggested questions:', error);
      setSuggestedQuestions(commonQuestions.general_health);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error(`File ${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      return true;
    });

    setUploadedFiles(prev => [...prev, ...validFiles]);
    setFormData(prev => ({
      ...prev,
      documents: [...prev.documents, ...validFiles]
    }));
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const addToArray = (arrayName, value, setValue) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [arrayName]: [...prev[arrayName], value.trim()]
      }));
      setValue('');
    }
  };

  const removeFromArray = (arrayName, index) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].filter((_, i) => i !== index)
    }));
  };

  const useSuggestedQuestion = (question) => {
    setFormData(prev => ({
      ...prev,
      title: question,
      description: question
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error('Please enter a question title');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Please provide a detailed description');
      return;
    }

    if (!formData.personId) {
      toast.error('Please select who this question is about');
      return;
    }

    try {
      setLoading(true);
      const userId = getUserId();

      // Prepare form data for submission
      const submitData = new FormData();
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (key === 'documents') {
          // Handle file uploads
          formData.documents.forEach((file) => {
            if (file instanceof File) {
              submitData.append('documents', file);
            }
          });
        } else if (Array.isArray(formData[key])) {
          submitData.append(key, JSON.stringify(formData[key]));
        } else if (formData[key] !== null && formData[key] !== '') {
          submitData.append(key, formData[key]);
        }
      });
      
      submitData.append('userId', userId);

      let result;
      if (isEditMode) {
        result = await healthQueryService.updateHealthQuery(id, submitData);
      } else {
        result = await healthQueryService.createHealthQuery(submitData);
      }

      if (result.success) {
        toast.success(`Health query ${isEditMode ? 'updated' : 'submitted'} successfully`);
        navigate('/app/user/health-queries');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error submitting health query:', error);
      toast.error(`Failed to ${isEditMode ? 'update' : 'submit'} health query`);
    } finally {
      setLoading(false);
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
    return <IconComponent className="h-5 w-5" />;
  };

  if (initialLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/app/user/health-queries')}
          className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-6 w-6 text-gray-600" />
        </button>
        <div className="flex items-center">
          <MessageCircle className="h-8 w-8 text-blue-600 mr-3" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditMode ? 'Edit Health Query' : 'Ask Health Question'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEditMode ? 'Update your health question' : 'Get expert medical advice and guidance'}
            </p>
          </div>
        </div>
      </div>

      {/* Suggested Questions (only in create mode) */}
      {!isEditMode && suggestedQuestions.length > 0 && (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
            <Bot className="h-5 w-5 mr-2" />
            Suggested Questions
          </h3>
          <div className="space-y-2">
            {suggestedQuestions.slice(0, 4).map((question, index) => (
              <button
                key={index}
                onClick={() => useSuggestedQuestion(question)}
                className="w-full text-left p-3 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-blue-800"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Query Type and Basic Information */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Question Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Type *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                {[
                  { value: 'general_health', label: 'General Health', icon: MessageCircle },
                  { value: 'symptoms', label: 'Symptoms', icon: AlertCircle },
                  { value: 'medications', label: 'Medications', icon: Bot },
                  { value: 'emergency', label: 'Emergency', icon: AlertCircle },
                  { value: 'family_health', label: 'Family Health', icon: User }
                ].map(type => {
                  const IconComponent = type.icon;
                  return (
                    <label
                      key={type.value}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.queryType === type.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="queryType"
                        value={type.value}
                        checked={formData.queryType === type.value}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <IconComponent className="h-4 w-4 mr-2" />
                      <span className="text-sm font-medium">{type.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                About *
              </label>
              <select
                name="personId"
                value={formData.personId}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select person</option>
                {familyMembers.map(member => (
                  <option key={member._id} value={member._id}>{member.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Urgency Level *
              </label>
              <select
                name="urgency"
                value={formData.urgency}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">Low - General inquiry</option>
                <option value="medium">Medium - Concerns but not urgent</option>
                <option value="high">High - Needs prompt attention</option>
                <option value="emergency">Emergency - Immediate help needed</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief summary of your question (e.g., 'Persistent headaches for a week')"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Detailed Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Please describe your question in detail. Include when symptoms started, what makes them better or worse, any treatments tried, and any other relevant information..."
              />
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
          
          {/* Symptoms */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Symptoms
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={newSymptom}
                onChange={(e) => setNewSymptom(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter symptom"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToArray('symptoms', newSymptom, setNewSymptom);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => addToArray('symptoms', newSymptom, setNewSymptom)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.symptoms.map((symptom, index) => (
                <span
                  key={index}
                  className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm flex items-center"
                >
                  {symptom}
                  <button
                    type="button"
                    onClick={() => removeFromArray('symptoms', index)}
                    className="ml-2 text-red-600 hover:text-red-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Current Medications */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Medications
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={newMedication}
                onChange={(e) => setNewMedication(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter medication name and dosage"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToArray('medications', newMedication, setNewMedication);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => addToArray('medications', newMedication, setNewMedication)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.medications.map((medication, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center"
                >
                  {medication}
                  <button
                    type="button"
                    onClick={() => removeFromArray('medications', index)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Medical History */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Relevant Medical History
            </label>
            <textarea
              name="medicalHistory"
              value={formData.medicalHistory}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Any relevant medical history, previous treatments, allergies, or chronic conditions..."
            />
          </div>
        </div>

        {/* Document Upload */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Supporting Documents</h3>
          <div className="mb-4">
            <label className="cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-lg inline-flex items-center transition-colors">
              <Upload className="h-4 w-4 mr-2" />
              Upload Documents
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <p className="text-sm text-gray-500 mt-2">
              Upload relevant documents, lab results, or images (PDF, Images, Word docs - max 10MB each)
            </p>
          </div>

          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center">
                    <Stethoscope className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => navigate('/app/user/health-queries')}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <Send className="h-5 w-5 mr-2" />
                {isEditMode ? 'Update Question' : 'Submit Question'}
              </>
            )}
          </button>
        </div>
      </form>

      {/* Emergency Notice */}
      {formData.urgency === 'emergency' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <div>
              <h4 className="font-medium text-red-800">Emergency Notice</h4>
              <p className="text-sm text-red-700 mt-1">
                For life-threatening emergencies, please call emergency services (108/102) immediately 
                or visit the nearest hospital emergency room. This platform is not for emergency medical care.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateHealthQuery;