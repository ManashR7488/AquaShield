import mongoose from 'mongoose';
import PatientRecord from '../models/patientRecord.model.js';
import { 
  getPatientsInVillage,
  validatePatientForHealthRecord 
} from '../models/index.js';
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
 * Patient Record Controller
 * Patient management with role-based access control
 */

/**
 * Register new patient
 * POST /api/patients
 */
const createPatient = asyncHandler(async (req, res) => {
  const patientData = {
    ...req.body,
    registeredBy: req.user._id,
    registrationDate: new Date()
  };

  // Auto-assign to ASHA worker if not specified
  if (!patientData.assignedAshaWorker && req.user.roleInfo.role === 'asha_worker') {
    patientData.assignedAshaWorker = req.user._id;
  }

  // Validate family relationships if provided
  if (patientData.familyMembers && patientData.familyMembers.length > 0) {
    const existingPatients = await PatientRecord.find({
      _id: { $in: patientData.familyMembers },
      isActive: true
    });

    if (existingPatients.length !== patientData.familyMembers.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more family members not found or inactive'
      });
    }
  }

  // Generate unique patient ID
  const patientCount = await PatientRecord.countDocuments();
  patientData.patientId = `PAT-${String(patientCount + 1).padStart(6, '0')}`;

  const patient = new PatientRecord(patientData);
  await patient.save();

  // Update family members to link back to this patient
  if (patientData.familyMembers && patientData.familyMembers.length > 0) {
    await PatientRecord.updateMany(
      { _id: { $in: patientData.familyMembers } },
      { $addToSet: { familyMembers: patient._id } }
    );
  }

  // Populate related data for response
  await patient.populate([
    { path: 'assignedAshaWorker', select: 'personalInfo.firstName personalInfo.lastName authentication.phone' },
    { path: 'registeredBy', select: 'personalInfo.firstName personalInfo.lastName roleInfo.role' },
    { path: 'location.villageId', select: 'name block district' },
    { path: 'familyMembers', select: 'personalInfo.firstName personalInfo.lastName patientId' }
  ]);

  return createdResponse(res, patient, 'Patient registered successfully');
});

/**
 * Get patients with filtering and pagination
 * GET /api/patients
 */
const getPatients = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    villageId,
    assignedAshaWorker,
    gender,
    ageMin,
    ageMax,
    search,
    isActive = true,
    sortBy = 'registrationDate',
    sortOrder = 'desc'
  } = req.query;

  // Build filter object
  const filter = {};
  
  if (villageId) filter['location.villageId'] = villageId;
  if (assignedAshaWorker) filter.assignedAshaWorker = assignedAshaWorker;
  if (gender) filter['personalInfo.gender'] = gender;
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  // Age filters (calculated from date of birth)
  if (ageMin || ageMax) {
    const now = new Date();
    if (ageMax) {
      const minDate = new Date(now.getFullYear() - parseInt(ageMax), now.getMonth(), now.getDate());
      filter['personalInfo.dateOfBirth'] = { $gte: minDate };
    }
    if (ageMin) {
      const maxDate = new Date(now.getFullYear() - parseInt(ageMin), now.getMonth(), now.getDate());
      filter['personalInfo.dateOfBirth'] = { 
        ...filter['personalInfo.dateOfBirth'],
        $lte: maxDate 
      };
    }
  }

  // Text search
  if (search) {
    filter.$or = [
      { 'personalInfo.firstName': { $regex: search, $options: 'i' } },
      { 'personalInfo.lastName': { $regex: search, $options: 'i' } },
      { patientId: { $regex: search, $options: 'i' } }
    ];
  }

  // Role-based access control
  const userRole = req.user.roleInfo.role;
  if (userRole === 'asha_worker') {
    // ASHA workers see only their assigned patients
    filter.assignedAshaWorker = req.user._id;
  } else if (userRole === 'volunteer') {
    // Volunteers might have limited access based on their assigned area
    // This would need to be implemented based on your access control requirements
    return res.status(403).json({
      success: false,
      message: 'Access denied. Volunteers cannot access patient records directly.'
    });
  }

  // Calculate pagination
  const total = await PatientRecord.countDocuments(filter);
  const paginationData = getPaginationData(page, limit, total);

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // Execute query
  const patients = await PatientRecord.find(filter)
    .populate([
      { path: 'assignedAshaWorker', select: 'personalInfo.firstName personalInfo.lastName authentication.phone' },
      { path: 'registeredBy', select: 'personalInfo.firstName personalInfo.lastName roleInfo.role' },
      { path: 'location.villageId', select: 'name block district' }
    ])
    .sort(sort)
    .skip(paginationData.skip)
    .limit(paginationData.itemsPerPage);

  return paginatedResponse(res, patients, paginationData, 'Patients retrieved successfully');
});

/**
 * Get single patient by ID
 * GET /api/patients/:id
 */
const getPatientById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const patient = await PatientRecord.findById(id)
    .populate([
      { path: 'assignedAshaWorker', select: 'personalInfo.firstName personalInfo.lastName authentication.phone roleInfo.specialization' },
      { path: 'registeredBy', select: 'personalInfo.firstName personalInfo.lastName roleInfo.role' },
      { path: 'location.villageId', select: 'name block district coordinates' },
      { path: 'familyMembers', select: 'personalInfo.firstName personalInfo.lastName patientId personalInfo.dateOfBirth personalInfo.gender' },
      { path: 'medicalHistory.chronicConditions.diagnosedBy', select: 'personalInfo.firstName personalInfo.lastName' },
      { path: 'emergencyContact.alternateContact', select: 'personalInfo.firstName personalInfo.lastName' }
    ]);

  if (!patient) {
    return notFoundResponse(res, 'Patient not found');
  }

  // Check authorization
  const userRole = req.user.roleInfo.role;
  if (userRole === 'asha_worker') {
    if (patient.assignedAshaWorker._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view patients assigned to you.'
      });
    }
  } else if (userRole === 'volunteer') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Volunteers cannot access detailed patient records.'
    });
  }

  return successResponse(res, patient, 'Patient retrieved successfully');
});

/**
 * Update patient record
 * PUT /api/patients/:id
 */
const updatePatient = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const patient = await PatientRecord.findById(id);
  
  if (!patient) {
    return notFoundResponse(res, 'Patient not found');
  }

  // Authorization check - assigned ASHA worker or health officials can update
  const userRole = req.user.roleInfo.role;
  const isAssignedAshaWorker = patient.assignedAshaWorker && 
                               patient.assignedAshaWorker.toString() === req.user._id.toString();
  const canUpdate = isAssignedAshaWorker || ['admin', 'health_official'].includes(userRole);

  if (!canUpdate) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only assigned ASHA workers or health officials can update patient records.'
    });
  }

  // Prevent changing critical fields
  delete updates.patientId;
  delete updates.registeredBy;
  delete updates.registrationDate;

  // Apply updates
  Object.assign(patient, updates);
  patient.lastUpdated = new Date();

  await patient.save();

  // Populate for response
  await patient.populate([
    { path: 'assignedAshaWorker', select: 'personalInfo.firstName personalInfo.lastName authentication.phone' },
    { path: 'location.villageId', select: 'name block district' }
  ]);

  return updatedResponse(res, patient, 'Patient record updated successfully');
});

/**
 * Link family member
 * PUT /api/patients/:id/family
 */
const linkFamilyMember = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { familyMemberId } = req.body;

  const patient = await PatientRecord.findById(id);
  const familyMember = await PatientRecord.findById(familyMemberId);
  
  if (!patient) {
    return notFoundResponse(res, 'Patient not found');
  }
  
  if (!familyMember) {
    return notFoundResponse(res, 'Family member not found');
  }

  // Authorization check
  const userRole = req.user.roleInfo.role;
  const isAssignedAshaWorker = patient.assignedAshaWorker && 
                               patient.assignedAshaWorker.toString() === req.user._id.toString();
  const canUpdate = isAssignedAshaWorker || ['admin', 'health_official'].includes(userRole);

  if (!canUpdate) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only assigned ASHA workers or health officials can link family members.'
    });
  }

  // Add family member relationships (bidirectional)
  if (!patient.familyMembers.includes(familyMemberId)) {
    patient.familyMembers.push(familyMemberId);
    await patient.save();
  }

  if (!familyMember.familyMembers.includes(id)) {
    familyMember.familyMembers.push(id);
    await familyMember.save();
  }

  return updatedResponse(res, patient, 'Family member linked successfully');
});

/**
 * Transfer patient to new ASHA worker
 * PUT /api/patients/:id/transfer
 */
const transferPatient = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { newAshaWorkerId, reason } = req.body;

  // Only health officials can transfer patients
  if (!['admin', 'health_official'].includes(req.user.roleInfo.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only health officials can transfer patients.'
    });
  }

  const patient = await PatientRecord.findById(id);
  const newAshaWorker = await mongoose.model('User').findById(newAshaWorkerId);
  
  if (!patient) {
    return notFoundResponse(res, 'Patient not found');
  }
  
  if (!newAshaWorker || newAshaWorker.roleInfo.role !== 'asha_worker') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ASHA worker ID'
    });
  }

  const previousAshaWorker = patient.assignedAshaWorker;
  patient.assignedAshaWorker = newAshaWorkerId;
  
  // Add transfer record
  if (!patient.transferHistory) patient.transferHistory = [];
  patient.transferHistory.push({
    fromAshaWorker: previousAshaWorker,
    toAshaWorker: newAshaWorkerId,
    transferredBy: req.user._id,
    transferDate: new Date(),
    reason: reason
  });

  await patient.save();

  return updatedResponse(res, patient, 'Patient transferred successfully');
});

/**
 * Deactivate patient record
 * DELETE /api/patients/:id
 */
const deactivatePatient = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Only admin can deactivate patients
  if (req.user.roleInfo.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only administrators can deactivate patient records.'
    });
  }

  const patient = await PatientRecord.findById(id);
  
  if (!patient) {
    return notFoundResponse(res, 'Patient not found');
  }

  patient.isActive = false;
  patient.deactivatedBy = req.user._id;
  patient.deactivatedAt = new Date();

  await patient.save();

  return updatedResponse(res, patient, 'Patient record deactivated successfully');
});

/**
 * Get patients by village
 * GET /api/patients/village/:villageId
 */
const getPatientsByVillage = asyncHandler(async (req, res) => {
  const { villageId } = req.params;
  const { page = 1, limit = 10, assignedAshaWorker } = req.query;

  // Use existing helper function
  const paginationData = getPaginationData(page, limit);
  
  try {
    const patients = await getPatientsInVillage(villageId, {
      isActive: true,
      ...(assignedAshaWorker && { assignedAshaWorker })
    });

    // Apply pagination manually since helper function doesn't support it
    const startIndex = paginationData.skip;
    const endIndex = startIndex + paginationData.itemsPerPage;
    const paginatedPatients = patients.slice(startIndex, endIndex);
    
    const finalPaginationData = getPaginationData(page, limit, patients.length);

    return paginatedResponse(res, paginatedPatients, finalPaginationData, 'Village patients retrieved successfully');
  } catch (error) {
    throw new Error(`Failed to get village patients: ${error.message}`);
  }
});

/**
 * Get ASHA worker patients
 * GET /api/patients/asha/:ashaWorkerId
 */
const getAshaWorkerPatients = asyncHandler(async (req, res) => {
  const { ashaWorkerId } = req.params;
  const { page = 1, limit = 10, isActive = true } = req.query;

  // Users can only view their own assigned patients unless admin/health official
  const userRole = req.user.roleInfo.role;
  if (ashaWorkerId !== req.user._id.toString() && !['admin', 'health_official'].includes(userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only view your own assigned patients.'
    });
  }

  const filter = {
    assignedAshaWorker: ashaWorkerId,
    isActive: isActive === 'true'
  };

  const total = await PatientRecord.countDocuments(filter);
  const paginationData = getPaginationData(page, limit, total);

  const patients = await PatientRecord.find(filter)
    .populate([
      { path: 'location.villageId', select: 'name block district' }
    ])
    .sort({ registrationDate: -1 })
    .skip(paginationData.skip)
    .limit(paginationData.itemsPerPage);

  return paginatedResponse(res, patients, paginationData, 'ASHA worker patients retrieved successfully');
});

/**
 * Get patient health summary
 * GET /api/patients/:id/health-summary
 */
const getPatientHealthSummary = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const patient = await PatientRecord.findById(id)
    .populate([
      { path: 'assignedAshaWorker', select: 'personalInfo.firstName personalInfo.lastName' },
      { path: 'location.villageId', select: 'name block district' }
    ]);

  if (!patient) {
    return notFoundResponse(res, 'Patient not found');
  }

  // Authorization check
  const userRole = req.user.roleInfo.role;
  if (userRole === 'asha_worker') {
    if (patient.assignedAshaWorker._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view patients assigned to you.'
      });
    }
  }

  // Use existing validation helper if available
  let healthSummary;
  try {
    healthSummary = await validatePatientForHealthRecord(id);
  } catch (error) {
    // Fallback to basic summary
    healthSummary = {
      patientId: patient.patientId,
      personalInfo: patient.personalInfo,
      chronicConditions: patient.medicalHistory?.chronicConditions || [],
      allergies: patient.medicalHistory?.allergies || [],
      medications: patient.medicalHistory?.medications || [],
      lastCheckup: patient.medicalHistory?.lastCheckup,
      assignedAshaWorker: patient.assignedAshaWorker,
      location: patient.location
    };
  }

  return successResponse(res, healthSummary, 'Patient health summary retrieved successfully');
});

/**
 * Get family members
 * GET /api/patients/:id/family
 */
const getFamilyMembers = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const patient = await PatientRecord.findById(id)
    .populate({
      path: 'familyMembers',
      select: 'personalInfo patientId location assignedAshaWorker',
      populate: [
        { path: 'location.villageId', select: 'name' },
        { path: 'assignedAshaWorker', select: 'personalInfo.firstName personalInfo.lastName' }
      ]
    });

  if (!patient) {
    return notFoundResponse(res, 'Patient not found');
  }

  // Authorization check
  const userRole = req.user.roleInfo.role;
  if (userRole === 'asha_worker') {
    if (patient.assignedAshaWorker && patient.assignedAshaWorker.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view patients assigned to you.'
      });
    }
  }

  return successResponse(res, patient.familyMembers, 'Family members retrieved successfully');
});

/**
 * Add medical history entry
 * POST /api/patients/:id/medical-history
 */
const addMedicalHistoryEntry = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const entry = {
    ...req.body,
    addedBy: req.user._id,
    addedAt: new Date()
  };

  const patient = await PatientRecord.findById(id);
  if (!patient) {
    return notFoundResponse(res, 'Patient not found');
  }

  // Privacy control: Only health officials, assigned ASHA, or patient can add
  const userRole = req.user.roleInfo.role;
  if (
    userRole !== 'health_official' &&
    userRole !== 'admin' &&
    (!patient.assignedAshaWorker || patient.assignedAshaWorker.toString() !== req.user._id.toString()) &&
    patient._id.toString() !== req.user._id.toString()
  ) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only authorized users can add medical history.'
    });
  }

  patient.medicalHistory.push(entry);
  await patient.save();

  return updatedResponse(res, patient, 'Medical history entry added successfully');
});

/**
 * Get medical history with privacy controls
 * GET /api/patients/:id/medical-history
 */
const getMedicalHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const patient = await PatientRecord.findById(id).select('medicalHistory assignedAshaWorker privacyLevel');
  if (!patient) {
    return notFoundResponse(res, 'Patient not found');
  }

  // Privacy control: Only health officials, assigned ASHA, or patient can view
  const userRole = req.user.roleInfo.role;
  if (
    patient.privacyLevel === 'confidential' &&
    userRole !== 'health_official' &&
    userRole !== 'admin' &&
    (!patient.assignedAshaWorker || patient.assignedAshaWorker.toString() !== req.user._id.toString()) &&
    patient._id.toString() !== req.user._id.toString()
  ) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Medical history is confidential.'
    });
  }

  return successResponse(res, patient.medicalHistory, 'Medical history retrieved successfully');
});

/**
 * Update privacy level
 * PATCH /api/patients/:id/privacy
 */
const updatePrivacyLevel = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { privacyLevel } = req.body;

  const allowedLevels = ['public', 'community', 'confidential'];
  if (!allowedLevels.includes(privacyLevel)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid privacy level'
    });
  }

  const patient = await PatientRecord.findById(id);
  if (!patient) {
    return notFoundResponse(res, 'Patient not found');
  }

  // Only health officials, admin, or patient can update privacy
  const userRole = req.user.roleInfo.role;
  if (
    userRole !== 'health_official' &&
    userRole !== 'admin' &&
    patient._id.toString() !== req.user._id.toString()
  ) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only authorized users can update privacy.'
    });
  }

  patient.privacyLevel = privacyLevel;
  await patient.save();

  return updatedResponse(res, patient, 'Privacy level updated successfully');
});

export {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  linkFamilyMember,
  transferPatient,
  deactivatePatient,
  getPatientsByVillage,
  getAshaWorkerPatients,
  getPatientHealthSummary,
  getFamilyMembers,
  addMedicalHistoryEntry,
  getMedicalHistory,
  updatePrivacyLevel
};