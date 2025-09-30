import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FiArrowLeft, 
  FiUsers, 
  FiBarChart2,
  FiMapPin,
  FiCalendar,
  FiFileText,
  FiAlertCircle,
  FiCheckCircle,
  FiPlus,
  FiEye,
  FiSearch,
  FiFilter
} from "react-icons/fi";
import FormField from "../../components/Admin/FormField";
import AdminTable from "../../components/Admin/AdminTable";
import { 
  createHealthSurvey,
  getAllHealthSurveys,
  getHealthSurveyStats
} from "../../services/healthReportService";
import useAuthStore from "../../store/useAuthStore";
import { getAshaWorkerVillages } from "../../utils/ashaWorkerGuard.jsx";

/**
 * HealthSurvey Component
 * Comprehensive health survey component for village-level data collection
 */
const HealthSurvey = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Get ASHA worker's assigned villages
  const assignedVillages = getAshaWorkerVillages();
  
  // Component state
  const [activeTab, setActiveTab] = useState('conduct'); // 'conduct', 'view', 'analytics'
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [surveys, setSurveys] = useState([]);
  const [stats, setStats] = useState({});
  const [loadingSurveys, setLoadingSurveys] = useState(false);
  
  // Survey form state
  const [surveyData, setSurveyData] = useState({
    villageId: assignedVillages.length === 1 ? assignedVillages[0]._id : '',
    surveyType: '',
    surveyDate: new Date().toISOString().split('T')[0],
    households: '',
    population: '',
    responses: {}
  });

  // Filters for viewing surveys
  const [filters, setFilters] = useState({
    villageId: '',
    surveyType: '',
    dateRange: 'last_30_days',
    status: 'all'
  });

  // Check if user is ASHA worker
  useEffect(() => {
    if (user && user.roleInfo?.role !== 'asha_worker') {
      navigate('/app');
    }
  }, [user, navigate]);

  // Fetch existing surveys
  useEffect(() => {
    if (activeTab === 'view' && assignedVillages.length > 0) {
      fetchSurveys();
    }
  }, [activeTab, assignedVillages, filters]);

  // Fetch survey statistics
  useEffect(() => {
    if (activeTab === 'analytics' && assignedVillages.length > 0) {
      fetchSurveyStats();
    }
  }, [activeTab, assignedVillages]);

  // Survey types and their questions
  const surveyTypes = {
    'household_health': {
      name: 'Household Health Survey',
      description: 'General health assessment of households',
      questions: [
        { key: 'total_members', label: 'Total household members', type: 'number', required: true },
        { key: 'children_under_5', label: 'Children under 5 years', type: 'number' },
        { key: 'pregnant_women', label: 'Pregnant women', type: 'number' },
        { key: 'elderly_above_60', label: 'Elderly members (60+)', type: 'number' },
        { key: 'chronic_diseases', label: 'Members with chronic diseases', type: 'number' },
        { key: 'vaccination_status', label: 'Are all children up-to-date with vaccinations?', type: 'select', options: ['Yes', 'No', 'Partially'] },
        { key: 'health_insurance', label: 'Family has health insurance?', type: 'select', options: ['Yes', 'No'] },
        { key: 'access_to_healthcare', label: 'Ease of accessing healthcare', type: 'select', options: ['Very Easy', 'Easy', 'Difficult', 'Very Difficult'] }
      ]
    },
    'maternal_child_health': {
      name: 'Maternal & Child Health Survey',
      description: 'Focus on maternal and child health indicators',
      questions: [
        { key: 'pregnant_women_count', label: 'Number of pregnant women', type: 'number', required: true },
        { key: 'anc_visits', label: 'Pregnant women with regular ANC visits', type: 'number' },
        { key: 'institutional_deliveries', label: 'Births in healthcare facilities (last year)', type: 'number' },
        { key: 'breastfeeding_exclusive', label: 'Infants exclusively breastfed (0-6 months)', type: 'number' },
        { key: 'immunization_complete', label: 'Children with complete immunization', type: 'number' },
        { key: 'malnutrition_cases', label: 'Children showing signs of malnutrition', type: 'number' },
        { key: 'family_planning', label: 'Families using family planning methods', type: 'number' },
        { key: 'teenage_pregnancies', label: 'Teenage pregnancies (under 18)', type: 'number' }
      ]
    },
    'communicable_diseases': {
      name: 'Communicable Diseases Survey',
      description: 'Assessment of communicable disease prevalence',
      questions: [
        { key: 'fever_cases', label: 'Households with fever cases (last month)', type: 'number', required: true },
        { key: 'diarrhea_cases', label: 'Households with diarrhea cases', type: 'number' },
        { key: 'respiratory_infections', label: 'Acute respiratory infection cases', type: 'number' },
        { key: 'skin_infections', label: 'Skin infection cases', type: 'number' },
        { key: 'tuberculosis_suspected', label: 'Suspected TB cases', type: 'number' },
        { key: 'malaria_cases', label: 'Confirmed/suspected malaria cases', type: 'number' },
        { key: 'vector_breeding', label: 'Households with stagnant water/breeding sites', type: 'number' },
        { key: 'sanitation_issues', label: 'Households with poor sanitation', type: 'number' }
      ]
    },
    'non_communicable_diseases': {
      name: 'Non-Communicable Diseases Survey',
      description: 'Assessment of lifestyle diseases and NCDs',
      questions: [
        { key: 'diabetes_cases', label: 'Known diabetes cases', type: 'number', required: true },
        { key: 'hypertension_cases', label: 'Known hypertension cases', type: 'number' },
        { key: 'heart_disease', label: 'Heart disease cases', type: 'number' },
        { key: 'tobacco_users', label: 'Tobacco users (any form)', type: 'number' },
        { key: 'alcohol_users', label: 'Regular alcohol users', type: 'number' },
        { key: 'obesity_cases', label: 'Overweight/obese individuals', type: 'number' },
        { key: 'mental_health', label: 'Mental health issues reported', type: 'number' },
        { key: 'regular_checkups', label: 'People getting regular health checkups', type: 'number' }
      ]
    },
    'water_sanitation': {
      name: 'Water & Sanitation Survey',
      description: 'Water quality and sanitation assessment',
      questions: [
        { key: 'safe_water_access', label: 'Households with safe drinking water', type: 'number', required: true },
        { key: 'water_source_type', label: 'Primary water source', type: 'select', options: ['Piped water', 'Tube well', 'Dug well', 'Surface water', 'Tanker water'] },
        { key: 'water_treatment', label: 'Households treating water before drinking', type: 'number' },
        { key: 'toilet_access', label: 'Households with toilet facilities', type: 'number' },
        { key: 'open_defecation', label: 'Households practicing open defecation', type: 'number' },
        { key: 'waste_disposal', label: 'Households with proper waste disposal', type: 'number' },
        { key: 'hand_washing', label: 'Households with handwashing facilities', type: 'number' },
        { key: 'water_storage', label: 'Households with safe water storage', type: 'number' }
      ]
    },
    'nutrition_food_security': {
      name: 'Nutrition & Food Security Survey',
      description: 'Assessment of nutrition status and food security',
      questions: [
        { key: 'food_secure_households', label: 'Food secure households', type: 'number', required: true },
        { key: 'three_meals_daily', label: 'Households having 3 meals daily', type: 'number' },
        { key: 'protein_access', label: 'Households with regular protein access', type: 'number' },
        { key: 'vegetable_access', label: 'Households consuming vegetables daily', type: 'number' },
        { key: 'underweight_children', label: 'Underweight children', type: 'number' },
        { key: 'stunted_children', label: 'Stunted children', type: 'number' },
        { key: 'anemic_women', label: 'Anemic women (pregnant/lactating)', type: 'number' },
        { key: 'nutrition_supplements', label: 'Children receiving nutrition supplements', type: 'number' }
      ]
    }
  };

  // Fetch surveys
  const fetchSurveys = async () => {
    setLoadingSurveys(true);
    try {
      const promises = assignedVillages.map(village => 
        getAllHealthSurveys({
          villageId: village._id,
          surveyType: filters.surveyType || undefined,
          dateRange: filters.dateRange,
          limit: 100
        })
      );
      
      const responses = await Promise.all(promises);
      const allSurveys = responses.reduce((acc, response) => {
        if (response.success) {
          return [...acc, ...response.data];
        }
        return acc;
      }, []);
      
      setSurveys(allSurveys);
    } catch (err) {
      console.error('Error fetching surveys:', err);
      setErrors({ surveys: 'Failed to load surveys' });
    } finally {
      setLoadingSurveys(false);
    }
  };

  // Fetch survey statistics
  const fetchSurveyStats = async () => {
    try {
      const promises = assignedVillages.map(village => 
        getHealthSurveyStats(village._id)
      );
      
      const responses = await Promise.all(promises);
      const combinedStats = responses.reduce((acc, response) => {
        if (response.success) {
          const data = response.data;
          Object.keys(data).forEach(key => {
            if (typeof data[key] === 'number') {
              acc[key] = (acc[key] || 0) + data[key];
            }
          });
        }
        return acc;
      }, {});
      
      setStats(combinedStats);
    } catch (err) {
      console.error('Error fetching survey stats:', err);
    }
  };

  // Handle survey type selection
  const handleSurveyTypeSelect = (type) => {
    setSurveyData(prev => ({
      ...prev,
      surveyType: type,
      responses: {}
    }));
  };

  // Handle response input
  const handleResponseChange = (questionKey, value) => {
    setSurveyData(prev => ({
      ...prev,
      responses: {
        ...prev.responses,
        [questionKey]: value
      }
    }));
  };

  // Validate survey form
  const validateSurveyForm = () => {
    const newErrors = {};

    if (!surveyData.villageId) {
      newErrors.villageId = 'Village selection is required';
    }

    if (!surveyData.surveyType) {
      newErrors.surveyType = 'Survey type is required';
    }

    if (!surveyData.surveyDate) {
      newErrors.surveyDate = 'Survey date is required';
    }

    if (!surveyData.households || surveyData.households < 1) {
      newErrors.households = 'Number of households must be at least 1';
    }

    if (!surveyData.population || surveyData.population < 1) {
      newErrors.population = 'Population must be at least 1';
    }

    // Validate required questions
    if (surveyData.surveyType && surveyTypes[surveyData.surveyType]) {
      const questions = surveyTypes[surveyData.surveyType].questions;
      questions.forEach(question => {
        if (question.required && !surveyData.responses[question.key]) {
          newErrors[`response_${question.key}`] = `${question.label} is required`;
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle survey submission
  const handleSurveySubmit = async (e) => {
    e.preventDefault();
    
    if (!validateSurveyForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const submitData = {
        ...surveyData,
        surveyDate: new Date(surveyData.surveyDate).toISOString(),
        households: parseInt(surveyData.households),
        population: parseInt(surveyData.population),
        responses: Object.keys(surveyData.responses).reduce((acc, key) => {
          const value = surveyData.responses[key];
          acc[key] = isNaN(value) ? value : parseInt(value) || 0;
          return acc;
        }, {})
      };

      const response = await createHealthSurvey(submitData);
      
      if (response.success) {
        setSurveyData({
          villageId: assignedVillages.length === 1 ? assignedVillages[0]._id : '',
          surveyType: '',
          surveyDate: new Date().toISOString().split('T')[0],
          households: '',
          population: '',
          responses: {}
        });
        
        setActiveTab('view');
        fetchSurveys();
      } else {
        setErrors({ 
          submit: response.error || 'Failed to submit survey. Please try again.' 
        });
      }
    } catch (err) {
      console.error('Error submitting survey:', err);
      setErrors({ 
        submit: 'An unexpected error occurred. Please check your connection and try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Survey table columns
  const surveyColumns = [
    {
      key: 'village',
      header: 'Village',
      render: (survey) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <FiMapPin className="text-blue-600" size={14} />
          </div>
          <div>
            <div className="font-medium text-gray-900">{survey.village?.name}</div>
            <div className="text-sm text-gray-500">{survey.village?.block}</div>
          </div>
        </div>
      )
    },
    {
      key: 'surveyType',
      header: 'Survey Type',
      render: (survey) => (
        <div>
          <div className="font-medium text-gray-900">
            {surveyTypes[survey.surveyType]?.name || survey.surveyType}
          </div>
          <div className="text-sm text-gray-500">
            {survey.households} households • {survey.population} people
          </div>
        </div>
      )
    },
    {
      key: 'surveyDate',
      header: 'Survey Date',
      render: (survey) => new Date(survey.surveyDate).toLocaleDateString()
    },
    {
      key: 'status',
      header: 'Status',
      render: (survey) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <FiCheckCircle className="mr-1" size={12} />
          Completed
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (survey) => (
        <button
          onClick={() => navigate('/app/health-surveys')}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          <FiEye className="inline mr-1" size={14} />
          View Details
        </button>
      )
    }
  ];

  if (!assignedVillages.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <FiUsers className="text-red-600" size={24} />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No Assigned Villages</h3>
          <p className="mt-2 text-sm text-gray-500 max-w-md">
            You need to be assigned to villages before you can conduct health surveys.
          </p>
          <button
            onClick={() => navigate('/app')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Go Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/app')}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <FiArrowLeft size={20} />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Health Surveys</h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Conduct and manage village health surveys
                  </p>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('conduct')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'conduct'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FiPlus className="inline mr-1" size={14} />
                  Conduct Survey
                </button>
                <button
                  onClick={() => setActiveTab('view')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'view'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FiFileText className="inline mr-1" size={14} />
                  View Surveys
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'analytics'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FiBarChart2 className="inline mr-1" size={14} />
                  Analytics
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {errors.submit && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiAlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{errors.submit}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'conduct' && (
          <form onSubmit={handleSurveySubmit} className="space-y-8">
            {/* Survey Setup */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Survey Setup</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Configure survey type and basic information
                </p>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    label="Village"
                    type="select"
                    name="villageId"
                    value={surveyData.villageId}
                    onChange={(value) => setSurveyData(prev => ({ ...prev, villageId: value }))}
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

                  <FormField
                    label="Survey Date"
                    type="date"
                    name="surveyDate"
                    value={surveyData.surveyDate}
                    onChange={(value) => setSurveyData(prev => ({ ...prev, surveyDate: value }))}
                    error={errors.surveyDate}
                    required
                    max={new Date().toISOString().split('T')[0]}
                    icon={FiCalendar}
                  />

                  <FormField
                    label="Total Households Surveyed"
                    type="number"
                    name="households"
                    value={surveyData.households}
                    onChange={(value) => setSurveyData(prev => ({ ...prev, households: value }))}
                    error={errors.households}
                    required
                    min="1"
                    placeholder="Number of households"
                  />

                  <FormField
                    label="Total Population Covered"
                    type="number"
                    name="population"
                    value={surveyData.population}
                    onChange={(value) => setSurveyData(prev => ({ ...prev, population: value }))}
                    error={errors.population}
                    required
                    min="1"
                    placeholder="Total people surveyed"
                  />
                </div>

                <FormField
                  label="Survey Type"
                  type="select"
                  name="surveyType"
                  value={surveyData.surveyType}
                  onChange={handleSurveyTypeSelect}
                  error={errors.surveyType}
                  required
                  options={[
                    { value: '', label: 'Select survey type' },
                    ...Object.entries(surveyTypes).map(([key, survey]) => ({
                      value: key,
                      label: survey.name
                    }))
                  ]}
                />

                {/* Survey Description */}
                {surveyData.surveyType && surveyTypes[surveyData.surveyType] && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-1">
                      {surveyTypes[surveyData.surveyType].name}
                    </h4>
                    <p className="text-sm text-blue-800">
                      {surveyTypes[surveyData.surveyType].description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Survey Questions */}
            {surveyData.surveyType && surveyTypes[surveyData.surveyType] && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Survey Questions</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Answer all survey questions based on your field observations
                  </p>
                </div>
                
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {surveyTypes[surveyData.surveyType].questions.map((question, index) => (
                      <FormField
                        key={question.key}
                        label={question.label}
                        type={question.type}
                        name={`response_${question.key}`}
                        value={surveyData.responses[question.key] || ''}
                        onChange={(value) => handleResponseChange(question.key, value)}
                        error={errors[`response_${question.key}`]}
                        required={question.required}
                        options={question.options ? [
                          { value: '', label: 'Select option' },
                          ...question.options.map(opt => ({ value: opt, label: opt }))
                        ] : undefined}
                        min={question.type === 'number' ? '0' : undefined}
                        placeholder={question.type === 'number' ? 'Enter number' : undefined}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Form Actions */}
            {surveyData.surveyType && (
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setSurveyData({
                    villageId: assignedVillages.length === 1 ? assignedVillages[0]._id : '',
                    surveyType: '',
                    surveyDate: new Date().toISOString().split('T')[0],
                    households: '',
                    population: '',
                    responses: {}
                  })}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  Reset Form
                </button>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{loading ? 'Submitting...' : 'Submit Survey'}</span>
                </button>
              </div>
            )}
          </form>
        )}

        {activeTab === 'view' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-4">
                <FormField
                  label="Village"
                  type="select"
                  name="villageFilter"
                  value={filters.villageId}
                  onChange={(value) => setFilters(prev => ({ ...prev, villageId: value }))}
                  options={[
                    { value: '', label: 'All villages' },
                    ...assignedVillages.map(village => ({
                      value: village._id,
                      label: village.name
                    }))
                  ]}
                  compact
                />

                <FormField
                  label="Survey Type"
                  type="select"
                  name="typeFilter"
                  value={filters.surveyType}
                  onChange={(value) => setFilters(prev => ({ ...prev, surveyType: value }))}
                  options={[
                    { value: '', label: 'All types' },
                    ...Object.entries(surveyTypes).map(([key, survey]) => ({
                      value: key,
                      label: survey.name
                    }))
                  ]}
                  compact
                />

                <FormField
                  label="Date Range"
                  type="select"
                  name="dateRangeFilter"
                  value={filters.dateRange}
                  onChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}
                  options={[
                    { value: 'last_7_days', label: 'Last 7 days' },
                    { value: 'last_30_days', label: 'Last 30 days' },
                    { value: 'last_90_days', label: 'Last 3 months' },
                    { value: 'last_year', label: 'Last year' }
                  ]}
                  compact
                />
              </div>
            </div>

            {/* Surveys Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Survey History</h3>
                <p className="mt-1 text-sm text-gray-500">
                  View and manage completed health surveys
                </p>
              </div>
              
              <AdminTable
                columns={surveyColumns}
                data={surveys}
                loading={loadingSurveys}
                emptyMessage="No surveys found. Create your first survey above."
              />
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Survey Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FiFileText className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-5">
                    <p className="text-sm font-medium text-gray-500">Total Surveys</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalSurveys || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FiMapPin className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-5">
                    <p className="text-sm font-medium text-gray-500">Villages Covered</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.villagesCovered || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FiUsers className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-5">
                    <p className="text-sm font-medium text-gray-500">Households Surveyed</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalHouseholds || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FiUsers className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="ml-5">
                    <p className="text-sm font-medium text-gray-500">Population Covered</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalPopulation || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Survey Type Distribution */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Survey Type Distribution</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Distribution of different survey types conducted
                </p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(surveyTypes).map(([key, survey]) => {
                    const count = stats.surveyTypeDistribution?.[key] || 0;
                    return (
                      <div key={key} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">{survey.name}</h4>
                        <p className="text-2xl font-semibold text-blue-600 mb-1">{count}</p>
                        <p className="text-sm text-gray-500">{survey.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Guidelines */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-yellow-900 mb-2">Survey Guidelines</h4>
          <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
            <li>Conduct surveys regularly to track health trends and changes</li>
            <li>Ensure accurate data collection by visiting households personally</li>
            <li>Maintain confidentiality of sensitive health information</li>
            <li>Use survey data to identify health priorities and plan interventions</li>
            <li>Follow up on critical findings with appropriate health authorities</li>
            <li>Include all demographic groups to ensure representative data</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default HealthSurvey;