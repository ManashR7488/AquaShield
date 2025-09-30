import React from "react";
import PropTypes from "prop-types";
import { 
  FiCalendar, 
  FiMapPin, 
  FiUser, 
  FiFileText,
  FiAlertTriangle,
  FiDollarSign,
  FiClock,
  FiTag,
  FiCheckCircle,
  FiXCircle
} from "react-icons/fi";
import { FaStethoscope } from "react-icons/fa";
import FormField from "../../../components/Admin/FormField";

/**
 * HealthReportForm Component
 * Reusable form for creating and editing health reports
 */
const HealthReportForm = ({
  formData,
  onChange,
  onSubmit,
  loading = false,
  isEdit = false,
  assignedVillages = [],
  errors = {}
}) => {

  // Handle form field changes
  const handleFieldChange = (name, value) => {
    onChange({
      ...formData,
      [name]: value
    });
  };

  // Handle nested field changes (e.g., location, resources)
  const handleNestedChange = (parent, field, value) => {
    onChange({
      ...formData,
      [parent]: {
        ...formData[parent],
        [field]: value
      }
    });
  };

  // Add/remove items from arrays
  const handleArrayChange = (arrayName, index, value, action = 'update') => {
    const currentArray = formData[arrayName] || [];
    let newArray;

    switch (action) {
      case 'add':
        newArray = [...currentArray, value];
        break;
      case 'remove':
        newArray = currentArray.filter((_, i) => i !== index);
        break;
      case 'update':
      default:
        newArray = currentArray.map((item, i) => i === index ? value : item);
        break;
    }

    onChange({
      ...formData,
      [arrayName]: newArray
    });
  };

  // Report type configurations
  const reportTypeConfigs = {
    disease_outbreak: {
      label: "Disease Outbreak Report",
      icon: FiAlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-100",
      requiredFields: ['affectedCount', 'symptoms', 'suspectedCause']
    },
    water_quality: {
      label: "Water Quality Report",
      icon: FaStethoscope,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      requiredFields: ['waterSource', 'qualityParameters']
    },
    health_survey: {
      label: "Health Survey Report",
      icon: FiFileText,
      color: "text-green-600",
      bgColor: "bg-green-100",
      requiredFields: ['surveyType', 'participantCount']
    },
    emergency_alert: {
      label: "Emergency Alert",
      icon: FiAlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      requiredFields: ['emergencyType', 'immediateActions']
    },
    routine_checkup: {
      label: "Routine Health Checkup",
      icon: FiCheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
      requiredFields: ['checkupType', 'participantCount']
    }
  };

  // Get current report type configuration
  const currentTypeConfig = reportTypeConfigs[formData.reportType] || reportTypeConfigs.routine_checkup;

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {/* Basic Information Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
          <p className="mt-1 text-sm text-gray-500">
            Essential details about the health report
          </p>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Report Type */}
            <FormField
              label="Report Type"
              type="select"
              name="reportType"
              value={formData.reportType || ''}
              onChange={(value) => handleFieldChange('reportType', value)}
              error={errors.reportType}
              required
              options={[
                { value: '', label: 'Select report type' },
                ...Object.entries(reportTypeConfigs).map(([key, config]) => ({
                  value: key,
                  label: config.label
                }))
              ]}
              icon={currentTypeConfig.icon}
            />

            {/* Village Selection */}
            <FormField
              label="Village"
              type="select"
              name="villageId"
              value={formData.villageId || ''}
              onChange={(value) => handleFieldChange('villageId', value)}
              error={errors.villageId}
              required
              options={[
                { value: '', label: 'Select village' },
                ...assignedVillages.map(village => ({
                  value: village._id,
                  label: `${village.name} - ${village.block || 'Unknown Block'}`
                }))
              ]}
              icon={FiMapPin}
            />

            {/* Report Date */}
            <FormField
              label="Report Date"
              type="datetime-local"
              name="reportDate"
              value={formData.reportDate || ''}
              onChange={(value) => handleFieldChange('reportDate', value)}
              error={errors.reportDate}
              required
              icon={FiCalendar}
            />

            {/* Priority */}
            <FormField
              label="Priority Level"
              type="select"
              name="priority"
              value={formData.priority || 'medium'}
              onChange={(value) => handleFieldChange('priority', value)}
              error={errors.priority}
              required
              options={[
                { value: 'low', label: 'Low Priority' },
                { value: 'medium', label: 'Medium Priority' },
                { value: 'high', label: 'High Priority' },
                { value: 'urgent', label: 'Urgent Priority' }
              ]}
              icon={FiTag}
            />
          </div>

          {/* Title */}
          <FormField
            label="Report Title"
            type="text"
            name="title"
            value={formData.title || ''}
            onChange={(value) => handleFieldChange('title', value)}
            error={errors.title}
            required
            placeholder="Enter a descriptive title for the report"
            icon={FiFileText}
          />

          {/* Description */}
          <FormField
            label="Description"
            type="textarea"
            name="description"
            value={formData.description || ''}
            onChange={(value) => handleFieldChange('description', value)}
            error={errors.description}
            required
            placeholder="Provide detailed description of the health situation..."
            rows={4}
          />
        </div>
      </div>

      {/* Location Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Location Details</h3>
          <p className="mt-1 text-sm text-gray-500">
            Specific location information for the report
          </p>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Specific Location"
              type="text"
              name="specificLocation"
              value={formData.location?.specificLocation || ''}
              onChange={(value) => handleNestedChange('location', 'specificLocation', value)}
              error={errors['location.specificLocation']}
              placeholder="e.g., Primary Health Center, School, Community Center"
              icon={FiMapPin}
            />

            <FormField
              label="Landmark"
              type="text"
              name="landmark"
              value={formData.location?.landmark || ''}
              onChange={(value) => handleNestedChange('location', 'landmark', value)}
              error={errors['location.landmark']}
              placeholder="Nearby landmark or reference point"
            />

            <FormField
              label="GPS Coordinates (Optional)"
              type="text"
              name="coordinates"
              value={formData.location?.coordinates || ''}
              onChange={(value) => handleNestedChange('location', 'coordinates', value)}
              error={errors['location.coordinates']}
              placeholder="Latitude, Longitude"
            />

            <FormField
              label="Area Type"
              type="select"
              name="areaType"
              value={formData.location?.areaType || ''}
              onChange={(value) => handleNestedChange('location', 'areaType', value)}
              error={errors['location.areaType']}
              options={[
                { value: '', label: 'Select area type' },
                { value: 'residential', label: 'Residential Area' },
                { value: 'commercial', label: 'Commercial Area' },
                { value: 'school', label: 'School/Educational' },
                { value: 'healthcare', label: 'Healthcare Facility' },
                { value: 'rural', label: 'Rural/Agricultural' },
                { value: 'other', label: 'Other' }
              ]}
            />
          </div>
        </div>
      </div>

      {/* Type-Specific Fields */}
      {formData.reportType && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentTypeConfig.bgColor}`}>
                <currentTypeConfig.icon className={`${currentTypeConfig.color}`} size={16} />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">{currentTypeConfig.label} Details</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Specific information for this type of report
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Disease Outbreak Fields */}
            {formData.reportType === 'disease_outbreak' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Number of Affected People"
                  type="number"
                  name="affectedCount"
                  value={formData.affectedCount || ''}
                  onChange={(value) => handleFieldChange('affectedCount', parseInt(value) || 0)}
                  error={errors.affectedCount}
                  required
                  min="1"
                  icon={FiUser}
                />

                <FormField
                  label="Suspected Cause"
                  type="text"
                  name="suspectedCause"
                  value={formData.suspectedCause || ''}
                  onChange={(value) => handleFieldChange('suspectedCause', value)}
                  error={errors.suspectedCause}
                  required
                  placeholder="e.g., Contaminated water, Vector-borne"
                />

                <div className="md:col-span-2">
                  <FormField
                    label="Symptoms Observed"
                    type="textarea"
                    name="symptoms"
                    value={formData.symptoms || ''}
                    onChange={(value) => handleFieldChange('symptoms', value)}
                    error={errors.symptoms}
                    required
                    placeholder="Describe the symptoms observed in affected individuals"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Water Quality Fields */}
            {formData.reportType === 'water_quality' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Water Source"
                  type="select"
                  name="waterSource"
                  value={formData.waterSource || ''}
                  onChange={(value) => handleFieldChange('waterSource', value)}
                  error={errors.waterSource}
                  required
                  options={[
                    { value: '', label: 'Select water source' },
                    { value: 'borewell', label: 'Borewell/Tubewell' },
                    { value: 'hand_pump', label: 'Hand Pump' },
                    { value: 'open_well', label: 'Open Well' },
                    { value: 'river', label: 'River/Stream' },
                    { value: 'pond', label: 'Pond/Lake' },
                    { value: 'piped_supply', label: 'Piped Water Supply' },
                    { value: 'other', label: 'Other' }
                  ]}
                />

                <FormField
                  label="Water Quality Status"
                  type="select"
                  name="qualityStatus"
                  value={formData.qualityStatus || ''}
                  onChange={(value) => handleFieldChange('qualityStatus', value)}
                  error={errors.qualityStatus}
                  options={[
                    { value: '', label: 'Select quality status' },
                    { value: 'good', label: 'Good' },
                    { value: 'fair', label: 'Fair' },
                    { value: 'poor', label: 'Poor' },
                    { value: 'contaminated', label: 'Contaminated' }
                  ]}
                />

                <div className="md:col-span-2">
                  <FormField
                    label="Quality Parameters & Issues"
                    type="textarea"
                    name="qualityParameters"
                    value={formData.qualityParameters || ''}
                    onChange={(value) => handleFieldChange('qualityParameters', value)}
                    error={errors.qualityParameters}
                    required
                    placeholder="Describe water quality issues, test results, contamination signs..."
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Health Survey Fields */}
            {formData.reportType === 'health_survey' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Survey Type"
                  type="select"
                  name="surveyType"
                  value={formData.surveyType || ''}
                  onChange={(value) => handleFieldChange('surveyType', value)}
                  error={errors.surveyType}
                  required
                  options={[
                    { value: '', label: 'Select survey type' },
                    { value: 'immunization', label: 'Immunization Coverage' },
                    { value: 'nutrition', label: 'Nutrition Assessment' },
                    { value: 'maternal_health', label: 'Maternal Health' },
                    { value: 'child_health', label: 'Child Health' },
                    { value: 'communicable_disease', label: 'Communicable Disease' },
                    { value: 'general_health', label: 'General Health Survey' }
                  ]}
                />

                <FormField
                  label="Number of Participants"
                  type="number"
                  name="participantCount"
                  value={formData.participantCount || ''}
                  onChange={(value) => handleFieldChange('participantCount', parseInt(value) || 0)}
                  error={errors.participantCount}
                  required
                  min="1"
                  icon={FiUser}
                />

                <div className="md:col-span-2">
                  <FormField
                    label="Survey Findings"
                    type="textarea"
                    name="surveyFindings"
                    value={formData.surveyFindings || ''}
                    onChange={(value) => handleFieldChange('surveyFindings', value)}
                    error={errors.surveyFindings}
                    placeholder="Summarize key findings from the health survey..."
                    rows={4}
                  />
                </div>
              </div>
            )}

            {/* Emergency Alert Fields */}
            {formData.reportType === 'emergency_alert' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    label="Emergency Type"
                    type="select"
                    name="emergencyType"
                    value={formData.emergencyType || ''}
                    onChange={(value) => handleFieldChange('emergencyType', value)}
                    error={errors.emergencyType}
                    required
                    options={[
                      { value: '', label: 'Select emergency type' },
                      { value: 'medical_emergency', label: 'Medical Emergency' },
                      { value: 'disease_outbreak', label: 'Disease Outbreak' },
                      { value: 'natural_disaster', label: 'Natural Disaster' },
                      { value: 'infrastructure_failure', label: 'Infrastructure Failure' },
                      { value: 'resource_shortage', label: 'Resource Shortage' },
                      { value: 'other', label: 'Other Emergency' }
                    ]}
                    icon={FiAlertTriangle}
                  />

                  <FormField
                    label="Severity Level"
                    type="select"
                    name="severityLevel"
                    value={formData.severityLevel || ''}
                    onChange={(value) => handleFieldChange('severityLevel', value)}
                    error={errors.severityLevel}
                    options={[
                      { value: '', label: 'Select severity' },
                      { value: 'low', label: 'Low Severity' },
                      { value: 'moderate', label: 'Moderate Severity' },
                      { value: 'high', label: 'High Severity' },
                      { value: 'critical', label: 'Critical Severity' }
                    ]}
                  />
                </div>

                <FormField
                  label="Immediate Actions Taken"
                  type="textarea"
                  name="immediateActions"
                  value={formData.immediateActions || ''}
                  onChange={(value) => handleFieldChange('immediateActions', value)}
                  error={errors.immediateActions}
                  required
                  placeholder="Describe immediate actions taken to address the emergency..."
                  rows={3}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Additional Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Additional Information</h3>
          <p className="mt-1 text-sm text-gray-500">
            Recommendations, resources needed, and follow-up actions
          </p>
        </div>
        
        <div className="p-6 space-y-6">
          <FormField
            label="Recommendations"
            type="textarea"
            name="recommendations"
            value={formData.recommendations || ''}
            onChange={(value) => handleFieldChange('recommendations', value)}
            error={errors.recommendations}
            placeholder="Provide recommendations for addressing the health situation..."
            rows={3}
          />

          <FormField
            label="Resources Needed"
            type="textarea"
            name="resourcesNeeded"
            value={formData.resourcesNeeded || ''}
            onChange={(value) => handleFieldChange('resourcesNeeded', value)}
            error={errors.resourcesNeeded}
            placeholder="List any resources, supplies, or support needed..."
            rows={3}
            icon={FiDollarSign}
          />

          <FormField
            label="Follow-up Actions Required"
            type="textarea"
            name="followUpActions"
            value={formData.followUpActions || ''}
            onChange={(value) => handleFieldChange('followUpActions', value)}
            error={errors.followUpActions}
            placeholder="Describe any follow-up actions or monitoring required..."
            rows={3}
            icon={FiClock}
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        >
          Cancel
        </button>
        
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          <span>{loading ? 'Saving...' : isEdit ? 'Update Report' : 'Create Report'}</span>
        </button>
      </div>
    </form>
  );
};

HealthReportForm.propTypes = {
  formData: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  isEdit: PropTypes.bool,
  assignedVillages: PropTypes.array,
  errors: PropTypes.object
};

export default HealthReportForm;