import axios from './axios';

class HealthReportService {
  // Create a new health report
  async createReport(reportData) {
    try {
      const response = await axios.post('/health-reports', reportData);
      return response.data;
    } catch (error) {
      console.error('Error creating health report:', error);
      throw error;
    }
  }

  // Get all health reports with filters
  async getAllReports(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.reportType) params.append('reportType', filters.reportType);
      if (filters.district) params.append('district', filters.district);
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.createdBy) params.append('createdBy', filters.createdBy);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      
      const response = await axios.get(`/health-reports?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching health reports:', error);
      throw error;
    }
  }

  // Get health report by ID
  async getReportById(reportId) {
    try {
      const response = await axios.get(`/health-reports/${reportId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching health report:', error);
      throw error;
    }
  }

  // Update health report
  async updateReport(reportId, updateData) {
    try {
      const response = await axios.put(`/health-reports/${reportId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating health report:', error);
      throw error;
    }
  }

  // Delete health report
  async deleteReport(reportId) {
    try {
      const response = await axios.delete(`/health-reports/${reportId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting health report:', error);
      throw error;
    }
  }

  // Generate health dashboard
  async generateDashboard(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.district) params.append('district', filters.district);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.healthArea) params.append('healthArea', filters.healthArea);
      if (filters.ageGroup) params.append('ageGroup', filters.ageGroup);
      
      const response = await axios.get(`/health-reports/dashboard?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error generating health dashboard:', error);
      throw error;
    }
  }

  // Generate epidemiological report
  async generateEpidemiologicalReport(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.district) params.append('district', filters.district);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.diseaseType) params.append('diseaseType', filters.diseaseType);
      if (filters.analysisType) params.append('analysisType', filters.analysisType);
      
      const response = await axios.get(`/health-reports/epidemiology?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error generating epidemiological report:', error);
      throw error;
    }
  }

  // Calculate health metrics
  async calculateHealthMetrics(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.district) params.append('district', filters.district);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.metricType) params.append('metricType', filters.metricType);
      if (filters.populationType) params.append('populationType', filters.populationType);
      
      const response = await axios.get(`/health-reports/metrics?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error calculating health metrics:', error);
      throw error;
    }
  }

  // Generate comprehensive health summary report
  async generateSummaryReport(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.district) params.append('district', filters.district);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.includeVaccinations) params.append('includeVaccinations', filters.includeVaccinations);
      if (filters.includeDiseases) params.append('includeDiseases', filters.includeDiseases);
      if (filters.includeWaterQuality) params.append('includeWaterQuality', filters.includeWaterQuality);
      if (filters.includeObservations) params.append('includeObservations', filters.includeObservations);
      
      const response = await axios.get(`/health-reports/summary?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error generating summary report:', error);
      throw error;
    }
  }

  // Get report trends and analytics
  async getReportTrends(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.district) params.append('district', filters.district);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.trendType) params.append('trendType', filters.trendType);
      if (filters.interval) params.append('interval', filters.interval);
      
      const response = await axios.get(`/health-reports/trends?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching report trends:', error);
      throw error;
    }
  }

  // Generate automated reports
  async generateAutomatedReport(reportConfig) {
    try {
      const response = await axios.post('/health-reports/automated', reportConfig);
      return response.data;
    } catch (error) {
      console.error('Error generating automated report:', error);
      throw error;
    }
  }

  // Schedule report generation
  async scheduleReport(scheduleData) {
    try {
      const response = await axios.post('/health-reports/schedule', scheduleData);
      return response.data;
    } catch (error) {
      console.error('Error scheduling report:', error);
      throw error;
    }
  }

  // Get scheduled reports
  async getScheduledReports(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.status) params.append('status', filters.status);
      if (filters.reportType) params.append('reportType', filters.reportType);
      if (filters.createdBy) params.append('createdBy', filters.createdBy);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      
      const response = await axios.get(`/health-reports/scheduled?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching scheduled reports:', error);
      throw error;
    }
  }

  // Update scheduled report
  async updateScheduledReport(scheduleId, updateData) {
    try {
      const response = await axios.put(`/health-reports/schedule/${scheduleId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating scheduled report:', error);
      throw error;
    }
  }

  // Cancel scheduled report
  async cancelScheduledReport(scheduleId) {
    try {
      const response = await axios.delete(`/health-reports/schedule/${scheduleId}`);
      return response.data;
    } catch (error) {
      console.error('Error canceling scheduled report:', error);
      throw error;
    }
  }

  // Export report in various formats
  async exportReport(reportId, format = 'pdf') {
    try {
      const response = await axios.get(`/health-reports/${reportId}/export`, {
        params: { format },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting report:', error);
      throw error;
    }
  }

  // Get report statistics
  async getReportStatistics(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.district) params.append('district', filters.district);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.reportType) params.append('reportType', filters.reportType);
      
      const response = await axios.get(`/health-reports/statistics?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching report statistics:', error);
      throw error;
    }
  }

  // Get report templates
  async getReportTemplates() {
    try {
      const response = await axios.get('/health-reports/templates');
      return response.data;
    } catch (error) {
      console.error('Error fetching report templates:', error);
      throw error;
    }
  }

  // Create custom report template
  async createReportTemplate(templateData) {
    try {
      const response = await axios.post('/health-reports/templates', templateData);
      return response.data;
    } catch (error) {
      console.error('Error creating report template:', error);
      throw error;
    }
  }

  // Update report template
  async updateReportTemplate(templateId, updateData) {
    try {
      const response = await axios.put(`/health-reports/templates/${templateId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating report template:', error);
      throw error;
    }
  }

  // Delete report template
  async deleteReportTemplate(templateId) {
    try {
      const response = await axios.delete(`/health-reports/templates/${templateId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting report template:', error);
      throw error;
    }
  }

  // Share report with other users
  async shareReport(reportId, shareData) {
    try {
      const response = await axios.post(`/health-reports/${reportId}/share`, shareData);
      return response.data;
    } catch (error) {
      console.error('Error sharing report:', error);
      throw error;
    }
  }

  // Get shared reports
  async getSharedReports(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.sharedBy) params.append('sharedBy', filters.sharedBy);
      if (filters.sharedWith) params.append('sharedWith', filters.sharedWith);
      if (filters.accessLevel) params.append('accessLevel', filters.accessLevel);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      
      const response = await axios.get(`/health-reports/shared?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching shared reports:', error);
      throw error;
    }
  }
}

export default new HealthReportService();