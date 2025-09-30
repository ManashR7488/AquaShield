import { FamilyMember } from '../models/familyMember.model.js';
import  User  from '../models/user.model.js';
import { successResponse, errorResponse } from '../utils/responseHelper.js';
import { validateRelationshipLogic } from '../validation/familyMember.validation.js';

/**
 * Get family members for the current user
 */
export const getFamilyMembers = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      relationship,
      minAge,
      maxAge,
      bloodGroup,
      status = 'active',
      search,
      page = 1,
      limit = 10,
      sortBy = 'firstName',
      sortOrder = 'asc'
    } = req.query;

    // Build filter object
    const filter = { userId, status };
    
    if (relationship) filter.relationship = relationship;
    if (bloodGroup) filter['healthProfile.bloodGroup'] = bloodGroup;
    if (minAge || maxAge) {
      filter.age = {};
      if (minAge) filter.age.$gte = parseInt(minAge);
      if (maxAge) filter.age.$lte = parseInt(maxAge);
    }

    // Add search functionality
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Execute query with pagination
    const [familyMembers, totalCount] = await Promise.all([
      FamilyMember.find(filter)
        .populate('linkedUserId', 'firstName lastName email profilePhoto')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      FamilyMember.countDocuments(filter)
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    successResponse(res, 'Family members retrieved successfully', {
      familyMembers,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching family members:', error);
    errorResponse(res, 'Failed to fetch family members', 500);
  }
};

/**
 * Create a new family member
 */
export const createFamilyMember = async (req, res) => {
  try {
    const userId = req.user.userId;
    const familyMemberData = { ...req.body, userId };

    // Normalize gender to lowercase for consistency
    if (familyMemberData.gender) {
      familyMemberData.gender = familyMemberData.gender.toLowerCase();
    }

    // Calculate age from dateOfBirth
    if (familyMemberData.dateOfBirth) {
      const birthDate = new Date(familyMemberData.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      familyMemberData.age = age;
    }

    // Get existing family members for relationship validation
    const existingFamilyMembers = await FamilyMember.find({ userId, status: 'active' }).lean();
    
    // Validate relationship logic
    const relationshipErrors = validateRelationshipLogic(existingFamilyMembers, familyMemberData);
    if (relationshipErrors.length > 0) {
      return errorResponse(res, relationshipErrors.join(', '), 400);
    }

    // If linking to an existing user, verify the user exists
    if (familyMemberData.linkedUserId) {
      const linkedUser = await User.findById(familyMemberData.linkedUserId);
      if (!linkedUser) {
        return errorResponse(res, 'Linked user not found', 404);
      }
      
      // Check if user is already linked to another family member
      const existingLink = await FamilyMember.findOne({
        linkedUserId: familyMemberData.linkedUserId,
        userId: { $ne: userId }
      });
      
      if (existingLink) {
        return errorResponse(res, 'User is already linked to another family member', 400);
      }
      
      familyMemberData.isLinkedUser = true;
    }

    // Create family member
    const familyMember = new FamilyMember(familyMemberData);
    await familyMember.save();

    // Populate linked user data for response
    await familyMember.populate('linkedUserId', 'firstName lastName email profilePhoto');

    successResponse(res, 'Family member created successfully', { familyMember }, 201);
  } catch (error) {
    console.error('Error creating family member:', error);
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return errorResponse(res, validationErrors.join(', '), 400);
    }
    errorResponse(res, 'Failed to create family member', 500);
  }
};

/**
 * Get a specific family member by ID
 */
export const getFamilyMemberById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const familyMember = await FamilyMember.findOne({ _id: id, userId, status: 'active' })
      .populate('linkedUserId', 'firstName lastName email profilePhoto')
      .lean();

    if (!familyMember) {
      return errorResponse(res, 'Family member not found', 404);
    }

    successResponse(res, 'Family member retrieved successfully', { familyMember });
  } catch (error) {
    console.error('Error fetching family member:', error);
    errorResponse(res, 'Failed to fetch family member', 500);
  }
};

/**
 * Update a family member
 */
export const updateFamilyMember = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const updateData = req.body;

    // Normalize gender to lowercase for consistency
    if (updateData.gender) {
      updateData.gender = updateData.gender.toLowerCase();
    }

    // Check if family member exists and belongs to the user
    const existingFamilyMember = await FamilyMember.findOne({ _id: id, userId, status: 'active' });
    if (!existingFamilyMember) {
      return errorResponse(res, 'Family member not found', 404);
    }

    // Calculate age if dateOfBirth is being updated
    if (updateData.dateOfBirth) {
      const birthDate = new Date(updateData.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      updateData.age = age;
    }

    // Validate relationship changes
    if (updateData.relationship && updateData.relationship !== existingFamilyMember.relationship) {
      const otherFamilyMembers = await FamilyMember.find({ 
        userId, 
        _id: { $ne: id }, 
        status: 'active' 
      }).lean();
      
      const updatedMember = { ...existingFamilyMember.toObject(), ...updateData };
      const relationshipErrors = validateRelationshipLogic(otherFamilyMembers, updatedMember);
      
      if (relationshipErrors.length > 0) {
        return errorResponse(res, relationshipErrors.join(', '), 400);
      }
    }

    // Handle linked user updates
    if (updateData.linkedUserId !== undefined) {
      if (updateData.linkedUserId) {
        const linkedUser = await User.findById(updateData.linkedUserId);
        if (!linkedUser) {
          return errorResponse(res, 'Linked user not found', 404);
        }
        
        // Check if user is already linked to another family member
        const existingLink = await FamilyMember.findOne({
          linkedUserId: updateData.linkedUserId,
          _id: { $ne: id },
          userId: { $ne: userId }
        });
        
        if (existingLink) {
          return errorResponse(res, 'User is already linked to another family member', 400);
        }
        
        updateData.isLinkedUser = true;
      } else {
        updateData.isLinkedUser = false;
        updateData.$unset = { linkedUserId: '' };
      }
    }

    // Update family member
    const updatedFamilyMember = await FamilyMember.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('linkedUserId', 'firstName lastName email profilePhoto');

    successResponse(res, 'Family member updated successfully', { familyMember: updatedFamilyMember });
  } catch (error) {
    console.error('Error updating family member:', error);
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return errorResponse(res, validationErrors.join(', '), 400);
    }
    errorResponse(res, 'Failed to update family member', 500);
  }
};

/**
 * Delete a family member (soft delete)
 */
export const deleteFamilyMember = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const familyMember = await FamilyMember.findOne({ _id: id, userId, status: 'active' });
    if (!familyMember) {
      return errorResponse(res, 'Family member not found', 404);
    }

    // Soft delete by updating status
    familyMember.status = 'inactive';
    await familyMember.save();

    successResponse(res, 'Family member deleted successfully');
  } catch (error) {
    console.error('Error deleting family member:', error);
    errorResponse(res, 'Failed to delete family member', 500);
  }
};

/**
 * Link an existing user to a family member
 */
export const linkExistingUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { linkedUserId } = req.body;
    const userId = req.user.userId;

    // Check if family member exists and belongs to the user
    const familyMember = await FamilyMember.findOne({ _id: id, userId, status: 'active' });
    if (!familyMember) {
      return errorResponse(res, 'Family member not found', 404);
    }

    // Verify the user to link exists
    const userToLink = await User.findById(linkedUserId);
    if (!userToLink) {
      return errorResponse(res, 'User to link not found', 404);
    }

    // Check if user is already linked to another family member
    const existingLink = await FamilyMember.findOne({
      linkedUserId,
      _id: { $ne: id }
    });
    
    if (existingLink) {
      return errorResponse(res, 'User is already linked to another family member', 400);
    }

    // Link the user
    await familyMember.linkToUser(linkedUserId);
    await familyMember.populate('linkedUserId', 'firstName lastName email profilePhoto');

    successResponse(res, 'User linked to family member successfully', { familyMember });
  } catch (error) {
    console.error('Error linking user to family member:', error);
    errorResponse(res, 'Failed to link user to family member', 500);
  }
};

/**
 * Get family health summary
 */
export const getFamilyHealthSummary = async (req, res) => {
  try {
    const userId = req.user.userId;

    const healthSummary = await FamilyMember.getHealthSummary(userId);
    
    if (!healthSummary || healthSummary.length === 0) {
      return successResponse(res, 'No family members found', {
        summary: {
          totalMembers: 0,
          avgAge: 0,
          bloodGroups: [],
          chronicConditions: [],
          relationships: []
        }
      });
    }

    const summary = healthSummary[0];
    
    // Process blood groups and chronic conditions
    const bloodGroupCounts = {};
    const relationshipCounts = {};
    const allChronicConditions = [];

    summary.bloodGroups.filter(bg => bg).forEach(bg => {
      bloodGroupCounts[bg] = (bloodGroupCounts[bg] || 0) + 1;
    });

    summary.relationships.forEach(rel => {
      relationshipCounts[rel] = (relationshipCounts[rel] || 0) + 1;
    });

    summary.chronicConditions.forEach(conditions => {
      if (Array.isArray(conditions)) {
        allChronicConditions.push(...conditions);
      }
    });

    const chronicConditionCounts = {};
    allChronicConditions.forEach(condition => {
      chronicConditionCounts[condition] = (chronicConditionCounts[condition] || 0) + 1;
    });

    const processedSummary = {
      totalMembers: summary.totalMembers,
      avgAge: Math.round(summary.avgAge || 0),
      bloodGroupDistribution: bloodGroupCounts,
      relationshipDistribution: relationshipCounts,
      chronicConditions: chronicConditionCounts,
      hasHealthConcerns: allChronicConditions.length > 0
    };

    successResponse(res, 'Family health summary retrieved successfully', { summary: processedSummary });
  } catch (error) {
    console.error('Error fetching family health summary:', error);
    errorResponse(res, 'Failed to fetch family health summary', 500);
  }
};

/**
 * Get family members by relationship
 */
export const getFamilyMembersByRelationship = async (req, res) => {
  try {
    const { relationship } = req.params;
    const userId = req.user.userId;

    const familyMembers = await FamilyMember.findByRelationship(userId, relationship);

    successResponse(res, `${relationship} family members retrieved successfully`, { familyMembers });
  } catch (error) {
    console.error('Error fetching family members by relationship:', error);
    errorResponse(res, 'Failed to fetch family members by relationship', 500);
  }
};

/**
 * Update family member health profile
 */
export const updateFamilyMemberHealthProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const healthData = req.body;

    const familyMember = await FamilyMember.findOne({ _id: id, userId, status: 'active' });
    if (!familyMember) {
      return errorResponse(res, 'Family member not found', 404);
    }

    await familyMember.updateHealthProfile(healthData);
    await familyMember.populate('linkedUserId', 'firstName lastName email profilePhoto');

    successResponse(res, 'Health profile updated successfully', { familyMember });
  } catch (error) {
    console.error('Error updating health profile:', error);
    errorResponse(res, 'Failed to update health profile', 500);
  }
};

/**
 * Get family members by age group
 */
export const getFamilyMembersByAge = async (req, res) => {
  try {
    const { minAge, maxAge } = req.query;
    const userId = req.user.userId;

    if (!minAge || !maxAge) {
      return errorResponse(res, 'Both minAge and maxAge are required', 400);
    }

    const familyMembers = await FamilyMember.findByAge(userId, parseInt(minAge), parseInt(maxAge));

    successResponse(res, `Family members aged ${minAge}-${maxAge} retrieved successfully`, { familyMembers });
  } catch (error) {
    console.error('Error fetching family members by age:', error);
    errorResponse(res, 'Failed to fetch family members by age', 500);
  }
};