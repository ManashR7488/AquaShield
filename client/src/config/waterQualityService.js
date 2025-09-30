import axios from './axios';

class WaterQualityService {
  // Create a new water quality record
  async createRecord(recordData) {
    try {
      const response = await axios.post('/water-quality', recordData);
      return response.data;
    } catch (error) {
      console.error('Error creating water quality record:', error);
      throw error;
    }
  }

  // Get all water quality records with filters
  async getAllRecords(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.testDate) params.append('testDate', filters.testDate);
      if (filters.location) params.append('location', filters.location);
      if (filters.waterType) params.append('waterType', filters.waterType);
      if (filters.status) params.append('status', filters.status);
      if (filters.district) params.append('district', filters.district);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      
      const response = await axios.get(`/water-quality?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching water quality records:', error);
      throw error;
    }
  }

  // Get water quality record by ID
  async getRecordById(recordId) {
    try {
      const response = await axios.get(`/water-quality/${recordId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching water quality record:', error);
      throw error;
    }
  }

  // Update water quality record
  async updateRecord(recordId, updateData) {
    try {
      const response = await axios.put(`/water-quality/${recordId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating water quality record:', error);
      throw error;
    }
  }

  // Delete water quality record
  async deleteRecord(recordId) {
    try {
      const response = await axios.delete(`/water-quality/${recordId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting water quality record:', error);
      throw error;
    }
  }

  // Get water quality trends analysis
  async getTrends(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.location) params.append('location', filters.location);
      if (filters.waterType) params.append('waterType', filters.waterType);
      if (filters.district) params.append('district', filters.district);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.parameter) params.append('parameter', filters.parameter);
      
      const response = await axios.get(`/water-quality/trends?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching water quality trends:', error);
      throw error;
    }
  }

  // Get contamination alerts
  async getContaminationAlerts(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.location) params.append('location', filters.location);
      if (filters.severity) params.append('severity', filters.severity);
      if (filters.district) params.append('district', filters.district);
      if (filters.waterType) params.append('waterType', filters.waterType);
      if (filters.status) params.append('status', filters.status);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      
      const response = await axios.get(`/water-quality/contamination-alerts?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching contamination alerts:', error);
      throw error;
    }
  }

  // Create contamination alert
  async createContaminationAlert(alertData) {
    try {
      const response = await axios.post('/water-quality/contamination-alerts', alertData);
      return response.data;
    } catch (error) {
      console.error('Error creating contamination alert:', error);
      throw error;
    }
  }

  // Update contamination alert status
  async updateAlertStatus(alertId, statusData) {
    try {
      const response = await axios.put(`/water-quality/contamination-alerts/${alertId}/status`, statusData);
      return response.data;
    } catch (error) {
      console.error('Error updating alert status:', error);
      throw error;
    }
  }

  // Get water quality report
  async getReport(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.location) params.append('location', filters.location);
      if (filters.district) params.append('district', filters.district);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.reportType) params.append('reportType', filters.reportType);
      
      const response = await axios.get(`/water-quality/report?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error generating water quality report:', error);
      throw error;
    }
  }

  // Get testing schedule
  async getTestingSchedule(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.location) params.append('location', filters.location);
      if (filters.district) params.append('district', filters.district);
      if (filters.waterType) params.append('waterType', filters.waterType);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      const response = await axios.get(`/water-quality/testing-schedule?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching testing schedule:', error);
      throw error;
    }
  }

  // Create testing schedule
  async createTestingSchedule(scheduleData) {
    try {
      const response = await axios.post('/water-quality/testing-schedule', scheduleData);
      return response.data;
    } catch (error) {
      console.error('Error creating testing schedule:', error);
      throw error;
    }
  }

  // Update testing schedule
  async updateTestingSchedule(scheduleId, updateData) {
    try {
      const response = await axios.put(`/water-quality/testing-schedule/${scheduleId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating testing schedule:', error);
      throw error;
    }
  }

  // Get maintenance recommendations
  async getMaintenanceRecommendations(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.location) params.append('location', filters.location);
      if (filters.district) params.append('district', filters.district);
      if (filters.waterType) params.append('waterType', filters.waterType);
      if (filters.priority) params.append('priority', filters.priority);
      
      const response = await axios.get(`/water-quality/maintenance-recommendations?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching maintenance recommendations:', error);
      throw error;
    }
  }

  // Create maintenance recommendation
  async createMaintenanceRecommendation(recommendationData) {
    try {
      const response = await axios.post('/water-quality/maintenance-recommendations', recommendationData);
      return response.data;
    } catch (error) {
      console.error('Error creating maintenance recommendation:', error);
      throw error;
    }
  }

  // Update maintenance recommendation
  async updateMaintenanceRecommendation(recommendationId, updateData) {
    try {
      const response = await axios.put(`/water-quality/maintenance-recommendations/${recommendationId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating maintenance recommendation:', error);
      throw error;
    }
  }

  // Get water quality statistics
  async getStatistics(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.location) params.append('location', filters.location);
      if (filters.district) params.append('district', filters.district);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.groupBy) params.append('groupBy', filters.groupBy);
      
      const response = await axios.get(`/water-quality/statistics?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching water quality statistics:', error);
      throw error;
    }
  }
}

export default new WaterQualityService();