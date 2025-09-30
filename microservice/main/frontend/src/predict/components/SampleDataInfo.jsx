// Sample Data Info Component
import { QUICK_SAMPLES, PARAMETER_INFO } from '../utils/constants';

const SampleDataInfo = ({ currentSample, onClose }) => {
  if (!currentSample) return null;

  const getSampleDetails = () => {
    for (const [key, sample] of Object.entries(QUICK_SAMPLES)) {
      if (JSON.stringify(sample.data) === JSON.stringify(currentSample)) {
        return sample;
      }
    }
    return null;
  };

  const sampleDetails = getSampleDetails();

  if (!sampleDetails) return null;

  return (
    <div className="sample-info-overlay">
      <div className="sample-info-modal">
        <div className="sample-info-header">
          <h3>{sampleDetails.name}</h3>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>
        
        <div className="sample-info-content">
          <p className="sample-description">{sampleDetails.description}</p>
          
          <div className="expected-result">
            <strong>Expected Result:</strong> {sampleDetails.expectedResult}
            <br />
            <strong>Expected Confidence:</strong> {sampleDetails.confidence}
          </div>

          <div className="sample-parameters">
            <h4>📊 Parameter Values</h4>
            <div className="parameters-list">
              {Object.entries(sampleDetails.data).map(([key, value]) => {
                const info = PARAMETER_INFO[key];
                return (
                  <div key={key} className="parameter-row">
                    <div className="param-name">{info?.name || key}</div>
                    <div className="param-value">{value} {info?.unit || ''}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="sample-actions">
            <button onClick={onClose} className="btn btn-primary">
              Continue with Analysis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SampleDataInfo;