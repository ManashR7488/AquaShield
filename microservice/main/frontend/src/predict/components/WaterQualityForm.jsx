// Water Quality Input Form Component
import { useState } from 'react';
import { makePrediction } from '../utils/api';
import { WATER_PARAMETERS, QUICK_SAMPLES, SAMPLE_DATA } from '../utils/constants';

const WaterQualityForm = ({ onPredictionResult, onSampleSelect, serverStatus }) => {
  const [formData, setFormData] = useState({
    ph: '',
    hardness: '',
    solids: '',
    chloramines: '',
    sulfate: '',
    conductivity: '',
    organic_carbon: '',
    trihalomethanes: '',
    turbidity: ''
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleBlur = (name) => {
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    validateField(name, formData[name]);
  };

  const validateField = (name, value) => {
    const parameter = WATER_PARAMETERS.find(p => p.name === name);
    const numValue = parseFloat(value);
    
    if (!value || value.trim() === '') {
      setErrors(prev => ({
        ...prev,
        [name]: 'This field is required'
      }));
      return false;
    }
    
    if (isNaN(numValue)) {
      setErrors(prev => ({
        ...prev,
        [name]: 'Must be a valid number'
      }));
      return false;
    }
    
    if (numValue < parameter.min || numValue > parameter.max) {
      setErrors(prev => ({
        ...prev,
        [name]: `Value must be between ${parameter.min} and ${parameter.max}`
      }));
      return false;
    }

    return true;
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    WATER_PARAMETERS.forEach(parameter => {
      if (!validateField(parameter.name, formData[parameter.name])) {
        isValid = false;
      }
    });

    setTouched(
      WATER_PARAMETERS.reduce((acc, param) => ({
        ...acc,
        [param.name]: true
      }), {})
    );

    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setLoading(true);
      setError(null);
      
      try {
        // Convert all values to numbers
        const numericData = {};
        for (const [key, value] of Object.entries(formData)) {
          numericData[key] = parseFloat(value);
        }
        
        const result = await makePrediction(numericData);
        onPredictionResult(result);
      } catch (err) {
        setError(err.message || 'Failed to make prediction');
        console.error('Prediction error:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      ph: '',
      hardness: '',
      solids: '',
      chloramines: '',
      sulfate: '',
      conductivity: '',
      organic_carbon: '',
      trihalomethanes: '',
      turbidity: ''
    });
    setErrors({});
    setTouched({});
  };

  const loadSampleData = (sampleType = 'excellent') => {
    const sample = QUICK_SAMPLES[sampleType];
    
    if (sample) {
      setFormData(sample.data);
      setErrors({});
      setTouched({});
    }
  };

  const handleSampleInfo = (sampleType) => {
    const sample = QUICK_SAMPLES[sampleType];
    if (sample && onSampleSelect) {
      onSampleSelect(sample);
    }
  };

  const loadQuickSample = (sampleType = 'excellent') => {
    const sample = QUICK_SAMPLES[sampleType];
    if (sample) {
      const stringData = {};
      Object.keys(sample.data).forEach(key => {
        stringData[key] = sample.data[key].toString();
      });
      setFormData(stringData);
      setErrors({});
    }
  };

  return (
    <div className="form-container">
      <div className="form-header">
        <h2>🧪 Water Quality Analysis</h2>
        <p>Enter the water quality parameters below to get a prediction</p>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span>{error.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="water-quality-form">
        <div className="form-grid">
          {WATER_PARAMETERS.map((parameter) => (
            <div key={parameter.name} className="form-group">
              <label htmlFor={parameter.name} className="form-label">
                {parameter.label}
                {parameter.unit && <span className="unit">({parameter.unit})</span>}
              </label>
              
              <input
                type="number"
                id={parameter.name}
                name={parameter.name}
                value={formData[parameter.name]}
                onChange={(e) => handleInputChange(parameter.name, e.target.value)}
                onBlur={() => handleBlur(parameter.name)}
                placeholder={parameter.placeholder}
                min={parameter.min}
                max={parameter.max}
                step={parameter.step}
                className={`form-input ${errors[parameter.name] && touched[parameter.name] ? 'error' : ''}`}
                disabled={loading}
              />
              
              <div className="field-info">
                <span className="description">{parameter.description}</span>
                {errors[parameter.name] && touched[parameter.name] && (
                  <span className="field-error">{errors[parameter.name]}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Sample Data Section */}
        <div className="sample-data-section">
          <h3>🧪 Test with Sample Data</h3>
          <p>Click any button below to load predefined water quality samples</p>
          
          <div className="sample-buttons-grid">
            <div className="sample-group">
              <h4>✅ Good Water Samples</h4>
              <div className="sample-buttons">
                <button
                  type="button"
                  onClick={() => loadSampleData('excellent')}
                  className="btn btn-sample good"
                  disabled={loading}
                  title="Excellent drinking water with optimal parameters"
                >
                  💧 Excellent Water
                </button>
                <button
                  type="button"
                  onClick={() => loadSampleData('good')}
                  className="btn btn-sample good"
                  disabled={loading}
                  title="Clean spring water with balanced minerals"
                >
                  🌊 Spring Water
                </button>
              </div>
            </div>

            <div className="sample-group">
              <h4>⚠️ Contaminated Water Samples</h4>
              <div className="sample-buttons">
                <button
                  type="button"
                  onClick={() => loadSampleData('contaminated')}
                  className="btn btn-sample bad"
                  disabled={loading}
                  title="High contamination with multiple parameter violations"
                >
                  ⚠️ Contaminated
                </button>
                <button
                  type="button"
                  onClick={() => loadSampleData('polluted')}
                  className="btn btn-sample bad"
                  disabled={loading}
                  title="Water contaminated with industrial pollutants"
                >
                  🏭 Polluted Water
                </button>
              </div>
            </div>

            <div className="sample-group">
              <h4>🤔 Edge Cases</h4>
              <div className="sample-buttons">
                <button
                  type="button"
                  onClick={() => loadSampleData('borderline')}
                  className="btn btn-sample borderline"
                  disabled={loading}
                  title="Water quality on the edge - uncertain outcome"
                >
                  ⚖️ Borderline Quality
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={resetForm}
            className="btn btn-outline"
            disabled={loading}
          >
            🔄 Reset Form
          </button>
          
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Analyzing...
              </>
            ) : (
              <>
                🔬 Analyze Water Quality
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WaterQualityForm;