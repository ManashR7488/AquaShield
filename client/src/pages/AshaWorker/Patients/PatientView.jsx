import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  FiArrowLeft, 
  FiEdit, 
  FiTrash2, 
  FiCalendar,
  FiMapPin,
  FiUser,
  FiPhone,
  FiHeart,
  FiShield,
  FiFileText,
  FiActivity,
  FiUsers,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiClock,
  FiPlus
} from "react-icons/fi";
import ConfirmDialog from "../../../components/Admin/ConfirmDialog";
import {
  getPatientById,
  deletePatient
} from "../../../services/patientService";
import useAuthStore from "../../../store/useAuthStore";
import { canManagePatient } from "../../../utils/ashaWorkerGuard.jsx";

/**
 * PatientView Component
 * Detailed view of a specific patient record
 */
const PatientView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Component state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [patient, setPatient] = useState(null);
  
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: 'delete',
    title: '',
    message: '',
    onConfirm: null
  });

  // Check if user is ASHA worker
  useEffect(() => {
    if (user && user.roleInfo?.role !== 'asha_worker') {
      navigate('/app');
    }
  }, [user, navigate]);

  // Fetch patient details
  useEffect(() => {
    const fetchPatient = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await getPatientById(id);
        
        if (response.success) {
          setPatient(response.data);
          
          // Check if user can access this patient
          if (!canManagePatient(response.data.villageId)) {
            setError('You do not have permission to view this patient record');
          }
        } else {
          setError(response.error || 'Failed to fetch patient details');
        }
      } catch (err) {
        console.error('Error fetching patient:', err);
        setError('An unexpected error occurred while fetching the patient details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPatient();
    }
  }, [id]);

  // Handle patient deletion
  const handleDeletePatient = async () => {
    try {
      const response = await deletePatient(id);
      if (response.success) {
        navigate('/app/patients', {
          replace: true,
          state: { 
            message: 'Patient record deleted successfully!', 
            type: 'success' 
          }
        });
      } else {
        setError(response.error || 'Failed to delete patient');
      }
    } catch (err) {
      console.error('Error deleting patient:', err);
      setError('An error occurred while deleting the patient');
    } finally {
      setConfirmDialog({ ...confirmDialog, isOpen: false });
    }
  };

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'Unknown';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return `${age} years`;
  };

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get vaccination status badge
  const getVaccinationStatusBadge = (status) => {
    const statusConfig = {
      'up_to_date': { label: 'Up to Date', className: 'bg-green-100 text-green-800', icon: FiCheckCircle },
      'pending': { label: 'Pending', className: 'bg-yellow-100 text-yellow-800', icon: FiClock },
      'overdue': { label: 'Overdue', className: 'bg-red-100 text-red-800', icon: FiAlertCircle },
      'partial': { label: 'Partial', className: 'bg-orange-100 text-orange-800', icon: FiActivity },
      'unknown': { label: 'Unknown', className: 'bg-gray-100 text-gray-800', icon: FiXCircle }
    };
    
    const config = statusConfig[status] || statusConfig.unknown;
    const IconComponent = config.icon;
    
    return (
      <div className="flex items-center space-x-2">
        <span className={`px-3 py-1 text-sm font-medium rounded-full ${config.className} flex items-center space-x-1`}>
          <IconComponent size={14} />
          <span>{config.label}</span>
        </span>
      </div>
    );
  };

  // Get patient category
  const getPatientCategory = () => {
    if (!patient) return 'Unknown';
    
    const age = calculateAge(patient.dateOfBirth);
    const ageNumber = parseInt(age);
    
    if (patient.isPregnant) return 'Pregnant Woman';
    if (ageNumber < 18) return 'Child/Adolescent';
    if (ageNumber >= 60) return 'Senior Citizen';
    return 'Adult';
  };

  // Calculate BMI
  const calculateBMI = () => {
    if (!patient?.height || !patient?.weight) return null;
    const heightInMeters = patient.height / 100;
    const bmi = patient.weight / (heightInMeters * heightInMeters);
    return bmi.toFixed(1);
  };

  // Get BMI category
  const getBMICategory = (bmi) => {
    if (!bmi) return null;
    const bmiValue = parseFloat(bmi);
    
    if (bmiValue < 18.5) return { label: 'Underweight', color: 'text-yellow-700 bg-yellow-100' };
    if (bmiValue >= 18.5 && bmiValue < 25) return { label: 'Normal', color: 'text-green-700 bg-green-100' };
    if (bmiValue >= 25 && bmiValue < 30) return { label: 'Overweight', color: 'text-orange-700 bg-orange-100' };
    return { label: 'Obese', color: 'text-red-700 bg-red-100' };
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading patient details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !patient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <FiXCircle className="text-red-600" size={24} />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Error Loading Patient</h3>
          <p className="mt-2 text-sm text-gray-500 max-w-md">
            {error || 'The requested patient record could not be found.'}
          </p>
          <button
            onClick={() => navigate('/app/patients')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Patients
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
                  onClick={() => navigate('/app/patients')}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <FiArrowLeft size={20} />
                </button>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <FiUser className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
                    <p className="mt-1 text-sm text-gray-500">
                      {patient.gender?.charAt(0).toUpperCase() + patient.gender?.slice(1)} • {calculateAge(patient.dateOfBirth)} • {getPatientCategory()}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigate('/app/patients/new')}
                  className="flex items-center space-x-2 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
                >
                  <FiEdit size={16} />
                  <span>Add New Patient</span>
                </button>
                
                <button
                  onClick={() => navigate('/app/patients')}
                  className="flex items-center space-x-2 px-4 py-2 text-green-600 border border-green-600 rounded-lg hover:bg-green-50"
                >
                  <FiFileText size={16} />
                  <span>All Patients</span>
                </button>
                
                <button
                  onClick={() => setConfirmDialog({
                    isOpen: true,
                    type: 'delete',
                    title: 'Delete Patient Record',
                    message: 'Are you sure you want to delete this patient record? This action cannot be undone and will remove all associated health data, vaccination records, and visit history.',
                    onConfirm: handleDeletePatient
                  })}
                  className="flex items-center space-x-2 px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50"
                >
                  <FiTrash2 size={16} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start space-x-3">
                    <FiCalendar className="text-gray-400 mt-1" size={16} />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                      <p className="text-base text-gray-900">{formatDate(patient.dateOfBirth)}</p>
                      <p className="text-sm text-gray-500">Age: {calculateAge(patient.dateOfBirth)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <FiPhone className="text-gray-400 mt-1" size={16} />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Contact Number</p>
                      <p className="text-base text-gray-900">{patient.contactNumber || 'Not provided'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <FiMapPin className="text-gray-400 mt-1" size={16} />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Village</p>
                      <p className="text-base text-gray-900">{patient.village?.name || 'Unknown Village'}</p>
                      {patient.village?.block && (
                        <p className="text-sm text-gray-500">{patient.village.block}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <FiFileText className="text-gray-400 mt-1" size={16} />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Aadhar Number</p>
                      <p className="text-base text-gray-900">{patient.aadharNumber || 'Not provided'}</p>
                    </div>
                  </div>

                  {patient.email && (
                    <div className="md:col-span-2">
                      <div className="flex items-start space-x-3">
                        <FiFileText className="text-gray-400 mt-1" size={16} />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Email Address</p>
                          <p className="text-base text-gray-900">{patient.email}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Address Information */}
            {patient.address && Object.values(patient.address).some(val => val) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Address Information</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {patient.address.houseNumber && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">House Number/Name</p>
                        <p className="text-gray-900">{patient.address.houseNumber}</p>
                      </div>
                    )}
                    
                    {patient.address.area && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Area/Locality</p>
                        <p className="text-gray-900">{patient.address.area}</p>
                      </div>
                    )}
                    
                    {patient.address.landmark && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Landmark</p>
                        <p className="text-gray-900">{patient.address.landmark}</p>
                      </div>
                    )}
                    
                    {patient.address.pincode && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">PIN Code</p>
                        <p className="text-gray-900">{patient.address.pincode}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Health Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Health Information</h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {patient.bloodGroup && (
                    <div className="flex items-start space-x-3">
                      <FiHeart className="text-gray-400 mt-1" size={16} />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Blood Group</p>
                        <p className="text-base text-gray-900">{patient.bloodGroup}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start space-x-3">
                    <FiShield className="text-gray-400 mt-1" size={16} />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Vaccination Status</p>
                      {getVaccinationStatusBadge(patient.vaccinationStatus)}
                    </div>
                  </div>
                </div>

                {(patient.height || patient.weight) && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {patient.height && (
                      <div className="flex items-start space-x-3">
                        <FiActivity className="text-gray-400 mt-1" size={16} />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Height</p>
                          <p className="text-base text-gray-900">{patient.height} cm</p>
                        </div>
                      </div>
                    )}
                    
                    {patient.weight && (
                      <div className="flex items-start space-x-3">
                        <FiActivity className="text-gray-400 mt-1" size={16} />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Weight</p>
                          <p className="text-base text-gray-900">{patient.weight} kg</p>
                        </div>
                      </div>
                    )}

                    {calculateBMI() && (
                      <div className="flex items-start space-x-3">
                        <FiActivity className="text-gray-400 mt-1" size={16} />
                        <div>
                          <p className="text-sm font-medium text-gray-500">BMI</p>
                          <div className="flex items-center space-x-2">
                            <p className="text-base text-gray-900">{calculateBMI()}</p>
                            {getBMICategory(calculateBMI()) && (
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getBMICategory(calculateBMI()).color}`}>
                                {getBMICategory(calculateBMI()).label}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Special Conditions */}
                {(patient.isPregnant || patient.hasDisability) && (
                  <div className="space-y-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900">Special Conditions</h4>
                    
                    {patient.isPregnant && (
                      <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                          <FiHeart className="text-pink-600" size={16} />
                          <span className="text-sm font-medium text-pink-900">Pregnant</span>
                        </div>
                        {patient.expectedDueDate && (
                          <p className="text-sm text-pink-700 mt-1">
                            Expected Due Date: {formatDate(patient.expectedDueDate)}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {patient.hasDisability && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                          <FiUsers className="text-blue-600" size={16} />
                          <span className="text-sm font-medium text-blue-900">Has Disability/Special Needs</span>
                        </div>
                        {patient.disabilityDetails && (
                          <p className="text-sm text-blue-700 mt-1">{patient.disabilityDetails}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Medical History */}
                {(patient.medicalHistory || patient.currentMedications) && (
                  <div className="space-y-4 pt-4 border-t border-gray-200">
                    {patient.medicalHistory && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-2">Known Medical Conditions</p>
                        <p className="text-gray-900 leading-relaxed">{patient.medicalHistory}</p>
                      </div>
                    )}
                    
                    {patient.currentMedications && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-2">Current Medications</p>
                        <p className="text-gray-900 leading-relaxed">{patient.currentMedications}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Emergency Contact */}
            {patient.emergencyContact && Object.values(patient.emergencyContact).some(val => val) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Emergency Contact</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {patient.emergencyContact.name && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Contact Name</p>
                        <p className="text-gray-900">{patient.emergencyContact.name}</p>
                      </div>
                    )}
                    
                    {patient.emergencyContact.relationship && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Relationship</p>
                        <p className="text-gray-900 capitalize">
                          {patient.emergencyContact.relationship.replace('_', ' ')}
                        </p>
                      </div>
                    )}
                    
                    {patient.emergencyContact.contactNumber && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Contact Number</p>
                        <p className="text-gray-900">{patient.emergencyContact.contactNumber}</p>
                      </div>
                    )}
                    
                    {patient.emergencyContact.alternativeContact && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Alternative Contact</p>
                        <p className="text-gray-900">{patient.emergencyContact.alternativeContact}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {patient.notes && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Notes & Observations</h3>
                </div>
                <div className="p-6">
                  <p className="text-gray-900 leading-relaxed">{patient.notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
              </div>
              <div className="p-6 space-y-3">
                <button 
                  onClick={() => navigate(`/app/vaccinations/schedule?patientId=${id}`)}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 rounded-lg border border-gray-200"
                >
                  <FiShield className="text-gray-400" size={16} />
                  <span className="text-gray-700">Schedule Vaccination</span>
                </button>
                
                <button 
                  onClick={() => navigate(`/app/village-reports/new?patientId=${id}`)}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 rounded-lg border border-gray-200"
                >
                  <FiFileText className="text-gray-400" size={16} />
                  <span className="text-gray-700">Create Health Report</span>
                </button>
                
                <button 
                  onClick={() => navigate(`/app/patients/${id}/visit`)}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 rounded-lg border border-gray-200"
                >
                  <FiPlus className="text-gray-400" size={16} />
                  <span className="text-gray-700">Record Visit</span>
                </button>
              </div>
            </div>

            {/* Patient Metadata */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Record Information</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Added By</p>
                  <p className="text-gray-900">{patient.createdBy?.name || 'Unknown'}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Record Created</p>
                  <p className="text-gray-900">{formatDate(patient.createdAt)}</p>
                </div>
                
                {patient.updatedAt && patient.updatedAt !== patient.createdAt && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Last Updated</p>
                    <p className="text-gray-900">{formatDate(patient.updatedAt)}</p>
                  </div>
                )}
                
                {patient.lastVisitDate && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Last Visit</p>
                    <p className="text-gray-900">{formatDate(patient.lastVisitDate)}</p>
                    {patient.lastVisitType && (
                      <p className="text-sm text-gray-500">{patient.lastVisitType}</p>
                    )}
                  </div>
                )}
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Patient ID</p>
                  <p className="text-gray-900 font-mono text-xs">{patient._id}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
      />
    </div>
  );
};

export default PatientView;