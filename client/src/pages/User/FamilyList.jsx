import React, { useState, useEffect } from 'react';
import { Plus, Users, Heart, Phone, MapPin, Calendar, AlertCircle, Edit2, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import familyService from '../../services/familyService';
import { useUserGuard } from '../../utils/userGuard.jsx';
import { toast } from 'react-toastify';

const FamilyList = () => {
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [relationshipFilter, setRelationshipFilter] = useState('all');
  const { getUserId } = useUserGuard();

  useEffect(() => {
    loadFamilyMembers();
  }, []);

  const loadFamilyMembers = async () => {
    try {
      setLoading(true);
      const userId = getUserId();
      if (!userId) {
        toast.error('User not authenticated');
        return;
      }

      const result = await familyService.getFamilyMembers(userId);
      if (result.success) {
        setFamilyMembers(result.data);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error loading family members:', error);
      toast.error('Failed to load family members');
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = familyMembers.filter(member => {
    const matchesSearch = member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.phone?.includes(searchTerm);
    const matchesRelationship = relationshipFilter === 'all' || member.relationship === relationshipFilter;
    return matchesSearch && matchesRelationship;
  });

  const getRelationshipIcon = (relationship) => {
    const icons = {
      'spouse': '💑',
      'child': '👶',
      'parent': '👨‍👩‍👧‍👦',
      'sibling': '👫',
      'grandparent': '👴👵',
      'grandchild': '👶',
      'other': '👤'
    };
    return icons[relationship] || icons['other'];
  };

  const getHealthStatusColor = (status) => {
    const colors = {
      'good': 'bg-green-100 text-green-800',
      'fair': 'bg-yellow-100 text-yellow-800',
      'poor': 'bg-red-100 text-red-800',
      'unknown': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors['unknown'];
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div className="flex items-center mb-4 sm:mb-0">
          <Users className="h-8 w-8 text-blue-600 mr-3" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Family Members</h1>
            <p className="text-gray-600 mt-1">Manage your family's health information</p>
          </div>
        </div>
        <Link
          to="/app/user/family/add"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Family Member
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name or phone number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="sm:w-48">
            <select
              value={relationshipFilter}
              onChange={(e) => setRelationshipFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Relationships</option>
              <option value="spouse">Spouse</option>
              <option value="child">Child</option>
              <option value="parent">Parent</option>
              <option value="sibling">Sibling</option>
              <option value="grandparent">Grandparent</option>
              <option value="grandchild">Grandchild</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Family Members Grid */}
      {filteredMembers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {familyMembers.length === 0 ? 'No Family Members Added' : 'No Members Found'}
          </h3>
          <p className="text-gray-600 mb-6">
            {familyMembers.length === 0 
              ? 'Start by adding your family members to track their health information.'
              : 'Try adjusting your search or filter criteria.'
            }
          </p>
          {familyMembers.length === 0 && (
            <Link
              to="/app/user/family/add"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg inline-flex items-center transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add First Family Member
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member) => (
            <div key={member._id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              {/* Member Header */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="text-3xl mr-3">
                      {getRelationshipIcon(member.relationship)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                      <p className="text-sm text-gray-600 capitalize">{member.relationship}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getHealthStatusColor(member.healthStatus)}`}>
                    {member.healthStatus}
                  </span>
                </div>

                {/* Member Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Age: {calculateAge(member.dateOfBirth)} years</span>
                  </div>
                  {member.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2" />
                      <span>{member.phone}</span>
                    </div>
                  )}
                  {member.address && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span className="truncate">{member.address}</span>
                    </div>
                  )}
                </div>

                {/* Health Conditions */}
                {member.medicalConditions && member.medicalConditions.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center mb-2">
                      <AlertCircle className="h-4 w-4 text-orange-500 mr-2" />
                      <span className="text-sm font-medium text-gray-700">Health Conditions</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {member.medicalConditions.slice(0, 2).map((condition, index) => (
                        <span key={index} className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                          {condition}
                        </span>
                      ))}
                      {member.medicalConditions.length > 2 && (
                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                          +{member.medicalConditions.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <Link
                    to={`/app/user/family/${member._id}`}
                    className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center transition-colors"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Profile
                  </Link>
                  <Link
                    to={`/app/user/family/${member._id}/edit`}
                    className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center transition-colors"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      {familyMembers.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Family Overview</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{familyMembers.length}</div>
              <div className="text-sm text-gray-600">Total Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {familyMembers.filter(m => m.healthStatus === 'good').length}
              </div>
              <div className="text-sm text-gray-600">Good Health</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {familyMembers.filter(m => m.healthStatus === 'fair').length}
              </div>
              <div className="text-sm text-gray-600">Fair Health</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {familyMembers.filter(m => m.healthStatus === 'poor').length}
              </div>
              <div className="text-sm text-gray-600">Need Attention</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyList;