import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiSave, FiX, FiMapPin, FiCamera, FiUser, FiActivity, FiAlertTriangle, FiClock, FiThermometer } from 'react-icons/fi';
import healthObservationService from '../../../services/healthObservationService';
import useAuthStore from '../../../store/useAuthStore';
import { toast } from 'react-toastify';

/**
 * Form component for creating and editing health observations
 * Supports comprehensive symptom tracking, patient info, and assessment
 */
const HealthObservationForm = () => {
  const { id } = useParams(); // For edit mode
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  // Form state
  const [formData, setFormData] = useState({
    patientInfo: {
      name: '',
      age: '',
      gender: '',
      contactNumber: '',
      address: ''
    },
    symptomType: 'fever',
    symptoms: [],
    severity: 'mild',
    status: 'active',
    observationDate: new Date().toISOString().split('T')[0],
    location: {
      address: '',
      coordinates: { latitude: '', longitude: '' }
    },
    vitalSigns: {
      temperature: '',
      bloodPressure: { systolic: '', diastolic: '' },
      pulse: '',
      respiratoryRate: '',
      oxygenSaturation: ''
    },
    additionalNotes: '',
    images: [],
    followUpRequired: false,
    referToHealthCenter: false,
    emergencyAlert: false
  });

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [customSymptom, setCustomSymptom] = useState('');
  const [imageFiles, setImageFiles] = useState([]);

  // Predefined symptoms by type
  const symptomOptions = {
    fever: ['High fever (>102°F)', 'Moderate fever (99-102°F)', 'Low-grade fever (99-100°F)', 'Chills', 'Sweating', 'Body aches'],
    respiratory: ['Cough (dry)', 'Cough (with phlegm)', 'Shortness of breath', 'Chest pain', 'Sore throat', 'Runny nose', 'Sneezing'],
    gastrointestinal: ['Nausea', 'Vomiting', 'Diarrhea', 'Abdominal pain', 'Loss of appetite', 'Constipation', 'Bloating'],
    skin: ['Rash', 'Itching', 'Swelling', 'Redness', 'Blisters', 'Dry skin', 'Unusual spots'],
    neurological: ['Headache', 'Dizziness', 'Confusion', 'Seizures', 'Memory issues', 'Numbness', 'Weakness'],
    other: ['Fatigue', 'Joint pain', 'Muscle pain', 'Sleep issues', 'Eye problems', 'Ear problems', 'Dental issues']
  };

  useEffect(() => {
    if (id) {
      loadObservation();
    }
  }, [id]);

  /**
   * Load existing observation for editing
   */
  const loadObservation = async () => {
    try {
      setIsLoading(true);
      const response = await healthObservationService.getHealthObservationById(id);
      
      if (response.success) {
        const observation = response.data;
        setFormData({
          ...observation,
          observationDate: observation.observationDate ? 
            observation.observationDate.split('T')[0] : 
            new Date().toISOString().split('T')[0]
        });
      } else {
        throw new Error(response.message || 'Failed to load observation');
      }
    } catch (error) {
      console.error('Error loading observation:', error);
    //   toast.error('Failed to load observation');
      navigate('/app/observations');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle form input changes
   */
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      if (parent === 'patientInfo') {
        setFormData(prev => ({
          ...prev,
          patientInfo: { ...prev.patientInfo, [child]: value }
        }));
      } else if (parent === 'location') {
        setFormData(prev => ({
          ...prev,
          location: { ...prev.location, [child]: value }
        }));
      } else if (parent === 'vitalSigns') {
        setFormData(prev => ({
          ...prev,
          vitalSigns: { ...prev.vitalSigns, [child]: value }
        }));
      } else if (parent === 'bloodPressure') {
        setFormData(prev => ({
          ...prev,
          vitalSigns: { 
            ...prev.vitalSigns, 
            bloodPressure: { ...prev.vitalSigns.bloodPressure, [child]: value }
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  /**
   * Handle symptom type change and reset symptoms
   */
  const handleSymptomTypeChange = (e) => {
    const newType = e.target.value;
    setFormData(prev => ({
      ...prev,
      symptomType: newType,
      symptoms: [] // Reset symptoms when changing type
    }));
  };

  /**
   * Handle symptom selection
   */
  const handleSymptomToggle = (symptom) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom]
    }));
  };

  /**
   * Add custom symptom
   */
  const handleAddCustomSymptom = () => {
    if (customSymptom.trim() && !formData.symptoms.includes(customSymptom.trim())) {
      setFormData(prev => ({
        ...prev,
        symptoms: [...prev.symptoms, customSymptom.trim()]
      }));
      setCustomSymptom('');
    }
  };

  /**
   * Get current GPS location
   */
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            coordinates: {
              latitude: latitude.toString(),
              longitude: longitude.toString()
            }
          }
        }));
        setIsGettingLocation(false);
        toast.success('Location captured successfully');
      },
      (error) => {
        console.error('Error getting location:', error);
        toast.error('Failed to get current location');
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  /**
   * Handle image file selection
   */
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      
      if (!isValidType) {
        toast.error(`${file.name}: Only JPEG, PNG, and WebP images are allowed`);
        return false;
      }
      if (!isValidSize) {
        toast.error(`${file.name}: Image must be smaller than 5MB`);
        return false;
      }
      return true;
    });
    
    setImageFiles(prev => [...prev, ...validFiles]);
  };

  /**
   * Remove image from selection
   */
  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  /**
   * Auto-assess severity based on symptoms and vital signs
   */
  const assessSeverity = () => {
    let severityScore = 0;
    
    // Check for critical symptoms
    const criticalSymptoms = ['High fever (>102°F)', 'Shortness of breath', 'Chest pain', 'Seizures', 'Confusion'];
    const hasCriticalSymptoms = formData.symptoms.some(symptom => criticalSymptoms.includes(symptom));
    
    if (hasCriticalSymptoms) severityScore += 3;
    
    // Check vital signs
    const temp = parseFloat(formData.vitalSigns.temperature);
    const pulse = parseFloat(formData.vitalSigns.pulse);
    const systolic = parseFloat(formData.vitalSigns.bloodPressure.systolic);
    const oxygenSat = parseFloat(formData.vitalSigns.oxygenSaturation);
    
    if (temp > 102) severityScore += 2;
    else if (temp > 100) severityScore += 1;
    
    if (pulse > 120 || pulse < 50) severityScore += 2;
    if (systolic > 180 || systolic < 90) severityScore += 2;
    if (oxygenSat < 95 && oxygenSat > 0) severityScore += 3;
    
    // Determine severity
    let newSeverity = 'mild';
    if (severityScore >= 5) newSeverity = 'critical';
    else if (severityScore >= 3) newSeverity = 'severe';
    else if (severityScore >= 1) newSeverity = 'moderate';
    
    setFormData(prev => ({
      ...prev,
      severity: newSeverity,
      emergencyAlert: severityScore >= 5
    }));
    
    if (severityScore >= 5) {
      toast.error('Critical condition detected! Emergency alert will be sent.');
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.patientInfo.name.trim()) {
      toast.error('Patient name is required');
      return;
    }
    
    if (formData.symptoms.length === 0) {
      toast.error('Please select at least one symptom');
      return;
    }

    try {
      setIsLoading(true);
      
      // Prepare form data with images
      const submitData = new FormData();
      
      // Add text fields
      submitData.append('data', JSON.stringify({
        ...formData,
        observedBy: user._id,
        areaId: user.assignedArea
      }));
      
      // Add image files
      imageFiles.forEach((file, index) => {
        submitData.append(`images`, file);
      });
      
      let response;
      if (id) {
        response = await healthObservationService.updateHealthObservation(id, submitData);
      } else {
        response = await healthObservationService.createHealthObservation(submitData);
      }
      
      if (response.success) {
        toast.success(id ? 'Health observation updated successfully!' : 'Health observation recorded successfully!');
        navigate('/app/observations');
      } else {
        throw new Error(response.message || 'Failed to save observation');
      }
    } catch (error) {
      console.error('Error saving observation:', error);
      toast.error(error.message || 'Failed to save observation');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FiActivity className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading health observation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {id ? 'Edit Health Observation' : 'New Health Observation'}
              </h1>
              <p className="text-gray-600 mt-1">
                Record community health symptoms and conditions for monitoring
              </p>
            </div>
            <button
              onClick={() => navigate('/app/observations')}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-700"
            >
              <FiX className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <FiUser className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Patient Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patient Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="patientInfo.name"
                  value={formData.patientInfo.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                <input
                  type="number"
                  name="patientInfo.age"
                  value={formData.patientInfo.age}
                  onChange={handleInputChange}
                  min="0"
                  max="150"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  name="patientInfo.gender"
                  value={formData.patientInfo.gender}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                <input
                  type="tel"
                  name="patientInfo.contactNumber"
                  value={formData.patientInfo.contactNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient Address</label>
                <input
                  type="text"
                  name="patientInfo.address"
                  value={formData.patientInfo.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Symptoms and Assessment */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <FiActivity className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Symptoms & Assessment</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Symptom Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="symptomType"
                  value={formData.symptomType}
                  onChange={handleSymptomTypeChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="fever">Fever</option>
                  <option value="respiratory">Respiratory</option>
                  <option value="gastrointestinal">Gastrointestinal</option>
                  <option value="skin">Skin Conditions</option>
                  <option value="neurological">Neurological</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Severity Level
                </label>
                <select
                  name="severity"
                  value={formData.severity}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observed Symptoms <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {symptomOptions[formData.symptomType]?.map((symptom) => (
                  <label key={symptom} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.symptoms.includes(symptom)}
                      onChange={() => handleSymptomToggle(symptom)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{symptom}</span>
                  </label>
                ))}
              </div>

              {/* Custom symptom input */}
              <div className="mt-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add custom symptom..."
                    value={customSymptom}
                    onChange={(e) => setCustomSymptom(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && e.preventDefault()}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSymptom}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={assessSeverity}
                className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
              >
                <FiThermometer className="w-4 h-4" />
                Auto-assess Severity
              </button>
            </div>
          </div>

          {/* Vital Signs */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <FiThermometer className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Vital Signs (Optional)</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temperature (°F)</label>
                <input
                  type="number"
                  name="vitalSigns.temperature"
                  value={formData.vitalSigns.temperature}
                  onChange={handleInputChange}
                  step="0.1"
                  min="90"
                  max="110"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pulse (BPM)</label>
                <input
                  type="number"
                  name="vitalSigns.pulse"
                  value={formData.vitalSigns.pulse}
                  onChange={handleInputChange}
                  min="30"
                  max="200"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Oxygen Saturation (%)</label>
                <input
                  type="number"
                  name="vitalSigns.oxygenSaturation"
                  value={formData.vitalSigns.oxygenSaturation}
                  onChange={handleInputChange}
                  min="70"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Systolic BP</label>
                <input
                  type="number"
                  name="bloodPressure.systolic"
                  value={formData.vitalSigns.bloodPressure.systolic}
                  onChange={handleInputChange}
                  min="60"
                  max="250"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diastolic BP</label>
                <input
                  type="number"
                  name="bloodPressure.diastolic"
                  value={formData.vitalSigns.bloodPressure.diastolic}
                  onChange={handleInputChange}
                  min="40"
                  max="150"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Respiratory Rate</label>
                <input
                  type="number"
                  name="vitalSigns.respiratoryRate"
                  value={formData.vitalSigns.respiratoryRate}
                  onChange={handleInputChange}
                  min="8"
                  max="40"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Location and Date */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <FiMapPin className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Location & Date</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observation Date</label>
                <input
                  type="date"
                  name="observationDate"
                  value={formData.observationDate}
                  onChange={handleInputChange}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="monitoring">Monitoring</option>
                  <option value="recovered">Recovered</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Location Address</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="location.address"
                    value={formData.location.address}
                    onChange={handleInputChange}
                    placeholder="Enter location address..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={isGettingLocation}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <FiMapPin className="w-4 h-4" />
                    {isGettingLocation ? 'Getting...' : 'Get GPS'}
                  </button>
                </div>
              </div>

              {(formData.location.coordinates.latitude || formData.location.coordinates.longitude) && (
                <div className="md:col-span-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                      <input
                        type="text"
                        value={formData.location.coordinates.latitude}
                        readOnly
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                      <input
                        type="text"
                        value={formData.location.coordinates.longitude}
                        readOnly
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <FiAlertTriangle className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Additional Information</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                <textarea
                  name="additionalNotes"
                  value={formData.additionalNotes}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Any additional observations, treatments suggested, or other relevant information..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Evidence Photos</label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <FiCamera className="w-5 h-5 text-gray-400" />
                </div>
                {imageFiles.length > 0 && (
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                    {imageFiles.map((file, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Evidence ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          <FiX />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Checkboxes */}
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="followUpRequired"
                    checked={formData.followUpRequired}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Follow-up required</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="referToHealthCenter"
                    checked={formData.referToHealthCenter}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Refer to health center</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="emergencyAlert"
                    checked={formData.emergencyAlert}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="ml-2 text-sm text-red-700 font-medium">Emergency alert</span>
                </label>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={() => navigate('/app/observations')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <FiSave className="w-4 h-4" />
                {isLoading ? 'Saving...' : (id ? 'Update Observation' : 'Save Observation')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HealthObservationForm;