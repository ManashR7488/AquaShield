import express from 'express';
const router = express.Router();

// Import all route modules
import waterQualityTestRoutes from './waterQualityTest.routes.js';
import waterQualityRoutes from './waterQuality.routes.js';
import healthReportRoutes from './healthReport.routes.js';
import alertSystemRoutes from './alertSystem.routes.js';
import patientRecordRoutes from './patientRecord.routes.js';
import healthProgramRoutes from './healthProgram.routes.js';

// Enhanced health surveillance route modules
import diseaseRecordRoutes from './diseaseRecord.routes.js';
import vaccinationRecordRoutes from './vaccinationRecord.routes.js';
import healthObservationRoutes from './healthObservation.routes.js';
import communityObservationRoutes from './communityObservation.routes.js';

// User-focused health management routes
import familyMemberRoutes from './familyMember.routes.js';
import personalHealthRecordRoutes from './personalHealthRecord.routes.js';

// Administrative and management routes
import districtRoutes from './district.routes.js';
import blockRoutes from './block.routes.js';
import userRoutes from './user.routes.js';

/**
 * Main API Routes Configuration
 * All routes are prefixed with /api
 */

// Health surveillance core routes
router.use('/water-quality-tests', waterQualityTestRoutes);
router.use('/water-quality', waterQualityRoutes);
router.use('/health-reports', healthReportRoutes);
router.use('/alerts', alertSystemRoutes);
router.use('/patients', patientRecordRoutes);
router.use('/health-programs', healthProgramRoutes);

// Enhanced health surveillance routes
router.use('/disease-records', diseaseRecordRoutes);
router.use('/vaccination-records', vaccinationRecordRoutes);
router.use('/health-observations', healthObservationRoutes);
router.use('/community-observations', communityObservationRoutes);

// User-focused health management routes
router.use('/family-members', familyMemberRoutes);
router.use('/health-records', personalHealthRecordRoutes);

// Administrative and management routes
router.use('/districts', districtRoutes);
router.use('/blocks', blockRoutes);
router.use('/users', userRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Health Surveillance API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: {
      waterQualityTests: '/api/water-quality-tests',
      healthReports: '/api/health-reports',
      alerts: '/api/alerts',
      patients: '/api/patients',
      healthPrograms: '/api/health-programs',
      diseaseRecords: '/api/disease-records',
      vaccinationRecords: '/api/vaccination-records',
      healthObservations: '/api/health-observations',
      communityObservations: '/api/community-observations',
      waterQuality: '/api/water-quality',
      familyMembers: '/api/family-members',
      healthRecords: '/api/health-records',
      districts: '/api/districts',
      blocks: '/api/blocks',
      users: '/api/users'
    }
  });
});

// API documentation endpoint
router.get('/docs', (req, res) => {
  res.json({
    success: true,
    message: 'Health Surveillance API Documentation',
    version: '1.0.0',
    baseUrl: '/api',
    authentication: 'JWT Bearer Token required for all endpoints except /health and /docs',
    authorization: 'Role-based access control implemented',
    roles: ['admin', 'health_official', 'asha_worker', 'volunteer'],
    endpoints: {
      '/water-quality-tests': {
        description: 'Water quality testing and monitoring',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        access: 'All authenticated users (role-based filtering)'
      },
      '/health-reports': {
        description: 'Health incident reporting and tracking',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        access: 'All authenticated users (role-based filtering)'
      },
      '/alerts': {
        description: 'Alert system for health notifications',
        methods: ['GET', 'POST', 'PUT'],
        access: 'All authenticated users (role-based filtering)'
      },
      '/patients': {
        description: 'Patient record management',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        access: 'ASHA workers, Health officials, Admin'
      },
      '/health-programs': {
        description: 'Health program management and enrollment',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        access: 'All authenticated users (create/update: officials only)'
      },
      '/family-members': {
        description: 'Family member management for users',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        access: 'Users only (own family members)'
      },
      '/health-records': {
        description: 'Personal health record tracking for users',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        access: 'Users only (own health records)'
      }
    },
    commonQueryParams: {
      page: 'Page number for pagination (default: 1)',
      limit: 'Items per page (default: 10, max: 100)',
      sortBy: 'Field to sort by',
      sortOrder: 'Sort direction (asc/desc)',
      search: 'Text search across relevant fields'
    },
    responseFormat: {
      success: 'Boolean indicating request success',
      message: 'Human-readable response message',
      data: 'Response data (varies by endpoint)',
      pagination: 'Pagination info for list endpoints'
    }
  });
});

// 404 handler for unknown API routes
router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} not found`,
    availableEndpoints: [
      '/api/health',
      '/api/docs',
      '/api/water-quality-tests',
      '/api/water-quality',
      '/api/health-reports',
      '/api/alerts',
      '/api/patients',
      '/api/health-programs',
      '/api/family-members',
      '/api/health-records'
    ]
  });
});

export default router;