/**
 * @deprecated This service is deprecated. Use waterTestService.js instead.
 * All methods in this service now proxy to the correct /api/water-quality-tests endpoints.
 * This file is maintained for backward compatibility only.
 * 
 * Migration Guide:
 * Replace: import waterQualityService from './config/waterQualityService'
 * With: import waterTestService from './services/waterTestService'
 */

import axios from './axios';

// Import the active service for proxying
import waterTestService from '../services/waterTestService';

class WaterQualityService {
  // Create a new water quality record
  // @deprecated - Proxies to waterTestService.createTest
  async createRecord(recordData) {
    console.warn('⚠️ waterQualityService.createRecord is deprecated. Use waterTestService.createTest instead.');
    try {
      return await waterTestService.createTest(recordData);
    } catch (error) {
      console.error('Error creating water quality record:', error);
      throw error;
    }
  }

  // Get all water quality records with filters
  // @deprecated - Proxies to waterTestService.getTests
  async getAllRecords(filters = {}) {
    console.warn('⚠️ waterQualityService.getAllRecords is deprecated. Use waterTestService.getTests instead.');
    try {
      return await waterTestService.getTests(filters);
    } catch (error) {
      console.error('Error fetching water quality records:', error);
      throw error;
    }
  }

  // Get water quality record by ID
  // @deprecated - Proxies to waterTestService.getTestById
  async getRecordById(recordId) {
    console.warn('⚠️ waterQualityService.getRecordById is deprecated. Use waterTestService.getTestById instead.');
    try {
      return await waterTestService.getTestById(recordId);
    } catch (error) {
      console.error('Error fetching water quality record:', error);
      throw error;
    }
  }

  // Update water quality record
  // @deprecated - Proxies to waterTestService.updateTest
  async updateRecord(recordId, updateData) {
    console.warn('⚠️ waterQualityService.updateRecord is deprecated. Use waterTestService.updateTest instead.');
    try {
      return await waterTestService.updateTest(recordId, updateData);
    } catch (error) {
      console.error('Error updating water quality record:', error);
      throw error;
    }
  }

  // Delete water quality record
  // @deprecated - Proxies to waterTestService.deleteTest
  async deleteRecord(recordId) {
    console.warn('⚠️ waterQualityService.deleteRecord is deprecated. Use waterTestService.deleteTest instead.');
    try {
      return await waterTestService.deleteTest(recordId);
    } catch (error) {
      console.error('Error deleting water quality record:', error);
      throw error;
    }
  }

  // Get water quality trends analysis
  // Uses waterQuality.routes.js endpoint: GET /api/water-quality/trends/analysis
  async getTrends(filters = {}) {
    console.warn('⚠️ waterQualityService.getTrends calls /api/water-quality/trends/analysis. Consider migrating to waterTestService.');
    try {
      const params = new URLSearchParams();
      
      if (filters.location) params.append('location', filters.location);
      if (filters.waterType) params.append('waterType', filters.waterType);
      if (filters.district) params.append('district', filters.district);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.parameter) params.append('parameter', filters.parameter);
      
      const response = await axios.get(`/water-quality/trends/analysis?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching water quality trends:', error);
      throw error;
    }
  }

  // Get contamination alerts
  // Uses waterQuality.routes.js endpoint: GET /api/water-quality/alerts/contamination
  async getContaminationAlerts(filters = {}) {
    console.warn('⚠️ waterQualityService.getContaminationAlerts calls /api/water-quality/alerts/contamination. Consider migrating to waterTestService.');
    try {
      const params = new URLSearchParams();
      
      if (filters.location) params.append('location', filters.location);
      if (filters.severity) params.append('severity', filters.severity);
      if (filters.district) params.append('district', filters.district);
      if (filters.waterType) params.append('waterType', filters.waterType);
      if (filters.status) params.append('status', filters.status);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      
      const response = await axios.get(`/water-quality/alerts/contamination?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching contamination alerts:', error);
      throw error;
    }
  }

  // @deprecated - No backend endpoint exists for creating contamination alerts
  // Backend only has GET /alerts/contamination for generating alerts from existing tests
  async createContaminationAlert(alertData) {
    console.error('❌ waterQualityService.createContaminationAlert is deprecated. No corresponding backend endpoint exists.');
    throw new Error('This method is deprecated. Contamination alerts are generated automatically by the backend based on water quality test results.');
  }

  // @deprecated - No backend endpoint exists for updating alert status
  async updateAlertStatus(alertId, statusData) {
    console.error('❌ waterQualityService.updateAlertStatus is deprecated. No corresponding backend endpoint exists.');
    throw new Error('This method is deprecated. Use the alert system API at /api/alerts instead.');
  }

  // Get water quality report
  // Uses waterQuality.routes.js endpoint: GET /api/water-quality/reports/comprehensive
  async getReport(filters = {}) {
    console.warn('⚠️ waterQualityService.getReport calls /api/water-quality/reports/comprehensive. Consider migrating to waterTestService.');
    try {
      const params = new URLSearchParams();
      
      if (filters.location) params.append('location', filters.location);
      if (filters.district) params.append('district', filters.district);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.reportType) params.append('reportType', filters.reportType);
      
      const response = await axios.get(`/water-quality/reports/comprehensive?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error generating water quality report:', error);
      throw error;
    }
  }

  // Get testing schedule
  // Uses waterQuality.routes.js endpoint: GET /api/water-quality/schedule/upcoming (NOT YET IMPLEMENTED - returns 501)
  async getTestingSchedule(filters = {}) {
    console.warn('⚠️ waterQualityService.getTestingSchedule calls /api/water-quality/schedule/upcoming (not yet implemented).');
    try {
      const params = new URLSearchParams();
      
      if (filters.location) params.append('location', filters.location);
      if (filters.district) params.append('district', filters.district);
      if (filters.waterType) params.append('waterType', filters.waterType);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      const response = await axios.get(`/water-quality/schedule/upcoming?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching testing schedule:', error);
      throw error;
    }
  }

  // Create testing schedule
  // Uses waterQuality.routes.js endpoint: POST /api/water-quality/schedule (NOT YET IMPLEMENTED - returns 501)
  async createTestingSchedule(scheduleData) {
    console.warn('⚠️ waterQualityService.createTestingSchedule calls /api/water-quality/schedule (not yet implemented).');
    try {
      const response = await axios.post('/water-quality/schedule', scheduleData);
      return response.data;
    } catch (error) {
      console.error('Error creating testing schedule:', error);
      throw error;
    }
  }

  // @deprecated - No backend endpoint exists
  async updateTestingSchedule(scheduleId, updateData) {
    console.error('❌ waterQualityService.updateTestingSchedule is deprecated. No corresponding backend endpoint exists.');
    throw new Error('This method is deprecated. No backend endpoint for updating test schedules.');
  }

  // Get maintenance recommendations
  // Uses waterQuality.routes.js endpoint: GET /api/water-quality/maintenance/recommendations
  async getMaintenanceRecommendations(filters = {}) {
    console.warn('⚠️ waterQualityService.getMaintenanceRecommendations calls /api/water-quality/maintenance/recommendations.');
    try {
      const params = new URLSearchParams();
      
      if (filters.location) params.append('location', filters.location);
      if (filters.district) params.append('district', filters.district);
      if (filters.area) params.append('area', filters.area);
      if (filters.waterType) params.append('waterType', filters.waterType);
      if (filters.priority) params.append('priority', filters.priority);
      
      const response = await axios.get(`/water-quality/maintenance/recommendations?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching maintenance recommendations:', error);
      throw error;
    }
  }

  // @deprecated - No backend endpoint exists for creating recommendations (they are auto-generated)
  async createMaintenanceRecommendation(recommendationData) {
    console.error('❌ waterQualityService.createMaintenanceRecommendation is deprecated. Recommendations are auto-generated by the backend.');
    throw new Error('This method is deprecated. Maintenance recommendations are automatically generated based on water quality test results.');
  }

  // @deprecated - No backend endpoint exists for updating recommendations
  async updateMaintenanceRecommendation(recommendationId, updateData) {
    console.error('❌ waterQualityService.updateMaintenanceRecommendation is deprecated. No corresponding backend endpoint exists.');
    throw new Error('This method is deprecated. No backend endpoint for updating maintenance recommendations.');
  }

  // Complete follow-up for a water quality test
  // Uses waterQuality.routes.js endpoint: PUT /api/water-quality/:id/follow-up/complete
  async completeFollowUp(testId, notes) {
    console.warn('⚠️ waterQualityService.completeFollowUp calls /api/water-quality/:id/follow-up/complete.');
    try {
      const response = await axios.put(`/water-quality/${testId}/follow-up/complete`, { notes });
      return response.data;
    } catch (error) {
      console.error('Error completing follow-up:', error);
      throw error;
    }
  }

  // Get water sources by area
  // Uses waterQuality.routes.js endpoint: GET /api/water-quality/sources/area/:areaId
  async getWaterSourcesByArea(areaId) {
    console.warn('⚠️ waterQualityService.getWaterSourcesByArea calls /api/water-quality/sources/area/:areaId.');
    try {
      const response = await axios.get(`/water-quality/sources/area/${areaId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching water sources by area:', error);
      throw error;
    }
  }

  // @deprecated - No backend endpoint exists for general statistics
  // Use getTrends() or getReport() instead for statistical data
  async getStatistics(filters = {}) {
    console.error('❌ waterQualityService.getStatistics is deprecated. No corresponding backend endpoint exists.');
    console.warn('💡 Use getTrends() or getReport() for statistical data instead.');
    throw new Error('This method is deprecated. Use getTrends() or getReport() for statistical data.');
  }
}

export default new WaterQualityService();