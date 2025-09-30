import mongoose from 'mongoose';
import WaterQuality from '../models/waterQuality.model.js';
import { 
  successResponse, 
  errorResponse, 
  paginatedResponse,
  createdResponse
} from '../utils/responseHelper.js';

/**
 * Water Quality Controller
 * Handles water quality monitoring, testing, and contamination alerts
 * Provides comprehensive water safety analysis and trend monitoring
 */

/**
 * Create new water quality test
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<ApiResponse>} Created water quality test
 */
export const createWaterQualityTest = async (req, res) => {
  try {
    const {
      location,
      waterSource,
      testingDate,
      testResults,
      testedBy,
      testingMethod,
      notes
    } = req.body;

    const waterQualityTest = new WaterQuality({
      location,
      waterSource,
      testingDate: new Date(testingDate),
      testResults,
      testedBy: req.user.id,
      testingMethod,
      notes,
      createdBy: req.user.id
    });

    // Analyze test results for contamination
    const contaminationAnalysis = analyzeContamination(testResults);
    waterQualityTest.contaminationLevel = contaminationAnalysis.level;
    waterQualityTest.safetyStatus = contaminationAnalysis.status;
    waterQualityTest.recommendations = contaminationAnalysis.recommendations;

    await waterQualityTest.save();

    // Generate alert if water is unsafe
    if (contaminationAnalysis.level === 'high' || contaminationAnalysis.status === 'unsafe') {
      await generateContaminationAlert(waterQualityTest);
    }

    return createdResponse(res, waterQualityTest, 'Water quality test created successfully');
  } catch (error) {
    console.error('Error creating water quality test:', error);
    return errorResponse(res, 'Failed to create water quality test', 400, error.message);
  }
};

/**
 * Get all water quality tests with filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<ApiResponse>} List of water quality tests
 */
export const getWaterQualityTests = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      area,
      waterSource,
      safetyStatus,
      contaminationLevel,
      startDate,
      endDate,
      sortBy = 'testingDate',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    
    // Apply filters
    if (area) query['location.area'] = area;
    if (waterSource) query.waterSource = waterSource;
    if (safetyStatus) query.safetyStatus = safetyStatus;
    if (contaminationLevel) query.contaminationLevel = contaminationLevel;
    
    if (startDate || endDate) {
      query.testingDate = {};
      if (startDate) query.testingDate.$gte = new Date(startDate);
      if (endDate) query.testingDate.$lte = new Date(endDate);
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const [tests, total] = await Promise.all([
      WaterQuality.find(query)
        .populate('testedBy', 'name email')
        .populate('createdBy', 'name email')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      WaterQuality.countDocuments(query)
    ]);

    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    };

    return paginatedResponse(res, tests, pagination, 'Water quality tests fetched successfully');
  } catch (error) {
    console.error('Error fetching water quality tests:', error);
    return errorResponse(res, 'Failed to fetch water quality tests', 500, error.message);
  }
};

/**
 * Get water quality test by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<ApiResponse>} Water quality test data
 */
export const getWaterQualityTestById = async (req, res) => {
  try {
    const { id } = req.params;

    const test = await WaterQuality.findById(id)
      .populate('testedBy', 'name email role')
      .populate('createdBy', 'name email role');

    if (!test) {
      return errorResponse(res, 'Water quality test not found', 404);
    }

    return successResponse(res, test, 'Water quality test fetched successfully');
  } catch (error) {
    console.error('Error fetching water quality test:', error);
    return errorResponse(res, 'Failed to fetch water quality test', 500, error.message);
  }
};

/**
 * Update water quality test
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<ApiResponse>} Updated water quality test
 */
export const updateWaterQualityTest = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const test = await WaterQuality.findById(id);
    if (!test) {
      return res.status(404).json(
        new ApiError(404, 'Water quality test not found')
      );
    }

    // Re-analyze if test results were updated
    if (updateData.testResults) {
      const contaminationAnalysis = analyzeContamination(updateData.testResults);
      updateData.contaminationLevel = contaminationAnalysis.level;
      updateData.safetyStatus = contaminationAnalysis.status;
      updateData.recommendations = contaminationAnalysis.recommendations;
    }

    const updatedTest = await WaterQuality.findByIdAndUpdate(
      id,
      { ...updateData, updatedBy: req.user.id },
      { new: true, runValidators: true }
    ).populate('testedBy', 'name email')
     .populate('createdBy', 'name email');

    return successResponse(res, updatedTest, 'Water quality test updated successfully');
  } catch (error) {
    console.error('Error updating water quality test:', error);
    return errorResponse(res, 'Failed to update water quality test', 400, error.message);
  }
};

/**
 * Get water quality trends
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<ApiResponse>} Water quality trends analysis
 */
export const getWaterQualityTrends = async (req, res) => {
  try {
    const { area, waterSource, timeframe = '30d' } = req.query;

    const query = {};
    if (area) query['location.area'] = area;
    if (waterSource) query.waterSource = waterSource;

    // Calculate date range based on timeframe
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }

    query.testingDate = { $gte: startDate, $lte: endDate };

    const trends = await WaterQuality.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            year: { $year: '$testingDate' },
            month: { $month: '$testingDate' },
            day: { $dayOfMonth: '$testingDate' }
          },
          avgPH: { $avg: '$testResults.pH' },
          avgTurbidity: { $avg: '$testResults.turbidity' },
          avgChlorine: { $avg: '$testResults.chlorine' },
          safeCount: {
            $sum: { $cond: [{ $eq: ['$safetyStatus', 'safe'] }, 1, 0] }
          },
          unsafeCount: {
            $sum: { $cond: [{ $eq: ['$safetyStatus', 'unsafe'] }, 1, 0] }
          },
          totalTests: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Calculate overall statistics
    const totalTests = await WaterQuality.countDocuments(query);
    const safeTests = await WaterQuality.countDocuments({ ...query, safetyStatus: 'safe' });
    const unsafeTests = await WaterQuality.countDocuments({ ...query, safetyStatus: 'unsafe' });

    const statistics = {
      totalTests,
      safeTests,
      unsafeTests,
      safetyPercentage: totalTests > 0 ? (safeTests / totalTests) * 100 : 0
    };

    return successResponse(res, { trends, statistics }, 'Water quality trends analyzed successfully');
  } catch (error) {
    console.error('Error analyzing water quality trends:', error);
    return errorResponse(res, 'Failed to analyze water quality trends', 500, error.message);
  }
};

/**
 * Generate contamination alerts
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<ApiResponse>} Contamination alerts
 */
export const generateContaminationAlerts = async (req, res) => {
  try {
    const { area, severity = 'high' } = req.query;

    const query = {
      safetyStatus: 'unsafe',
      contaminationLevel: { $in: severity === 'all' ? ['medium', 'high'] : [severity] }
    };

    if (area) query['location.area'] = area;

    // Get recent contamination cases (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    query.testingDate = { $gte: sevenDaysAgo };

    const contaminatedSources = await WaterQuality.find(query)
      .populate('testedBy', 'name email')
      .sort({ testingDate: -1 });

    // Group by water source and location
    const alertsByLocation = contaminatedSources.reduce((acc, test) => {
      const locationKey = `${test.location.area}-${test.waterSource}`;
      if (!acc[locationKey]) {
        acc[locationKey] = {
          location: test.location,
          waterSource: test.waterSource,
          tests: [],
          latestTest: test.testingDate,
          severity: test.contaminationLevel
        };
      }
      acc[locationKey].tests.push(test);
      return acc;
    }, {});

    const alerts = Object.values(alertsByLocation);

    return successResponse(res, alerts, 'Contamination alerts generated successfully');
  } catch (error) {
    console.error('Error generating contamination alerts:', error);
    return errorResponse(res, 'Failed to generate contamination alerts', 500, error.message);
  }
};

/**
 * Get water quality report
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<ApiResponse>} Comprehensive water quality report
 */
export const generateWaterQualityReport = async (req, res) => {
  try {
    const { area, startDate, endDate, format = 'json' } = req.query;

    const query = {};
    if (area) query['location.area'] = area;
    if (startDate || endDate) {
      query.testingDate = {};
      if (startDate) query.testingDate.$gte = new Date(startDate);
      if (endDate) query.testingDate.$lte = new Date(endDate);
    }

    const [
      totalTests,
      safeTests,
      unsafeTests,
      testsBySource,
      recentContamination
    ] = await Promise.all([
      WaterQuality.countDocuments(query),
      WaterQuality.countDocuments({ ...query, safetyStatus: 'safe' }),
      WaterQuality.countDocuments({ ...query, safetyStatus: 'unsafe' }),
      WaterQuality.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$waterSource',
            count: { $sum: 1 },
            safeCount: { $sum: { $cond: [{ $eq: ['$safetyStatus', 'safe'] }, 1, 0] } },
            unsafeCount: { $sum: { $cond: [{ $eq: ['$safetyStatus', 'unsafe'] }, 1, 0] } }
          }
        }
      ]),
      WaterQuality.find({ ...query, safetyStatus: 'unsafe' })
        .sort({ testingDate: -1 })
        .limit(10)
        .populate('testedBy', 'name')
    ]);

    const report = {
      summary: {
        totalTests,
        safeTests,
        unsafeTests,
        safetyPercentage: totalTests > 0 ? (safeTests / totalTests) * 100 : 0
      },
      byWaterSource: testsBySource,
      recentContamination,
      generatedAt: new Date(),
      period: {
        startDate: startDate || 'All time',
        endDate: endDate || 'Present'
      }
    };

    return successResponse(res, report, 'Water quality report generated successfully');
  } catch (error) {
    console.error('Error generating water quality report:', error);
    return errorResponse(res, 'Failed to generate water quality report', 500, error.message);
  }
};

/**
 * Analyze water contamination levels
 * Helper function to determine contamination level and safety status
 * @param {Object} testResults - Water test results
 * @returns {Object} Contamination analysis
 */
function analyzeContamination(testResults) {
  const { pH, turbidity, chlorine, bacteria, nitrates, fluoride } = testResults;
  
  let contaminationScore = 0;
  const recommendations = [];

  // pH analysis (ideal range: 6.5-8.5)
  if (pH < 6.5 || pH > 8.5) {
    contaminationScore += pH < 6.0 || pH > 9.0 ? 3 : 1;
    recommendations.push('pH levels outside safe range');
  }

  // Turbidity analysis (should be < 1 NTU)
  if (turbidity > 1) {
    contaminationScore += turbidity > 4 ? 3 : turbidity > 2 ? 2 : 1;
    recommendations.push('High turbidity detected');
  }

  // Chlorine analysis (0.2-0.5 mg/L for treated water)
  if (chlorine > 5 || chlorine < 0.2) {
    contaminationScore += chlorine > 10 ? 3 : 1;
    recommendations.push('Chlorine levels not optimal');
  }

  // Bacteria analysis
  if (bacteria && bacteria > 0) {
    contaminationScore += bacteria > 100 ? 3 : bacteria > 10 ? 2 : 1;
    recommendations.push('Bacterial contamination detected');
  }

  // Determine contamination level and safety status
  let level = 'low';
  let status = 'safe';

  if (contaminationScore >= 5) {
    level = 'high';
    status = 'unsafe';
  } else if (contaminationScore >= 3) {
    level = 'medium';
    status = 'caution';
  }

  return { level, status, recommendations, score: contaminationScore };
}

/**
 * Generate contamination alert
 * Helper function to create and send contamination alerts
 * @param {Object} waterQualityTest - Water quality test data
 */
async function generateContaminationAlert(waterQualityTest) {
  // In a real application, this would send notifications to relevant authorities
  console.log('WATER CONTAMINATION ALERT:', {
    location: waterQualityTest.location,
    waterSource: waterQualityTest.waterSource,
    contaminationLevel: waterQualityTest.contaminationLevel,
    testDate: waterQualityTest.testingDate
  });
  
  // TODO: Implement actual notification system (email, SMS, etc.)
}