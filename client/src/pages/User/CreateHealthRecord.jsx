import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  FileText, 
  Calendar, 
  User, 
  Upload, 
  X, 
  Plus,
  Stethoscope,
  Heart,
  Activity,
  Thermometer,
  Scale
} from 'lucide-react';
import personalHealthService from '../../services/personalHealthService';
import familyService from '../../services/familyService';
import { useUserGuard } from '../../utils/userGuard';
import { toast } from 'react-toastify';

const CreateHealthRecord = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // For edit mode
  const [searchParams] = useSearchParams();
  const { getUserId } = useUserGuard();
  const isEditMode = Boolean(id);
  const preselectedPersonId = searchParams.get('personId');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    recordType: 'general',
    date: new Date().toISOString().split('T')[0],
    personId: preselectedPersonId || '',
    severity: 'low',
    healthData: {},
    symptoms: [],
    medications: [],
    documents: [],
    notes: ''
  });

  const [familyMembers, setFamilyMembers] = useState([]);
  const [newSymptom, setNewSymptom] = useState('');
  const [newMedication, setNewMedication] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);

  // Health data fields based on record type
  const healthDataFields = {
    vital_signs: [
      { key: 'blood_pressure_systolic', label: 'Blood Pressure (Systolic)', type: 'number', unit: 'mmHg' },
      { key: 'blood_pressure_diastolic', label: 'Blood Pressure (Diastolic)', type: 'number', unit: 'mmHg' },
      { key: 'heart_rate', label: 'Heart Rate', type: 'number', unit: 'bpm' },
      { key: 'temperature', label: 'Temperature', type: 'number', unit: '°F' },
      { key: 'weight', label: 'Weight', type: 'number', unit: 'kg' },
      { key: 'height', label: 'Height', type: 'number', unit: 'cm' },
      { key: 'oxygen_saturation', label: 'Oxygen Saturation', type: 'number', unit: '%' }
    ],
    lab_result: [
      { key: 'test_name', label: 'Test Name', type: 'text' },
      { key: 'result_value', label: 'Result Value', type: 'text' },
      { key: 'reference_range', label: 'Reference Range', type: 'text' },
      { key: 'lab_name', label: 'Laboratory Name', type: 'text' }
    ],
    medication: [
      { key: 'medication_name', label: 'Medication Name', type: 'text' },
      { key: 'dosage', label: 'Dosage', type: 'text' },
      { key: 'frequency', label: 'Frequency', type: 'text' },
      { key: 'prescribed_by', label: 'Prescribed By', type: 'text' },
      { key: 'start_date', label: 'Start Date', type: 'date' },
      { key: 'end_date', label: 'End Date', type: 'date' }
    ],
    exercise: [
      { key: 'exercise_type', label: 'Exercise Type', type: 'text' },
      { key: 'duration', label: 'Duration', type: 'number', unit: 'minutes' },
      { key: 'intensity', label: 'Intensity', type: 'select', options: ['Low', 'Medium', 'High'] },
      { key: 'calories_burned', label: 'Calories Burned', type: 'number', unit: 'cal' }
    ]
  };

  useEffect(() => {
    loadFamilyMembers();
    if (isEditMode) {
      loadHealthRecord();
    }
  }, []);

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
        
        // Set default person if not preselected
        if (!preselectedPersonId && !isEditMode) {
          setFormData(prev => ({ ...prev, personId: userId }));
        }
      }
    } catch (error) {
      console.error('Error loading family members:', error);
    }
  };

  const loadHealthRecord = async () => {
    try {
      setInitialLoading(true);
      const result = await personalHealthService.getHealthRecordById(id);
      if (result.success) {
        const record = result.data;
        setFormData({
          title: record.title || '',
          description: record.description || '',
          recordType: record.recordType || 'general',
          date: record.date ? record.date.split('T')[0] : new Date().toISOString().split('T')[0],
          personId: record.personId || '',
          severity: record.severity || 'low',
          healthData: record.healthData || {},
          symptoms: record.symptoms || [],
          medications: record.medications || [],
          documents: [],
          notes: record.notes || ''
        });
      } else {
        toast.error(result.message);
        navigate('/app/health-records');
      }
    } catch (error) {
      console.error('Error loading health record:', error);
      toast.error('Failed to load health record');
      navigate('/app/health-records');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleHealthDataChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      healthData: {
        ...prev.healthData,
        [key]: value
      }
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!formData.personId) {
      toast.error('Please select a person');
      return;
    }

    if (!formData.date) {
      toast.error('Date is required');
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
          formData.documents.forEach((file, index) => {
            if (file instanceof File) {
              submitData.append(`documents`, file);
            }
          });
        } else if (typeof formData[key] === 'object' && formData[key] !== null) {
          submitData.append(key, JSON.stringify(formData[key]));
        } else if (formData[key] !== null && formData[key] !== '') {
          submitData.append(key, formData[key]);
        }
      });
      
      submitData.append('userId', userId);

      let result;
      if (isEditMode) {
        result = await personalHealthService.updateHealthRecord(id, submitData);
      } else {
        result = await personalHealthService.createHealthRecord(submitData);
      }

      if (result.success) {
        toast.success(`Health record ${isEditMode ? 'updated' : 'created'} successfully`);
        navigate('/app/health-records');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error saving health record:', error);
      toast.error(`Failed to ${isEditMode ? 'update' : 'create'} health record`);
    } finally {
      setLoading(false);
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
          onClick={() => navigate('/app/health-records')}
          className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-6 w-6 text-gray-600" />
        </button>
        <div className="flex items-center">
          <FileText className="h-8 w-8 text-blue-600 mr-3" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditMode ? 'Edit Health Record' : 'Create Health Record'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEditMode ? 'Update your health record information' : 'Add a new health record to track your health'}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter record title (e.g., Annual Checkup, Blood Test Results)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Record Type *
              </label>
              <select
                name="recordType"
                value={formData.recordType}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="general">General</option>
                <option value="vital_signs">Vital Signs</option>
                <option value="medical_visit">Medical Visit</option>
                <option value="lab_result">Lab Result</option>
                <option value="medication">Medication</option>
                <option value="symptom">Symptom</option>
                <option value="exercise">Exercise</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Person *
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
                Date *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity
              </label>
              <select
                name="severity"
                value={formData.severity}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the health record details..."
              />
            </div>
          </div>
        </div>

        {/* Health Data Fields */}
        {healthDataFields[formData.recordType] && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              {getRecordTypeIcon(formData.recordType)}
              <span className="ml-2">{formData.recordType.replace('_', ' ').toUpperCase()} Data</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {healthDataFields[formData.recordType].map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label} {field.unit && <span className="text-gray-500">({field.unit})</span>}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      value={formData.healthData[field.key] || ''}
                      onChange={(e) => handleHealthDataChange(field.key, e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select {field.label}</option>
                      {field.options?.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      value={formData.healthData[field.key] || ''}
                      onChange={(e) => handleHealthDataChange(field.key, e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Symptoms and Medications */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
          
          {/* Symptoms */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Symptoms
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

          {/* Medications */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Related Medications
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={newMedication}
                onChange={(e) => setNewMedication(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter medication"
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

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Any additional notes or observations..."
            />
          </div>
        </div>

        {/* Document Upload */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents</h3>
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
              Upload related documents (PDF, Images, Word docs - max 10MB each)
            </p>
          </div>

          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 text-gray-400 mr-2" />
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
            onClick={() => navigate('/app/health-records')}
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
                <Save className="h-5 w-5 mr-2" />
                {isEditMode ? 'Update Record' : 'Create Record'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateHealthRecord;