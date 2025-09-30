import District from '../models/district.model.js';
import Block from '../models/block.model.js';
import User from '../models/user.model.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { 
  successResponse, 
  createdResponse, 
  updatedResponse, 
  notFoundResponse,
  paginatedResponse,
  getPaginationData
} from '../utils/responseHelper.js';
import { generateDistrictId } from '../utils/idGenerator.js';
import { generateBlockToken as generateBlockRegistrationToken } from '../utils/tokenGenerator.js';

/**
 * @desc Create new district
 * @route POST /api/districts
 * @access Admin only
 */
export const createDistrict = asyncHandler(async (req, res) => {
  const { 
    name, 
    state, 
    code, 
    districtOfficer, 
    boundaries, 
    demographics, 
    healthInfrastructure, 
    blockRegistration 
  } = req.body;

  // Check if district already exists
  const existingDistrict = await District.findOne({
    $or: [
      { name: new RegExp(`^${name}$`, 'i'), state },
      { code }
    ]
  });

  if (existingDistrict) {
    return res.status(400).json({
      success: false,
      message: 'District with this name or code already exists'
    });
  }

  // Generate unique district ID
  const districtId = await generateDistrictId(state);

  // Create district object
  const districtData = {
    districtId,
    name,
    state,
    code,
    boundaries,
    demographics,
    healthInfrastructure,
    blockRegistration: {
      registrationEnabled: true,
      requiresApproval: false,
      autoGenerateTokens: true,
      tokenValidityDays: 30,
      maxBlocksAllowed: 50,
      ...blockRegistration
    },
    createdBy: req.user._id,
    status: 'active'
  };

  // Add district officer if provided
  if (districtOfficer?.userId) {
    const officer = await User.findById(districtOfficer.userId);
    if (!officer) {
      return res.status(400).json({
        success: false,
        message: 'District officer not found'
      });
    }

    districtData.districtOfficer = {
      ...districtOfficer,
      appointedDate: new Date()
    };
  }

  const district = await District.create(districtData);

  // Populate district officer details
  await district.populate('districtOfficer.userId', 'personalInfo contactInfo');

  createdResponse(res, district, 'District created successfully');
});

/**
 * @desc Get all districts with pagination and filtering
 * @route GET /api/districts
 * @access All authenticated users
 */
export const getDistricts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    state,
    status = 'all',
    sortBy = 'createdAt',
    sortOrder = 'desc',
    hasDistrictOfficer,
    minPopulation,
    maxPopulation
  } = req.query;

  // Build filter
  const filter = {};

  if (status !== 'all') {
    filter.status = status;
  }

  if (state) {
    filter.state = state;
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
      { districtId: { $regex: search, $options: 'i' } }
    ];
  }

  if (hasDistrictOfficer !== undefined) {
    if (hasDistrictOfficer === 'true') {
      filter['districtOfficer.userId'] = { $exists: true };
    } else {
      filter['districtOfficer.userId'] = { $exists: false };
    }
  }

  if (minPopulation || maxPopulation) {
    filter['demographics.totalPopulation'] = {};
    if (minPopulation) filter['demographics.totalPopulation'].$gte = parseInt(minPopulation);
    if (maxPopulation) filter['demographics.totalPopulation'].$lte = parseInt(maxPopulation);
  }

  // Build sort
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Execute query with pagination
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort,
    populate: [
      {
        path: 'districtOfficer.userId',
        select: 'personalInfo contactInfo roleInfo'
      },
      {
        path: 'createdBy',
        select: 'personalInfo'
      }
    ]
  };

  const districts = await District.paginate(filter, options);

  const paginationMeta = {
    total: districts.totalDocs,
    limit: districts.limit,
    totalPages: districts.totalPages,
    currentPage: districts.page,
    hasNext: districts.hasNextPage,
    hasPrevious: districts.hasPrevPage,
    nextPage: districts.nextPage,
    previousPage: districts.prevPage
  };

  paginatedResponse(res, districts.docs, paginationMeta, 'Districts retrieved successfully');
});

/**
 * @desc Get single district by ID
 * @route GET /api/districts/:id
 * @access All authenticated users
 */
export const getDistrictById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const district = await District.findById(id)
    .populate('districtOfficer.userId', 'personalInfo contactInfo roleInfo')
    .populate('createdBy', 'personalInfo')
    .populate('updatedBy', 'personalInfo');

  if (!district) {
    return notFoundResponse(res, 'District not found');
  }

  // Get blocks count for this district
  const blocksCount = await Block.countDocuments({ districtId: district._id });
  
  // Add blocks count to response
  const districtWithStats = {
    ...district.toObject(),
    blocksCount
  };

  successResponse(res, districtWithStats, 'District retrieved successfully');
});

/**
 * @desc Update district
 * @route PUT /api/districts/:id
 * @access Admin only
 */
export const updateDistrict = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = { ...req.body };

  // Prevent updating critical fields
  delete updateData.districtId;
  delete updateData.createdBy;
  delete updateData.createdAt;

  updateData.updatedBy = req.user._id;

  const district = await District.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  )
    .populate('districtOfficer.userId', 'personalInfo contactInfo')
    .populate('updatedBy', 'personalInfo');

  if (!district) {
    return notFoundResponse(res, 'District not found');
  }

  updatedResponse(res, district, 'District updated successfully');
});

/**
 * @desc Delete district (soft delete)
 * @route DELETE /api/districts/:id
 * @access Admin only
 */
export const deleteDistrict = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if district has blocks
  const blocksCount = await Block.countDocuments({ districtId: id });
  if (blocksCount > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete district. It has ${blocksCount} blocks associated with it.`
    });
  }

  const district = await District.findByIdAndUpdate(
    id,
    { 
      status: 'inactive',
      updatedBy: req.user._id
    },
    { new: true }
  );

  if (!district) {
    return notFoundResponse(res, 'District not found');
  }

  successResponse(res, district, 'District deleted successfully');
});

/**
 * @desc Assign district officer
 * @route POST /api/districts/:id/assign-officer
 * @access Admin only
 */
export const assignDistrictOfficer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId, contactNumber, email } = req.body;

  // Verify user exists and has appropriate role
  const user = await User.findById(userId);
  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'User not found'
    });
  }

  if (!['admin', 'health_official'].includes(user.roleInfo.role)) {
    return res.status(400).json({
      success: false,
      message: 'User must be an admin or health official to be assigned as district officer'
    });
  }

  const district = await District.findByIdAndUpdate(
    id,
    {
      districtOfficer: {
        userId,
        contactNumber,
        email: email || user.contactInfo.email,
        appointedDate: new Date()
      },
      updatedBy: req.user._id
    },
    { new: true }
  ).populate('districtOfficer.userId', 'personalInfo contactInfo');

  if (!district) {
    return notFoundResponse(res, 'District not found');
  }

  successResponse(res, district, 'District officer assigned successfully');
});

/**
 * @desc Remove district officer
 * @route DELETE /api/districts/:id/remove-officer
 * @access Admin only
 */
export const removeDistrictOfficer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const district = await District.findByIdAndUpdate(
    id,
    {
      $unset: { districtOfficer: 1 },
      updatedBy: req.user._id
    },
    { new: true }
  );

  if (!district) {
    return notFoundResponse(res, 'District not found');
  }

  successResponse(res, district, 'District officer removed successfully');
});

/**
 * @desc Generate block registration token
 * @route POST /api/districts/:id/blocks/token
 * @access Admin, District Officer
 */
export const generateBlockToken = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { blockName, expiryDate, notes } = req.body;

  const district = await District.findById(id);
  if (!district) {
    return notFoundResponse(res, 'District not found');
  }

  // Check if block registration is enabled
  if (!district.blockRegistration.registrationEnabled) {
    return res.status(400).json({
      success: false,
      message: 'Block registration is currently disabled for this district'
    });
  }

  // Check max blocks limit
  const currentBlocksCount = await Block.countDocuments({ districtId: id });
  if (currentBlocksCount >= district.blockRegistration.maxBlocksAllowed) {
    return res.status(400).json({
      success: false,
      message: 'Maximum number of blocks reached for this district'
    });
  }

  // Generate unique token
  const token = await generateBlockRegistrationToken();

  // Calculate expiry date
  const tokenExpiryDate = expiryDate 
    ? new Date(expiryDate)
    : new Date(Date.now() + district.blockRegistration.tokenValidityDays * 24 * 60 * 60 * 1000);

  // Add token to district
  const tokenData = {
    token,
    blockName,
    generatedBy: req.user._id,
    generatedAt: new Date(),
    expiryDate: tokenExpiryDate,
    isUsed: false,
    notes
  };

  district.blockRegistration.registrationTokens.push(tokenData);
  await district.save();

  const newToken = district.blockRegistration.registrationTokens[
    district.blockRegistration.registrationTokens.length - 1
  ];

  // Populate generated by user
  await district.populate('blockRegistration.registrationTokens.generatedBy', 'personalInfo');

  createdResponse(res, newToken, 'Block registration token generated successfully');
});

/**
 * @desc Get block tokens for district
 * @route GET /api/districts/:id/blocks/tokens
 * @access Admin, District Officer
 */
export const getBlockTokens = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { used, expired } = req.query;

  const district = await District.findById(id)
    .populate('blockRegistration.registrationTokens.generatedBy', 'personalInfo');

  if (!district) {
    return notFoundResponse(res, 'District not found');
  }

  let tokens = district.blockRegistration.registrationTokens;

  // Filter by usage status
  if (used !== undefined) {
    tokens = tokens.filter(token => token.isUsed === (used === 'true'));
  }

  // Filter by expiry status
  if (expired !== undefined) {
    const now = new Date();
    if (expired === 'true') {
      tokens = tokens.filter(token => token.expiryDate < now);
    } else {
      tokens = tokens.filter(token => token.expiryDate >= now);
    }
  }

  successResponse(res, tokens, 'Block tokens retrieved successfully');
});


/**
 * @desc Revoke block token
 * @route DELETE /api/districts/:id/blocks/tokens/:tokenId
 * @access Admin, District Officer
 */
export const revokeBlockToken = asyncHandler(async (req, res) => {
  const { id, tokenId } = req.params;

  const district = await District.findById(id);
  if (!district) {
    return notFoundResponse(res, 'District not found');
  }

  const token = district.blockRegistration.registrationTokens.id(tokenId);
  if (!token) {
    return res.status(404).json({
      success: false,
      message: 'Token not found'
    });
  }

  if (token.isUsed) {
    return res.status(400).json({
      success: false,
      message: 'Cannot revoke a used token'
    });
  }

  token.remove();
  await district.save();

  successResponse(res, null, 'Token revoked successfully');
});

/**
 * @desc Validate block token
 * @route POST /api/districts/validate-token
 * @access Health Officials
 */
export const validateBlockToken = asyncHandler(async (req, res) => {
  const { token } = req.body;

  const district = await District.findOne({
    'blockRegistration.registrationTokens.token': token,
    'blockRegistration.registrationTokens.isUsed': false
  });

  if (!district) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or already used token'
    });
  }

  const tokenData = district.blockRegistration.registrationTokens.find(
    t => t.token === token && !t.isUsed
  );

  if (tokenData.expiryDate < new Date()) {
    return res.status(400).json({
      success: false,
      message: 'Token has expired'
    });
  }

  successResponse(res, { 
    district: {
      _id: district._id,
      name: district.name,
      state: district.state,
      districtId: district.districtId
    },
    tokenData: {
      blockName: tokenData.blockName,
      expiryDate: tokenData.expiryDate,
      generatedAt: tokenData.generatedAt
    }
  }, 'Token is valid');
});

/**
 * @desc Get district statistics
 * @route GET /api/districts/:id/stats
 * @access Admin, Health Officials
 */
export const getDistrictStats = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const district = await District.findById(id);
  if (!district) {
    return notFoundResponse(res, 'District not found');
  }

  // Aggregate statistics
  const stats = await District.aggregate([
    { $match: { _id: district._id } },
    {
      $lookup: {
        from: 'blocks',
        localField: '_id',
        foreignField: 'districtId',
        as: 'blocks'
      }
    },
    {
      $project: {
        name: 1,
        state: 1,
        demographics: 1,
        healthInfrastructure: 1,
        totalBlocks: { $size: '$blocks' },
        activeBlocks: {
          $size: {
            $filter: {
              input: '$blocks',
              cond: { $eq: ['$$this.status', 'active'] }
            }
          }
        },
        totalVillages: { $sum: '$blocks.demographics.totalVillages' },
        totalPopulation: '$demographics.totalPopulation',
        availableTokens: {
          $size: {
            $filter: {
              input: '$blockRegistration.registrationTokens',
              cond: { $eq: ['$$this.isUsed', false] }
            }
          }
        }
      }
    }
  ]);

  successResponse(res, stats[0], 'District statistics retrieved successfully');
});

/**
 * @desc Get district dashboard data
 * @route GET /api/districts/:id/dashboard
 * @access Admin, District Officer
 */
export const getDistrictDashboard = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const district = await District.findById(id)
    .populate('districtOfficer.userId', 'personalInfo');

  if (!district) {
    return notFoundResponse(res, 'District not found');
  }

  // Get recent blocks
  const recentBlocks = await Block.find({ districtId: id })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('blockOfficer.userId', 'personalInfo');

  // Get statistics
  const stats = await District.aggregate([
    { $match: { _id: district._id } },
    {
      $lookup: {
        from: 'blocks',
        localField: '_id',
        foreignField: 'districtId',
        as: 'blocks'
      }
    },
    {
      $project: {
        totalBlocks: { $size: '$blocks' },
        activeBlocks: {
          $size: {
            $filter: {
              input: '$blocks',
              cond: { $eq: ['$$this.status', 'active'] }
            }
          }
        },
        pendingBlocks: {
          $size: {
            $filter: {
              input: '$blocks',
              cond: { $eq: ['$$this.status', 'pending_approval'] }
            }
          }
        },
        totalVillages: { $sum: '$blocks.demographics.totalVillages' }
      }
    }
  ]);

  const dashboardData = {
    district: {
      _id: district._id,
      name: district.name,
      state: district.state,
      districtId: district.districtId,
      districtOfficer: district.districtOfficer
    },
    statistics: stats[0] || {
      totalBlocks: 0,
      activeBlocks: 0,
      pendingBlocks: 0,
      totalVillages: 0
    },
    recentBlocks
  };

  successResponse(res, dashboardData, 'Dashboard data retrieved successfully');
});

/**
 * @desc Get blocks for a district
 * @route GET /api/districts/:id/blocks
 * @access All authenticated users
 */
export const getDistrictBlocks = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 10, status, search } = req.query;

  const district = await District.findById(id);
  if (!district) {
    return notFoundResponse(res, 'District not found');
  }

  // Build filter
  const filter = { districtId: id };
  
  if (status && status !== 'all') {
    filter.status = status;
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { blockId: { $regex: search, $options: 'i' } }
    ];
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    populate: [
      {
        path: 'blockOfficer.userId',
        select: 'personalInfo contactInfo'
      }
    ]
  };

  const blocks = await Block.paginate(filter, options);

  const pagination = {
    totalDocs: blocks.totalDocs,
    limit: blocks.limit,
    totalPages: blocks.totalPages,
    page: blocks.page,
    pagingCounter: blocks.pagingCounter,
    hasPrevPage: blocks.hasPrevPage,
    hasNextPage: blocks.hasNextPage,
    prevPage: blocks.prevPage,
    nextPage: blocks.nextPage
  };

  paginatedResponse(res, blocks.docs, pagination, 'District blocks retrieved successfully');
});

/**
 * @desc Update district status
 * @route PATCH /api/districts/:id/status
 * @access Admin only
 */
export const updateDistrictStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  const district = await District.findByIdAndUpdate(
    id,
    { 
      status, 
      updatedBy: req.user._id,
      ...(reason && { statusUpdateReason: reason })
    },
    { new: true }
  );

  if (!district) {
    return notFoundResponse(res, 'District not found');
  }

  successResponse(res, district, `District status updated to ${status}`);
});

/**
 * @desc Search districts
 * @route POST /api/districts/search
 * @access All authenticated users
 */
export const searchDistricts = asyncHandler(async (req, res) => {
  const {
    query,
    state,
    districtOfficer,
    demographics,
    healthInfrastructure
  } = req.body;

  const filter = {};

  // Text search
  if (query) {
    filter.$or = [
      { name: { $regex: query, $options: 'i' } },
      { code: { $regex: query, $options: 'i' } },
      { districtId: { $regex: query, $options: 'i' } }
    ];
  }

  // State filter
  if (state) {
    filter.state = state;
  }

  // District officer filter
  if (districtOfficer) {
    filter['districtOfficer.userId'] = districtOfficer;
  }

  // Demographics filter
  if (demographics) {
    if (demographics.minPopulation || demographics.maxPopulation) {
      filter['demographics.totalPopulation'] = {};
      if (demographics.minPopulation) {
        filter['demographics.totalPopulation'].$gte = demographics.minPopulation;
      }
      if (demographics.maxPopulation) {
        filter['demographics.totalPopulation'].$lte = demographics.maxPopulation;
      }
    }
  }

  // Health infrastructure filter
  if (healthInfrastructure) {
    if (healthInfrastructure.minHospitals) {
      filter['healthInfrastructure.districtHospitals'] = {
        $gte: healthInfrastructure.minHospitals
      };
    }
  }

  const districts = await District.find(filter)
    .populate('districtOfficer.userId', 'personalInfo')
    .sort({ createdAt: -1 })
    .limit(50);

  successResponse(res, districts, 'Search results retrieved successfully');
});