// Test Runner Component for Batch Testing
import { useState } from 'react';
import { TEST_SCENARIOS, SAMPLE_DATA } from '../utils/constants';
import { makePrediction, validateParameters } from '../utils/api';

const TestRunner = ({ onTestComplete, onClose }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState([]);
  const [currentTest, setCurrentTest] = useState(0);
  const [selectedScenario, setSelectedScenario] = useState(null);

  const runTestScenario = async (scenario) => {
    setIsRunning(true);
    setResults([]);
    setCurrentTest(0);
    setSelectedScenario(scenario);

    const testResults = [];

    for (let i = 0; i < scenario.samples.length; i++) {
      setCurrentTest(i + 1);
      const sample = scenario.samples[i];

      try {
        // Validate parameters
        const validatedParams = validateParameters(sample.data);
        
        // Make prediction
        const predictionResult = await makePrediction(validatedParams);
        
        testResults.push({
          sample: sample,
          result: predictionResult,
          success: true,
          error: null
        });

      } catch (error) {
        testResults.push({
          sample: sample,
          result: null,
          success: false,
          error: error.message
        });
      }

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setResults(testResults);
    setIsRunning(false);
    setCurrentTest(0);
  };

  const getResultSummary = () => {
    if (results.length === 0) return null;

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => r.success === false).length;
    const correct = results.filter(r => {
      if (!r.success) return false;
      const predicted = r.result.prediction.is_safe_to_drink;
      const expected = r.sample.expectedResult === "Safe to drink";
      return predicted === expected;
    }).length;

    return { successful, failed, correct, total: results.length };
  };

  const summary = getResultSummary();

  return (
    <div className="test-runner-overlay">
      <div className="test-runner-modal">
        <div className="test-runner-header">
          <h3>🧪 Model Test Runner</h3>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        <div className="test-runner-content">
          {!selectedScenario ? (
            // Scenario Selection
            <div className="scenario-selection">
              <p>Select a test scenario to run batch predictions:</p>
              
              <div className="scenarios-grid">
                {TEST_SCENARIOS.map((scenario, index) => (
                  <div key={index} className="scenario-card">
                    <h4>{scenario.name}</h4>
                    <p>{scenario.description}</p>
                    <div className="scenario-stats">
                      <span>{scenario.samples.length} samples</span>
                    </div>
                    <button
                      onClick={() => runTestScenario(scenario)}
                      className="btn btn-primary"
                      disabled={isRunning}
                    >
                      Run Tests
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Test Results
            <div className="test-results">
              <div className="test-progress">
                <h4>{selectedScenario.name}</h4>
                {isRunning ? (
                  <div className="progress-info">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${(currentTest / selectedScenario.samples.length) * 100}%` }}
                      ></div>
                    </div>
                    <p>Running test {currentTest} of {selectedScenario.samples.length}...</p>
                  </div>
                ) : summary && (
                  <div className="test-summary">
                    <div className="summary-stats">
                      <div className="stat">
                        <span className="stat-value">{summary.successful}</span>
                        <span className="stat-label">Successful</span>
                      </div>
                      <div className="stat">
                        <span className="stat-value">{summary.correct}</span>
                        <span className="stat-label">Correct</span>
                      </div>
                      <div className="stat">
                        <span className="stat-value">{summary.failed}</span>
                        <span className="stat-label">Failed</span>
                      </div>
                      <div className="stat">
                        <span className="stat-value">{((summary.correct / summary.total) * 100).toFixed(1)}%</span>
                        <span className="stat-label">Accuracy</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {results.length > 0 && (
                <div className="results-list">
                  <h5>Test Results</h5>
                  {results.map((testResult, index) => (
                    <div key={index} className={`result-item ${testResult.success ? 'success' : 'error'}`}>
                      <div className="result-header">
                        <span className="result-name">{testResult.sample.name}</span>
                        <span className={`result-status ${testResult.success ? 'success' : 'error'}`}>
                          {testResult.success ? '✅' : '❌'}
                        </span>
                      </div>
                      
                      {testResult.success ? (
                        <div className="result-details">
                          <div className="prediction-info">
                            <span>Predicted: {testResult.result.prediction.safety_status}</span>
                            <span>Expected: {testResult.sample.expectedResult}</span>
                            <span>Confidence: {(testResult.result.prediction.confidence * 100).toFixed(1)}%</span>
                          </div>
                          <div className={`accuracy-indicator ${
                            (testResult.result.prediction.is_safe_to_drink === (testResult.sample.expectedResult === "Safe to drink")) 
                              ? 'correct' : 'incorrect'
                          }`}>
                            {(testResult.result.prediction.is_safe_to_drink === (testResult.sample.expectedResult === "Safe to drink")) 
                              ? '✓ Correct' : '✗ Incorrect'}
                          </div>
                        </div>
                      ) : (
                        <div className="error-details">
                          <span className="error-message">{testResult.error}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="test-actions">
                <button
                  onClick={() => {
                    setSelectedScenario(null);
                    setResults([]);
                  }}
                  className="btn btn-outline"
                  disabled={isRunning}
                >
                  Back to Scenarios
                </button>
                {summary && (
                  <button
                    onClick={() => onTestComplete(results)}
                    className="btn btn-primary"
                  >
                    View Detailed Results
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestRunner;