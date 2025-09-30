# Water Quality Prediction - Import Libraries
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier, ExtraTreesClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.impute import SimpleImputer
import warnings
warnings.filterwarnings('ignore')

# Import model saving functionality
from download import save_trained_model

print("Libraries imported successfully!")

# Load the dataset
df = pd.read_csv('water_quality.csv')

# Basic information
print(f"Dataset shape: {df.shape}")
print("\nFirst 5 rows:")
print(df.head())

print("\nMissing values:")
print(df.isnull().sum())

print("\nTarget distribution:")
print(df['Potability'].value_counts())


# Handle missing values using mean imputation
imputer = SimpleImputer(strategy='mean')
X = df.drop('Potability', axis=1)
y = df['Potability']

# Apply imputation
X_imputed = pd.DataFrame(imputer.fit_transform(X), columns=X.columns)

# Split the data (80% training, 20% testing)
X_train, X_test, y_train, y_test = train_test_split(
    X_imputed, y, test_size=0.2, random_state=42, stratify=y
)

# Feature scaling
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

print(f"Training set: {X_train_scaled.shape}")
print(f"Test set: {X_test_scaled.shape}")


# Define multiple algorithms
models = {
    'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42),
    'Extra Trees': ExtraTreesClassifier(n_estimators=100, random_state=42),
    'Logistic Regression': LogisticRegression(random_state=42, max_iter=1000),
    'SVM': SVC(random_state=42),
    'K-Neighbors': KNeighborsClassifier(n_neighbors=5),
    'Naive Bayes': GaussianNB(),
    'Decision Tree': DecisionTreeClassifier(random_state=42)
}

# Train and evaluate models
results = {}

for name, model in models.items():
    print(f"\nTraining {name}...")

    # Train the model
    model.fit(X_train_scaled, y_train)

    # Make predictions
    y_pred = model.predict(X_test_scaled)

    # Calculate accuracy
    accuracy = accuracy_score(y_test, y_pred)

    results[name] = {
        'model': model,
        'accuracy': accuracy,
        'predictions': y_pred
    }

    print(f"{name} Accuracy: {accuracy:.4f}")
    print("Classification Report:")
    print(classification_report(y_test, y_pred))


# Find best model
best_model_name = max(results.keys(), key=lambda k: results[k]['accuracy'])
best_accuracy = results[best_model_name]['accuracy']

print(f"\nBest Model: {best_model_name}")
print(f"Best Accuracy: {best_accuracy:.4f}")

# Confusion matrix for best model
best_predictions = results[best_model_name]['predictions']
cm = confusion_matrix(y_test, best_predictions)
print("\nConfusion Matrix:")
print(cm)

# For tree-based models, show feature importance
if 'Forest' in best_model_name or 'Trees' in best_model_name:
    feature_importance = results[best_model_name]['model'].feature_importances_
    importance_df = pd.DataFrame({
        'Feature': X.columns,
        'Importance': feature_importance
    }).sort_values('Importance', ascending=False)

    print("\nFeature Importance:")
    print(importance_df)

def predict_water_quality(ph, hardness, solids, chloramines, sulfate,
                         conductivity, organic_carbon, trihalomethanes, turbidity):
    """
    Predict water quality for new samples
    """
    # Create input array
    input_data = np.array([[ph, hardness, solids, chloramines, sulfate,
                           conductivity, organic_carbon, trihalomethanes, turbidity]])

    # Scale the input
    input_scaled = scaler.transform(input_data)

    # Make prediction
    prediction = results[best_model_name]['model'].predict(input_scaled)
    probability = results[best_model_name]['model'].predict_proba(input_scaled)

    return prediction[0], probability[0]

# Example prediction
prediction, probability = predict_water_quality(
    ph=7.0, hardness=200.0, solids=20000.0, chloramines=7.0,
    sulfate=300.0, conductivity=400.0, organic_carbon=15.0,
    trihalomethanes=70.0, turbidity=4.0
)

print(f"Prediction: {'Safe to drink' if prediction == 1 else 'Not safe to drink'}")
print(f"Confidence: {max(probability):.3f}")

# Save the trained model and preprocessing components
print("\n" + "="*50)
print("SAVING MODEL COMPONENTS")
print("="*50)

saved_files = save_trained_model(
    results=results,
    best_model_name=best_model_name,
    scaler=scaler,
    imputer=imputer,
    feature_names=X.columns
)

print("\n🎉 Model successfully saved!")
print("Files created:")
for file_type, filepath in saved_files.items():
    print(f"  {file_type}: {filepath}")

print(f"\n💡 To load this model later, use:")
print(f"   from download import load_trained_model")
print(f"   model_components = load_trained_model()")
print(f"   # Then use predict_with_saved_model() for predictions")