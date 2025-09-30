import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiUser,
  FiCalendar,
  FiPhone,
  FiMapPin,
  FiUserCheck,
  FiCheckCircle,
  FiArrowRight,
  FiSkipForward,
  FiSave
} from 'react-icons/fi';
import useAuthStore from '../../store/useAuthStore';
import FormField from '../../components/Auth/FormField';

const ProfileComplete = () => {
  const { user, updateProfile, isLoading } = useAuthStore();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    // Personal Info
    dateOfBirth: '',
    gender: '',
    
    // Address Details
    street: '',
    pincode: '',
    
    // Emergency Contact
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    
    // Professional Info (for health workers)
    qualification: '',
    experience: '',
    languages: []
  });
  
  const [completedSections, setCompletedSections] = useState({
    personal: false,
    address: false,
    emergency: false,
    professional: false
  });
  
  const [currentSection, setCurrentSection] = useState('personal');
  
  useEffect(() => {
    // Pre-fill form with existing user data
    if (user) {
      setFormData({
        dateOfBirth: user.personalInfo?.dateOfBirth?.split('T')[0] || '',
        gender: user.personalInfo?.gender || '',
        street: user.contactInfo?.address?.street || '',
        pincode: user.contactInfo?.address?.pincode || '',
        emergencyContactName: user.contactInfo?.emergencyContact?.name || '',
        emergencyContactPhone: user.contactInfo?.emergencyContact?.phone || '',
        emergencyContactRelationship: user.contactInfo?.emergencyContact?.relationship || '',
        qualification: user.professionalInfo?.qualification || '',
        experience: user.professionalInfo?.experience || '',
        languages: user.professionalInfo?.languages || []
      });
    }
  }, [user]);
  
  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' }
  ];
  
  const relationshipOptions = [
    { value: 'parent', label: 'Parent' },
    { value: 'spouse', label: 'Spouse' },
    { value: 'sibling', label: 'Sibling' },
    { value: 'child', label: 'Child' },
    { value: 'friend', label: 'Friend' },
    { value: 'relative', label: 'Other Relative' },
    { value: 'colleague', label: 'Colleague' },
    { value: 'neighbor', label: 'Neighbor' }
  ];
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const calculateCompletion = () => {
    const sections = {
      personal: formData.dateOfBirth && formData.gender,
      address: formData.street && formData.pincode,
      emergency: formData.emergencyContactName && formData.emergencyContactPhone && formData.emergencyContactRelationship,
      professional: user?.roleInfo?.role !== 'user' ? (formData.qualification && formData.experience) : true
    };
    
    const completed = Object.values(sections).filter(Boolean).length;
    const total = Object.keys(sections).length;
    
    return Math.round((completed / total) * 100);
  };
  
  const handleSaveSection = async (section) => {
    try {
      let updateData = {};
      
      switch (section) {
        case 'personal':
          updateData = {
            personalInfo: {
              dateOfBirth: formData.dateOfBirth,
              gender: formData.gender
            }
          };
          break;
        case 'address':
          updateData = {
            contactInfo: {
              address: {
                street: formData.street,
                pincode: formData.pincode
              }
            }
          };
          break;
        case 'emergency':
          updateData = {
            contactInfo: {
              emergencyContact: {
                name: formData.emergencyContactName,
                phone: formData.emergencyContactPhone,
                relationship: formData.emergencyContactRelationship
              }
            }
          };
          break;
        case 'professional':
          updateData = {
            professionalInfo: {
              qualification: formData.qualification,
              experience: parseInt(formData.experience) || 0,
              languages: formData.languages
            }
          };
          break;
      }
      
      await updateProfile(updateData);
      setCompletedSections(prev => ({ ...prev, [section]: true }));
    } catch (error) {
      console.error('Failed to save section:', error);
    }
  };
  
  const handleSkipToApp = () => {
    navigate('/app');
  };
  
  const handleCompleteProfile = async () => {
    // Save all sections
    await Promise.all([
      handleSaveSection('personal'),
      handleSaveSection('address'),
      handleSaveSection('emergency'),
      user?.roleInfo?.role !== 'user' && handleSaveSection('professional')
    ].filter(Boolean));
    
    navigate('/app');
  };
  
  const completionPercentage = calculateCompletion();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 lg:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiUser className="text-blue-600" size={24} />
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
              Complete Your Profile
            </h1>
            <p className="text-gray-600">
              Add more details to unlock all features and improve your experience
            </p>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Profile Completion</span>
              <span>{completionPercentage}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
          
          {/* Completion Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Personal Information */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <FiCalendar className="mr-2" size={16} />
                  Personal Details
                </h3>
                {completedSections.personal && <FiCheckCircle className="text-green-500" size={16} />}
              </div>
              
              <div className="space-y-3">
                <FormField
                  label="Date of Birth"
                  name="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  placeholder="Select your date of birth"
                />
                
                <FormField
                  label="Gender"
                  name="gender"
                  type="select"
                  value={formData.gender}
                  onChange={handleInputChange}
                  options={genderOptions}
                  placeholder="Select your gender"
                />
              </div>
              
              <button
                onClick={() => handleSaveSection('personal')}
                disabled={!formData.dateOfBirth || !formData.gender}
                className="mt-3 w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <FiSave className="mr-2" size={16} />
                Save Personal Details
              </button>
            </div>
            
            {/* Address Details */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <FiMapPin className="mr-2" size={16} />
                  Address Details
                </h3>
                {completedSections.address && <FiCheckCircle className="text-green-500" size={16} />}
              </div>
              
              <div className="space-y-3">
                <FormField
                  label="Street Address"
                  name="street"
                  value={formData.street}
                  onChange={handleInputChange}
                  placeholder="Enter your complete street address"
                />
                
                <FormField
                  label="Pincode"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  placeholder="000000"
                  helpText="6-digit pincode"
                />
              </div>
              
              <button
                onClick={() => handleSaveSection('address')}
                disabled={!formData.street || !formData.pincode}
                className="mt-3 w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <FiSave className="mr-2" size={16} />
                Save Address Details
              </button>
            </div>
            
            {/* Emergency Contact */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <FiUserCheck className="mr-2" size={16} />
                  Emergency Contact
                </h3>
                {completedSections.emergency && <FiCheckCircle className="text-green-500" size={16} />}
              </div>
              
              <div className="space-y-3">
                <FormField
                  label="Contact Name"
                  name="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={handleInputChange}
                  placeholder="Full name of emergency contact"
                />
                
                <FormField
                  label="Contact Phone"
                  name="emergencyContactPhone"
                  type="tel"
                  value={formData.emergencyContactPhone}
                  onChange={handleInputChange}
                  placeholder="9XXXXXXXXX"
                />
                
                <FormField
                  label="Relationship"
                  name="emergencyContactRelationship"
                  type="select"
                  value={formData.emergencyContactRelationship}
                  onChange={handleInputChange}
                  options={relationshipOptions}
                  placeholder="Select relationship"
                />
              </div>
              
              <button
                onClick={() => handleSaveSection('emergency')}
                disabled={!formData.emergencyContactName || !formData.emergencyContactPhone || !formData.emergencyContactRelationship}
                className="mt-3 w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <FiSave className="mr-2" size={16} />
                Save Emergency Contact
              </button>
            </div>
            
            {/* Professional Info (only for health workers) */}
            {user?.roleInfo?.role !== 'user' && (
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 flex items-center">
                    <FiUserCheck className="mr-2" size={16} />
                    Professional Info
                  </h3>
                  {completedSections.professional && <FiCheckCircle className="text-green-500" size={16} />}
                </div>
                
                <div className="space-y-3">
                  <FormField
                    label="Qualification"
                    name="qualification"
                    value={formData.qualification}
                    onChange={handleInputChange}
                    placeholder="Your highest qualification"
                  />
                  
                  <FormField
                    label="Experience (Years)"
                    name="experience"
                    type="number"
                    value={formData.experience}
                    onChange={handleInputChange}
                    placeholder="Years of experience"
                  />
                </div>
                
                <button
                  onClick={() => handleSaveSection('professional')}
                  disabled={!formData.qualification || !formData.experience}
                  className="mt-3 w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <FiSave className="mr-2" size={16} />
                  Save Professional Info
                </button>
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleSkipToApp}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
            >
              <FiSkipForward className="mr-2" size={16} />
              Skip for Now
            </button>
            
            <button
              onClick={handleCompleteProfile}
              disabled={completionPercentage < 80}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <FiArrowRight className="mr-2" size={16} />
              Complete & Continue
            </button>
          </div>
          
          {/* Benefits of Completion */}
          <div className="mt-8 bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Benefits of completing your profile:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Better health recommendations and alerts</li>
              <li>• Emergency contact notifications</li>
              <li>• Personalized health insights</li>
              <li>• Access to all platform features</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileComplete;