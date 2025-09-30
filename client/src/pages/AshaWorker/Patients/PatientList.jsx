import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FiPlus, 
  FiSearch, 
  FiFilter, 
  FiUser,
  FiCalendar,
  FiPhone,
  FiMapPin,
  FiUsers,
  FiActivity,
  FiAlertCircle,
  FiCheckCircle
} from "react-icons/fi";
import AdminTable from "../../../components/Admin/AdminTable";
import ConfirmDialog from "../../../components/Admin/ConfirmDialog";
import {
  getAllPatients,
  deletePatient,
  getPatientStats
} from "../../../services/patientService";
import useAuthStore from "../../../store/useAuthStore";
import { getAshaWorkerVillages } from "../../../utils/ashaWorkerGuard.jsx";

/**
 * PatientList Component
 * Main listing page for patients managed by ASHA workers
 */
const PatientList = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Get ASHA worker's assigned villages
  const assignedVillages = getAshaWorkerVillages();
  
  // Component state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [stats, setStats] = useState({});
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGender, setSelectedGender] = useState("all");
  const [selectedAgeGroup, setSelectedAgeGroup] = useState("all");
  const [selectedVillage, setSelectedVillage] = useState("all");
  const [selectedVaccinationStatus, setSelectedVaccinationStatus] = useState("all");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: 'delete',
    title: '',
    message: '',
    onConfirm: null,
    patientId: null
  });

  // Check if user is ASHA worker
  useEffect(() => {
    if (user && user.roleInfo?.role !== 'asha_worker') {
      navigate('/app');
    }
  }, [user, navigate]);

  // Fetch patients and statistics
  useEffect(() => {
    const fetchPatientsAndStats = async () => {
      if (assignedVillages.length === 0) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch patients for all assigned villages
        const patientsPromises = assignedVillages.map(village => 
          getAllPatients(village._id, {
            page: currentPage,
            limit: itemsPerPage,
            search: searchTerm,
            gender: selectedGender !== 'all' ? selectedGender : '',
            ageGroup: selectedAgeGroup !== 'all' ? selectedAgeGroup : '',
            vaccinationStatus: selectedVaccinationStatus !== 'all' ? selectedVaccinationStatus : '',
            sortBy: 'createdAt',
            sortOrder: 'desc'
          })
        );
        
        const patientsResponses = await Promise.all(patientsPromises);
        const allPatients = patientsResponses.reduce((acc, response) => {
          if (response.success) {
            return [...acc, ...response.data];
          }
          return acc;
        }, []);
        
        setPatients(allPatients);
        setFilteredPatients(allPatients);
        
        // Calculate combined stats
        const combinedStats = patientsResponses.reduce((acc, response) => {
          if (response.success && response.stats) {
            acc.total = (acc.total || 0) + (response.stats.total || 0);
            acc.children = (acc.children || 0) + (response.stats.children || 0);
            acc.adults = (acc.adults || 0) + (response.stats.adults || 0);
            acc.pregnant = (acc.pregnant || 0) + (response.stats.pregnant || 0);
            acc.pendingVaccinations = (acc.pendingVaccinations || 0) + (response.stats.pendingVaccinations || 0);
          }
          return acc;
        }, {});
        
        setStats(combinedStats);
        
      } catch (err) {
        console.error('Error fetching patients:', err);
        setError('An unexpected error occurred while fetching patients');
      } finally {
        setLoading(false);
      }
    };

    fetchPatientsAndStats();
  }, [assignedVillages, currentPage, itemsPerPage, searchTerm, selectedGender, selectedAgeGroup, selectedVaccinationStatus]);

  // Filter patients based on search and filters
  useEffect(() => {
    let filtered = patients;

    if (searchTerm) {
      filtered = filtered.filter(patient =>
        patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.contactNumber?.includes(searchTerm) ||
        patient.aadharNumber?.includes(searchTerm) ||
        patient.village?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedVillage !== 'all') {
      filtered = filtered.filter(patient => patient.villageId === selectedVillage);
    }

    setFilteredPatients(filtered);
  }, [patients, searchTerm, selectedVillage]);

  // Handle patient deletion
  const handleDeletePatient = async (patientId) => {
    try {
      const response = await deletePatient(patientId);
      if (response.success) {
        setPatients(prev => prev.filter(patient => patient._id !== patientId));
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      } else {
        setError(response.error || 'Failed to delete patient');
      }
    } catch (err) {
      console.error('Error deleting patient:', err);
      setError('An error occurred while deleting the patient');
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
    
    return age;
  };

  // Get vaccination status badge
  const getVaccinationStatusBadge = (status) => {
    const statusConfig = {
      'up_to_date': { label: 'Up to Date', className: 'bg-green-100 text-green-800' },
      'pending': { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
      'overdue': { label: 'Overdue', className: 'bg-red-100 text-red-800' },
      'partial': { label: 'Partial', className: 'bg-orange-100 text-orange-800' },
      'unknown': { label: 'Unknown', className: 'bg-gray-100 text-gray-800' }
    };
    
    const config = statusConfig[status] || statusConfig.unknown;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  // Table columns configuration
  const columns = [
    {
      key: "name",
      label: "Patient",
      sortable: true,
      render: (patient) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <FiUser className="text-blue-600" size={14} />
          </div>
          <div>
            <div className="font-medium text-gray-900">{patient.name || 'Unknown'}</div>
            <div className="text-sm text-gray-500">
              {patient.gender || 'Unknown'} • {calculateAge(patient.dateOfBirth)} years
            </div>
          </div>
        </div>
      )
    },
    {
      key: "contact",
      label: "Contact Information",
      render: (patient) => (
        <div>
          <div className="font-medium text-gray-900">
            {patient.contactNumber || 'No contact'}
          </div>
          <div className="text-sm text-gray-500">
            {patient.aadharNumber || 'No Aadhar'}
          </div>
        </div>
      )
    },
    {
      key: "village",
      label: "Village",
      render: (patient) => (
        <div>
          <div className="font-medium text-gray-900">
            {patient.village?.name || 'Unknown Village'}
          </div>
          <div className="text-sm text-gray-500">
            {patient.address?.area || 'Unknown Area'}
          </div>
        </div>
      )
    },
    {
      key: "category",
      label: "Category",
      render: (patient) => {
        const age = calculateAge(patient.dateOfBirth);
        let category = 'Adult';
        let categoryClass = 'bg-blue-100 text-blue-800';
        
        if (age < 18) {
          category = 'Child';
          categoryClass = 'bg-green-100 text-green-800';
        } else if (patient.isPregnant) {
          category = 'Pregnant';
          categoryClass = 'bg-pink-100 text-pink-800';
        } else if (age >= 60) {
          category = 'Senior';
          categoryClass = 'bg-purple-100 text-purple-800';
        }
        
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${categoryClass}`}>
            {category}
          </span>
        );
      }
    },
    {
      key: "vaccinationStatus",
      label: "Vaccination Status",
      render: (patient) => getVaccinationStatusBadge(patient.vaccinationStatus || 'unknown')
    },
    {
      key: "lastVisit",
      label: "Last Visit",
      sortable: true,
      render: (patient) => {
        if (!patient.lastVisitDate) {
          return <span className="text-gray-500 text-sm">Never visited</span>;
        }
        return (
          <div>
            <div className="font-medium text-gray-900">
              {new Date(patient.lastVisitDate).toLocaleDateString()}
            </div>
            <div className="text-sm text-gray-500">
              {patient.lastVisitType || 'Unknown visit'}
            </div>
          </div>
        );
      }
    },
    {
      key: "actions",
      label: "Actions",
      render: (patient) => (
        <div className="flex space-x-2">
          <button
            onClick={() => navigate(`/app/patients/${patient._id}`)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View
          </button>
          <button
            onClick={() => navigate(`/app/patients/${patient._id}/edit`)}
            className="text-green-600 hover:text-green-800 text-sm font-medium"
          >
            Edit
          </button>
          <button
            onClick={() => navigate(`/app/patients/${patient._id}/history`)}
            className="text-purple-600 hover:text-purple-800 text-sm font-medium"
          >
            History
          </button>
          <button
            onClick={() => setConfirmDialog({
              isOpen: true,
              type: 'delete',
              title: 'Delete Patient Record',
              message: 'Are you sure you want to delete this patient record? This action cannot be undone and will remove all associated health data.',
              onConfirm: () => handleDeletePatient(patient._id),
              patientId: patient._id
            })}
            className="text-red-600 hover:text-red-800 text-sm font-medium"
          >
            Delete
          </button>
        </div>
      )
    }
  ];

  // Filter configuration
  const filters = [
    {
      key: "gender",
      label: "Gender",
      value: selectedGender,
      onChange: setSelectedGender,
      options: [
        { value: "all", label: "All Genders" },
        { value: "male", label: "Male" },
        { value: "female", label: "Female" },
        { value: "other", label: "Other" }
      ]
    },
    {
      key: "ageGroup",
      label: "Age Group",
      value: selectedAgeGroup,
      onChange: setSelectedAgeGroup,
      options: [
        { value: "all", label: "All Ages" },
        { value: "child", label: "Children (0-17)" },
        { value: "adult", label: "Adults (18-59)" },
        { value: "senior", label: "Seniors (60+)" }
      ]
    },
    {
      key: "vaccinationStatus",
      label: "Vaccination Status",
      value: selectedVaccinationStatus,
      onChange: setSelectedVaccinationStatus,
      options: [
        { value: "all", label: "All Statuses" },
        { value: "up_to_date", label: "Up to Date" },
        { value: "pending", label: "Pending" },
        { value: "overdue", label: "Overdue" },
        { value: "partial", label: "Partial" }
      ]
    }
  ];

  // if (!assignedVillages.length) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
  //       <div className="text-center">
  //         <FiUser className="mx-auto h-12 w-12 text-gray-400" />
  //         <h3 className="mt-2 text-sm font-medium text-gray-900">No Assigned Villages</h3>
  //         <p className="mt-1 text-sm text-gray-500">You need to be assigned to villages to manage patients.</p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Patient Management</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Manage patient records for your assigned villages
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => navigate('/app/patients/new')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <FiPlus size={16} />
                  <span>Add New Patient</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <FiUsers className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Patients</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <FiUser className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Children</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.children || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <FiActivity className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Adults</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.adults || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <FiCheckCircle className="h-8 w-8 text-pink-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Pregnant Women</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pregnant || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <FiAlertCircle className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Pending Vaccinations</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pendingVaccinations || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search patients by name, contact, Aadhar, or village..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                {filters.map(filter => (
                  <select
                    key={filter.key}
                    value={filter.value}
                    onChange={(e) => filter.onChange(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {filter.options.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ))}
                
                {assignedVillages.length > 1 && (
                  <select
                    value={selectedVillage}
                    onChange={(e) => setSelectedVillage(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Villages</option>
                    {assignedVillages.map(village => (
                      <option key={village._id} value={village._id}>
                        {village.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Patients Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-400">
              <div className="flex">
                <FiAlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <AdminTable
            data={filteredPatients}
            columns={columns}
            loading={loading}
            emptyState={{
              icon: FiUser,
              title: "No patients found",
              description: "Add your first patient to get started with health management."
            }}
          />
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

export default PatientList;