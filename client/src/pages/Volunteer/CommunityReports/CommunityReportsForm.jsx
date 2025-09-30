import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiSave, FiX, FiCamera, FiMapPin, FiAlertCircle, FiArrowLeft } from 'react-icons/fi';
import { communityReportService } from '../../../services/communityReportService';
import { useAuthStore } from '../../../store/useAuthStore';
import { toast } from 'react-toastify';

/**
 * Form component for creating and editing community reports
 * Supports image uploads, GPS coordinates, and various report types
 */
const CommunityReportsForm = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { id } = useParams(); // For editing existing reports
  const isEditing = Boolean(id);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingReport, setIsLoadingReport] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    type: '',
    priority: 'medium',
    description: '',
    location: '',
    coordinates: {
      latitude: null,
      longitude: null
    },
    affectedPeople: '',
    immediateAction: false,
    contactInfo: {
      name: user?.name || '',
      phone: user?.phone || ''
    },
    images: [],
    additionalNotes: ''
  });

  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  // Report types
  const reportTypes = [
    { value: 'infrastructure', label: 'Infrastructure Issue' },
    { value: 'health', label: 'Health Concern' },
    { value: 'sanitation', label: 'Sanitation Problem' },
    { value: 'water', label: 'Water Supply Issue' },
    { value: 'electricity', label: 'Electricity Problem' },
    { value: 'safety', label: 'Safety & Security' },
    { value: 'environment', label: 'Environmental Issue' },
    { value: 'other', label: 'Other' }
  ];

  // Priority levels
  const priorityLevels = [
    { value: 'low', label: 'Low', color: 'text-gray-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'high', label: 'High', color: 'text-orange-600' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-600' }
  ];

  useEffect(() => {
    if (isEditing) {
      loadReport();
    }
    getCurrentLocation();
  }, [id]);

  /**
   * Load existing report for editing
   */
  const loadReport = async () => {
    try {
      setIsLoadingReport(true);
      const response = await communityReportService.getCommunityReport(id);
      
      if (response.success) {
        const report = response.data;
        setFormData({
          type: report.type || '',
          priority: report.priority || 'medium',
          description: report.description || '',
          location: report.location || '',
          coordinates: report.coordinates || { latitude: null, longitude: null },
          affectedPeople: report.affectedPeople || '',
          immediateAction: report.immediateAction || false,
          contactInfo: report.contactInfo || { name: user?.name || '', phone: user?.phone || '' },
          images: report.images || [],
          additionalNotes: report.additionalNotes || ''
        });
      } else {
        throw new Error(response.message || 'Failed to load report');
      }
    } catch (error) {
      console.error('Error loading report:', error);
      // toast.error('Failed to load report details');
      navigate('/volunteer/community-reports');
    } finally {
      setIsLoadingReport(false);
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
          coordinates: location
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
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
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
          images: [...prev.images, ...validFiles]
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
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  /**
   * Validate form data
   */
  const validateForm = () => {
    const errors = [];

    if (!formData.type) errors.push('Report type is required');
    if (!formData.description.trim()) errors.push('Description is required');
    if (!formData.location.trim()) errors.push('Location is required');
    if (!formData.contactInfo.name.trim()) errors.push('Contact name is required');
    if (!formData.contactInfo.phone.trim()) errors.push('Contact phone is required');

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
        submittedBy: user?._id
      };

      let response;
      if (isEditing) {
        response = await communityReportService.updateCommunityReport(id, submitData);
      } else {
        response = await communityReportService.createCommunityReport(submitData);
      }

      if (response.success) {
        toast.success(isEditing ? 'Report updated successfully!' : 'Report submitted successfully!');
        navigate('/volunteer/community-reports');
      } else {
        throw new Error(response.message || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Submit as urgent alert
   */
  const handleUrgentSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      const alertData = {
        ...formData,
        priority: 'urgent',
        immediateAction: true,
        village: user?.village,
        submittedBy: user?._id
      };

      const response = await communityReportService.submitUrgentAlert(alertData);

      if (response.success) {
        toast.success('Urgent alert submitted successfully!');
        navigate('/volunteer/community-reports');
      } else {
        throw new Error(response.message || 'Failed to submit urgent alert');
      }
    } catch (error) {
      console.error('Error submitting urgent alert:', error);
      toast.error('Failed to submit urgent alert. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingReport) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading report details...</p>
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
              onClick={() => navigate('/volunteer/community-reports')}
              className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <FiArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {isEditing ? 'Edit Community Report' : 'Create Community Report'}
              </h1>
              <p className="text-gray-600 mt-1">
                {isEditing ? 'Update the community report details' : 'Report an issue or concern in your community'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Report Type *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select report type</option>
                    {reportTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority Level
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {priorityLevels.map(priority => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Provide a detailed description of the issue or concern..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
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
                    name="location"
                    value={formData.location}
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
                      value={formData.coordinates.latitude || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        coordinates: {
                          ...prev.coordinates,
                          latitude: parseFloat(e.target.value) || null
                        }
                      }))}
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
                      value={formData.coordinates.longitude || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        coordinates: {
                          ...prev.coordinates,
                          longitude: parseFloat(e.target.value) || null
                        }
                      }))}
                      placeholder="Longitude"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {locationError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
                    <FiAlertCircle className="w-4 h-4" />
                    <span className="text-sm">{locationError}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of People Affected (Optional)
                  </label>
                  <input
                    type="number"
                    name="affectedPeople"
                    value={formData.affectedPeople}
                    onChange={handleInputChange}
                    placeholder="Estimate number of people affected"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    name="additionalNotes"
                    value={formData.additionalNotes}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Any additional information or context..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="immediateAction"
                    name="immediateAction"
                    checked={formData.immediateAction}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="immediateAction" className="text-sm font-medium text-gray-700">
                    This issue requires immediate action
                  </label>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    name="contactInfo.name"
                    value={formData.contactInfo.name}
                    onChange={handleInputChange}
                    placeholder="Your name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Phone *
                  </label>
                  <input
                    type="tel"
                    name="contactInfo.phone"
                    value={formData.contactInfo.phone}
                    onChange={handleInputChange}
                    placeholder="Your phone number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Image Upload */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Images (Optional)</h2>
              
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
                          <span className="font-semibold">Click to upload</span> or drag and drop
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
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={typeof image === 'string' ? image : URL.createObjectURL(image)}
                          alt={`Upload ${index + 1}`}
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
                  {isSubmitting ? 'Submitting...' : (isEditing ? 'Update Report' : 'Submit Report')}
                </button>

                {!isEditing && (
                  <button
                    type="button"
                    onClick={handleUrgentSubmit}
                    disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiAlertCircle className="w-4 h-4" />
                    {isSubmitting ? 'Submitting...' : 'Submit as Urgent Alert'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => navigate('/volunteer/community-reports')}
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

export default CommunityReportsForm;