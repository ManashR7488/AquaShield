# Model Download and Persistence
import joblib
import pandas as pd
import numpy as np
from datetime import datetime
import os
import json

def save_trained_model(results, best_model_name, scaler, imputer, feature_names, 
                       model_dir="saved_models"):
    """
    Save the trained water quality prediction model and all preprocessing components
    
    Args:
        results: Dictionary containing all trained models and their results
        best_model_name: Name of the best performing model
        scaler: Fitted StandardScaler object
        imputer: Fitted SimpleImputer object
        feature_names: List of feature column names
        model_dir: Directory to save the model files
    """
    
    # Create directory if it doesn't exist
    os.makedirs(model_dir, exist_ok=True)
    
    # Get current timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Save the best model
    best_model = results[best_model_name]['model']
    model_filename = f"{model_dir}/water_quality_model_{timestamp}.pkl"
    joblib.dump(best_model, model_filename)
    print(f"✅ Best model ({best_model_name}) saved as: {model_filename}")
    
    # Save the scaler
    scaler_filename = f"{model_dir}/scaler_{timestamp}.pkl"
    joblib.dump(scaler, scaler_filename)
    print(f"✅ Scaler saved as: {scaler_filename}")
    
    # Save the imputer
    imputer_filename = f"{model_dir}/imputer_{timestamp}.pkl"
    joblib.dump(imputer, imputer_filename)
    print(f"✅ Imputer saved as: {imputer_filename}")
    
    # Save model metadata
    metadata = {
        "model_name": best_model_name,
        "model_type": type(best_model).__name__,
        "accuracy": results[best_model_name]['accuracy'],
        "feature_names": feature_names.tolist() if hasattr(feature_names, 'tolist') else list(feature_names),
        "training_date": timestamp,
        "model_file": model_filename,
        "scaler_file": scaler_filename,
        "imputer_file": imputer_filename,
        "preprocessing_steps": [
            "SimpleImputer with mean strategy",
            "StandardScaler normalization"
        ]
    }
    
    metadata_filename = f"{model_dir}/model_metadata_{timestamp}.json"
    with open(metadata_filename, 'w') as f:
        json.dump(metadata, f, indent=4)
    print(f"✅ Model metadata saved as: {metadata_filename}")
    
    # Save all model results for comparison
    all_results = {}
    for name, result in results.items():
        all_results[name] = {
            "accuracy": result['accuracy'],
            "model_type": type(result['model']).__name__
        }
    
    results_filename = f"{model_dir}/all_models_comparison_{timestamp}.json"
    with open(results_filename, 'w') as f:
        json.dump(all_results, f, indent=4)
    print(f"✅ All models comparison saved as: {results_filename}")
    
    return {
        "model_file": model_filename,
        "scaler_file": scaler_filename,
        "imputer_file": imputer_filename,
        "metadata_file": metadata_filename,
        "results_file": results_filename
    }

def load_trained_model(model_dir="saved_models", timestamp=None):
    """
    Load a previously saved water quality prediction model
    
    Args:
        model_dir: Directory where model files are saved
        timestamp: Specific timestamp to load (if None, loads the most recent)
    
    Returns:
        Dictionary containing loaded model, scaler, imputer, and metadata
    """
    
    if not os.path.exists(model_dir):
        raise FileNotFoundError(f"Model directory '{model_dir}' not found")
    
    # If no timestamp specified, find the most recent one
    if timestamp is None:
        model_files = [f for f in os.listdir(model_dir) if f.startswith("water_quality_model_")]
        if not model_files:
            raise FileNotFoundError("No saved models found")
        
        # Extract timestamps and find the most recent
        # Format: water_quality_model_YYYYMMDD_HHMMSS.pkl
        timestamps = []
        for f in model_files:
            parts = f.replace("water_quality_model_", "").replace(".pkl", "")
            timestamps.append(parts)
        timestamp = max(timestamps)
    
    # Load model components
    model_file = f"{model_dir}/water_quality_model_{timestamp}.pkl"
    scaler_file = f"{model_dir}/scaler_{timestamp}.pkl"
    imputer_file = f"{model_dir}/imputer_{timestamp}.pkl"
    metadata_file = f"{model_dir}/model_metadata_{timestamp}.json"
    
    try:
        # Load the model
        model = joblib.load(model_file)
        # print(f"✅ Model loaded from: {model_file}")
        
        # Load the scaler
        scaler = joblib.load(scaler_file)
        # print(f"✅ Scaler loaded from: {scaler_file}")
        
        # Load the imputer
        imputer = joblib.load(imputer_file)
        # print(f"✅ Imputer loaded from: {imputer_file}")
        
        # Load metadata
        with open(metadata_file, 'r') as f:
            metadata = json.load(f)
        # print(f"✅ Metadata loaded from: {metadata_file}")
        
        return {
            "model": model,
            "scaler": scaler,
            "imputer": imputer,
            "metadata": metadata
        }
        
    except FileNotFoundError as e:
        raise FileNotFoundError(f"Required model file not found: {e}")
    except Exception as e:
        raise Exception(f"Error loading model: {e}")

def predict_with_saved_model(model_components, ph, hardness, solids, chloramines, 
                           sulfate, conductivity, organic_carbon, trihalomethanes, turbidity):
    """
    Make prediction using loaded model components
    
    Args:
        model_components: Dictionary returned by load_trained_model()
        ph, hardness, etc.: Water quality parameters
    
    Returns:
        Tuple of (prediction, probability_array)
    """
    
    # Extract components
    model = model_components['model']
    scaler = model_components['scaler']
    imputer = model_components['imputer']
    feature_names = model_components['metadata']['feature_names']
    
    # Create input array in correct order
    input_data = np.array([[ph, hardness, solids, chloramines, sulfate,
                           conductivity, organic_carbon, trihalomethanes, turbidity]])
    
    # Apply same preprocessing as training
    input_df = pd.DataFrame(input_data, columns=feature_names)
    input_imputed = imputer.transform(input_df)
    input_scaled = scaler.transform(input_imputed)
    
    # Make prediction
    prediction = model.predict(input_scaled)
    
    # Get probability if available
    try:
        probability = model.predict_proba(input_scaled)
        return prediction[0], probability[0]
    except AttributeError:
        # Some models might not have predict_proba
        return prediction[0], None

def list_saved_models(model_dir="saved_models"):
    """
    List all saved models with their details
    
    Args:
        model_dir: Directory where model files are saved
    """
    
    if not os.path.exists(model_dir):
        print(f"Model directory '{model_dir}' not found")
        return
    
    model_files = [f for f in os.listdir(model_dir) if f.startswith("water_quality_model_")]
    
    if not model_files:
        print("No saved models found")
        return
    
    print("📋 Saved Water Quality Models:")
    print("-" * 60)
    
    for model_file in sorted(model_files):
        timestamp = model_file.split("_")[-1].replace(".pkl", "")
        metadata_file = f"{model_dir}/model_metadata_{timestamp}.json"
        
        try:
            with open(metadata_file, 'r') as f:
                metadata = json.load(f)
            
            print(f"🤖 Model: {metadata['model_name']}")
            print(f"   📅 Date: {timestamp}")
            print(f"   🎯 Accuracy: {metadata['accuracy']:.4f}")
            print(f"   📁 File: {model_file}")
            print()
            
        except FileNotFoundError:
            print(f"⚠️  Metadata not found for {model_file}")

if __name__ == "__main__":
    # Example usage - this would typically be called from train.py
    print("🔧 Water Quality Model Download/Save Utility")
    print("This module provides functions to save and load trained models.")
    print("\nTo use this module:")
    print("1. Import the functions in your train.py")
    print("2. Call save_trained_model() after training")
    print("3. Use load_trained_model() to load saved models")
    
    # List any existing saved models
    list_saved_models()