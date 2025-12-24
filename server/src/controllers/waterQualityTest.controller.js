import mongoose from 'mongoose';
import WaterQualityTest from '../models/waterQualityTest.model.js';
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
 * Water Quality Test Controller
 * Full CRUD operations with notification integration
 */

/**
 * Create new water quality test
 * POST /api/water-tests
 */
const createTest = asyncHandler(async (req, res) => {
  const testData = {
    ...req.body,
    conductedBy: req.user._id,
    testDate: new Date()
  };

  // Validate water source exists (basic check)
  if (testData.waterSourceId) {
    // In a real implementation, verify the water source exists
    // const waterSource = await WaterSource.findById(testData.waterSourceId);
    // if (!waterSource) throw new Error('Water source not found');
  }

  // Create test record
  const waterTest = new WaterQualityTest(testData);
  
  // Calculate overall status using model method if it exists
  if (typeof waterTest.calculateOverallStatus === 'function') {
    waterTest.calculateOverallStatus();
  } else {
    // Fallback calculation based on risk level
    if (!waterTest.overallStatus && waterTest.riskLevel) {
      const riskToStatusMap = {
        'low': 'safe',
        'medium': 'moderate_risk',
        'high': 'high_risk',
        'critical': 'contaminated'
      };
      waterTest.overallStatus = riskToStatusMap[waterTest.riskLevel] || 'moderate_risk';
    }
  }

  await waterTest.save();

  // Populate related data for response
  await waterTest.populate([
    { path: 'conductedBy', select: 'personalInfo.firstName personalInfo.lastName roleInfo.role' },
    { path: 'villageId', select: 'name block district' }
  ]);

  // Trigger alerts for contaminated results
  if (['high_risk', 'contaminated'].includes(waterTest.overallStatus) || 
      ['high', 'critical'].includes(waterTest.riskLevel)) {
    
    try {
      const alertData = {
        alertType: 'water_contamination_warning',
        title: `Water Contamination Alert - ${waterTest.villageId?.name || 'Unknown Village'}`,
        messageContent: `High contamination detected in water source. Risk Level: ${waterTest.riskLevel}. Immediate action required.`,
        alertLevel: waterTest.riskLevel === 'critical' ? 'emergency' : 'urgent',
        priority: {
          level: waterTest.riskLevel === 'critical' ? 'emergency' : 'urgent',
          justification: 'Water contamination poses immediate health risk to community'
        },
        affectedAreas: {
          villages: [waterTest.villageId]
        },
        source: {
          triggeredBy: 'system',
          sourceId: waterTest._id,
          sourceModel: 'WaterQualityTest'
        }
      };

      await handleAlertSystemIntegration(alertData);
    } catch (alertError) {
      console.error('Failed to send contamination alert:', alertError);
      // Don't fail the main operation if alert fails
    }
  }

  return createdResponse(res, waterTest, 'Water quality test created successfully');
});

/**
 * Get water quality tests with filtering and pagination
 * GET /api/water-tests
 */
const getTests = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    villageId,
    waterSourceId,
    testType,
    testingMethod,
    overallStatus,
    riskLevel,
    conductedBy,
    dateFrom,
    dateTo,
    requiresFollowUp,
    hasRemediationActions,
    sortBy = 'testDate',
    sortOrder = 'desc'
  } = req.query;

  // Build filter object
  const filter = {};
  
  if (villageId) filter.villageId = villageId;
  if (waterSourceId) filter.waterSourceId = waterSourceId;
  if (testType) filter.testType = testType;
  if (testingMethod) filter.testingMethod = testingMethod;
  if (overallStatus) filter.overallStatus = overallStatus;
  if (riskLevel) filter.riskLevel = riskLevel;
  if (conductedBy) filter.conductedBy = conductedBy;
  if (requiresFollowUp !== undefined) filter.requiresFollowUp = requiresFollowUp === 'true';
  
  // Date filters
  if (dateFrom || dateTo) {
    filter.testDate = {};
    if (dateFrom) filter.testDate.$gte = new Date(dateFrom);
    if (dateTo) filter.testDate.$lte = new Date(dateTo);
  }

  // Remediation actions filter
  if (hasRemediationActions === 'true') {
    filter['remediationActions.0'] = { $exists: true };
  }

  // Role-based filtering
  const userRole = req.user.roleInfo.role;
  if (userRole === 'volunteer' || userRole === 'asha_worker') {
    // Users can only see tests they conducted or in their assigned areas
    if (!conductedBy) {
      filter.conductedBy = req.user._id;
    }
  }

  // Calculate pagination
  const pagination = getPaginationData(page, limit);
  
  // Get total count
  const total = await WaterQualityTest.countDocuments(filter);
  const paginationData = getPaginationData(page, limit, total);

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // Execute query
  const tests = await WaterQualityTest.find(filter)
    .populate([
      { path: 'conductedBy', select: 'personalInfo.firstName personalInfo.lastName roleInfo.role' },
      { path: 'villageId', select: 'name block district' },
      { path: 'waterSourceId', select: 'name type location' }
    ])
    .sort(sort)
    .skip(paginationData.skip)
    .limit(paginationData.itemsPerPage);

  return paginatedResponse(res, tests, paginationData, 'Water quality tests retrieved successfully');
});

/**
 * Get single water quality test by ID
 * GET /api/water-tests/:id
 */
const getTestById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const test = await WaterQualityTest.findById(id)
    .populate([
      { path: 'conductedBy', select: 'personalInfo.firstName personalInfo.lastName roleInfo.role authentication.phone' },
      { path: 'villageId', select: 'name block district coordinates' },
      { path: 'waterSourceId', select: 'name type location capacity' },
      { path: 'remediationActions.implementedBy', select: 'personalInfo.firstName personalInfo.lastName' }
    ]);

  if (!test) {
    return notFoundResponse(res, 'Water quality test not found');
  }

  // Check authorization - users can only view tests they conducted or in their area
  const userRole = req.user.roleInfo.role;
  if (userRole === 'volunteer' || userRole === 'asha_worker') {
    if (test.conductedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view tests you conducted.'
      });
    }
  }

  return successResponse(res, test, 'Water quality test retrieved successfully');
});

/**
 * Update water quality test
 * PUT /api/water-tests/:id
 */
const updateTest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const test = await WaterQualityTest.findById(id);
  
  if (!test) {
    return notFoundResponse(res, 'Water quality test not found');
  }

  // Authorization check - only creator or admin can update
  const userRole = req.user.roleInfo.role;
  const isCreator = test.conductedBy.toString() === req.user._id.toString();
  const isAuthorized = isCreator || ['admin', 'health_official'].includes(userRole);

  if (!isAuthorized) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only update tests you conducted.'
    });
  }

  // Apply updates
  Object.assign(test, updates);
  test.lastUpdated = new Date();
  
  // Recalculate overall status if test parameters changed
  if (updates.testParameters && typeof test.calculateOverallStatus === 'function') {
    test.calculateOverallStatus();
  }

  await test.save();

  // Populate for response
  await test.populate([
    { path: 'conductedBy', select: 'personalInfo.firstName personalInfo.lastName roleInfo.role' },
    { path: 'villageId', select: 'name block district' }
  ]);

  return updatedResponse(res, test, 'Water quality test updated successfully');
});

/**
 * Delete water quality test
 * DELETE /api/water-tests/:id
 */
const deleteTest = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const test = await WaterQualityTest.findById(id);
  
  if (!test) {
    return notFoundResponse(res, 'Water quality test not found');
  }

  // Authorization check - only creator or admin can delete
  const userRole = req.user.roleInfo.role;
  const isCreator = test.conductedBy.toString() === req.user._id.toString();
  const isAuthorized = isCreator || userRole === 'admin';

  if (!isAuthorized) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only delete tests you conducted.'
    });
  }

  await WaterQualityTest.findByIdAndDelete(id);

  return deletedResponse(res, true, 'Water quality test deleted successfully');
});

/**
 * Get water quality tests by village
 * GET /api/water-tests/village/:villageId
 */
const getTestsByVillage = asyncHandler(async (req, res) => {
  const { villageId } = req.params;
  const { page = 1, limit = 10, dateFrom, dateTo } = req.query;

  const filter = { villageId };

  // Date filters
  if (dateFrom || dateTo) {
    filter.testDate = {};
    if (dateFrom) filter.testDate.$gte = new Date(dateFrom);
    if (dateTo) filter.testDate.$lte = new Date(dateTo);
  }

  // Get pagination data
  const total = await WaterQualityTest.countDocuments(filter);
  const paginationData = getPaginationData(page, limit, total);

  const tests = await WaterQualityTest.find(filter)
    .populate([
      { path: 'conductedBy', select: 'personalInfo.firstName personalInfo.lastName roleInfo.role' },
      { path: 'waterSourceId', select: 'name type' }
    ])
    .sort({ testDate: -1 })
    .skip(paginationData.skip)
    .limit(paginationData.itemsPerPage);

  return paginatedResponse(res, tests, paginationData, 'Village water quality tests retrieved successfully');
});

/**
 * Get contamination trends for a village
 * GET /api/water-tests/trends/:villageId
 */
const getContaminationTrends = asyncHandler(async (req, res) => {
  const { villageId } = req.params;
  const { days = 30 } = req.query;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  const trends = await WaterQualityTest.aggregate([
    {
      $match: {
        villageId: new mongoose.Types.ObjectId(villageId),
        testDate: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$testDate' } },
          status: '$overallStatus'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.date',
        statusCounts: {
          $push: {
            status: '$_id.status',
            count: '$count'
          }
        },
        totalTests: { $sum: '$count' }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  return successResponse(res, trends, 'Contamination trends retrieved successfully');
});

/**
 * Schedule follow-up test
 * POST /api/water-tests/:id/follow-up
 */
const scheduleFollowUpTest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { followUpDate, notes } = req.body;

  const originalTest = await WaterQualityTest.findById(id);
  
  if (!originalTest) {
    return notFoundResponse(res, 'Original water quality test not found');
  }

  // Create follow-up test based on original
  const followUpTest = new WaterQualityTest({
    villageId: originalTest.villageId,
    waterSourceId: originalTest.waterSourceId,
    testType: 'follow_up',
    testingMethod: originalTest.testingMethod,
    conductedBy: req.user._id,
    testDate: new Date(followUpDate),
    parentTestId: originalTest._id,
    notes: notes
  });

  await followUpTest.save();

  // Update original test
  originalTest.requiresFollowUp = true;
  originalTest.followUpDate = new Date(followUpDate);
  await originalTest.save();

  await followUpTest.populate([
    { path: 'conductedBy', select: 'personalInfo.firstName personalInfo.lastName roleInfo.role' },
    { path: 'villageId', select: 'name block district' }
  ]);

  return createdResponse(res, followUpTest, 'Follow-up test scheduled successfully');
});

/**
 * Get ML prediction for water quality test
 * POST /api/water-quality-tests/:id/predict
 */
const getPrediction = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find the test
  const waterTest = await WaterQualityTest.findById(id);
  if (!waterTest) {
    return notFoundResponse(res, 'Water quality test not found');
  }

  try {
    // Prepare data for ML service
    const mlPayload = {
      ph: waterTest.parameters?.ph,
      turbidity: waterTest.parameters?.turbidity,
      tds: waterTest.parameters?.tds,
      temperature: waterTest.parameters?.temperature,
      conductivity: waterTest.parameters?.conductivity,
      hardness: waterTest.parameters?.hardness,
      chlorides: waterTest.parameters?.chlorides,
      alkalinity: waterTest.parameters?.alkalinity,
      dissolvedOxygen: waterTest.parameters?.dissolvedOxygen
    };

    // Call ML microservice
    const mlResponse = await fetch('http://localhost:8000/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mlPayload)
    });

    if (!mlResponse.ok) {
      throw new Error('ML service unavailable');
    }

    const prediction = await mlResponse.json();

    // Update test with prediction
    waterTest.mlPrediction = {
      predictedStatus: prediction.status || 'safe',
      confidence: prediction.confidence || 0,
      predictionDate: new Date(),
      modelVersion: prediction.modelVersion || '1.0',
      features: mlPayload
    };

    await waterTest.save();

    return successResponse(res, {
      test: waterTest,
      prediction: waterTest.mlPrediction
    }, 'ML prediction generated successfully');

  } catch (error) {
    console.error('ML prediction error:', error);
    // Return graceful error - don't fail the request
    return successResponse(res, {
      test: waterTest,
      prediction: null,
      warning: 'ML service unavailable - prediction could not be generated'
    }, 'Test retrieved but ML prediction unavailable');
  }
});

export {
  createTest,
  getTests,
  getTestById,
  updateTest,
  deleteTest,
  getTestsByVillage,
  getContaminationTrends,
  scheduleFollowUpTest,
  getPrediction
};