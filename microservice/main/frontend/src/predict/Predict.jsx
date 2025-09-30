import React, { useState, useEffect } from 'react';
import WaterQualityForm from './components/WaterQualityForm';
import ResultsDisplay from './components/ResultsDisplay';
import TestRunner from './components/TestRunner';
import SampleDataInfo from './components/SampleDataInfo';
import { checkServerHealth } from './utils/api';
import './styles/predict.css';

const Predict = () => {
  const [serverStatus, setServerStatus] = useState('checking');
  const [predictions, setPredictions] = useState([]);
  const [currentPrediction, setCurrentPrediction] = useState(null);
  const [showTestRunner, setShowTestRunner] = useState(false);
  const [showSampleInfo, setShowSampleInfo] = useState(false);
  const [selectedSample, setSelectedSample] = useState(null);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    setServerStatus('checking');
    try {
      const health = await checkServerHealth();
      setServerStatus(health.status === 'healthy' ? 'healthy' : 'offline');
    } catch (error) {
      console.error('Health check failed:', error);
      setServerStatus('offline');
    }
  };

  const handlePredictionResult = (result) => {
    const newPrediction = {
      ...result,
      id: Date.now(),
      timestamp: new Date().toISOString()
    };
    
    setPredictions(prev => [newPrediction, ...prev.slice(0, 9)]);
    setCurrentPrediction(newPrediction);
  };

  const handleSampleSelect = (sample) => {
    setSelectedSample(sample);
    setShowSampleInfo(true);
  };

  const ServerStatusIndicator = () => (
    <div className={`server-status ${serverStatus}`}>
      <div className="status-dot"></div>
      {serverStatus === 'healthy' && 'Server Online'}
      {serverStatus === 'offline' && 'Server Offline'}
      {serverStatus === 'checking' && 'Checking...'}
      {serverStatus === 'offline' && (
        <button className="retry-btn" onClick={checkHealth}>
          Retry
        </button>
      )}
    </div>
  );

  const ServerOfflineNotice = () => (
    <div className="server-offline-notice">
      <h3>Flask Server Not Running</h3>
      <p>The prediction server appears to be offline. To use the water quality predictor:</p>
      <ul>
        <li>Make sure you have Flask installed: <code>pip install flask flask-cors</code></li>
        <li>Navigate to the project directory</li>
        <li>Run the server: <code>python main.py</code></li>
        <li>The server should start on <code>http://localhost:5000</code></li>
      </ul>
      <p>Once the server is running, click the retry button above.</p>
    </div>
  );

  if (serverStatus === 'offline') {
    return (
      <div className="app">
        <header>
          <h1>🌊 Water Quality Predictor</h1>
          <div className="header-controls">
            <ServerStatusIndicator />
          </div>
        </header>
        <main>
          <ServerOfflineNotice />
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <header>
        <h1>🌊 Water Quality Predictor</h1>
        <div className="header-controls">
          <ServerStatusIndicator />
          <button 
            className="btn btn-outline btn-small"
            onClick={() => setShowTestRunner(true)}
          >
            🧪 Run Tests
          </button>
        </div>
      </header>

      <main>
        <WaterQualityForm 
          onPredictionResult={handlePredictionResult}
          onSampleSelect={handleSampleSelect}
          serverStatus={serverStatus}
        />

        {currentPrediction && (
          <ResultsDisplay 
            prediction={currentPrediction}
            predictions={predictions}
          />
        )}
      </main>

      {showTestRunner && (
        <TestRunner onClose={() => setShowTestRunner(false)} />
      )}

      {showSampleInfo && selectedSample && (
        <SampleDataInfo 
          sample={selectedSample}
          onClose={() => {
            setShowSampleInfo(false);
            setSelectedSample(null);
          }}
        />
      )}
    </div>
  );
};

export default Predict;