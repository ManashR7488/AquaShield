import Block from '../models/block.model.js';
import District from '../models/district.model.js';
import User from '../models/user.model.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  successResponse,
  createdResponse,
  updatedResponse,
  notFoundResponse,
  paginatedResponse
} from '../utils/responseHelper.js';
import { generateBlockId } from '../utils/idGenerator.js';

/**
 * @desc Create new block (Admin direct creation)
 * @route POST /api/blocks
 * @access Admin only
 */
export const createBlock = asyncHandler(async (req, res) => {
  const {
    name,
    blockType,
    districtId,
    boundaries,
    demographics,
    healthInfrastructure,
    blockOfficer,
    administrativeInfo
  } = req.body;

  // Verify district exists
  const district = await District.findById(districtId);
  if (!district) {
    return res.status(400).json({
      success: false,
      message: 'District not found'
    });
  }

  // Check if block name already exists in the district
  const existingBlock = await Block.findOne({
    districtId,
    name: new RegExp(`^${name}$`, 'i')
  });

  if (existingBlock) {
    return res.status(400).json({
      success: false,
      message: 'Block with this name already exists in the district'
    });
  }

  // Generate unique block ID
  const blockId = await generateBlockId(district.districtId);

  // Create block object
  const blockData = {
    blockId,
    name,
    blockType,
    districtId,
    boundaries,
    demographics,
    healthInfrastructure,
    administrativeInfo,
    registeredBy: req.user._id,
    status: 'active' // Direct creation by admin is automatically active
  };

  // Add block officer if provided
  if (blockOfficer?.userId) {
    const officer = await User.findById(blockOfficer.userId);
    if (!officer) {
      return res.status(400).json({
        success: false,
        message: 'Block officer not found'
      });
    }

    blockData.blockOfficer = {
      ...blockOfficer,
      appointedDate: new Date()
    };
  }

  const block = await Block.create(blockData);

  // Populate references
  await block.populate([
    {
      path: 'districtId',
      select: 'name state districtId'
    },
    {
      path: 'blockOfficer.userId',
      select: 'personalInfo contactInfo'
    },
    {
      path: 'registeredBy',
      select: 'personalInfo'
    }
  ]);

  createdResponse(res, block, 'Block created successfully');
});

/**
 * @desc Register new block using token
 * @route POST /api/blocks/register
 * @access Health Officials
 */
export const registerBlock = asyncHandler(async (req, res) => {
  const {
    token,
    name,
    blockType,
    boundaries,
    demographics,
    healthInfrastructure,
    blockOfficer,
    administrativeInfo
  } = req.body;

  // Validate token and get district
  const district = await District.findOne({
    'blockRegistration.registrationTokens.token': token,
    'blockRegistration.registrationTokens.isUsed': false
  });

  if (!district) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or already used registration token'
    });
  }

  const tokenData = district.blockRegistration.registrationTokens.find(
    t => t.token === token && !t.isUsed
  );

  if (tokenData.expiryDate < new Date()) {
    return res.status(400).json({
      success: false,
      message: 'Registration token has expired'
    });
  }

  // Check if block name already exists in the district
  const existingBlock = await Block.findOne({
    districtId: district._id,
    name: new RegExp(`^${name}$`, 'i')
  });

  if (existingBlock) {
    return res.status(400).json({
      success: false,
      message: 'Block with this name already exists in the district'
    });
  }

  // Check blocks limit
  const currentBlocksCount = await Block.countDocuments({ 
    districtId: district._id,
    status: { $ne: 'rejected' }
  });

  if (currentBlocksCount >= district.blockRegistration.maxBlocksAllowed) {
    return res.status(400).json({
      success: false,
      message: 'Maximum number of blocks reached for this district'
    });
  }

  // Generate unique block ID
  const blockId = await generateBlockId(district.districtId);

  // Create block object
  const blockData = {
    blockId,
    name,
    blockType,
    districtId: district._id,
    boundaries,
    demographics,
    healthInfrastructure,
    administrativeInfo,
    registrationToken: token,
    registeredBy: req.user._id,
    status: district.blockRegistration.requiresApproval ? 'pending_approval' : 'active'
  };

  // Add block officer if provided
  if (blockOfficer?.userId) {
    const officer = await User.findById(blockOfficer.userId);
    if (!officer) {
      return res.status(400).json({
        success: false,
        message: 'Block officer not found'
      });
    }

    blockData.blockOfficer = {
      ...blockOfficer,
      appointedDate: new Date()
    };
  }

  const block = await Block.create(blockData);

  // Mark token as used
  tokenData.isUsed = true;
  tokenData.usedBy = req.user._id;
  tokenData.usedAt = new Date();
  tokenData.blockId = block._id;
  await district.save();

  // Populate references
  await block.populate([
    {
      path: 'districtId',
      select: 'name state districtId'
    },
    {
      path: 'blockOfficer.userId',
      select: 'personalInfo contactInfo'
    },
    {
      path: 'registeredBy',
      select: 'personalInfo'
    }
  ]);

  createdResponse(res, block, 'Block registered successfully');
});

/**
 * @desc Get all blocks with pagination and filtering
 * @route GET /api/blocks
 * @access All authenticated users
 */
export const getBlocks = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    districtId,
    blockType,
    status = 'all',
    sortBy = 'createdAt',
    sortOrder = 'desc',
    hasBlockOfficer,
    minPopulation,
    maxPopulation,
    state
  } = req.query;

  // Build filter
  const filter = {};

  if (status !== 'all') {
    filter.status = status;
  }

  if (districtId) {
    filter.districtId = districtId;
  }

  if (blockType) {
    filter.blockType = blockType;
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { blockId: { $regex: search, $options: 'i' } }
    ];
  }

  if (hasBlockOfficer !== undefined) {
    if (hasBlockOfficer === 'true') {
      filter['blockOfficer.userId'] = { $exists: true };
    } else {
      filter['blockOfficer.userId'] = { $exists: false };
    }
  }

  if (minPopulation || maxPopulation) {
    filter['demographics.totalPopulation'] = {};
    if (minPopulation) filter['demographics.totalPopulation'].$gte = parseInt(minPopulation);
    if (maxPopulation) filter['demographics.totalPopulation'].$lte = parseInt(maxPopulation);
  }

  // Handle state filter through district lookup
  let aggregationPipeline = [];
  
  if (state) {
    aggregationPipeline.push({
      $lookup: {
        from: 'districts',
        localField: 'districtId',
        foreignField: '_id',
        as: 'district'
      }
    });
    aggregationPipeline.push({
      $match: {
        'district.state': state,
        ...filter
      }
    });
  } else {
    aggregationPipeline.push({ $match: filter });
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
        path: 'districtId',
        select: 'name state districtId'
      },
      {
        path: 'blockOfficer.userId',
        select: 'personalInfo contactInfo roleInfo'
      },
      {
        path: 'registeredBy',
        select: 'personalInfo'
      }
    ]
  };

  let blocks;
  if (state) {
    // Use aggregation for state filter
    const aggregate = Block.aggregate(aggregationPipeline);
    blocks = await Block.aggregatePaginate(aggregate, options);
  } else {
    blocks = await Block.paginate(filter, options);
  }

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

  paginatedResponse(res, blocks.docs, pagination, 'Blocks retrieved successfully');
});

/**
 * @desc Get single block by ID
 * @route GET /api/blocks/:id
 * @access All authenticated users
 */
export const getBlockById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const block = await Block.findById(id)
    .populate('districtId', 'name state districtId')
    .populate('blockOfficer.userId', 'personalInfo contactInfo roleInfo')
    .populate('registeredBy', 'personalInfo')
    .populate('updatedBy', 'personalInfo')
    .populate('approvedBy', 'personalInfo');

  if (!block) {
    return notFoundResponse(res, 'Block not found');
  }

  successResponse(res, block, 'Block retrieved successfully');
});

/**
 * @desc Update block information
 * @route PUT /api/blocks/:id
 * @access Block Officer, District Officer, Admin
 */
export const updateBlock = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = { ...req.body };

  // Prevent updating critical fields
  delete updateData.blockId;
  delete updateData.districtId;
  delete updateData.registrationToken;
  delete updateData.registeredBy;
  delete updateData.createdAt;
  delete updateData.approvedBy;
  delete updateData.approvalDate;

  updateData.updatedBy = req.user._id;

  const block = await Block.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  )
    .populate('districtId', 'name state districtId')
    .populate('blockOfficer.userId', 'personalInfo contactInfo')
    .populate('updatedBy', 'personalInfo');

  if (!block) {
    return notFoundResponse(res, 'Block not found');
  }

  updatedResponse(res, block, 'Block updated successfully');
});

/**
 * @desc Delete block (soft delete)
 * @route DELETE /api/blocks/:id
 * @access Admin, District Officer
 */
export const deleteBlock = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const block = await Block.findByIdAndUpdate(
    id,
    { 
      status: 'inactive',
      updatedBy: req.user._id
    },
    { new: true }
  );

  if (!block) {
    return notFoundResponse(res, 'Block not found');
  }

  successResponse(res, block, 'Block deleted successfully');
});

/**
 * @desc Approve block registration
 * @route POST /api/blocks/:id/approve
 * @access Admin, District Officer
 */
export const approveBlock = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { remarks } = req.body;

  const block = await Block.findById(id);
  if (!block) {
    return notFoundResponse(res, 'Block not found');
  }

  if (block.status !== 'pending_approval') {
    return res.status(400).json({
      success: false,
      message: 'Block is not pending approval'
    });
  }

  block.status = 'active';
  block.approvedBy = req.user._id;
  block.approvalDate = new Date();
  block.approvalRemarks = remarks;
  block.updatedBy = req.user._id;

  await block.save();

  await block.populate([
    {
      path: 'districtId',
      select: 'name state districtId'
    },
    {
      path: 'approvedBy',
      select: 'personalInfo'
    }
  ]);

  successResponse(res, block, 'Block approved successfully');
});

/**
 * @desc Reject block registration
 * @route POST /api/blocks/:id/reject
 * @access Admin, District Officer
 */
export const rejectBlock = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const block = await Block.findById(id);
  if (!block) {
    return notFoundResponse(res, 'Block not found');
  }

  if (block.status !== 'pending_approval') {
    return res.status(400).json({
      success: false,
      message: 'Block is not pending approval'
    });
  }

  block.status = 'rejected';
  block.rejectedBy = req.user._id;
  block.rejectionDate = new Date();
  block.rejectionReason = reason;
  block.updatedBy = req.user._id;

  await block.save();

  await block.populate([
    {
      path: 'districtId',
      select: 'name state districtId'
    },
    {
      path: 'rejectedBy',
      select: 'personalInfo'
    }
  ]);

  successResponse(res, block, 'Block registration rejected');
});

/**
 * @desc Assign block officer
 * @route POST /api/blocks/:id/assign-officer
 * @access Admin, District Officer
 */
export const assignBlockOfficer = asyncHandler(async (req, res) => {
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
      message: 'User must be an admin or health official to be assigned as block officer'
    });
  }

  const block = await Block.findByIdAndUpdate(
    id,
    {
      blockOfficer: {
        userId,
        contactNumber,
        email: email || user.contactInfo.email,
        appointedDate: new Date()
      },
      updatedBy: req.user._id
    },
    { new: true }
  ).populate('blockOfficer.userId', 'personalInfo contactInfo');

  if (!block) {
    return notFoundResponse(res, 'Block not found');
  }

  successResponse(res, block, 'Block officer assigned successfully');
});

/**
 * @desc Remove block officer
 * @route DELETE /api/blocks/:id/remove-officer
 * @access Admin, District Officer
 */
export const removeBlockOfficer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const block = await Block.findByIdAndUpdate(
    id,
    {
      $unset: { blockOfficer: 1 },
      updatedBy: req.user._id
    },
    { new: true }
  );

  if (!block) {
    return notFoundResponse(res, 'Block not found');
  }

  successResponse(res, block, 'Block officer removed successfully');
});

/**
 * @desc Get block statistics
 * @route GET /api/blocks/:id/stats
 * @access All authenticated users
 */
export const getBlockStats = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const block = await Block.findById(id).populate('districtId', 'name state');
  if (!block) {
    return notFoundResponse(res, 'Block not found');
  }

  // Calculate additional statistics
  const stats = {
    basicInfo: {
      name: block.name,
      blockId: block.blockId,
      blockType: block.blockType,
      district: block.districtId,
      status: block.status
    },
    demographics: block.demographics,
    healthInfrastructure: block.healthInfrastructure,
    boundaries: {
      area: block.boundaries.area,
      villages: block.demographics.totalVillages,
      populationDensity: Math.round(block.demographics.totalPopulation / block.boundaries.area)
    },
    healthMetrics: {
      populationPerPHC: block.healthInfrastructure.primaryHealthCenters > 0 
        ? Math.round(block.demographics.totalPopulation / block.healthInfrastructure.primaryHealthCenters)
        : 0,
      populationPerCHC: block.healthInfrastructure.communityHealthCenters > 0
        ? Math.round(block.demographics.totalPopulation / block.healthInfrastructure.communityHealthCenters)
        : 0,
      healthWorkerRatio: {
        anmWorkers: block.healthInfrastructure.anmWorkers || 0,
        ashaWorkers: block.healthInfrastructure.ashaWorkers || 0,
        totalHealthWorkers: (block.healthInfrastructure.anmWorkers || 0) + (block.healthInfrastructure.ashaWorkers || 0)
      }
    },
    registrationInfo: {
      registeredDate: block.createdAt,
      registeredBy: block.registeredBy,
      approvalStatus: block.status,
      approvedDate: block.approvalDate
    }
  };

  successResponse(res, stats, 'Block statistics retrieved successfully');
});

/**
 * @desc Update block status
 * @route PATCH /api/blocks/:id/status
 * @access Admin, District Officer
 */
export const updateBlockStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  const block = await Block.findByIdAndUpdate(
    id,
    { 
      status, 
      updatedBy: req.user._id,
      ...(reason && { statusUpdateReason: reason })
    },
    { new: true }
  );

  if (!block) {
    return notFoundResponse(res, 'Block not found');
  }

  successResponse(res, block, `Block status updated to ${status}`);
});

/**
 * @desc Search blocks
 * @route POST /api/blocks/search
 * @access All authenticated users
 */
export const searchBlocks = asyncHandler(async (req, res) => {
  const {
    query,
    districtId,
    state,
    blockType,
    status,
    demographics,
    healthInfrastructure,
    boundaries
  } = req.body;

  // Build aggregation pipeline
  const pipeline = [];

  // Match stage
  const matchConditions = {};

  if (query) {
    matchConditions.$or = [
      { name: { $regex: query, $options: 'i' } },
      { blockId: { $regex: query, $options: 'i' } }
    ];
  }

  if (districtId) {
    matchConditions.districtId = districtId;
  }

  if (blockType) {
    matchConditions.blockType = blockType;
  }

  if (status) {
    matchConditions.status = status;
  }

  // Demographics filters
  if (demographics) {
    if (demographics.minPopulation || demographics.maxPopulation) {
      matchConditions['demographics.totalPopulation'] = {};
      if (demographics.minPopulation) {
        matchConditions['demographics.totalPopulation'].$gte = demographics.minPopulation;
      }
      if (demographics.maxPopulation) {
        matchConditions['demographics.totalPopulation'].$lte = demographics.maxPopulation;
      }
    }

    if (demographics.minVillages || demographics.maxVillages) {
      matchConditions['demographics.totalVillages'] = {};
      if (demographics.minVillages) {
        matchConditions['demographics.totalVillages'].$gte = demographics.minVillages;
      }
      if (demographics.maxVillages) {
        matchConditions['demographics.totalVillages'].$lte = demographics.maxVillages;
      }
    }
  }

  // Health infrastructure filters
  if (healthInfrastructure) {
    if (healthInfrastructure.minPHCs) {
      matchConditions['healthInfrastructure.primaryHealthCenters'] = {
        $gte: healthInfrastructure.minPHCs
      };
    }
    if (healthInfrastructure.minCHCs) {
      matchConditions['healthInfrastructure.communityHealthCenters'] = {
        $gte: healthInfrastructure.minCHCs
      };
    }
  }

  // Boundaries filters
  if (boundaries) {
    if (boundaries.minArea || boundaries.maxArea) {
      matchConditions['boundaries.area'] = {};
      if (boundaries.minArea) {
        matchConditions['boundaries.area'].$gte = boundaries.minArea;
      }
      if (boundaries.maxArea) {
        matchConditions['boundaries.area'].$lte = boundaries.maxArea;
      }
    }
  }

  pipeline.push({ $match: matchConditions });

  // Lookup district information
  pipeline.push({
    $lookup: {
      from: 'districts',
      localField: 'districtId',
      foreignField: '_id',
      as: 'district'
    }
  });

  pipeline.push({
    $unwind: '$district'
  });

  // State filter (after lookup)
  if (state) {
    pipeline.push({
      $match: { 'district.state': state }
    });
  }

  // Lookup block officer
  pipeline.push({
    $lookup: {
      from: 'users',
      localField: 'blockOfficer.userId',
      foreignField: '_id',
      as: 'blockOfficerDetails'
    }
  });

  // Project final fields
  pipeline.push({
    $project: {
      name: 1,
      blockId: 1,
      blockType: 1,
      status: 1,
      demographics: 1,
      healthInfrastructure: 1,
      boundaries: 1,
      createdAt: 1,
      district: {
        _id: '$district._id',
        name: '$district.name',
        state: '$district.state',
        districtId: '$district.districtId'
      },
      blockOfficer: 1,
      blockOfficerDetails: {
        $arrayElemAt: ['$blockOfficerDetails.personalInfo', 0]
      }
    }
  });

  // Sort
  pipeline.push({
    $sort: { createdAt: -1 }
  });

  // Limit
  pipeline.push({ $limit: 100 });

  const blocks = await Block.aggregate(pipeline);

  successResponse(res, blocks, 'Search results retrieved successfully');
});

/**
 * @desc Get block dashboard data
 * @route GET /api/blocks/:id/dashboard
 * @access Block Officer, District Officer, Admin
 */
export const getBlockDashboard = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const block = await Block.findById(id)
    .populate('districtId', 'name state districtId')
    .populate('blockOfficer.userId', 'personalInfo contactInfo');

  if (!block) {
    return notFoundResponse(res, 'Block not found');
  }

  // Calculate dashboard metrics
  const dashboardData = {
    block: {
      _id: block._id,
      name: block.name,
      blockId: block.blockId,
      blockType: block.blockType,
      status: block.status,
      district: block.districtId,
      blockOfficer: block.blockOfficer
    },
    demographics: {
      totalPopulation: block.demographics.totalPopulation,
      totalVillages: block.demographics.totalVillages,
      malePopulation: block.demographics.malePopulation,
      femalePopulation: block.demographics.femalePopulation,
      literacyRate: block.demographics.literacyRate,
      childrenUnder5: block.demographics.childrenUnder5,
      womenOfReproductiveAge: block.demographics.womenOfReproductiveAge
    },
    healthInfrastructure: {
      primaryHealthCenters: block.healthInfrastructure.primaryHealthCenters,
      communityHealthCenters: block.healthInfrastructure.communityHealthCenters,
      subHealthCenters: block.healthInfrastructure.subHealthCenters,
      anmWorkers: block.healthInfrastructure.anmWorkers,
      ashaWorkers: block.healthInfrastructure.ashaWorkers,
      totalBeds: block.healthInfrastructure.totalBeds
    },
    metrics: {
      populationDensity: Math.round(block.demographics.totalPopulation / block.boundaries.area),
      villagesPerSHC: block.healthInfrastructure.subHealthCenters > 0 
        ? Math.round(block.demographics.totalVillages / block.healthInfrastructure.subHealthCenters)
        : 0,
      populationPerPHC: block.healthInfrastructure.primaryHealthCenters > 0 
        ? Math.round(block.demographics.totalPopulation / block.healthInfrastructure.primaryHealthCenters)
        : 0
    },
    registrationInfo: {
      registeredDate: block.createdAt,
      approvalDate: block.approvalDate,
      status: block.status
    }
  };

  successResponse(res, dashboardData, 'Block dashboard data retrieved successfully');
});

/**
 * @desc Get pending approvals for district officer
 * @route GET /api/blocks/pending-approvals
 * @access District Officer, Admin
 */
export const getPendingApprovals = asyncHandler(async (req, res) => {
  const { districtId } = req.query;
  
  const filter = { status: 'pending_approval' };
  
  // If user is district officer, filter by their district
  if (req.user.roleInfo.role !== 'admin' && districtId) {
    filter.districtId = districtId;
  }

  const pendingBlocks = await Block.find(filter)
    .populate('districtId', 'name state districtId')
    .populate('registeredBy', 'personalInfo contactInfo')
    .sort({ createdAt: -1 });

  successResponse(res, pendingBlocks, 'Pending approvals retrieved successfully');
});