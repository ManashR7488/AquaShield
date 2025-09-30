import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  FiArrowLeft, 
  FiCheckCircle, 
  FiUser,
  FiShield,
  FiCalendar,
  FiMapPin,
  FiClock,
  FiAlertTriangle,
  FiCamera,
  FiUpload
} from "react-icons/fi";
import FormField from "../../../components/Admin/FormField";
import AdminTable from "../../../components/Admin/AdminTable";
import { 
  getAllVaccinations,
  markVaccinationComplete,
  getVaccinationById
} from "../../../services/vaccinationService";
import useAuthStore from "../../../store/useAuthStore";
import { getAshaWorkerVillages } from "../../../utils/ashaWorkerGuard.jsx";

/**
 * VaccinationComplete Component
 * Page for marking vaccinations as completed with batch processing
 */
const VaccinationComplete = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  
  // Get ASHA worker's assigned villages
  const assignedVillages = getAshaWorkerVillages();
  
  // Get pre-selected vaccination from URL params
  const preSelectedVaccinationId = searchParams.get('vaccinationId');
  
  // Component state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [scheduledVaccinations, setScheduledVaccinations] = useState([]);
  const [selectedVaccinations, setSelectedVaccinations] = useState([]);
  const [loadingVaccinations, setLoadingVaccinations] = useState(false);
  const [completionMode, setCompletionMode] = useState('single'); // 'single' or 'batch'
  
  // Single completion form state
  const [singleCompletionData, setSingleCompletionData] = useState({
    vaccinationId: preSelectedVaccinationId || '',
    completedDate: new Date().toISOString().split('T')[0],
    completedTime: new Date().toTimeString().slice(0, 5),
    actualLocation: '',
    batchNumber: '',
    manufacturer: '',
    expiryDate: '',
    sideEffects: '',
    notes: '',
    nextDueDate: '',
    verificationPhoto: null
  });

  // Batch completion form state
  const [batchCompletionData, setBatchCompletionData] = useState({
    completedDate: new Date().toISOString().split('T')[0],
    completedTime: new Date().toTimeString().slice(0, 5),
    actualLocation: '',
    batchNumber: '',
    manufacturer: '',
    expiryDate: '',
    generalNotes: '',
    verificationPhotos: []
  });

  // Check if user is ASHA worker
  useEffect(() => {
    if (user && user.roleInfo?.role !== 'asha_worker') {
      navigate('/app');
    }
  }, [user, navigate]);

  // Fetch scheduled vaccinations
  useEffect(() => {
    const fetchScheduledVaccinations = async () => {
      if (assignedVillages.length === 0) return;
      
      setLoadingVaccinations(true);
      try {
        const today = new Date();
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        
        const vaccinationPromises = assignedVillages.map(village => 
          getAllVaccinations(village._id, {
            status: 'scheduled',
            startDate: weekAgo.toISOString(),
            endDate: today.toISOString()
          })
        );
        
        const responses = await Promise.all(vaccinationPromises);
        const allVaccinations = responses.reduce((acc, response) => {
          if (response.success) {
            return [...acc, ...response.data];
          }
          return acc;
        }, []);
        
        setScheduledVaccinations(allVaccinations);
        
        // Pre-select vaccination if provided in URL
        if (preSelectedVaccinationId) {
          const preSelected = allVaccinations.find(v => v._id === preSelectedVaccinationId);
          if (preSelected) {
            setSelectedVaccinations([preSelected]);
            setSingleCompletionData(prev => ({
              ...prev,
              vaccinationId: preSelected._id,
              actualLocation: preSelected.location || '',
              batchNumber: preSelected.batchNumber || '',
              manufacturer: preSelected.manufacturer || '',
              expiryDate: preSelected.expiryDate ? 
                new Date(preSelected.expiryDate).toISOString().split('T')[0] : ''
            }));
          }
        }
      } catch (err) {
        console.error('Error fetching scheduled vaccinations:', err);
        setErrors({ vaccinations: 'Failed to load scheduled vaccinations' });
      } finally {
        setLoadingVaccinations(false);
      }
    };

    fetchScheduledVaccinations();
  }, [assignedVillages, preSelectedVaccinationId]);

  // Handle single vaccination selection
  const handleSingleVaccinationSelect = async (vaccinationId) => {
    if (!vaccinationId) return;
    
    try {
      const response = await getVaccinationById(vaccinationId);
      if (response.success) {
        const vaccination = response.data;
        setSingleCompletionData(prev => ({
          ...prev,
          vaccinationId,
          actualLocation: vaccination.location || prev.actualLocation,
          batchNumber: vaccination.batchNumber || prev.batchNumber,
          manufacturer: vaccination.manufacturer || prev.manufacturer,
          expiryDate: vaccination.expiryDate ? 
            new Date(vaccination.expiryDate).toISOString().split('T')[0] : prev.expiryDate
        }));
      }
    } catch (err) {
      console.error('Error fetching vaccination details:', err);
    }
  };

  // Handle batch selection toggle
  const handleBatchSelectionToggle = (vaccination) => {
    const isSelected = selectedVaccinations.find(v => v._id === vaccination._id);
    
    if (isSelected) {
      setSelectedVaccinations(prev => prev.filter(v => v._id !== vaccination._id));
    } else {
      setSelectedVaccinations(prev => [...prev, vaccination]);
    }
  };

  // Validate single completion form
  const validateSingleCompletion = () => {
    const newErrors = {};

    if (!singleCompletionData.vaccinationId) {
      newErrors.vaccinationId = 'Please select a vaccination to complete';
    }

    if (!singleCompletionData.completedDate) {
      newErrors.completedDate = 'Completion date is required';
    } else {
      const completedDate = new Date(singleCompletionData.completedDate);
      const today = new Date();
      
      if (completedDate > today) {
        newErrors.completedDate = 'Completion date cannot be in the future';
      }
    }

    if (!singleCompletionData.completedTime) {
      newErrors.completedTime = 'Completion time is required';
    }

    if (singleCompletionData.expiryDate) {
      const expiryDate = new Date(singleCompletionData.expiryDate);
      const completedDate = new Date(singleCompletionData.completedDate);
      
      if (expiryDate <= completedDate) {
        newErrors.expiryDate = 'Vaccine should not be expired when administered';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate batch completion form
  const validateBatchCompletion = () => {
    const newErrors = {};

    if (selectedVaccinations.length === 0) {
      newErrors.selectedVaccinations = 'Please select at least one vaccination to complete';
    }

    if (!batchCompletionData.completedDate) {
      newErrors.completedDate = 'Completion date is required';
    } else {
      const completedDate = new Date(batchCompletionData.completedDate);
      const today = new Date();
      
      if (completedDate > today) {
        newErrors.completedDate = 'Completion date cannot be in the future';
      }
    }

    if (!batchCompletionData.completedTime) {
      newErrors.completedTime = 'Completion time is required';
    }

    if (batchCompletionData.expiryDate) {
      const expiryDate = new Date(batchCompletionData.expiryDate);
      const completedDate = new Date(batchCompletionData.completedDate);
      
      if (expiryDate <= completedDate) {
        newErrors.expiryDate = 'Vaccine should not be expired when administered';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle single completion submission
  const handleSingleCompletion = async (e) => {
    e.preventDefault();
    
    if (!validateSingleCompletion()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const completedDateTime = new Date(
        `${singleCompletionData.completedDate}T${singleCompletionData.completedTime}`
      ).toISOString();

      const administeredData = {
        completedDate: completedDateTime,
        actualLocation: singleCompletionData.actualLocation,
        batchNumber: singleCompletionData.batchNumber,
        manufacturer: singleCompletionData.manufacturer,
        expiryDate: singleCompletionData.expiryDate ? 
          new Date(singleCompletionData.expiryDate).toISOString() : undefined,
        sideEffects: singleCompletionData.sideEffects,
        notes: singleCompletionData.notes,
        nextDueDate: singleCompletionData.nextDueDate ? 
          new Date(singleCompletionData.nextDueDate).toISOString() : undefined,
        verificationPhoto: singleCompletionData.verificationPhoto
      };

      const response = await markVaccinationComplete(singleCompletionData.vaccinationId, administeredData);
      
      if (response.success) {
        navigate('/app/vaccinations', {
          replace: true,
          state: { 
            message: 'Vaccination marked as completed successfully!', 
            type: 'success' 
          }
        });
      } else {
        setErrors({ 
          submit: response.error || 'Failed to complete vaccination. Please try again.' 
        });
      }
    } catch (err) {
      console.error('Error completing vaccination:', err);
      setErrors({ 
        submit: 'An unexpected error occurred. Please check your connection and try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle batch completion submission
  const handleBatchCompletion = async () => {
    if (!validateBatchCompletion()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const completedDateTime = new Date(
        `${batchCompletionData.completedDate}T${batchCompletionData.completedTime}`
      ).toISOString();

      const batchPromises = selectedVaccinations.map(vaccination => {
        const administeredData = {
          completedDate: completedDateTime,
          actualLocation: batchCompletionData.actualLocation,
          batchNumber: batchCompletionData.batchNumber,
          manufacturer: batchCompletionData.manufacturer,
          expiryDate: batchCompletionData.expiryDate ? 
            new Date(batchCompletionData.expiryDate).toISOString() : undefined,
          notes: batchCompletionData.generalNotes
        };

        return markVaccinationComplete(vaccination._id, administeredData);
      });

      const responses = await Promise.all(batchPromises);
      const failedCount = responses.filter(r => !r.success).length;
      const successCount = responses.filter(r => r.success).length;

      if (failedCount === 0) {
        navigate('/app/vaccinations', {
          replace: true,
          state: { 
            message: `${successCount} vaccinations marked as completed successfully!`, 
            type: 'success' 
          }
        });
      } else {
        setErrors({ 
          submit: `${successCount} vaccinations completed, but ${failedCount} failed. Please check and retry failed ones.` 
        });
      }
    } catch (err) {
      console.error('Error completing batch vaccinations:', err);
      setErrors({ 
        submit: 'An unexpected error occurred during batch completion. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload for verification photos
  const handleFileUpload = (file, isBatch = false) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      if (isBatch) {
        setBatchCompletionData(prev => ({
          ...prev,
          verificationPhotos: [...prev.verificationPhotos, e.target.result]
        }));
      } else {
        setSingleCompletionData(prev => ({
          ...prev,
          verificationPhoto: e.target.result
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Table columns for scheduled vaccinations
  const vaccinationColumns = [
    {
      key: 'selection',
      header: completionMode === 'batch' ? 'Select' : '',
      render: (vaccination) => (
        completionMode === 'batch' ? (
          <input
            type="checkbox"
            checked={selectedVaccinations.find(v => v._id === vaccination._id) ? true : false}
            onChange={() => handleBatchSelectionToggle(vaccination)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        ) : null
      )
    },
    {
      key: 'patient',
      header: 'Patient',
      render: (vaccination) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <FiUser className="text-blue-600" size={14} />
          </div>
          <div>
            <div className="font-medium text-gray-900">{vaccination.patient?.name}</div>
            <div className="text-sm text-gray-500">{vaccination.patient?.contactNumber}</div>
          </div>
        </div>
      )
    },
    {
      key: 'vaccine',
      header: 'Vaccine Details',
      render: (vaccination) => (
        <div>
          <div className="font-medium text-gray-900">{vaccination.vaccineType}</div>
          <div className="text-sm text-gray-500">
            Dose {vaccination.doseNumber}/{vaccination.totalDoses}
          </div>
        </div>
      )
    },
    {
      key: 'scheduledDate',
      header: 'Scheduled Date',
      render: (vaccination) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">
            {new Date(vaccination.scheduledDate).toLocaleDateString()}
          </div>
          <div className="text-gray-500">
            {new Date(vaccination.scheduledDate).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>
      )
    },
    {
      key: 'location',
      header: 'Location',
      render: (vaccination) => vaccination.location || 'Not specified'
    },
    {
      key: 'status',
      header: 'Status',
      render: (vaccination) => {
        const isOverdue = new Date(vaccination.scheduledDate) < new Date();
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isOverdue
              ? 'bg-red-100 text-red-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {isOverdue ? 'Overdue' : 'Scheduled'}
          </span>
        );
      }
    }
  ];

  if (!assignedVillages.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <FiArrowLeft className="text-red-600" size={24} />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No Assigned Villages</h3>
          <p className="mt-2 text-sm text-gray-500 max-w-md">
            You need to be assigned to villages before you can mark vaccinations as completed.
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
                  onClick={() => navigate('/app/vaccinations')}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <FiArrowLeft size={20} />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Complete Vaccinations</h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Mark scheduled vaccinations as completed
                  </p>
                </div>
              </div>

              {/* Completion Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setCompletionMode('single')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    completionMode === 'single'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Single Completion
                </button>
                <button
                  onClick={() => setCompletionMode('batch')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    completionMode === 'batch'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Batch Completion
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
                <FiAlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{errors.submit}</p>
              </div>
            </div>
          </div>
        )}

        {/* Scheduled Vaccinations Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Scheduled Vaccinations</h3>
            <p className="mt-1 text-sm text-gray-500">
              Vaccinations scheduled for the past week (ready for completion)
            </p>
          </div>
          
          <AdminTable
            columns={vaccinationColumns}
            data={scheduledVaccinations}
            loading={loadingVaccinations}
            emptyMessage="No scheduled vaccinations found for completion"
          />
        </div>

        {/* Completion Form */}
        {completionMode === 'single' ? (
          /* Single Completion Form */
          <form onSubmit={handleSingleCompletion} className="space-y-8">
            {/* Vaccination Selection */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Select Vaccination</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Choose the vaccination to mark as completed
                </p>
              </div>
              
              <div className="p-6">
                <FormField
                  label="Vaccination"
                  type="select"
                  name="vaccinationId"
                  value={singleCompletionData.vaccinationId}
                  onChange={handleSingleVaccinationSelect}
                  error={errors.vaccinationId}
                  required
                  options={[
                    { value: '', label: 'Select vaccination to complete' },
                    ...scheduledVaccinations.map(v => ({
                      value: v._id,
                      label: `${v.patient?.name} - ${v.vaccineType} (Dose ${v.doseNumber}/${v.totalDoses})`
                    }))
                  ]}
                />
              </div>
            </div>

            {/* Completion Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Completion Details</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Record vaccination completion information
                </p>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    label="Completion Date"
                    type="date"
                    name="completedDate"
                    value={singleCompletionData.completedDate}
                    onChange={(value) => setSingleCompletionData(prev => ({ ...prev, completedDate: value }))}
                    error={errors.completedDate}
                    required
                    max={new Date().toISOString().split('T')[0]}
                    icon={FiCalendar}
                  />

                  <FormField
                    label="Completion Time"
                    type="time"
                    name="completedTime"
                    value={singleCompletionData.completedTime}
                    onChange={(value) => setSingleCompletionData(prev => ({ ...prev, completedTime: value }))}
                    error={errors.completedTime}
                    required
                    icon={FiClock}
                  />

                  <FormField
                    label="Actual Location"
                    type="text"
                    name="actualLocation"
                    value={singleCompletionData.actualLocation}
                    onChange={(value) => setSingleCompletionData(prev => ({ ...prev, actualLocation: value }))}
                    error={errors.actualLocation}
                    placeholder="Where was the vaccination given?"
                    icon={FiMapPin}
                  />

                  <FormField
                    label="Next Due Date (Optional)"
                    type="date"
                    name="nextDueDate"
                    value={singleCompletionData.nextDueDate}
                    onChange={(value) => setSingleCompletionData(prev => ({ ...prev, nextDueDate: value }))}
                    error={errors.nextDueDate}
                    min={new Date().toISOString().split('T')[0]}
                    helperText="For multi-dose vaccines"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    label="Batch Number"
                    type="text"
                    name="batchNumber"
                    value={singleCompletionData.batchNumber}
                    onChange={(value) => setSingleCompletionData(prev => ({ ...prev, batchNumber: value }))}
                    error={errors.batchNumber}
                    placeholder="e.g., VB2024001"
                  />

                  <FormField
                    label="Manufacturer"
                    type="text"
                    name="manufacturer"
                    value={singleCompletionData.manufacturer}
                    onChange={(value) => setSingleCompletionData(prev => ({ ...prev, manufacturer: value }))}
                    error={errors.manufacturer}
                    placeholder="e.g., Serum Institute"
                  />

                  <FormField
                    label="Expiry Date"
                    type="date"
                    name="expiryDate"
                    value={singleCompletionData.expiryDate}
                    onChange={(value) => setSingleCompletionData(prev => ({ ...prev, expiryDate: value }))}
                    error={errors.expiryDate}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <FormField
                  label="Side Effects (if any)"
                  type="textarea"
                  name="sideEffects"
                  value={singleCompletionData.sideEffects}
                  onChange={(value) => setSingleCompletionData(prev => ({ ...prev, sideEffects: value }))}
                  error={errors.sideEffects}
                  placeholder="Record any observed side effects..."
                  rows={3}
                />

                <FormField
                  label="Notes"
                  type="textarea"
                  name="notes"
                  value={singleCompletionData.notes}
                  onChange={(value) => setSingleCompletionData(prev => ({ ...prev, notes: value }))}
                  error={errors.notes}
                  placeholder="Additional notes about the vaccination..."
                  rows={3}
                />

                {/* Verification Photo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Photo (Optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <FiCamera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <div className="text-sm text-gray-600 mb-4">
                      Upload a photo as verification of vaccination completion
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e.target.files[0], false)}
                      className="hidden"
                      id="verification-photo"
                    />
                    <label
                      htmlFor="verification-photo"
                      className="cursor-pointer bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      <FiUpload className="inline mr-2" size={16} />
                      Choose Photo
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/app/vaccinations')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={loading || !singleCompletionData.vaccinationId}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <FiCheckCircle size={16} />
                <span>{loading ? 'Completing...' : 'Mark as Completed'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* Batch Completion Form */
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Batch Completion ({selectedVaccinations.length} selected)
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Complete multiple vaccinations with common details
                </p>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    label="Completion Date"
                    type="date"
                    name="completedDate"
                    value={batchCompletionData.completedDate}
                    onChange={(value) => setBatchCompletionData(prev => ({ ...prev, completedDate: value }))}
                    error={errors.completedDate}
                    required
                    max={new Date().toISOString().split('T')[0]}
                    icon={FiCalendar}
                  />

                  <FormField
                    label="Completion Time"
                    type="time"
                    name="completedTime"
                    value={batchCompletionData.completedTime}
                    onChange={(value) => setBatchCompletionData(prev => ({ ...prev, completedTime: value }))}
                    error={errors.completedTime}
                    required
                    icon={FiClock}
                  />

                  <FormField
                    label="Actual Location"
                    type="text"
                    name="actualLocation"
                    value={batchCompletionData.actualLocation}
                    onChange={(value) => setBatchCompletionData(prev => ({ ...prev, actualLocation: value }))}
                    error={errors.actualLocation}
                    placeholder="Where were the vaccinations given?"
                    icon={FiMapPin}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    label="Common Batch Number"
                    type="text"
                    name="batchNumber"
                    value={batchCompletionData.batchNumber}
                    onChange={(value) => setBatchCompletionData(prev => ({ ...prev, batchNumber: value }))}
                    error={errors.batchNumber}
                    placeholder="e.g., VB2024001"
                  />

                  <FormField
                    label="Common Manufacturer"
                    type="text"
                    name="manufacturer"
                    value={batchCompletionData.manufacturer}
                    onChange={(value) => setBatchCompletionData(prev => ({ ...prev, manufacturer: value }))}
                    error={errors.manufacturer}
                    placeholder="e.g., Serum Institute"
                  />

                  <FormField
                    label="Common Expiry Date"
                    type="date"
                    name="expiryDate"
                    value={batchCompletionData.expiryDate}
                    onChange={(value) => setBatchCompletionData(prev => ({ ...prev, expiryDate: value }))}
                    error={errors.expiryDate}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <FormField
                  label="General Notes"
                  type="textarea"
                  name="generalNotes"
                  value={batchCompletionData.generalNotes}
                  onChange={(value) => setBatchCompletionData(prev => ({ ...prev, generalNotes: value }))}
                  error={errors.generalNotes}
                  placeholder="Common notes for all vaccinations..."
                  rows={3}
                />

                {/* Batch Actions */}
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => navigate('/app/vaccinations')}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleBatchCompletion}
                    disabled={loading || selectedVaccinations.length === 0}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    <FiCheckCircle size={16} />
                    <span>{loading ? 'Completing...' : `Complete ${selectedVaccinations.length} Vaccinations`}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Guidelines */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-yellow-900 mb-2">Completion Guidelines</h4>
          <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
            <li>Only mark vaccinations as completed after they have been actually administered</li>
            <li>Record accurate date and time of vaccination administration</li>
            <li>Document any side effects or adverse reactions observed</li>
            <li>Ensure proper vaccine batch tracking for safety and accountability</li>
            <li>Use batch completion for vaccinations given at the same time and location</li>
            <li>Keep verification photos when possible for record keeping</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default VaccinationComplete;