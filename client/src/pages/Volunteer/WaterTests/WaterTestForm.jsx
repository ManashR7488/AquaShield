import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiSave, FiX, FiCamera, FiMapPin, FiDroplet, FiArrowLeft, FiThermometer, FiCheckCircle } from 'react-icons/fi';
import waterTestService from '../../../services/waterTestService';
import useAuthStore from '../../../store/useAuthStore';
import { toast } from 'react-toastify';

/**
 * Form component for creating and editing water tests
 * Supports various water quality parameters and GPS coordinates
 */
const WaterTestForm = () => {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const { id } = useParams(); // For editing existing tests
  const isEditing = Boolean(id);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTest, setIsLoadingTest] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    sourceName: '',
    sourceType: '',
    location: {
      address: '',
      coordinates: {
        latitude: null,
        longitude: null
      }
    },
    testDate: new Date().toISOString().split('T')[0],
    parameters: {
      pH: '',
      turbidity: '',
      chlorine: '',
      bacteria: '',
      nitrates: '',
      fluoride: '',
      arsenic: '',
      temperature: ''
    },
    testKit: {
      type: '',
      serialNumber: '',
      calibrationDate: ''
    },
    results: {
      overallQuality: '',
      drinkable: false,
      treatmentRequired: false,
      notes: ''
    },
    evidence: [],
    testedBy: {
      name: user?.name || '',
      qualification: '',
      phone: user?.phone || ''
    }
  });

  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  // Source types
  const sourceTypes = [
    { value: 'well', label: 'Hand Pump Well' },
    { value: 'borehole', label: 'Borehole' },
    { value: 'spring', label: 'Natural Spring' },
    { value: 'river', label: 'River/Stream' },
    { value: 'pond', label: 'Pond/Lake' },
    { value: 'tap', label: 'Tap Water' },
    { value: 'tanker', label: 'Water Tanker' },
    { value: 'other', label: 'Other' }
  ];

  // Quality levels
  const qualityLevels = [
    { value: 'safe', label: 'Safe to Drink', color: 'text-green-600' },
    { value: 'marginal', label: 'Marginal Quality', color: 'text-yellow-600' },
    { value: 'unsafe', label: 'Unsafe to Drink', color: 'text-red-600' },
    { value: 'contaminated', label: 'Severely Contaminated', color: 'text-red-800' }
  ];

  useEffect(() => {
    if (isEditing) {
      loadTest();
    }
    getCurrentLocation();
  }, [id]);

  /**
   * Load existing test for editing
   */
  const loadTest = async () => {
    try {
      setIsLoadingTest(true);
      const response = await waterTestService.getWaterTestById(id);
      
      if (response.success) {
        const test = response.data;
        setFormData({
          sourceName: test.sourceName || '',
          sourceType: test.sourceType || '',
          location: test.location || { address: '', coordinates: { latitude: null, longitude: null } },
          testDate: test.testDate ? new Date(test.testDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          parameters: test.parameters || {
            pH: '', turbidity: '', chlorine: '', bacteria: '', nitrates: '', fluoride: '', arsenic: '', temperature: ''
          },
          testKit: test.testKit || { type: '', serialNumber: '', calibrationDate: '' },
          results: test.results || { overallQuality: '', drinkable: false, treatmentRequired: false, notes: '' },
          evidence: test.evidence || [],
          testedBy: test.testedBy || { name: user?.name || '', qualification: '', phone: user?.phone || '' }
        });
      } else {
        throw new Error(response.message || 'Failed to load test');
      }
    } catch (error) {
      console.error('Error loading test:', error);
    //   toast.error('Failed to load test details');
      navigate('/app/water-tests');
    } finally {
      setIsLoadingTest(false);
    }
  };

  /**
   * Get current GPS location
   */
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        setCurrentLocation(location);
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            coordinates: location
          }
        }));
        setIsLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setLocationError('Unable to get current location');
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  /**
   * Handle input changes
   */
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child, grandChild] = name.split('.');
      if (grandChild) {
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: {
              ...prev[parent][child],
              [grandChild]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) || null : value)
            }
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) || '' : value)
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
   * Handle image upload
   */
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length > 0) {
      // Check file size (max 5MB per file)
      const maxSize = 5 * 1024 * 1024;
      const validFiles = files.filter(file => {
        if (file.size > maxSize) {
          toast.error(`File ${file.name} is too large. Maximum size is 5MB.`);
          return false;
        }
        return true;
      });

      if (validFiles.length > 0) {
        setFormData(prev => ({
          ...prev,
          evidence: [...prev.evidence, ...validFiles]
        }));
      }
    }
  };

  /**
   * Remove uploaded image
   */
  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      evidence: prev.evidence.filter((_, i) => i !== index)
    }));
  };

  /**
   * Auto-calculate overall quality based on parameters
   */
  const calculateOverallQuality = () => {
    const { pH, turbidity, chlorine, bacteria } = formData.parameters;
    let score = 0;
    let factors = 0;

    // pH scoring (6.5-8.5 is ideal)
    if (pH) {
      factors++;
      const pHVal = parseFloat(pH);
      if (pHVal >= 6.5 && pHVal <= 8.5) score += 25;
      else if (pHVal >= 6.0 && pHVal <= 9.0) score += 15;
      else score += 5;
    }

    // Turbidity scoring (< 1 NTU is ideal)
    if (turbidity) {
      factors++;
      const turbVal = parseFloat(turbidity);
      if (turbVal < 1) score += 25;
      else if (turbVal < 5) score += 15;
      else score += 5;
    }

    // Chlorine scoring (0.2-0.5 mg/L is ideal)
    if (chlorine) {
      factors++;
      const chlorVal = parseFloat(chlorine);
      if (chlorVal >= 0.2 && chlorVal <= 0.5) score += 25;
      else if (chlorVal >= 0.1 && chlorVal <= 1.0) score += 15;
      else score += 5;
    }

    // Bacteria scoring (absent is ideal)
    if (bacteria) {
      factors++;
      if (bacteria.toLowerCase() === 'absent' || bacteria === '0') score += 25;
      else if (bacteria.toLowerCase() === 'low') score += 15;
      else score += 0;
    }

    if (factors === 0) return '';

    const avgScore = score / factors;
    if (avgScore >= 20) return 'safe';
    if (avgScore >= 15) return 'marginal';
    if (avgScore >= 10) return 'unsafe';
    return 'contaminated';
  };

  /**
   * Auto-update overall quality when parameters change
   */
  useEffect(() => {
    const quality = calculateOverallQuality();
    if (quality && quality !== formData.results.overallQuality) {
      setFormData(prev => ({
        ...prev,
        results: {
          ...prev.results,
          overallQuality: quality,
          drinkable: quality === 'safe',
          treatmentRequired: quality !== 'safe'
        }
      }));
    }
  }, [formData.parameters]);

  /**
   * Validate form data
   */
  const validateForm = () => {
    const errors = [];

    if (!formData.sourceName.trim()) errors.push('Source name is required');
    if (!formData.sourceType) errors.push('Source type is required');
    if (!formData.location.address.trim()) errors.push('Location is required');
    if (!formData.testDate) errors.push('Test date is required');
    if (!formData.testedBy.name.trim()) errors.push('Tester name is required');

    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return false;
    }

    return true;
  };

  /**
   * Submit form
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      const submitData = {
        ...formData,
        village: user?.village,
        testedBy: {
          ...formData.testedBy,
          userId: user?._id
        }
      };

      let response;
      if (isEditing) {
        response = await waterTestService.updateWaterTest(id, submitData);
      } else {
        response = await waterTestService.createWaterTest(submitData);
      }

      if (response.success) {
        toast.success(isEditing ? 'Test updated successfully!' : 'Test submitted successfully!');
        navigate('/app/water-tests');
      } else {
        throw new Error(response.message || 'Failed to submit test');
      }
    } catch (error) {
      console.error('Error submitting test:', error);
      toast.error('Failed to submit test. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingTest) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading test details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/app/water-tests')}
              className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <FiArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {isEditing ? 'Edit Water Test' : 'Conduct Water Test'}
              </h1>
              <p className="text-gray-600 mt-1">
                {isEditing ? 'Update the water test details' : 'Record water quality testing results'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Source Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Water Source Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Source Name *
                  </label>
                  <input
                    type="text"
                    name="sourceName"
                    value={formData.sourceName}
                    onChange={handleInputChange}
                    placeholder="e.g., Main Village Well, Community Borehole"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Source Type *
                  </label>
                  <select
                    name="sourceType"
                    value={formData.sourceType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select source type</option>
                    {sourceTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Date *
                  </label>
                  <input
                    type="date"
                    name="testDate"
                    value={formData.testDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Location Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location/Address *
                  </label>
                  <input
                    type="text"
                    name="location.address"
                    value={formData.location.address}
                    onChange={handleInputChange}
                    placeholder="Enter the specific location or address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GPS Coordinates
                    </label>
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                    >
                      <FiMapPin className="w-4 h-4" />
                      {isLoading ? 'Getting Location...' : 'Get Current Location'}
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      name="location.coordinates.latitude"
                      value={formData.location.coordinates.latitude || ''}
                      onChange={handleInputChange}
                      placeholder="Latitude"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      name="location.coordinates.longitude"
                      value={formData.location.coordinates.longitude || ''}
                      onChange={handleInputChange}
                      placeholder="Longitude"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Test Parameters */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Water Quality Parameters</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    pH Level
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="parameters.pH"
                    value={formData.parameters.pH}
                    onChange={handleInputChange}
                    placeholder="6.5 - 8.5 (ideal range)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Turbidity (NTU)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="parameters.turbidity"
                    value={formData.parameters.turbidity}
                    onChange={handleInputChange}
                    placeholder="< 1 NTU (ideal)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chlorine (mg/L)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="parameters.chlorine"
                    value={formData.parameters.chlorine}
                    onChange={handleInputChange}
                    placeholder="0.2 - 0.5 mg/L (ideal)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temperature (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="parameters.temperature"
                    value={formData.parameters.temperature}
                    onChange={handleInputChange}
                    placeholder="Water temperature"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bacteria Count
                  </label>
                  <select
                    name="parameters.bacteria"
                    value={formData.parameters.bacteria}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select bacteria level</option>
                    <option value="absent">Absent</option>
                    <option value="low">Low</option>
                    <option value="moderate">Moderate</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nitrates (mg/L)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="parameters.nitrates"
                    value={formData.parameters.nitrates}
                    onChange={handleInputChange}
                    placeholder="< 10 mg/L (safe limit)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fluoride (mg/L)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="parameters.fluoride"
                    value={formData.parameters.fluoride}
                    onChange={handleInputChange}
                    placeholder="0.5 - 1.0 mg/L (ideal)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Arsenic (mg/L)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    name="parameters.arsenic"
                    value={formData.parameters.arsenic}
                    onChange={handleInputChange}
                    placeholder="< 0.01 mg/L (safe limit)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Test Results */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Results</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overall Water Quality
                  </label>
                  <select
                    name="results.overallQuality"
                    value={formData.results.overallQuality}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select quality level</option>
                    {qualityLevels.map(quality => (
                      <option key={quality.value} value={quality.value}>
                        {quality.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-6">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="drinkable"
                      name="results.drinkable"
                      checked={formData.results.drinkable}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="drinkable" className="text-sm font-medium text-gray-700">
                      Safe for drinking
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="treatmentRequired"
                      name="results.treatmentRequired"
                      checked={formData.results.treatmentRequired}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="treatmentRequired" className="text-sm font-medium text-gray-700">
                      Treatment required
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes & Recommendations
                  </label>
                  <textarea
                    name="results.notes"
                    value={formData.results.notes}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Additional observations and treatment recommendations..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Test Kit Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Kit Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Kit Type
                  </label>
                  <input
                    type="text"
                    name="testKit.type"
                    value={formData.testKit.type}
                    onChange={handleInputChange}
                    placeholder="e.g., Field Test Kit, Digital Meter"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    name="testKit.serialNumber"
                    value={formData.testKit.serialNumber}
                    onChange={handleInputChange}
                    placeholder="Kit serial number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Calibration Date
                  </label>
                  <input
                    type="date"
                    name="testKit.calibrationDate"
                    value={formData.testKit.calibrationDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Tester Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Tester Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tester Name *
                  </label>
                  <input
                    type="text"
                    name="testedBy.name"
                    value={formData.testedBy.name}
                    onChange={handleInputChange}
                    placeholder="Your name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Qualification
                  </label>
                  <input
                    type="text"
                    name="testedBy.qualification"
                    value={formData.testedBy.qualification}
                    onChange={handleInputChange}
                    placeholder="e.g., Trained Volunteer, Certified Tester"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    name="testedBy.phone"
                    value={formData.testedBy.phone}
                    onChange={handleInputChange}
                    placeholder="Phone number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Evidence Upload */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Evidence (Optional)</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Photos
                  </label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <FiCamera className="w-8 h-8 mb-4 text-gray-500" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> test photos
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG or JPEG (MAX. 5MB each)</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
                </div>

                {/* Display uploaded images */}
                {formData.evidence.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {formData.evidence.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={typeof image === 'string' ? image : URL.createObjectURL(image)}
                          alt={`Test evidence ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiSave className="w-4 h-4" />
                  {isSubmitting ? 'Submitting...' : (isEditing ? 'Update Test' : 'Submit Test Results')}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/app/water-tests')}
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WaterTestForm;