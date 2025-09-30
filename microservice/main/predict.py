# Water Quality Prediction Module
import numpy as np
import pandas as pd
from download import load_trained_model, predict_with_saved_model

# Global variables to store loaded model components
_model_components = None

def load_model():
    """
    Load the trained water quality model and preprocessing components
    """
    global _model_components
    if _model_components is None:
        try:
            _model_components = load_trained_model()
            # print("✅ Model loaded successfully!")
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            raise
    return _model_components

def predictWaterQuality(ph, hardness, solids, chloramines, sulfate, 
                       conductivity, organic_carbon, trihalomethanes, turbidity):
    """
    Predict water quality based on 9 input parameters
    
    Args:
        ph (float): pH level of water
        hardness (float): Water hardness
        solids (float): Total dissolved solids
        chloramines (float): Chloramines content
        sulfate (float): Sulfate content
        conductivity (float): Electrical conductivity
        organic_carbon (float): Total organic carbon
        trihalomethanes (float): Trihalomethanes content
        turbidity (float): Water turbidity
    
    Returns:
        tuple: (prediction, probability)
            - prediction (int): 0 = Not safe to drink, 1 = Safe to drink
            - probability (array): Probability scores for each class [prob_not_safe, prob_safe]
    """
    
    # Load model if not already loaded
    model_components = load_model()
    
    # Make prediction using the loaded model
    prediction, probability = predict_with_saved_model(
        model_components=model_components,
        ph=ph,
        hardness=hardness,
        solids=solids,
        chloramines=chloramines,
        sulfate=sulfate,
        conductivity=conductivity,
        organic_carbon=organic_carbon,
        trihalomethanes=trihalomethanes,
        turbidity=turbidity
    )
    
    return prediction, probability

def get_water_quality_prediction(ph, hardness, solids, chloramines, sulfate,
                               conductivity, organic_carbon, trihalomethanes, turbidity,
                               return_details=False):
    """
    Get water quality prediction with human-readable output
    
    Args:
        ph, hardness, etc.: Water quality parameters
        return_details (bool): If True, returns detailed information
    
    Returns:
        dict: Prediction results with interpretation
    """
    
    prediction, probability = predictWaterQuality(
        ph, hardness, solids, chloramines, sulfate,
        conductivity, organic_carbon, trihalomethanes, turbidity
    )
    
    # Interpret results
    is_safe = prediction == 1
    confidence = max(probability) if probability is not None else None
    
    result = {
        'prediction': prediction,
        'is_safe_to_drink': is_safe,
        'safety_status': 'Safe to drink' if is_safe else 'Not safe to drink',
        'confidence': confidence,
        'probability_safe': probability[1] if probability is not None else None,
        'probability_not_safe': probability[0] if probability is not None else None
    }
    
    if return_details:
        result['input_parameters'] = {
            'ph': ph,
            'hardness': hardness,
            'solids': solids,
            'chloramines': chloramines,
            'sulfate': sulfate,
            'conductivity': conductivity,
            'organic_carbon': organic_carbon,
            'trihalomethanes': trihalomethanes,
            'turbidity': turbidity
        }
    
    return result

def validate_input_parameters(ph, hardness, solids, chloramines, sulfate,
                            conductivity, organic_carbon, trihalomethanes, turbidity):
    """
    Validate input parameters are within reasonable ranges for water quality
    
    Returns:
        tuple: (is_valid, warnings_list)
    """
    warnings = []
    
    # Define reasonable ranges for water quality parameters
    ranges = {
        'ph': (0, 14),
        'hardness': (0, 1000),
        'solids': (0, 100000),
        'chloramines': (0, 20),
        'sulfate': (0, 1000),
        'conductivity': (0, 2000),
        'organic_carbon': (0, 50),
        'trihalomethanes': (0, 200),
        'turbidity': (0, 20)
    }
    
    params = {
        'ph': ph, 'hardness': hardness, 'solids': solids,
        'chloramines': chloramines, 'sulfate': sulfate,
        'conductivity': conductivity, 'organic_carbon': organic_carbon,
        'trihalomethanes': trihalomethanes, 'turbidity': turbidity
    }
    
    for param_name, value in params.items():
        min_val, max_val = ranges[param_name]
        if not (min_val <= value <= max_val):
            warnings.append(f"{param_name} ({value}) is outside typical range ({min_val}-{max_val})")
    
    return len(warnings) == 0, warnings

# Example usage and testing function
def test_prediction():
    """
    Test the prediction function with sample data
    """
    print("🧪 Testing Water Quality Prediction Function")
    print("-" * 50)
    
    # Test case 1: Typical safe water
    print("Test 1: Typical safe water parameters")
    result1 = get_water_quality_prediction(
        ph=7.0, hardness=200.0, solids=20000.0, chloramines=7.0,
        sulfate=300.0, conductivity=400.0, organic_carbon=15.0,
        trihalomethanes=70.0, turbidity=4.0, return_details=True
    )
    print(f"Result: {result1['safety_status']}")
    print(f"Confidence: {result1['confidence']:.3f}")
    print()
    
    # Test case 2: Potentially unsafe water (high pH, high turbidity)
    print("Test 2: Potentially unsafe water parameters")
    result2 = get_water_quality_prediction(
        ph=9.5, hardness=350.0, solids=40000.0, chloramines=12.0,
        sulfate=500.0, conductivity=800.0, organic_carbon=25.0,
        trihalomethanes=120.0, turbidity=8.0, return_details=True
    )
    print(f"Result: {result2['safety_status']}")
    print(f"Confidence: {result2['confidence']:.3f}")
    print()

if __name__ == "__main__":
    # Run test when script is executed directly
    test_prediction()
