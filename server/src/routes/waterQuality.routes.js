import express from 'express';
import mongoose from 'mongoose';
import {
  createWaterQualityTest,
  getWaterQualityTests,
  getWaterQualityTestById,
  updateWaterQualityTest,
  getWaterQualityTrends,
  generateContaminationAlerts,
  generateWaterQualityReport
} from '../controllers/waterQuality.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * Water Quality Test Management Routes
 */

// Create new water quality test
router.post('/',
  authorize(['asha_worker', 'health_official', 'admin']),
  // validate(waterQualitySchema), // TODO: Add validation schema
  asyncHandler(createWaterQualityTest)
);

// Get all water quality tests (with filtering)
router.get('/',
  authorize(['asha_worker', 'volunteer', 'health_official', 'admin']),
  asyncHandler(getWaterQualityTests)
);

// Get water quality test by ID
router.get('/:id',
  authorize(['asha_worker', 'volunteer', 'health_official', 'admin']),
  asyncHandler(getWaterQualityTestById)
);

// Update water quality test
router.put('/:id',
  authorize(['asha_worker', 'health_official', 'admin']),
  // validate(waterQualityUpdateSchema), // TODO: Add validation schema
  asyncHandler(updateWaterQualityTest)
);

/**
 * Water Quality Analysis Routes
 */

// Get water quality trends
router.get('/trends/analysis',
  authorize(['asha_worker', 'health_official', 'admin']),
  asyncHandler(getWaterQualityTrends)
);

// Generate contamination alerts
router.get('/alerts/contamination',
  authorize(['asha_worker', 'health_official', 'admin']),
  asyncHandler(generateContaminationAlerts)
);

// Generate comprehensive water quality report
router.get('/reports/comprehensive',
  authorize(['health_official', 'admin']),
  asyncHandler(generateWaterQualityReport)
);

/**
 * Testing Schedule Routes (Future Implementation)
 */

// Schedule water quality test
router.post('/schedule',
  authorize(['asha_worker', 'health_official', 'admin']),
  asyncHandler(async (req, res) => {
    // TODO: Implement test scheduling functionality
    res.status(501).json({
      success: false,
      message: 'Test scheduling functionality coming soon'
    });
  })
);

// Get scheduled tests
router.get('/schedule/upcoming',
  authorize(['asha_worker', 'health_official', 'admin']),
  asyncHandler(async (req, res) => {
    // TODO: Implement scheduled tests retrieval
    res.status(501).json({
      success: false,
      message: 'Scheduled tests functionality coming soon'
    });
  })
);

/**
 * Water Source Management Routes
 */

// Get water sources by area
router.get('/sources/area/:areaId',
  authorize(['asha_worker', 'volunteer', 'health_official', 'admin']),
  asyncHandler(async (req, res) => {
    const { areaId } = req.params;
    
    // Import model dynamically to avoid circular dependencies
    const WaterQuality = mongoose.model('WaterQuality');
    
    const sources = await WaterQuality.aggregate([
      { $match: { 'location.area': areaId } },
      {
        $group: {
          _id: '$waterSource',
          count: { $sum: 1 },
          latestTest: { $max: '$testingDate' },
          safeTests: { $sum: { $cond: [{ $eq: ['$safetyStatus', 'safe'] }, 1, 0] } },
          unsafeTests: { $sum: { $cond: [{ $eq: ['$safetyStatus', 'unsafe'] }, 1, 0] } }
        }
      },
      {
        $addFields: {
          safetyPercentage: {
            $multiply: [{ $divide: ['$safeTests', '$count'] }, 100]
          }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    res.status(200).json({
      success: true,
      data: sources,
      message: 'Water sources fetched successfully'
    });
  })
);

/**
 * Monitoring and Maintenance Routes
 */

// Get maintenance recommendations
router.get('/maintenance/recommendations',
  authorize(['asha_worker', 'health_official', 'admin']),
  asyncHandler(async (req, res) => {
    const { area } = req.query;
    
    const WaterQuality = mongoose.model('WaterQuality');
    const filter = area ? { 'location.area': area } : {};
    
    // Find water sources that need attention
    const needsAttention = await WaterQuality.find({
      ...filter,
      $or: [
        { safetyStatus: 'unsafe' },
        { contaminationLevel: { $in: ['medium', 'high'] } },
        { followUpRequired: true }
      ]
    })
    .sort({ testingDate: -1 })
    .limit(20)
    .populate('testedBy', 'name email');
    
    const recommendations = needsAttention.map(test => ({
      testId: test._id,
      location: test.location,
      waterSource: test.waterSource,
      issues: test.recommendations,
      priority: test.contaminationLevel === 'high' ? 'urgent' : 'medium',
      testDate: test.testingDate,
      followUpRequired: test.followUpRequired
    }));
    
    res.status(200).json({
      success: true,
      data: recommendations,
      message: 'Maintenance recommendations generated successfully'
    });
  })
);

// Mark follow-up completed
router.put('/:id/follow-up/complete',
  authorize(['asha_worker', 'health_official', 'admin']),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { notes } = req.body;
    
    const WaterQuality = mongoose.model('WaterQuality');
    
    const test = await WaterQuality.findByIdAndUpdate(
      id,
      {
        followUpRequired: false,
        followUpCompleted: true,
        followUpCompletedAt: new Date(),
        followUpCompletedBy: req.user.id,
        followUpNotes: notes
      },
      { new: true }
    );
    
    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Water quality test not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: test,
      message: 'Follow-up marked as completed successfully'
    });
  })
);

export default router;