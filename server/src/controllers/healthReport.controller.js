import mongoose from 'mongoose';
import HealthReport from '../models/healthReport.model.js';
import { handleAlertSystemIntegration } from '../utils/notificationService.js';
import { 
  successResponse, 
  createdResponse, 
  updatedResponse, 
  deletedResponse, 
  notFoundResponse, 
  errorResponse,
  paginatedResponse,
  getPaginationData 
} from '../utils/responseHelper.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * Health Report Controller
 * Report management and workflow with notification integration
 */

/**
 * Create new health report
 * POST /api/health-reports
 */
const createReport = asyncHandler(async (req, res) => {
  const reportData = {
    ...req.body,
    reporter: req.user._id,
    reportDate: new Date(),
    status: 'draft',
    workflow: {
      currentStage: 'initial_submission',
      submittedAt: new Date(),
      submittedBy: req.user._id
    }
  };

  // Set initial status based on priority and urgency
  if (reportData.urgencyLevel === 'emergency' || reportData.priority === 'urgent') {
    reportData.status = 'submitted';
    reportData.workflow.currentStage = 'under_review';
  }

  const healthReport = new HealthReport(reportData);
  await healthReport.save();

  // Populate related data for response
  await healthReport.populate([
    { path: 'reporter', select: 'personalInfo.firstName personalInfo.lastName roleInfo.role' },
    { path: 'location.villageId', select: 'name block district' }
  ]);

  // Trigger notifications based on priority level
  if (['urgent', 'high'].includes(reportData.priority) || reportData.urgencyLevel === 'emergency') {
    try {
      let alertType = 'system_alert';
      let alertLevel = 'warning';

      if (reportData.reportType === 'disease_outbreak') {
        alertType = 'disease_outbreak_notification';
        alertLevel = 'urgent';
      } else if (reportData.reportType === 'emergency_alert') {
        alertType = 'health_emergency';
        alertLevel = 'emergency';
      } else if (reportData.reportType === 'water_quality_concern') {
        alertType = 'water_contamination_warning';
        alertLevel = 'urgent';
      }

      const alertData = {
        alertType,
        title: `Health Report Alert - ${reportData.title}`,
        messageContent: `New ${reportData.reportType.replace('_', ' ')} report requires attention. Priority: ${reportData.priority}`,
        alertLevel,
        priority: {
          level: reportData.urgencyLevel === 'emergency' ? 'emergency' : reportData.priority,
          justification: 'High priority health report requiring immediate review'
        },
        affectedAreas: {
          villages: [reportData.location.villageId]
        },
        source: {
          triggeredBy: 'user',
          sourceId: healthReport._id,
          sourceModel: 'HealthReport'
        }
      };

      await handleAlertSystemIntegration(alertData);
    } catch (alertError) {
      console.error('Failed to send health report alert:', alertError);
      // Don't fail the main operation if alert fails
    }
  }

  return createdResponse(res, healthReport, 'Health report created successfully');
});

/**
 * Get health reports with filtering and pagination
 * GET /api/health-reports
 */
const getReports = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    reportType,
    status,
    priority,
    urgencyLevel,
    reporter,
    villageId,
    dateFrom,
    dateTo,
    search,
    sortBy = 'reportDate',
    sortOrder = 'desc'
  } = req.query;

  // Build filter object
  const filter = {};
  
  if (reportType) filter.reportType = reportType;
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (urgencyLevel) filter.urgencyLevel = urgencyLevel;
  if (reporter) filter.reporter = reporter;
  if (villageId) filter['location.villageId'] = villageId;

  // Date filters
  if (dateFrom || dateTo) {
    filter.reportDate = {};
    if (dateFrom) filter.reportDate.$gte = new Date(dateFrom);
    if (dateTo) filter.reportDate.$lte = new Date(dateTo);
  }

  // Text search
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  // Role-based access control
  const userRole = req.user.roleInfo.role;
  if (userRole === 'asha_worker' || userRole === 'volunteer') {
    // Users see only their reports unless filtering by specific reporter
    if (!reporter) {
      filter.reporter = req.user._id;
    } else if (reporter !== req.user._id.toString()) {
      // Can only view their own reports
      filter.reporter = req.user._id;
    }
  } else if (userRole === 'health_official') {
    // Health officials see reports in their district
    // In a real implementation, filter by user's assigned district
    // filter['location.district'] = req.user.assignedDistrict;
  }

  // Calculate pagination
  const total = await HealthReport.countDocuments(filter);
  const paginationData = getPaginationData(page, limit, total);

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // Execute query
  const reports = await HealthReport.find(filter)
    .populate([
      { path: 'reporter', select: 'personalInfo.firstName personalInfo.lastName roleInfo.role' },
      { path: 'location.villageId', select: 'name block district' },
      { path: 'workflow.reviewHistory.reviewedBy', select: 'personalInfo.firstName personalInfo.lastName' }
    ])
    .sort(sort)
    .skip(paginationData.skip)
    .limit(paginationData.itemsPerPage);

  return paginatedResponse(res, reports, paginationData, 'Health reports retrieved successfully');
});

/**
 * Get single health report by ID
 * GET /api/health-reports/:id
 */
const getReportById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const report = await HealthReport.findById(id)
    .populate([
      { path: 'reporter', select: 'personalInfo.firstName personalInfo.lastName roleInfo.role authentication.phone' },
      { path: 'location.villageId', select: 'name block district coordinates' },
      { path: 'workflow.reviewHistory.reviewedBy', select: 'personalInfo.firstName personalInfo.lastName roleInfo.role' },
      { path: 'workflow.escalationHistory.escalatedBy', select: 'personalInfo.firstName personalInfo.lastName' },
      { path: 'workflow.escalationHistory.escalatedTo', select: 'personalInfo.firstName personalInfo.lastName' }
    ]);

  if (!report) {
    return notFoundResponse(res, 'Health report not found');
  }

  // Check authorization
  const userRole = req.user.roleInfo.role;
  if (userRole === 'volunteer' || userRole === 'asha_worker') {
    if (report.reporter._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view reports you created.'
      });
    }
  }

  return successResponse(res, report, 'Health report retrieved successfully');
});

/**
 * Update health report (only draft reports)
 * PUT /api/health-reports/:id
 */
const updateReport = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const report = await HealthReport.findById(id);
  
  if (!report) {
    return notFoundResponse(res, 'Health report not found');
  }

  // Only draft reports can be edited
  if (report.status !== 'draft') {
    return res.status(400).json({
      success: false,
      message: 'Only draft reports can be edited'
    });
  }

  // Authorization check - only creator can update
  const isCreator = report.reporter.toString() === req.user._id.toString();
  if (!isCreator && !['admin'].includes(req.user.roleInfo.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only edit reports you created.'
    });
  }

  // Apply updates
  Object.assign(report, updates);
  report.lastUpdated = new Date();

  await report.save();

  // Populate for response
  await report.populate([
    { path: 'reporter', select: 'personalInfo.firstName personalInfo.lastName roleInfo.role' },
    { path: 'location.villageId', select: 'name block district' }
  ]);

  return updatedResponse(res, report, 'Health report updated successfully');
});

/**
 * Review health report (approval workflow)
 * PUT /api/health-reports/:id/review
 */
const reviewReport = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, comments, recommendations, adjustPriority, adjustUrgency, escalateTo, rejectionReason } = req.body;

  const report = await HealthReport.findById(id);
  
  if (!report) {
    return notFoundResponse(res, 'Health report not found');
  }

  // Only health officials and admin can review
  const userRole = req.user.roleInfo.role;
  if (!['health_official', 'admin'].includes(userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only health officials can review reports.'
    });
  }

  // Add review to history
  const reviewEntry = {
    reviewedBy: req.user._id,
    reviewDate: new Date(),
    status,
    comments,
    recommendations: recommendations || []
  };

  if (status === 'rejected' && rejectionReason) {
    reviewEntry.rejectionReason = rejectionReason;
  }

  if (!report.workflow.reviewHistory) {
    report.workflow.reviewHistory = [];
  }
  report.workflow.reviewHistory.push(reviewEntry);

  // Update report status
  report.status = status;
  report.workflow.currentStage = status === 'approved' ? 'approved' : 
                                  status === 'rejected' ? 'rejected' : 
                                  status === 'escalated' ? 'escalated' : 'under_review';

  // Adjust priority if requested
  if (adjustPriority) report.priority = adjustPriority;
  if (adjustUrgency) report.urgencyLevel = adjustUrgency;

  // Handle escalation
  if (status === 'escalated' && escalateTo) {
    const escalationEntry = {
      escalatedBy: req.user._id,
      escalatedTo: escalateTo,
      escalationDate: new Date(),
      escalationReason: comments
    };

    if (!report.workflow.escalationHistory) {
      report.workflow.escalationHistory = [];
    }
    report.workflow.escalationHistory.push(escalationEntry);
  }

  await report.save();

  // Send notifications for review decisions
  if (status === 'approved' || status === 'escalated') {
    try {
      const alertData = {
        alertType: 'administrative_notification',
        title: `Health Report ${status === 'approved' ? 'Approved' : 'Escalated'} - ${report.title}`,
        messageContent: `Your health report has been ${status}. ${comments}`,
        alertLevel: status === 'escalated' ? 'urgent' : 'info',
        priority: {
          level: status === 'escalated' ? 'urgent' : 'medium'
        },
        recipients: {
          targetingType: 'individual',
          userIds: [report.reporter]
        }
      };

      await handleAlertSystemIntegration(alertData);
    } catch (alertError) {
      console.error('Failed to send review notification:', alertError);
    }
  }

  return updatedResponse(res, report, `Health report ${status} successfully`);
});

/**
 * Escalate health report
 * PUT /api/health-reports/:id/escalate
 */
const escalateReport = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { escalateTo, escalationReason, urgencyJustification, additionalEvidence, requestedResources } = req.body;

  const report = await HealthReport.findById(id);
  
  if (!report) {
    return notFoundResponse(res, 'Health report not found');
  }

  // Add escalation to history
  const escalationEntry = {
    escalatedBy: req.user._id,
    escalatedTo: escalateTo,
    escalationDate: new Date(),
    escalationReason,
    urgencyJustification,
    additionalEvidence: additionalEvidence || [],
    requestedResources: requestedResources || []
  };

  if (!report.workflow.escalationHistory) {
    report.workflow.escalationHistory = [];
  }
  report.workflow.escalationHistory.push(escalationEntry);

  // Update status
  report.status = 'escalated';
  report.workflow.currentStage = 'escalated';

  // Increase priority if justified
  if (urgencyJustification && report.priority !== 'urgent') {
    const priorityLevels = ['low', 'medium', 'high', 'urgent'];
    const currentIndex = priorityLevels.indexOf(report.priority);
    if (currentIndex < priorityLevels.length - 1) {
      report.priority = priorityLevels[currentIndex + 1];
    }
  }

  await report.save();

  return updatedResponse(res, report, 'Health report escalated successfully');
});

/**
 * Delete health report
 * DELETE /api/health-reports/:id
 */
const deleteReport = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const report = await HealthReport.findById(id);
  
  if (!report) {
    return notFoundResponse(res, 'Health report not found');
  }

  // Authorization check
  const userRole = req.user.roleInfo.role;
  const isCreator = report.reporter.toString() === req.user._id.toString();
  const canDelete = isCreator && report.status === 'draft' || userRole === 'admin';

  if (!canDelete) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only draft reports can be deleted by their creators.'
    });
  }

  await HealthReport.findByIdAndDelete(id);

  return deletedResponse(res, true, 'Health report deleted successfully');
});

/**
 * Get health reports by village
 * GET /api/health-reports/village/:villageId
 */
const getReportsByVillage = asyncHandler(async (req, res) => {
  const { villageId } = req.params;
  const { page = 1, limit = 10, reportType, status, dateFrom, dateTo } = req.query;

  const filter = { 'location.villageId': villageId };
  
  if (reportType) filter.reportType = reportType;
  if (status) filter.status = status;

  // Date filters
  if (dateFrom || dateTo) {
    filter.reportDate = {};
    if (dateFrom) filter.reportDate.$gte = new Date(dateFrom);
    if (dateTo) filter.reportDate.$lte = new Date(dateTo);
  }

  const total = await HealthReport.countDocuments(filter);
  const paginationData = getPaginationData(page, limit, total);

  const reports = await HealthReport.find(filter)
    .populate([
      { path: 'reporter', select: 'personalInfo.firstName personalInfo.lastName roleInfo.role' }
    ])
    .sort({ reportDate: -1 })
    .skip(paginationData.skip)
    .limit(paginationData.itemsPerPage);

  return paginatedResponse(res, reports, paginationData, 'Village health reports retrieved successfully');
});

/**
 * Get pending reports for review
 * GET /api/health-reports/pending
 */
const getPendingReports = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const filter = { 
    status: { $in: ['submitted', 'under_review'] },
    urgencyLevel: { $in: ['urgent', 'emergency'] }
  };

  const total = await HealthReport.countDocuments(filter);
  const paginationData = getPaginationData(page, limit, total);

  const reports = await HealthReport.find(filter)
    .populate([
      { path: 'reporter', select: 'personalInfo.firstName personalInfo.lastName roleInfo.role' },
      { path: 'location.villageId', select: 'name block district' }
    ])
    .sort({ reportDate: -1, priority: -1 })
    .skip(paginationData.skip)
    .limit(paginationData.itemsPerPage);

  return paginatedResponse(res, reports, paginationData, 'Pending reports retrieved successfully');
});

/**
 * Get report statistics
 * GET /api/health-reports/statistics
 */
const getReportStatistics = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  const statistics = await HealthReport.aggregate([
    {
      $match: {
        reportDate: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalReports: { $sum: 1 },
        byType: {
          $push: {
            type: '$reportType',
            priority: '$priority',
            status: '$status'
          }
        },
        urgentReports: {
          $sum: {
            $cond: [{ $eq: ['$urgencyLevel', 'urgent'] }, 1, 0]
          }
        },
        emergencyReports: {
          $sum: {
            $cond: [{ $eq: ['$urgencyLevel', 'emergency'] }, 1, 0]
          }
        },
        pendingReports: {
          $sum: {
            $cond: [{ $in: ['$status', ['submitted', 'under_review']] }, 1, 0]
          }
        }
      }
    }
  ]);

  return successResponse(res, statistics[0] || {}, 'Report statistics retrieved successfully');
});

/**
 * Get health reports by specific reporter
 * @route GET /api/health-reports/reporter/:reporterId
 */
const getReportsByReporter = asyncHandler(async (req, res) => {
  const { reporterId } = req.params;
  const { 
    page = 1, 
    limit = 10, 
    status, 
    severity, 
    category,
    startDate,
    endDate 
  } = req.query;

  // Build query
  const query = { 'reportedBy.userId': reporterId };

  // Add optional filters
  if (status) query.status = status;
  if (severity) query.severity = severity;
  if (category) query.category = category;
  
  // Date range filter
  if (startDate || endDate) {
    query.reportDate = {};
    if (startDate) query.reportDate.$gte = new Date(startDate);
    if (endDate) query.reportDate.$lte = new Date(endDate);
  }

  // Role-based access control
  if (req.user.role === 'asha_worker' && req.user.userId !== reporterId) {
    return errorResponse(res, 'Access denied. You can only view your own reports.', 403);
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    populate: [
      { path: 'location.villageId', select: 'villageName blockName districtName' },
      { path: 'patientInfo.patientId', select: 'personalInfo.firstName personalInfo.lastName' }
    ],
    sort: { reportDate: -1 }
  };

  const reports = await HealthReport.paginate(query, options);
  
  return successResponse(res, reports, `Reports by reporter ${reporterId} retrieved successfully`);
});

/**
 * Get health reports for specific patient
 * @route GET /api/health-reports/patient/:patientId
 */
const getReportsByPatient = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { 
    page = 1, 
    limit = 10, 
    status, 
    severity, 
    category,
    startDate,
    endDate 
  } = req.query;

  // Build query
  const query = { 'patientInfo.patientId': patientId };

  // Add optional filters
  if (status) query.status = status;
  if (severity) query.severity = severity;
  if (category) query.category = category;
  
  // Date range filter
  if (startDate || endDate) {
    query.reportDate = {};
    if (startDate) query.reportDate.$gte = new Date(startDate);
    if (endDate) query.reportDate.$lte = new Date(endDate);
  }

  // Role-based access control
  // ASHA workers can only see reports for patients in their assigned villages
  if (req.user.role === 'asha_worker') {
    // Additional check would be needed here to verify patient is in ASHA's assigned villages
    // This would require looking up the patient's village and matching with user's assigned villages
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    populate: [
      { path: 'location.villageId', select: 'villageName blockName districtName' },
      { path: 'patientInfo.patientId', select: 'personalInfo.firstName personalInfo.lastName personalInfo.dateOfBirth' },
      { path: 'reportedBy.userId', select: 'personalInfo.firstName personalInfo.lastName role' }
    ],
    sort: { reportDate: -1 }
  };

  const reports = await HealthReport.paginate(query, options);
  
  return successResponse(res, reports, `Reports for patient ${patientId} retrieved successfully`);
});

/**
 * Get all critical health reports
 * @route GET /api/health-reports/severity/critical
 */
const getCriticalReports = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    status, 
    category,
    villageId,
    reporterId,
    startDate,
    endDate 
  } = req.query;

  // Build query for critical reports
  const query = { severity: 'critical' };

  // Add optional filters
  if (status) query.status = status;
  if (category) query.category = category;
  if (villageId) query['location.villageId'] = villageId;
  if (reporterId) query['reportedBy.userId'] = reporterId;
  
  // Date range filter
  if (startDate || endDate) {
    query.reportDate = {};
    if (startDate) query.reportDate.$gte = new Date(startDate);
    if (endDate) query.reportDate.$lte = new Date(endDate);
  }

  // Role-based filtering
  if (req.user.role === 'asha_worker') {
    // ASHA workers can only see critical reports from their assigned villages
    // This would need to be implemented based on user's assigned villages
    query['reportedBy.userId'] = req.user.userId;
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    populate: [
      { path: 'location.villageId', select: 'villageName blockName districtName' },
      { path: 'patientInfo.patientId', select: 'personalInfo.firstName personalInfo.lastName' },
      { path: 'reportedBy.userId', select: 'personalInfo.firstName personalInfo.lastName role' }
    ],
    sort: { reportDate: -1, urgencyLevel: -1 }
  };

  const reports = await HealthReport.paginate(query, options);
  
  // Add summary statistics
  const totalCritical = await HealthReport.countDocuments({ severity: 'critical' });
  const pendingCritical = await HealthReport.countDocuments({ 
    severity: 'critical', 
    status: 'pending_review' 
  });
  
  const responseData = {
    ...reports,
    summary: {
      totalCriticalReports: totalCritical,
      pendingCriticalReports: pendingCritical,
      criticalReportsNeedingAttention: pendingCritical
    }
  };
  
  return successResponse(res, responseData, 'Critical health reports retrieved successfully');
});

/**
 * Get health reports by category
 * @route GET /api/health-reports/category/:category
 */
const getReportsByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const { 
    page = 1, 
    limit = 10, 
    status, 
    severity,
    villageId,
    reporterId,
    startDate,
    endDate 
  } = req.query;

  // Validate category parameter
  const validCategories = [
    'maternal_health',
    'child_health',
    'infectious_diseases',
    'non_communicable_diseases',
    'environmental_health',
    'nutrition',
    'mental_health',
    'emergency_health',
    'preventive_care',
    'other'
  ];

  if (!validCategories.includes(category)) {
    return errorResponse(res, `Invalid category. Valid categories are: ${validCategories.join(', ')}`, 400);
  }

  // Build query for specific category
  const query = { category };

  // Add optional filters
  if (status) query.status = status;
  if (severity) query.severity = severity;
  if (villageId) query['location.villageId'] = villageId;
  if (reporterId) query['reportedBy.userId'] = reporterId;
  
  // Date range filter
  if (startDate || endDate) {
    query.reportDate = {};
    if (startDate) query.reportDate.$gte = new Date(startDate);
    if (endDate) query.reportDate.$lte = new Date(endDate);
  }

  // Role-based filtering
  if (req.user.role === 'asha_worker') {
    // ASHA workers can only see reports from their assigned villages
    query['reportedBy.userId'] = req.user.userId;
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    populate: [
      { path: 'location.villageId', select: 'villageName blockName districtName' },
      { path: 'patientInfo.patientId', select: 'personalInfo.firstName personalInfo.lastName personalInfo.age' },
      { path: 'reportedBy.userId', select: 'personalInfo.firstName personalInfo.lastName role' }
    ],
    sort: { reportDate: -1, severity: -1 }
  };

  const reports = await HealthReport.paginate(query, options);
  
  // Add category statistics
  const categoryStats = await HealthReport.aggregate([
    { $match: { category } },
    {
      $group: {
        _id: '$severity',
        count: { $sum: 1 }
      }
    }
  ]);

  const statusStats = await HealthReport.aggregate([
    { $match: { category } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const responseData = {
    ...reports,
    categoryInfo: {
      category,
      severityBreakdown: categoryStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      statusBreakdown: statusStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      totalReportsInCategory: await HealthReport.countDocuments({ category })
    }
  };
  
  return successResponse(res, responseData, `Health reports for category '${category}' retrieved successfully`);
});

/**
 * Get recent health reports within specified days
 * @route GET /api/health-reports/recent/:days
 */
const getRecentReports = asyncHandler(async (req, res) => {
  const { days } = req.params;
  const { 
    page = 1, 
    limit = 10, 
    status, 
    severity,
    category,
    villageId,
    reporterId
  } = req.query;

  // Validate days parameter
  const daysNum = parseInt(days);
  if (isNaN(daysNum) || daysNum <= 0 || daysNum > 365) {
    return errorResponse(res, 'Invalid days parameter. Must be a number between 1 and 365.', 400);
  }

  // Calculate date range for recent reports
  const currentDate = new Date();
  const startDate = new Date();
  startDate.setDate(currentDate.getDate() - daysNum);

  // Build query for recent reports
  const query = {
    reportDate: {
      $gte: startDate,
      $lte: currentDate
    }
  };

  // Add optional filters
  if (status) query.status = status;
  if (severity) query.severity = severity;
  if (category) query.category = category;
  if (villageId) query['location.villageId'] = villageId;
  if (reporterId) query['reportedBy.userId'] = reporterId;

  // Role-based filtering
  if (req.user.role === 'asha_worker') {
    // ASHA workers can only see their own recent reports
    query['reportedBy.userId'] = req.user.userId;
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    populate: [
      { path: 'location.villageId', select: 'villageName blockName districtName' },
      { path: 'patientInfo.patientId', select: 'personalInfo.firstName personalInfo.lastName personalInfo.age' },
      { path: 'reportedBy.userId', select: 'personalInfo.firstName personalInfo.lastName role' }
    ],
    sort: { reportDate: -1, severity: -1 }
  };

  const reports = await HealthReport.paginate(query, options);
  
  // Add recent reports analytics
  const recentStats = await HealthReport.aggregate([
    {
      $match: {
        reportDate: {
          $gte: startDate,
          $lte: currentDate
        }
      }
    },
    {
      $group: {
        _id: {
          severity: '$severity',
          status: '$status'
        },
        count: { $sum: 1 }
      }
    }
  ]);

  // Get daily trend data
  const dailyTrend = await HealthReport.aggregate([
    {
      $match: {
        reportDate: {
          $gte: startDate,
          $lte: currentDate
        }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$reportDate'
          }
        },
        count: { $sum: 1 },
        criticalCount: {
          $sum: {
            $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0]
          }
        }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ]);
  
  const responseData = {
    ...reports,
    recentReportsInfo: {
      timeframe: `${daysNum} days`,
      startDate: startDate.toISOString(),
      endDate: currentDate.toISOString(),
      totalRecentReports: await HealthReport.countDocuments(query),
      statisticsBreakdown: recentStats.reduce((acc, stat) => {
        const key = `${stat._id.severity}_${stat._id.status}`;
        acc[key] = stat.count;
        return acc;
      }, {}),
      dailyTrend: dailyTrend
    }
  };
  
  return successResponse(res, responseData, `Recent health reports from last ${daysNum} days retrieved successfully`);
});

/**
 * Get health report statistics summary
 * @route GET /api/health-reports/stats/summary
 */
const getReportStats = asyncHandler(async (req, res) => {
  const { 
    startDate, 
    endDate, 
    villageId, 
    category 
  } = req.query;

  // Build date filter
  let dateFilter = {};
  if (startDate || endDate) {
    dateFilter.reportDate = {};
    if (startDate) dateFilter.reportDate.$gte = new Date(startDate);
    if (endDate) dateFilter.reportDate.$lte = new Date(endDate);
  }

  // Build additional filters
  const additionalFilters = {};
  if (villageId) additionalFilters['location.villageId'] = villageId;
  if (category) additionalFilters.category = category;

  // Combine filters
  const matchFilter = { ...dateFilter, ...additionalFilters };

  // Get comprehensive statistics
  const [
    totalReports,
    severityStats,
    statusStats,
    categoryStats,
    monthlyTrends,
    villageStats,
    reporterStats
  ] = await Promise.all([
    // Total reports count
    HealthReport.countDocuments(matchFilter),

    // Severity breakdown
    HealthReport.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 },
          avgResolutionTime: { $avg: '$resolutionTimeHours' }
        }
      }
    ]),

    // Status breakdown
    HealthReport.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]),

    // Category breakdown
    HealthReport.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          criticalCount: {
            $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] }
          }
        }
      }
    ]),

    // Monthly trends (last 12 months)
    HealthReport.aggregate([
      { 
        $match: {
          ...matchFilter,
          reportDate: {
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 12))
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$reportDate' },
            month: { $month: '$reportDate' }
          },
          count: { $sum: 1 },
          criticalCount: {
            $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]),

    // Top villages by report count
    HealthReport.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$location.villageId',
          count: { $sum: 1 },
          criticalCount: {
            $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'villages',
          localField: '_id',
          foreignField: '_id',
          as: 'village'
        }
      }
    ]),

    // Top reporters by report count
    HealthReport.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$reportedBy.userId',
          count: { $sum: 1 },
          categories: { $addToSet: '$category' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'reporter'
        }
      }
    ])
  ]);

  const stats = {
    overview: {
      totalReports,
      dateRange: {
        startDate: startDate || 'All time',
        endDate: endDate || 'Present'
      },
      filters: {
        village: villageId || 'All villages',
        category: category || 'All categories'
      }
    },
    breakdown: {
      bySeverity: severityStats.reduce((acc, item) => {
        acc[item._id] = {
          count: item.count,
          avgResolutionTime: item.avgResolutionTime || 0
        };
        return acc;
      }, {}),
      byStatus: statusStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byCategory: categoryStats.reduce((acc, item) => {
        acc[item._id] = {
          count: item.count,
          criticalCount: item.criticalCount
        };
        return acc;
      }, {})
    },
    trends: {
      monthly: monthlyTrends.map(trend => ({
        period: `${trend._id.year}-${String(trend._id.month).padStart(2, '0')}`,
        totalReports: trend.count,
        criticalReports: trend.criticalCount
      }))
    },
    topPerformers: {
      villages: villageStats.map(stat => ({
        villageId: stat._id,
        villageName: stat.village[0]?.villageName || 'Unknown',
        totalReports: stat.count,
        criticalReports: stat.criticalCount
      })),
      reporters: reporterStats.map(stat => ({
        reporterId: stat._id,
        reporterName: stat.reporter[0] ? 
          `${stat.reporter[0].personalInfo?.firstName} ${stat.reporter[0].personalInfo?.lastName}` : 
          'Unknown',
        role: stat.reporter[0]?.role || 'Unknown',
        totalReports: stat.count,
        categoriesCovered: stat.categories.length
      }))
    }
  };

  return successResponse(res, stats, 'Health report statistics retrieved successfully');
});

/**
 * Export health reports as CSV
 * @route GET /api/health-reports/export/csv
 */
const exportReports = asyncHandler(async (req, res) => {
  const { 
    startDate, 
    endDate, 
    status, 
    severity, 
    category, 
    villageId 
  } = req.query;

  // Build query
  const query = {};
  
  // Date range filter
  if (startDate || endDate) {
    query.reportDate = {};
    if (startDate) query.reportDate.$gte = new Date(startDate);
    if (endDate) query.reportDate.$lte = new Date(endDate);
  }
  
  // Additional filters
  if (status) query.status = status;
  if (severity) query.severity = severity;
  if (category) query.category = category;
  if (villageId) query['location.villageId'] = villageId;

  // Role-based filtering
  if (req.user.role === 'asha_worker') {
    query['reportedBy.userId'] = req.user.userId;
  }

  // Get reports with populated data
  const reports = await HealthReport.find(query)
    .populate('location.villageId', 'villageName blockName districtName')
    .populate('patientInfo.patientId', 'personalInfo.firstName personalInfo.lastName personalInfo.age personalInfo.gender')
    .populate('reportedBy.userId', 'personalInfo.firstName personalInfo.lastName role')
    .sort({ reportDate: -1 })
    .lean();

  // Generate CSV headers
  const csvHeaders = [
    'Report ID',
    'Report Date',
    'Category',
    'Severity',
    'Status',
    'Title',
    'Description',
    'Village',
    'Block',
    'District',
    'Patient Name',
    'Patient Age',
    'Patient Gender',
    'Reporter Name',
    'Reporter Role',
    'Created At',
    'Updated At'
  ];

  // Generate CSV rows
  const csvRows = reports.map(report => [
    report.reportId || '',
    report.reportDate ? new Date(report.reportDate).toISOString().split('T')[0] : '',
    report.category || '',
    report.severity || '',
    report.status || '',
    report.title || '',
    (report.description || '').replace(/"/g, '""'), // Escape quotes for CSV
    report.location?.villageId?.villageName || '',
    report.location?.villageId?.blockName || '',
    report.location?.villageId?.districtName || '',
    report.patientInfo?.patientId ? 
      `${report.patientInfo.patientId.personalInfo?.firstName || ''} ${report.patientInfo.patientId.personalInfo?.lastName || ''}`.trim() : '',
    report.patientInfo?.patientId?.personalInfo?.age || '',
    report.patientInfo?.patientId?.personalInfo?.gender || '',
    report.reportedBy?.userId ? 
      `${report.reportedBy.userId.personalInfo?.firstName || ''} ${report.reportedBy.userId.personalInfo?.lastName || ''}`.trim() : '',
    report.reportedBy?.userId?.role || '',
    report.createdAt ? new Date(report.createdAt).toISOString() : '',
    report.updatedAt ? new Date(report.updatedAt).toISOString() : ''
  ]);

  // Combine headers and rows
  const csvContent = [csvHeaders, ...csvRows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  // Set response headers for CSV download
  const filename = `health_reports_${new Date().toISOString().split('T')[0]}.csv`;
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  
  return res.send(csvContent);
});

/**
 * Generate comprehensive health dashboard
 * @route GET /api/health-reports/dashboard
 */
const generateHealthDashboard = asyncHandler(async (req, res) => {
  const { area, startDate, endDate } = req.query;

  const dateFilter = {};
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate) dateFilter.$lte = new Date(endDate);

  const areaFilter = area ? { 'location.area': area } : {};
  const timeFilter = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

  // Import models dynamically to avoid circular dependencies
  const HealthObservation = mongoose.model('HealthObservation');
  const VaccinationRecord = mongoose.model('VaccinationRecord');
  const DiseaseRecord = mongoose.model('DiseaseRecord');
  const WaterQuality = mongoose.model('WaterQuality');
  const PatientRecord = mongoose.model('PatientRecord');
  const CommunityObservation = mongoose.model('CommunityObservation');

  // Run all aggregations in parallel
  const [
    healthObservationStats,
    vaccinationStats,
    diseaseStats,
    waterQualityStats,
    patientStats,
    communityReportStats,
    reportStats
  ] = await Promise.all([
    HealthObservation.countDocuments({ ...areaFilter, ...timeFilter }),
    VaccinationRecord.countDocuments({ ...areaFilter, ...timeFilter }),
    DiseaseRecord.countDocuments({ ...areaFilter, ...timeFilter }),
    WaterQuality.countDocuments({ ...areaFilter, ...timeFilter }),
    PatientRecord.countDocuments({ ...areaFilter, ...timeFilter }),
    CommunityObservation.countDocuments({ ...areaFilter, ...timeFilter }),
    HealthReport.countDocuments({ ...areaFilter, ...timeFilter })
  ]);

  const dashboard = {
    summary: {
      totalObservations: healthObservationStats,
      totalVaccinations: vaccinationStats,
      totalDiseases: diseaseStats,
      totalWaterTests: waterQualityStats,
      totalPatients: patientStats,
      totalCommunityReports: communityReportStats,
      totalHealthReports: reportStats
    },
    generatedAt: new Date()
  };

  return successResponse(res, dashboard, 'Health dashboard generated successfully');
});

/**
 * Generate epidemiological report
 * @route GET /api/health-reports/epidemiology
 */
const generateEpidemiologicalReport = asyncHandler(async (req, res) => {
  const { area, disease, startDate, endDate } = req.query;

  const dateFilter = {};
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate) dateFilter.$lte = new Date(endDate);

  const DiseaseRecord = mongoose.model('DiseaseRecord');
  const reportFilter = {};
  if (area) reportFilter['location.area'] = area;
  if (disease) reportFilter.disease = disease;
  if (Object.keys(dateFilter).length > 0) reportFilter.createdAt = dateFilter;

  // Disease incidence analysis
  const diseaseIncidence = await DiseaseRecord.aggregate([
    { $match: reportFilter },
    {
      $group: {
        _id: {
          disease: '$disease',
          month: { $month: '$createdAt' },
          year: { $year: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  // Geographic distribution
  const geographicDistribution = await DiseaseRecord.aggregate([
    { $match: reportFilter },
    {
      $group: {
        _id: '$location.area',
        totalCases: { $sum: 1 },
        diseases: { $addToSet: '$disease' }
      }
    },
    { $sort: { totalCases: -1 } }
  ]);

  const report = {
    diseaseIncidence,
    geographicDistribution,
    period: {
      startDate: startDate || 'All time',
      endDate: endDate || 'Present'
    },
    filters: { area, disease },
    generatedAt: new Date()
  };

  return successResponse(res, report, 'Epidemiological report generated successfully');
});

/**
 * Calculate comprehensive health metrics
 * @route GET /api/health-reports/metrics
 */
const calculateHealthMetrics = asyncHandler(async (req, res) => {
  const { area } = req.query;
  const areaFilter = area ? { 'location.area': area } : {};

  // Get counts from all health-related collections
  const HealthObservation = mongoose.model('HealthObservation');
  const VaccinationRecord = mongoose.model('VaccinationRecord');
  const DiseaseRecord = mongoose.model('DiseaseRecord');
  const WaterQuality = mongoose.model('WaterQuality');

  const [
    totalObservations,
    criticalObservations,
    totalVaccinations,
    completedVaccinations,
    totalDiseases,
    activeDiseases,
    totalWaterTests,
    safeWaterTests
  ] = await Promise.all([
    HealthObservation.countDocuments(areaFilter),
    HealthObservation.countDocuments({ ...areaFilter, severity: 'critical' }),
    VaccinationRecord.countDocuments(areaFilter),
    VaccinationRecord.countDocuments({ ...areaFilter, status: 'completed' }),
    DiseaseRecord.countDocuments(areaFilter),
    DiseaseRecord.countDocuments({ ...areaFilter, status: 'active' }),
    WaterQuality.countDocuments(areaFilter),
    WaterQuality.countDocuments({ ...areaFilter, safetyStatus: 'safe' })
  ]);

  const metrics = {
    healthObservations: {
      total: totalObservations,
      critical: criticalObservations,
      criticalPercentage: totalObservations > 0 ? (criticalObservations / totalObservations) * 100 : 0
    },
    vaccinations: {
      total: totalVaccinations,
      completed: completedVaccinations,
      coverageRate: totalVaccinations > 0 ? (completedVaccinations / totalVaccinations) * 100 : 0
    },
    diseases: {
      total: totalDiseases,
      active: activeDiseases,
      activePercentage: totalDiseases > 0 ? (activeDiseases / totalDiseases) * 100 : 0
    },
    waterQuality: {
      total: totalWaterTests,
      safe: safeWaterTests,
      safetyRate: totalWaterTests > 0 ? (safeWaterTests / totalWaterTests) * 100 : 0
    },
    generatedAt: new Date()
  };

  return successResponse(res, metrics, 'Health metrics calculated successfully');
});

export {
  createReport,
  getReports,
  getReportById,
  updateReport,
  reviewReport,
  escalateReport,
  deleteReport,
  getReportsByVillage,
  getReportsByReporter,
  getReportsByPatient,
  getCriticalReports,
  getReportsByCategory,
  getRecentReports,
  getReportStats,
  exportReports,
  getPendingReports,
  getReportStatistics,
  generateHealthDashboard,
  generateEpidemiologicalReport,
  calculateHealthMetrics
};