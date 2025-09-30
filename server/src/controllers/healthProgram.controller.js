import mongoose from 'mongoose';
import HealthProgram from '../models/healthProgram.model.js';
import { handleAlertSystemIntegration } from '../utils/notificationService.js';
import { 
  successResponse, 
  createdResponse, 
  updatedResponse, 
  deletedResponse, 
  notFoundResponse, 
  paginatedResponse,
  getPaginationData 
} from '../utils/responseHelper.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * Health Program Controller
 * Program management with enrollment and tracking
 */

/**
 * Create new health program
 * POST /api/health-programs
 */
const createProgram = asyncHandler(async (req, res) => {
  const programData = {
    ...req.body,
    createdBy: req.user._id,
    createdAt: new Date(),
    status: 'planning'
  };

  const program = new HealthProgram(programData);
  await program.save();

  // Populate related data for response
  await program.populate([
    { path: 'createdBy', select: 'personalInfo.firstName personalInfo.lastName roleInfo.role' },
    { path: 'targetAreas.villages', select: 'name block district' },
    { path: 'assignedStaff.coordinator', select: 'personalInfo.firstName personalInfo.lastName' }
  ]);

  return createdResponse(res, program, 'Health program created successfully');
});

/**
 * Get health programs with filtering and pagination
 * GET /api/health-programs
 */
const getPrograms = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    programType,
    villageId,
    startDateFrom,
    startDateTo,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build filter object
  const filter = {};
  
  if (status) filter.status = status;
  if (programType) filter.programType = programType;
  if (villageId) filter['targetAreas.villages'] = villageId;
  
  // Date range filters
  if (startDateFrom || startDateTo) {
    filter.startDate = {};
    if (startDateFrom) filter.startDate.$gte = new Date(startDateFrom);
    if (startDateTo) filter.startDate.$lte = new Date(startDateTo);
  }

  // Text search
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  // Calculate pagination
  const total = await HealthProgram.countDocuments(filter);
  const paginationData = getPaginationData(page, limit, total);

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // Execute query
  const programs = await HealthProgram.find(filter)
    .populate([
      { path: 'createdBy', select: 'personalInfo.firstName personalInfo.lastName roleInfo.role' },
      { path: 'targetAreas.villages', select: 'name block district' },
      { path: 'assignedStaff.coordinator', select: 'personalInfo.firstName personalInfo.lastName' }
    ])
    .sort(sort)
    .skip(paginationData.skip)
    .limit(paginationData.itemsPerPage);

  return paginatedResponse(res, programs, paginationData, 'Health programs retrieved successfully');
});

/**
 * Get single health program by ID
 * GET /api/health-programs/:id
 */
const getProgramById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const program = await HealthProgram.findById(id)
    .populate([
      { path: 'createdBy', select: 'personalInfo.firstName personalInfo.lastName roleInfo.role' },
      { path: 'targetAreas.villages', select: 'name block district coordinates' },
      { path: 'assignedStaff.coordinator', select: 'personalInfo.firstName personalInfo.lastName authentication.phone' },
      { path: 'assignedStaff.fieldWorkers', select: 'personalInfo.firstName personalInfo.lastName roleInfo.role' },
      { path: 'enrollments.enrolledBy', select: 'personalInfo.firstName personalInfo.lastName' },
      { path: 'progress.milestones.completedBy', select: 'personalInfo.firstName personalInfo.lastName' }
    ]);

  if (!program) {
    return notFoundResponse(res, 'Health program not found');
  }

  return successResponse(res, program, 'Health program retrieved successfully');
});

/**
 * Update health program
 * PUT /api/health-programs/:id
 */
const updateProgram = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const program = await HealthProgram.findById(id);
  
  if (!program) {
    return notFoundResponse(res, 'Health program not found');
  }

  // Authorization check - only coordinators, health officials, and admins can update
  const userRole = req.user.roleInfo.role;
  const isCoordinator = program.assignedStaff?.coordinator?.toString() === req.user._id.toString();
  const canUpdate = isCoordinator || ['admin', 'health_official'].includes(userRole);

  if (!canUpdate) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only program coordinators or health officials can update programs.'
    });
  }

  // Prevent changing critical fields
  delete updates.createdBy;
  delete updates.createdAt;

  // Apply updates
  Object.assign(program, updates);
  program.updatedAt = new Date();

  await program.save();

  // Populate for response
  await program.populate([
    { path: 'assignedStaff.coordinator', select: 'personalInfo.firstName personalInfo.lastName' },
    { path: 'targetAreas.villages', select: 'name block district' }
  ]);

  return updatedResponse(res, program, 'Health program updated successfully');
});

/**
 * Enroll patient in health program
 * POST /api/health-programs/:id/enroll
 */
const enrollPatient = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { patientId, enrollmentType, notes } = req.body;

  const program = await HealthProgram.findById(id);
  
  if (!program) {
    return notFoundResponse(res, 'Health program not found');
  }

  // Check if patient is already enrolled
  const existingEnrollment = program.enrollments.find(
    enrollment => enrollment.patientId.toString() === patientId && enrollment.status === 'active'
  );

  if (existingEnrollment) {
    return res.status(400).json({
      success: false,
      message: 'Patient is already enrolled in this program'
    });
  }

  // Add enrollment
  program.enrollments.push({
    patientId,
    enrollmentType: enrollmentType || 'voluntary',
    enrolledBy: req.user._id,
    enrollmentDate: new Date(),
    status: 'active',
    notes
  });

  program.statistics.totalEnrollments = program.enrollments.length;
  program.statistics.activeEnrollments = program.enrollments.filter(e => e.status === 'active').length;

  await program.save();

  return updatedResponse(res, program, 'Patient enrolled successfully');
});

/**
 * Unenroll patient from health program
 * DELETE /api/health-programs/:id/enroll/:patientId
 */
const unenrollPatient = asyncHandler(async (req, res) => {
  const { id, patientId } = req.params;
  const { reason } = req.body;

  const program = await HealthProgram.findById(id);
  
  if (!program) {
    return notFoundResponse(res, 'Health program not found');
  }

  // Find and update enrollment
  const enrollment = program.enrollments.find(
    e => e.patientId.toString() === patientId && e.status === 'active'
  );

  if (!enrollment) {
    return res.status(404).json({
      success: false,
      message: 'Active enrollment not found for this patient'
    });
  }

  enrollment.status = 'completed';
  enrollment.completionDate = new Date();
  enrollment.completionReason = reason || 'Manual unenrollment';

  program.statistics.activeEnrollments = program.enrollments.filter(e => e.status === 'active').length;
  program.statistics.completedEnrollments = program.enrollments.filter(e => e.status === 'completed').length;

  await program.save();

  return updatedResponse(res, program, 'Patient unenrolled successfully');
});

/**
 * Get program enrollments
 * GET /api/health-programs/:id/enrollments
 */
const getEnrollmentsByProgram = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 10, status = 'active' } = req.query;

  const program = await HealthProgram.findById(id)
    .populate({
      path: 'enrollments.patientId',
      select: 'personalInfo patientId location',
      populate: {
        path: 'location.villageId',
        select: 'name block district'
      }
    })
    .populate({
      path: 'enrollments.enrolledBy',
      select: 'personalInfo.firstName personalInfo.lastName roleInfo.role'
    });

  if (!program) {
    return notFoundResponse(res, 'Health program not found');
  }

  // Filter enrollments by status
  let enrollments = program.enrollments;
  if (status !== 'all') {
    enrollments = enrollments.filter(enrollment => enrollment.status === status);
  }

  // Apply pagination
  const total = enrollments.length;
  const paginationData = getPaginationData(page, limit, total);
  const startIndex = paginationData.skip;
  const endIndex = startIndex + paginationData.itemsPerPage;
  const paginatedEnrollments = enrollments.slice(startIndex, endIndex);

  return paginatedResponse(res, paginatedEnrollments, paginationData, 'Program enrollments retrieved successfully');
});

/**
 * Get programs by village
 * GET /api/health-programs/village/:villageId
 */
const getProgramsByVillage = asyncHandler(async (req, res) => {
  const { villageId } = req.params;
  const { page = 1, limit = 10, status = 'active' } = req.query;

  const filter = {
    'targetAreas.villages': villageId
  };

  if (status !== 'all') {
    filter.status = status;
  }

  const total = await HealthProgram.countDocuments(filter);
  const paginationData = getPaginationData(page, limit, total);

  const programs = await HealthProgram.find(filter)
    .populate([
      { path: 'assignedStaff.coordinator', select: 'personalInfo.firstName personalInfo.lastName' },
      { path: 'targetAreas.villages', select: 'name' }
    ])
    .sort({ startDate: -1 })
    .skip(paginationData.skip)
    .limit(paginationData.itemsPerPage);

  return paginatedResponse(res, programs, paginationData, 'Village programs retrieved successfully');
});

/**
 * Get program statistics
 * GET /api/health-programs/stats/summary
 */
const getProgramStats = asyncHandler(async (req, res) => {
  const { villageId, programType } = req.query;

  const matchFilter = {};
  if (villageId) matchFilter['targetAreas.villages'] = new mongoose.Types.ObjectId(villageId);
  if (programType) matchFilter.programType = programType;

  const stats = await HealthProgram.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: null,
        totalPrograms: { $sum: 1 },
        activePrograms: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        completedPrograms: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        totalEnrollments: { $sum: '$statistics.totalEnrollments' },
        activeEnrollments: { $sum: '$statistics.activeEnrollments' },
        totalBudget: { $sum: '$budget.totalBudget' },
        avgDuration: {
          $avg: {
            $divide: [
              { $subtract: ['$endDate', '$startDate'] },
              86400000 // Convert to days
            ]
          }
        }
      }
    }
  ]);

  const programTypeStats = await HealthProgram.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: '$programType',
        count: { $sum: 1 },
        totalEnrollments: { $sum: '$statistics.totalEnrollments' }
      }
    }
  ]);

  const result = {
    overall: stats[0] || {
      totalPrograms: 0,
      activePrograms: 0,
      completedPrograms: 0,
      totalEnrollments: 0,
      activeEnrollments: 0,
      totalBudget: 0,
      avgDuration: 0
    },
    byProgramType: programTypeStats
  };

  return successResponse(res, result, 'Program statistics retrieved successfully');
});

/**
 * Delete health program (soft delete)
 * DELETE /api/health-programs/:id
 */
const deleteProgram = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Only admin can delete programs
  if (req.user.roleInfo.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only administrators can delete health programs.'
    });
  }

  const program = await HealthProgram.findById(id);
  
  if (!program) {
    return notFoundResponse(res, 'Health program not found');
  }

  program.status = 'cancelled';
  program.updatedAt = new Date();

  await program.save();

  return updatedResponse(res, program, 'Health program cancelled successfully');
});

export {
  createProgram,
  getPrograms,
  getProgramById,
  updateProgram,
  enrollPatient,
  unenrollPatient,
  getEnrollmentsByProgram,
  getProgramsByVillage,
  getProgramStats,
  deleteProgram
};