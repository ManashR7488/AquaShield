// API service for water quality prediction
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

class WaterQualityAPI {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000, // 10 seconds timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Health check endpoint
  async checkHealth() {
    try {
      const response = await this.client.get('/api/health');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get model information
  async getModelInfo() {
    try {
      const response = await this.client.get('/api/model-info');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Main prediction endpoint
  async predictWaterQuality(waterParams) {
    try {
      const response = await this.client.post('/api/predict', waterParams);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Validate water quality parameters before sending
  validateParameters(params) {
    const required = [
      'ph', 'hardness', 'solids', 'chloramines', 'sulfate',
      'conductivity', 'organic_carbon', 'trihalomethanes', 'turbidity'
    ];

    const missing = required.filter(param => 
      params[param] === undefined || params[param] === null || params[param] === ''
    );

    if (missing.length > 0) {
      throw new Error(`Missing required parameters: ${missing.join(', ')}`);
    }

    // Convert to numbers and validate ranges
    const numericParams = {};
    for (const [key, value] of Object.entries(params)) {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        throw new Error(`${key} must be a valid number`);
      }
      numericParams[key] = numValue;
    }

    return numericParams;
  }

  // Error handler
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      return {
        message: error.response.data?.message || 'Server error occurred',
        status: error.response.status,
        details: error.response.data
      };
    } else if (error.request) {
      // Request made but no response received
      return {
        message: 'Unable to connect to server. Please make sure the Flask server is running on port 5000.',
        status: 0,
        details: 'Network error'
      };
    } else {
      // Something else happened
      return {
        message: error.message || 'An unexpected error occurred',
        status: -1,
        details: error
      };
    }
  }
}

// Create and export a singleton instance
const waterQualityAPI = new WaterQualityAPI();
export default waterQualityAPI;

// Export named functions for easier importing
export const makePrediction = (params) => waterQualityAPI.predictWaterQuality(params);
export const checkServerHealth = () => waterQualityAPI.checkHealth();
export const getModelInfo = () => waterQualityAPI.getModelInfo();
export const validateParameters = (params) => waterQualityAPI.validateParameters(params);