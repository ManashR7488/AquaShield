import { PersonalHealthRecord } from '../models/personalHealthRecord.model.js';
import { FamilyMember } from '../models/familyMember.model.js';
import { successResponse, errorResponse } from '../utils/responseHelper.js';

/**
 * Get health records for the current user
 */
export const getHealthRecords = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      recordType,
      category,
      familyMemberId,
      startDate,
      endDate,
      priority,
      status = 'active',
      tags,
      search,
      page = 1,
      limit = 10,
      sortBy = 'recordDate',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { userId, status };
    
    if (recordType) filter.recordType = recordType;
    if (category) filter.category = category;
    if (familyMemberId) filter.familyMemberId = familyMemberId;
    if (priority) filter.priority = priority;
    
    // Date range filter
    if (startDate || endDate) {
      filter.recordDate = {};
      if (startDate) filter.recordDate.$gte = new Date(startDate);
      if (endDate) filter.recordDate.$lte = new Date(endDate);
    }
    
    // Tags filter
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filter.tags = { $in: tagArray };
    }

    // Search functionality
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { keywords: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Execute query with pagination
    const [healthRecords, totalCount] = await Promise.all([
      PersonalHealthRecord.find(filter)
        .populate('familyMemberId', 'firstName lastName relationship')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      PersonalHealthRecord.countDocuments(filter)
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    successResponse(res, 'Health records retrieved successfully', {
      healthRecords,
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
    console.error('Error fetching health records:', error);
    errorResponse(res, 'Failed to fetch health records', 500);
  }
};

/**
 * Create a new health record
 */
export const createHealthRecord = async (req, res) => {
  try {
    const userId = req.user.userId;
    const recordData = { ...req.body, userId };

    // Validate family member if provided
    if (recordData.familyMemberId) {
      const familyMember = await FamilyMember.findOne({
        _id: recordData.familyMemberId,
        userId,
        status: 'active'
      });
      
      if (!familyMember) {
        return errorResponse(res, 'Family member not found', 404);
      }
    }

    // Create health record
    const healthRecord = new PersonalHealthRecord(recordData);
    await healthRecord.save();

    // Populate family member data for response
    await healthRecord.populate('familyMemberId', 'firstName lastName relationship');

    successResponse(res, 'Health record created successfully', { healthRecord }, 201);
  } catch (error) {
    console.error('Error creating health record:', error);
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return errorResponse(res, validationErrors.join(', '), 400);
    }
    errorResponse(res, 'Failed to create health record', 500);
  }
};

/**
 * Get a specific health record by ID
 */
export const getHealthRecordById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const healthRecord = await PersonalHealthRecord.findOne({ _id: id, userId, status: 'active' })
      .populate('familyMemberId', 'firstName lastName relationship')
      .lean();

    if (!healthRecord) {
      return errorResponse(res, 'Health record not found', 404);
    }

    successResponse(res, 'Health record retrieved successfully', { healthRecord });
  } catch (error) {
    console.error('Error fetching health record:', error);
    errorResponse(res, 'Failed to fetch health record', 500);
  }
};

/**
 * Update a health record
 */
export const updateHealthRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const updateData = req.body;

    // Check if health record exists and belongs to the user
    const existingRecord = await PersonalHealthRecord.findOne({ _id: id, userId, status: 'active' });
    if (!existingRecord) {
      return errorResponse(res, 'Health record not found', 404);
    }

    // Validate family member if being updated
    if (updateData.familyMemberId) {
      const familyMember = await FamilyMember.findOne({
        _id: updateData.familyMemberId,
        userId,
        status: 'active'
      });
      
      if (!familyMember) {
        return errorResponse(res, 'Family member not found', 404);
      }
    }

    // Update health record
    const updatedRecord = await PersonalHealthRecord.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('familyMemberId', 'firstName lastName relationship');

    successResponse(res, 'Health record updated successfully', { healthRecord: updatedRecord });
  } catch (error) {
    console.error('Error updating health record:', error);
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return errorResponse(res, validationErrors.join(', '), 400);
    }
    errorResponse(res, 'Failed to update health record', 500);
  }
};

/**
 * Delete a health record (soft delete)
 */
export const deleteHealthRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const healthRecord = await PersonalHealthRecord.findOne({ _id: id, userId, status: 'active' });
    if (!healthRecord) {
      return errorResponse(res, 'Health record not found', 404);
    }

    // Soft delete by updating status
    healthRecord.status = 'deleted';
    await healthRecord.save();

    successResponse(res, 'Health record deleted successfully');
  } catch (error) {
    console.error('Error deleting health record:', error);
    errorResponse(res, 'Failed to delete health record', 500);
  }
};

/**
 * Create vital signs record
 */
export const createVitalSigns = async (req, res) => {
  try {
    const userId = req.user.userId;
    const vitalSignsData = {
      ...req.body,
      userId,
      recordType: 'vital_signs',
      title: req.body.title || 'Vital Signs Check',
      description: req.body.description || 'Regular vital signs monitoring'
    };

    // Validate family member if provided
    if (vitalSignsData.familyMemberId) {
      const familyMember = await FamilyMember.findOne({
        _id: vitalSignsData.familyMemberId,
        userId,
        status: 'active'
      });
      
      if (!familyMember) {
        return errorResponse(res, 'Family member not found', 404);
      }
    }

    const healthRecord = new PersonalHealthRecord(vitalSignsData);
    await healthRecord.save();
    await healthRecord.populate('familyMemberId', 'firstName lastName relationship');

    successResponse(res, 'Vital signs recorded successfully', { healthRecord }, 201);
  } catch (error) {
    console.error('Error creating vital signs record:', error);
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return errorResponse(res, validationErrors.join(', '), 400);
    }
    errorResponse(res, 'Failed to record vital signs', 500);
  }
};

/**
 * Create symptom log
 */
export const createSymptomLog = async (req, res) => {
  try {
    const userId = req.user.userId;
    const symptomData = {
      ...req.body,
      userId,
      recordType: 'symptoms'
    };

    // Validate family member if provided
    if (symptomData.familyMemberId) {
      const familyMember = await FamilyMember.findOne({
        _id: symptomData.familyMemberId,
        userId,
        status: 'active'
      });
      
      if (!familyMember) {
        return errorResponse(res, 'Family member not found', 404);
      }
    }

    const healthRecord = new PersonalHealthRecord(symptomData);
    await healthRecord.save();
    await healthRecord.populate('familyMemberId', 'firstName lastName relationship');

    successResponse(res, 'Symptom log created successfully', { healthRecord }, 201);
  } catch (error) {
    console.error('Error creating symptom log:', error);
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return errorResponse(res, validationErrors.join(', '), 400);
    }
    errorResponse(res, 'Failed to create symptom log', 500);
  }
};

/**
 * Create medical history record
 */
export const createMedicalHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const medicalHistoryData = {
      ...req.body,
      userId,
      recordType: 'medical_history'
    };

    // Validate family member if provided
    if (medicalHistoryData.familyMemberId) {
      const familyMember = await FamilyMember.findOne({
        _id: medicalHistoryData.familyMemberId,
        userId,
        status: 'active'
      });
      
      if (!familyMember) {
        return errorResponse(res, 'Family member not found', 404);
      }
    }

    const healthRecord = new PersonalHealthRecord(medicalHistoryData);
    await healthRecord.save();
    await healthRecord.populate('familyMemberId', 'firstName lastName relationship');

    successResponse(res, 'Medical history record created successfully', { healthRecord }, 201);
  } catch (error) {
    console.error('Error creating medical history record:', error);
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return errorResponse(res, validationErrors.join(', '), 400);
    }
    errorResponse(res, 'Failed to create medical history record', 500);
  }
};

/**
 * Get records by type
 */
export const getRecordsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const userId = req.user.userId;
    const { familyMemberId, page = 1, limit = 10 } = req.query;

    const filter = { userId, recordType: type, status: 'active' };
    if (familyMemberId) filter.familyMemberId = familyMemberId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [records, totalCount] = await Promise.all([
      PersonalHealthRecord.find(filter)
        .populate('familyMemberId', 'firstName lastName relationship')
        .sort({ recordDate: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      PersonalHealthRecord.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    successResponse(res, `${type} records retrieved successfully`, {
      records,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching records by type:', error);
    errorResponse(res, 'Failed to fetch records', 500);
  }
};

/**
 * Get health trends
 */
export const getHealthTrends = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { recordType, timeframe = '6months', familyMemberId } = req.query;

    if (!recordType) {
      return errorResponse(res, 'Record type is required for trends analysis', 400);
    }

    let query = PersonalHealthRecord.getHealthTrends(userId, recordType, timeframe);
    
    if (familyMemberId) {
      query = query.where({ familyMemberId });
    }

    const trendData = await query;

    // Process trend data based on record type
    let processedTrends = [];

    if (recordType === 'vital_signs') {
      processedTrends = trendData.map(record => ({
        date: record.recordDate,
        bloodPressure: record.vitalSigns?.bloodPressure,
        heartRate: record.vitalSigns?.heartRate?.value,
        weight: record.vitalSigns?.weight?.value,
        bmi: record.vitalSigns?.bmi
      }));
    } else if (recordType === 'symptoms') {
      processedTrends = trendData.map(record => ({
        date: record.recordDate,
        severity: record.symptoms?.severity,
        painScale: record.symptoms?.painScale,
        primarySymptoms: record.symptoms?.primarySymptoms
      }));
    }

    successResponse(res, 'Health trends retrieved successfully', { trends: processedTrends });
  } catch (error) {
    console.error('Error fetching health trends:', error);
    errorResponse(res, 'Failed to fetch health trends', 500);
  }
};

/**
 * Get health record statistics
 */
export const getHealthRecordStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    const stats = await PersonalHealthRecord.getRecordStats(userId);

    // Calculate additional statistics
    const totalRecords = stats.reduce((sum, stat) => sum + stat.count, 0);
    const recordTypeDistribution = {};
    
    stats.forEach(stat => {
      recordTypeDistribution[stat.recordType] = {
        count: stat.count,
        percentage: Math.round((stat.count / totalRecords) * 100),
        lastRecord: stat.lastRecordDate,
        avgPriority: stat.avgPriority
      };
    });

    // Get family member health records count
    const familyRecordsCount = await PersonalHealthRecord.countDocuments({
      userId,
      familyMemberId: { $exists: true },
      status: 'active'
    });

    const summary = {
      totalRecords,
      personalRecords: totalRecords - familyRecordsCount,
      familyRecords: familyRecordsCount,
      recordTypeDistribution,
      lastActivity: stats.length > 0 ? Math.max(...stats.map(s => new Date(s.lastRecordDate))) : null
    };

    successResponse(res, 'Health record statistics retrieved successfully', { stats: summary });
  } catch (error) {
    console.error('Error fetching health record stats:', error);
    errorResponse(res, 'Failed to fetch health record statistics', 500);
  }
};

/**
 * Generate health report
 */
export const generateHealthReport = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      startDate,
      endDate,
      recordTypes = [],
      includeFamily = true,
      format = 'json'
    } = req.body;

    // Build filter for report
    const filter = {
      userId,
      status: 'active',
      recordDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    if (recordTypes.length > 0) {
      filter.recordType = { $in: recordTypes };
    }

    if (!includeFamily) {
      filter.familyMemberId = { $exists: false };
    }

    // Fetch records for report
    const records = await PersonalHealthRecord.find(filter)
      .populate('familyMemberId', 'firstName lastName relationship')
      .sort({ recordDate: -1 })
      .lean();

    // Group records by type
    const groupedRecords = {};
    records.forEach(record => {
      if (!groupedRecords[record.recordType]) {
        groupedRecords[record.recordType] = [];
      }
      groupedRecords[record.recordType].push(record);
    });

    // Generate report summary
    const reportSummary = {
      generatedDate: new Date(),
      reportPeriod: { startDate, endDate },
      totalRecords: records.length,
      recordTypes: Object.keys(groupedRecords),
      includeFamily
    };

    const reportData = {
      summary: reportSummary,
      records: groupedRecords,
      rawData: records
    };

    if (format === 'json') {
      successResponse(res, 'Health report generated successfully', { report: reportData });
    } else {
      // For PDF and Excel formats, return download URL (implementation would depend on file generation service)
      successResponse(res, 'Health report generation initiated', {
        message: `${format.toUpperCase()} report will be generated and download link will be sent via email`,
        reportId: `RPT-${Date.now()}`
      });
    }
  } catch (error) {
    console.error('Error generating health report:', error);
    errorResponse(res, 'Failed to generate health report', 500);
  }
};