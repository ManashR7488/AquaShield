// Water Quality Results Display Component
import { useState, useEffect } from 'react';

const ResultsDisplay = ({ result, onNewTest }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [animateResult, setAnimateResult] = useState(false);

  useEffect(() => {
    if (result) {
      setAnimateResult(true);
      const timer = setTimeout(() => setAnimateResult(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [result]);

  if (!result) {
    return null;
  }

  const { prediction, input_parameters, validation, metadata } = result;
  const isSafe = prediction.is_safe_to_drink;
  const confidence = prediction.confidence;
  const safetyStatus = prediction.safety_status;

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'high-confidence';
    if (confidence >= 0.6) return 'medium-confidence';
    return 'low-confidence';
  };

  const getConfidenceText = (confidence) => {
    if (confidence >= 0.9) return 'Very High';
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.7) return 'Good';
    if (confidence >= 0.6) return 'Moderate';
    return 'Low';
  };

  const formatParameter = (key, value) => {
    const paramNames = {
      ph: 'pH Level',
      hardness: 'Hardness',
      solids: 'Total Dissolved Solids',
      chloramines: 'Chloramines',
      sulfate: 'Sulfate',
      conductivity: 'Conductivity',
      organic_carbon: 'Total Organic Carbon',
      trihalomethanes: 'Trihalomethanes',
      turbidity: 'Turbidity'
    };
    return paramNames[key] || key;
  };

  return (
    <div className={`results-container ${animateResult ? 'animate' : ''}`}>
      <div className="results-header">
        <h2>📊 Analysis Results</h2>
        <button 
          onClick={onNewTest} 
          className="btn btn-outline btn-small"
          title="Run another test"
        >
          🔄 New Test
        </button>
      </div>

      {/* Main Result Card */}
      <div className={`result-card main-result ${isSafe ? 'safe' : 'unsafe'}`}>
        <div className="result-icon">
          {isSafe ? '✅' : '⚠️'}
        </div>
        
        <div className="result-content">
          <h3 className="result-status">{safetyStatus}</h3>
          <div className="confidence-section">
            <div className="confidence-label">Confidence Level</div>
            <div className={`confidence-value ${getConfidenceColor(confidence)}`}>
              {getConfidenceText(confidence)} ({(confidence * 100).toFixed(1)}%)
            </div>
            <div className="confidence-bar">
              <div 
                className={`confidence-fill ${getConfidenceColor(confidence)}`}
                style={{ width: `${confidence * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Probability Details */}
      <div className="probability-card">
        <h4>🎯 Probability Breakdown</h4>
        <div className="probability-grid">
          <div className="probability-item safe">
            <div className="prob-label">Safe to Drink</div>
            <div className="prob-value">
              {(prediction.probability_scores.safe * 100).toFixed(1)}%
            </div>
            <div className="prob-bar">
              <div 
                className="prob-fill safe"
                style={{ width: `${prediction.probability_scores.safe * 100}%` }}
              ></div>
            </div>
          </div>
          
          <div className="probability-item unsafe">
            <div className="prob-label">Not Safe</div>
            <div className="prob-value">
              {(prediction.probability_scores.not_safe * 100).toFixed(1)}%
            </div>
            <div className="prob-bar">
              <div 
                className="prob-fill unsafe"
                style={{ width: `${prediction.probability_scores.not_safe * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Warnings */}
      {validation.warnings && validation.warnings.length > 0 && (
        <div className="warnings-card">
          <h4>⚠️ Parameter Warnings</h4>
          <ul className="warnings-list">
            {validation.warnings.map((warning, index) => (
              <li key={index} className="warning-item">
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Toggle Details Button */}
      <button 
        onClick={() => setShowDetails(!showDetails)}
        className="btn btn-outline details-toggle"
      >
        {showDetails ? '🔼 Hide Details' : '🔽 Show Details'}
      </button>

      {/* Detailed Information */}
      {showDetails && (
        <div className="details-section">
          <div className="parameters-card">
            <h4>📋 Input Parameters</h4>
            <div className="parameters-grid">
              {Object.entries(input_parameters).map(([key, value]) => (
                <div key={key} className="parameter-item">
                  <div className="param-label">{formatParameter(key, value)}</div>
                  <div className="param-value">{value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="metadata-card">
            <h4>ℹ️ Analysis Information</h4>
            <div className="metadata-grid">
              <div className="metadata-item">
                <div className="meta-label">Analysis Time</div>
                <div className="meta-value">
                  {new Date(metadata.timestamp).toLocaleString()}
                </div>
              </div>
              <div className="metadata-item">
                <div className="meta-label">Model Version</div>
                <div className="meta-value">{metadata.model_version}</div>
              </div>
              <div className="metadata-item">
                <div className="meta-label">Raw Prediction</div>
                <div className="meta-value">{prediction.raw_prediction}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommendation Section */}
      <div className="recommendation-card">
        <h4>💡 Recommendation</h4>
        <div className="recommendation-content">
          {isSafe ? (
            <div className="recommendation safe">
              <p>
                <strong>This water sample appears to be safe for consumption</strong> based on the analyzed parameters. 
                The confidence level is {getConfidenceText(confidence).toLowerCase()}
                {confidence < 0.8 && ', so you may want to verify with additional testing'}.
              </p>
            </div>
          ) : (
            <div className="recommendation unsafe">
              <p>
                <strong>This water sample may not be safe for consumption</strong> based on the analyzed parameters. 
                We recommend {confidence > 0.7 ? 'immediate water treatment' : 'further testing and professional analysis'} 
                before use.
              </p>
            </div>
          )}
          
          {confidence < 0.7 && (
            <div className="low-confidence-note">
              <p>
                <em>Note: The confidence level is relatively low. Consider running additional tests 
                or consulting with water quality professionals for a more comprehensive analysis.</em>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsDisplay;