import React, { useState, useEffect } from "react";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCamera,
  FiEdit3,
  FiSave,
  FiX,
  FiCalendar,
  FiUserCheck,
  FiSettings,
  FiBriefcase,
  FiShield,
  FiHome,
  FiGlobe,
  FiAward,
  FiClock,
  FiBell,
} from "react-icons/fi";
import useAuthStore from "../../store/useAuthStore";

const ProfilePage = () => {
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [profileData, setProfileData] = useState({
    // Personal Information
    personalInfo: {
      firstName: "",
      lastName: "",
      middleName: "",
      localName: "",
      dateOfBirth: "",
      age: "",
      gender: "",
      profileImage: "",
    },
    // Contact Information
    contactInfo: {
      currentAddress: {
        houseNumber: "",
        street: "",
        village: "",
        block: "",
        district: "",
        state: "",
        pincode: "",
      },
      permanentAddress: {
        isSameAsCurrent: true,
        houseNumber: "",
        street: "",
        village: "",
        block: "",
        district: "",
        state: "",
        pincode: "",
      },
      emergencyContact: {
        name: "",
        relation: "",
        phone: "",
        address: "",
      },
    },
    // Professional Information
    professionalInfo: {
      qualification: "",
      experience: 0,
      certification: [],
      specialization: [],
      languages: [],
      performanceRating: 0,
      workSchedule: {
        workingDays: [],
        workingHours: "",
        availability: "",
      },
    },
    // Preferences
    preferences: {
      language: "english",
      notifications: {
        sms: true,
        email: true,
        push: true,
        whatsapp: false,
        callAlerts: false,
      },
      alertTypes: [],
      reportingFrequency: "weekly",
      dataUsageConsent: true,
      privacySettings: {
        shareLocation: false,
        sharePhone: false,
        shareEmail: false,
      },
    },
  });

  // Load user data when component mounts
  useEffect(() => {
    if (user) {
      setProfileData((prevData) => ({
        ...prevData,
        personalInfo: { ...prevData.personalInfo, ...user.personalInfo },
        contactInfo: { ...prevData.contactInfo, ...user.contactInfo },
        professionalInfo: {
          ...prevData.professionalInfo,
          ...user.professionalInfo,
        },
        preferences: { ...prevData.preferences, ...user.preferences },
      }));
    }
  }, [user]);

  const handleInputChange = (section, field, value) => {
    setProfileData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleNestedInputChange = (section, subsection, field, value) => {
    setProfileData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: {
          ...prev[section][subsection],
          [field]: value,
        },
      },
    }));
  };

  const handleSave = async () => {
    // Here you would typically call an API to update the profile
    console.log("Saving profile data:", profileData);
    setIsEditing(false);
    // Add toast notification for success
  };

  const tabs = [
    { id: "personal", label: "Personal Info", icon: FiUser },
    { id: "contact", label: "Contact & Address", icon: FiHome },
    { id: "professional", label: "Professional", icon: FiBriefcase },
    { id: "preferences", label: "Preferences", icon: FiSettings },
  ];

  const genderOptions = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" },
  ];

  const availabilityOptions = [
    { value: "24x7", label: "24/7 Available" },
    { value: "office_hours", label: "Office Hours" },
    { value: "on_call", label: "On Call" },
  ];

  const languageOptions = [
    "English",
    "Hindi",
    "Assamese",
    "Bengali",
    "Bodo",
    "Manipuri",
    "Mizo",
    "Nagamese",
    "Nepali",
  ];

  const weekDays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const renderPersonalInfo = () => (
    <div className="space-y-6">
      {/* Personal Information Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FiUser className="mr-2 text-gray-600" size={20} />
          Personal Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              type="text"
              value={profileData.personalInfo.firstName}
              onChange={(e) =>
                handleInputChange("personalInfo", "firstName", e.target.value)
              }
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              type="text"
              value={profileData.personalInfo.lastName}
              onChange={(e) =>
                handleInputChange("personalInfo", "lastName", e.target.value)
              }
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Middle Name
            </label>
            <input
              type="text"
              value={profileData.personalInfo.middleName}
              onChange={(e) =>
                handleInputChange("personalInfo", "middleName", e.target.value)
              }
              disabled={!isEditing}
              placeholder="Optional"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Local Name
            </label>
            <input
              type="text"
              value={profileData.personalInfo.localName}
              onChange={(e) =>
                handleInputChange("personalInfo", "localName", e.target.value)
              }
              disabled={!isEditing}
              placeholder="Name in local language"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth
            </label>
            <input
              type="date"
              value={profileData.personalInfo.dateOfBirth}
              onChange={(e) =>
                handleInputChange("personalInfo", "dateOfBirth", e.target.value)
              }
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gender
            </label>
            <select
              value={profileData.personalInfo.gender}
              onChange={(e) =>
                handleInputChange("personalInfo", "gender", e.target.value)
              }
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            >
              <option value="">Select Gender</option>
              {genderOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContactInfo = () => (
    <div className="space-y-6">
      {/* Current Address */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FiMapPin className="mr-2 text-gray-600" size={20} />
          Current Address
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              House Number
            </label>
            <input
              type="text"
              value={profileData.contactInfo.currentAddress.houseNumber}
              onChange={(e) =>
                handleNestedInputChange(
                  "contactInfo",
                  "currentAddress",
                  "houseNumber",
                  e.target.value
                )
              }
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Street
            </label>
            <input
              type="text"
              value={profileData.contactInfo.currentAddress.street}
              onChange={(e) =>
                handleNestedInputChange(
                  "contactInfo",
                  "currentAddress",
                  "street",
                  e.target.value
                )
              }
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Village
            </label>
            <input
              type="text"
              value={profileData.contactInfo.currentAddress.village}
              onChange={(e) =>
                handleNestedInputChange(
                  "contactInfo",
                  "currentAddress",
                  "village",
                  e.target.value
                )
              }
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Block
            </label>
            <input
              type="text"
              value={profileData.contactInfo.currentAddress.block}
              onChange={(e) =>
                handleNestedInputChange(
                  "contactInfo",
                  "currentAddress",
                  "block",
                  e.target.value
                )
              }
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              District
            </label>
            <input
              type="text"
              value={profileData.contactInfo.currentAddress.district}
              onChange={(e) =>
                handleNestedInputChange(
                  "contactInfo",
                  "currentAddress",
                  "district",
                  e.target.value
                )
              }
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State
            </label>
            <input
              type="text"
              value={profileData.contactInfo.currentAddress.state}
              onChange={(e) =>
                handleNestedInputChange(
                  "contactInfo",
                  "currentAddress",
                  "state",
                  e.target.value
                )
              }
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pincode
            </label>
            <input
              type="text"
              value={profileData.contactInfo.currentAddress.pincode}
              onChange={(e) =>
                handleNestedInputChange(
                  "contactInfo",
                  "currentAddress",
                  "pincode",
                  e.target.value
                )
              }
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FiPhone className="mr-2 text-gray-600" size={20} />
          Emergency Contact
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={profileData.contactInfo.emergencyContact.name}
              onChange={(e) =>
                handleNestedInputChange(
                  "contactInfo",
                  "emergencyContact",
                  "name",
                  e.target.value
                )
              }
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Relation
            </label>
            <input
              type="text"
              value={profileData.contactInfo.emergencyContact.relation}
              onChange={(e) =>
                handleNestedInputChange(
                  "contactInfo",
                  "emergencyContact",
                  "relation",
                  e.target.value
                )
              }
              disabled={!isEditing}
              placeholder="Father, Mother, Spouse, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={profileData.contactInfo.emergencyContact.phone}
              onChange={(e) =>
                handleNestedInputChange(
                  "contactInfo",
                  "emergencyContact",
                  "phone",
                  e.target.value
                )
              }
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              value={profileData.contactInfo.emergencyContact.address}
              onChange={(e) =>
                handleNestedInputChange(
                  "contactInfo",
                  "emergencyContact",
                  "address",
                  e.target.value
                )
              }
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderProfessionalInfo = () => (
    <div className="space-y-6">
      {/* Professional Information Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FiBriefcase className="mr-2 text-gray-600" size={20} />
          Professional Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Qualification
            </label>
            <input
              type="text"
              value={profileData.professionalInfo.qualification}
              onChange={(e) =>
                handleInputChange(
                  "professionalInfo",
                  "qualification",
                  e.target.value
                )
              }
              disabled={!isEditing}
              placeholder="Highest qualification"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Experience (Years)
            </label>
            <input
              type="number"
              value={profileData.professionalInfo.experience}
              onChange={(e) =>
                handleInputChange(
                  "professionalInfo",
                  "experience",
                  parseInt(e.target.value)
                )
              }
              disabled={!isEditing}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Working Hours
            </label>
            <input
              type="text"
              value={profileData.professionalInfo.workSchedule.workingHours}
              onChange={(e) =>
                handleNestedInputChange(
                  "professionalInfo",
                  "workSchedule",
                  "workingHours",
                  e.target.value
                )
              }
              disabled={!isEditing}
              placeholder="e.g., 9 AM - 5 PM"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Availability
            </label>
            <select
              value={profileData.professionalInfo.workSchedule.availability}
              onChange={(e) =>
                handleNestedInputChange(
                  "professionalInfo",
                  "workSchedule",
                  "availability",
                  e.target.value
                )
              }
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            >
              <option value="">Select Availability</option>
              {availabilityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Languages Spoken
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {languageOptions.map((language) => (
              <label key={language} className="flex items-center">
                <input
                  type="checkbox"
                  checked={profileData.professionalInfo.languages.includes(
                    language
                  )}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleInputChange("professionalInfo", "languages", [
                        ...profileData.professionalInfo.languages,
                        language,
                      ]);
                    } else {
                      handleInputChange(
                        "professionalInfo",
                        "languages",
                        profileData.professionalInfo.languages.filter(
                          (l) => l !== language
                        )
                      );
                    }
                  }}
                  disabled={!isEditing}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">{language}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Working Days
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {weekDays.map((day) => (
              <label key={day} className="flex items-center">
                <input
                  type="checkbox"
                  checked={profileData.professionalInfo.workSchedule.workingDays.includes(
                    day.toLowerCase()
                  )}
                  onChange={(e) => {
                    const dayLower = day.toLowerCase();
                    if (e.target.checked) {
                      handleNestedInputChange(
                        "professionalInfo",
                        "workSchedule",
                        "workingDays",
                        [
                          ...profileData.professionalInfo.workSchedule
                            .workingDays,
                          dayLower,
                        ]
                      );
                    } else {
                      handleNestedInputChange(
                        "professionalInfo",
                        "workSchedule",
                        "workingDays",
                        profileData.professionalInfo.workSchedule.workingDays.filter(
                          (d) => d !== dayLower
                        )
                      );
                    }
                  }}
                  disabled={!isEditing}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">{day}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPreferences = () => (
    <div className="space-y-6">
      {/* Notification Preferences */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FiBell className="mr-2 text-gray-600" size={20} />
          Notification Preferences
        </h3>
        <div className="space-y-4">
          {Object.entries(profileData.preferences.notifications).map(
            ([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
              >
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </span>
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) =>
                    handleNestedInputChange(
                      "preferences",
                      "notifications",
                      key,
                      e.target.checked
                    )
                  }
                  disabled={!isEditing}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>
            )
          )}
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FiShield className="mr-2 text-gray-600" size={20} />
          Privacy Settings
        </h3>
        <div className="space-y-4">
          {Object.entries(profileData.preferences.privacySettings).map(
            ([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
              >
                <span className="text-sm font-medium text-gray-700">
                  {key
                    .replace(/([A-Z])/g, " $1")
                    .replace("share", "Share")
                    .trim()}
                </span>
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) =>
                    handleNestedInputChange(
                      "preferences",
                      "privacySettings",
                      key,
                      e.target.checked
                    )
                  }
                  disabled={!isEditing}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>
            )
          )}
        </div>
      </div>

      {/* General Preferences */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FiSettings className="mr-2 text-gray-600" size={20} />
          General Preferences
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Language
            </label>
            <select
              value={profileData.preferences.language}
              onChange={(e) =>
                handleInputChange("preferences", "language", e.target.value)
              }
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            >
              <option value="english">English</option>
              <option value="hindi">Hindi</option>
              <option value="assamese">Assamese</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reporting Frequency
            </label>
            <select
              value={profileData.preferences.reportingFrequency}
              onChange={(e) =>
                handleInputChange(
                  "preferences",
                  "reportingFrequency",
                  e.target.value
                )
              }
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Profile Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-8">
              {/* Profile Picture and Basic Info */}
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
                    {profileData.personalInfo.profileImage ? (
                      <img
                        src={profileData.personalInfo.profileImage}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <FiUser size={48} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                  {isEditing && (
                    <button className="absolute bottom-2 right-2 bg-gray-800 text-white rounded-full p-2 hover:bg-gray-900 transition-colors shadow-lg">
                      <FiCamera size={14} />
                    </button>
                  )}
                </div>

                <h1 className="text-xl font-semibold text-gray-900 mt-4">
                  {user?.personalInfo?.firstName || "John"}{" "}
                  {user?.personalInfo?.lastName || "Doe"}
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                  {user?.roleInfo?.role?.replace("_", " ") || "Health Worker"}
                </p>
              </div>

              {/* Quick Stats */}
              <div className="border-t border-gray-100 pt-4 mb-4">
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <FiMapPin size={14} className="mr-2" />
                  <span>
                    {profileData.contactInfo?.currentAddress?.district ||
                      "Location not set"}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <FiMail size={14} className="mr-2" />
                  <span>
                    {user?.authentication?.email || "email@example.com"}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <FiCalendar size={14} className="mr-2" />
                  <span>Joined {new Date().getFullYear()}</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="border-t border-gray-100 pt-4">
                {isEditing ? (
                  <div className="space-y-2">
                    <button
                      onClick={handleSave}
                      className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center"
                    >
                      <FiSave className="mr-2" size={16} />
                      Save Profile
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center"
                    >
                      <FiX className="mr-2" size={16} />
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center"
                  >
                    <FiEdit3 className="mr-2" size={16} />
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-3">
            {/* Navigation Tabs */}
            <div className="bg-white rounded-lg border border-gray-200 mb-6">
              <nav className="flex border-b border-gray-200">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? "border-orange-500 text-orange-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <IconComponent className="mr-2" size={16} />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {activeTab === "personal" && renderPersonalInfo()}
              {activeTab === "contact" && renderContactInfo()}
              {activeTab === "professional" && renderProfessionalInfo()}
              {activeTab === "preferences" && renderPreferences()}
            </div>
          </div>
        </div>

        {/* Account Status */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FiUserCheck className="mr-2 text-gray-600" size={20} />
            Account Verification Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
              <div className="flex items-center space-x-3">
                <div
                  className={`p-2 rounded-lg ${
                    user?.authentication?.isEmailVerified
                      ? "bg-green-100 text-green-600"
                      : "bg-yellow-100 text-yellow-600"
                  }`}
                >
                  <FiMail size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Email</p>
                  <p
                    className={`text-xs ${
                      user?.authentication?.isEmailVerified
                        ? "text-green-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {user?.authentication?.isEmailVerified
                      ? "Verified"
                      : "Pending"}
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
              <div className="flex items-center space-x-3">
                <div
                  className={`p-2 rounded-lg ${
                    user?.authentication?.isPhoneVerified
                      ? "bg-green-100 text-green-600"
                      : "bg-yellow-100 text-yellow-600"
                  }`}
                >
                  <FiPhone size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Phone</p>
                  <p
                    className={`text-xs ${
                      user?.authentication?.isPhoneVerified
                        ? "text-green-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {user?.authentication?.isPhoneVerified
                      ? "Verified"
                      : "Pending"}
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
              <div className="flex items-center space-x-3">
                <div
                  className={`p-2 rounded-lg ${
                    user?.verification?.isVerified
                      ? "bg-green-100 text-green-600"
                      : "bg-yellow-100 text-yellow-600"
                  }`}
                >
                  <FiShield size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Profile</p>
                  <p
                    className={`text-xs ${
                      user?.verification?.isVerified
                        ? "text-green-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {user?.verification?.isVerified
                      ? "Verified"
                      : "Under Review"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
