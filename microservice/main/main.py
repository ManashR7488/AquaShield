# Water Quality Prediction Flask API Server
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import traceback
from datetime import datetime
import os

# Import our prediction function
from predict import predictWaterQuality, get_water_quality_prediction, validate_input_parameters

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for cross-origin requests

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variable to track model loading status
model_loaded = False

def initialize_model():
    """Initialize the model on startup"""
    global model_loaded
    try:
        # Try to load the model by making a dummy prediction
        from predict import load_model
        load_model()
        model_loaded = True
        logger.info("✅ Water quality prediction model loaded successfully")
    except Exception as e:
        logger.error(f"❌ Failed to load model: {e}")
        model_loaded = False

@app.route('/')
def home():
    """Home endpoint with API information"""
    return jsonify({
        "message": "Water Quality Prediction API",
        "version": "1.0.0",
        "endpoints": {
            "predict": "/api/predict",
            "health": "/api/health",
            "model_info": "/api/model-info"
        },
        "status": "running",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "model_loaded": model_loaded,
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/model-info')
def model_info():
    """Get information about the loaded model"""
    try:
        from predict import _model_components
        if _model_components and 'metadata' in _model_components:
            metadata = _model_components['metadata']
            return jsonify({
                "model_name": metadata.get('model_name', 'Unknown'),
                "model_type": metadata.get('model_type', 'Unknown'),
                "accuracy": metadata.get('accuracy', 'Unknown'),
                "training_date": metadata.get('training_date', 'Unknown'),
                "feature_names": metadata.get('feature_names', []),
                "status": "loaded"
            })
        else:
            return jsonify({
                "status": "not_loaded",
                "message": "Model not loaded or metadata not available"
            })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/api/predict', methods=['POST'])
def predict_water_quality():
    """
    Predict water quality based on input parameters
    
    Expected JSON payload:
    {
        "ph": 7.0,
        "hardness": 200.0,
        "solids": 20000.0,
        "chloramines": 7.0,
        "sulfate": 300.0,
        "conductivity": 400.0,
        "organic_carbon": 15.0,
        "trihalomethanes": 70.0,
        "turbidity": 4.0
    }
    """
    try:
        # Check if model is loaded
        if not model_loaded:
            return jsonify({
                "error": "Model not loaded",
                "message": "The prediction model is not available. Please check server logs."
            }), 503

        # Get JSON data from request
        data = request.get_json()
        
        if not data:
            return jsonify({
                "error": "No input data",
                "message": "Please provide JSON data with water quality parameters"
            }), 400

        # Extract required parameters
        required_params = [
            'ph', 'hardness', 'solids', 'chloramines', 'sulfate',
            'conductivity', 'organic_carbon', 'trihalomethanes', 'turbidity'
        ]
        
        # Check for missing parameters
        missing_params = [param for param in required_params if param not in data]
        if missing_params:
            return jsonify({
                "error": "Missing parameters",
                "message": f"Missing required parameters: {missing_params}",
                "required_parameters": required_params
            }), 400

        # Extract parameter values
        try:
            ph = float(data['ph'])
            hardness = float(data['hardness'])
            solids = float(data['solids'])
            chloramines = float(data['chloramines'])
            sulfate = float(data['sulfate'])
            conductivity = float(data['conductivity'])
            organic_carbon = float(data['organic_carbon'])
            trihalomethanes = float(data['trihalomethanes'])
            turbidity = float(data['turbidity'])
        except (ValueError, TypeError) as e:
            return jsonify({
                "error": "Invalid parameter values",
                "message": "All parameters must be numeric values"
            }), 400

        # Validate input parameters
        is_valid, warnings = validate_input_parameters(
            ph, hardness, solids, chloramines, sulfate,
            conductivity, organic_carbon, trihalomethanes, turbidity
        )

        # Make prediction using our function
        prediction, probability = predictWaterQuality(
            ph, hardness, solids, chloramines, sulfate,
            conductivity, organic_carbon, trihalomethanes, turbidity
        )

        # Get detailed prediction info
        detailed_result = get_water_quality_prediction(
            ph, hardness, solids, chloramines, sulfate,
            conductivity, organic_carbon, trihalomethanes, turbidity,
            return_details=True
        )

        # Prepare response
        response = {
            "prediction": {
                "raw_prediction": int(prediction),
                "is_safe_to_drink": bool(prediction == 1),
                "safety_status": "Safe to drink" if prediction == 1 else "Not safe to drink",
                "confidence": float(max(probability)) if probability is not None else None,
                "probability_scores": {
                    "not_safe": float(probability[0]) if probability is not None else None,
                    "safe": float(probability[1]) if probability is not None else None
                }
            },
            "input_parameters": {
                "ph": ph,
                "hardness": hardness,
                "solids": solids,
                "chloramines": chloramines,
                "sulfate": sulfate,
                "conductivity": conductivity,
                "organic_carbon": organic_carbon,
                "trihalomethanes": trihalomethanes,
                "turbidity": turbidity
            },
            "validation": {
                "is_valid": is_valid,
                "warnings": warnings if warnings else []
            },
            "metadata": {
                "timestamp": datetime.now().isoformat(),
                "model_version": "1.0.0"
            }
        }

        logger.info(f"Prediction made: {prediction} (confidence: {max(probability):.3f})")
        return jsonify(response)

    except Exception as e:
        logger.error(f"Error in prediction: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            "error": "Prediction failed",
            "message": str(e)
        }), 500

@app.route('/api/predict', methods=['GET'])
def predict_example():
    """
    GET endpoint that shows example usage for the prediction API
    """
    return jsonify({
        "message": "Water Quality Prediction API",
        "method": "POST",
        "endpoint": "/api/predict",
        "example_request": {
            "ph": 7.0,
            "hardness": 200.0,
            "solids": 20000.0,
            "chloramines": 7.0,
            "sulfate": 300.0,
            "conductivity": 400.0,
            "organic_carbon": 15.0,
            "trihalomethanes": 70.0,
            "turbidity": 4.0
        },
        "required_parameters": [
            "ph", "hardness", "solids", "chloramines", "sulfate",
            "conductivity", "organic_carbon", "trihalomethanes", "turbidity"
        ],
        "curl_example": """
curl -X POST http://localhost:5000/api/predict \\
  -H "Content-Type: application/json" \\
  -d '{
    "ph": 7.0,
    "hardness": 200.0,
    "solids": 20000.0,
    "chloramines": 7.0,
    "sulfate": 300.0,
    "conductivity": 400.0,
    "organic_carbon": 15.0,
    "trihalomethanes": 70.0,
    "turbidity": 4.0
  }'
        """
    })

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        "error": "Not found",
        "message": "The requested endpoint does not exist",
        "available_endpoints": ["/", "/api/health", "/api/model-info", "/api/predict"]
    }), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({
        "error": "Internal server error",
        "message": "An unexpected error occurred"
    }), 500

if __name__ == '__main__':
    print("🚀 Starting Water Quality Prediction API Server")
    print("-" * 50)
    print("📡 Endpoints available:")
    print("  • Home: http://localhost:8000/")
    print("  • Health: http://localhost:8000/api/health")
    print("  • Model Info: http://localhost:8000/api/model-info")
    print("  • Predict: http://localhost:8000/api/predict (POST)")
    print("-" * 50)
    
    # Check if model files exist
    if os.path.exists('saved_models'):
        print("✅ Model directory found")
    else:
        print("⚠️  Warning: Model directory not found. Run train.py first!")
    
    print("🌟 Server starting on http://localhost:8000")
    print("Press Ctrl+C to stop the server")
    
    # Initialize model before starting server
    initialize_model()
    
    # Run the Flask app
    app.run(debug=True, host='0.0.0.0', port=8000)
