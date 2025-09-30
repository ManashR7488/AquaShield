# Create a comprehensive model training and evaluation pipeline
# with the best performing approach

print("FINAL RECOMMENDATION SYSTEM FOR WATER POTABILITY PREDICTION")
print("="*65)

# Best approach: Bagging Random Forest with SMOTE
print("\n1. RECOMMENDED MODEL PIPELINE")
print("-"*40)
print("✓ Data Preprocessing: Median imputation for missing values")
print("✓ Class Balancing: SMOTE oversampling") 
print("✓ Feature Scaling: StandardScaler")
print("✓ Model: Bagging Random Forest")
print("✓ Expected Performance: ~70% accuracy, ~70% F1-score")

# Create the final model pipeline
def create_water_potability_model():
    """
    Create and return the optimal water potability prediction model
    """
    # Data preprocessing
    imputer = SimpleImputer(strategy='median')
    scaler = StandardScaler()
    smote = SMOTE(random_state=42)
    
    # Best performing model
    model = BaggingClassifier(
        estimator=RandomForestClassifier(n_estimators=50, random_state=42),
        n_estimators=10,
        random_state=42
    )
    
    return imputer, scaler, smote, model

# Demonstrate the complete pipeline
imputer, scaler, smote, final_model = create_water_potability_model()

# Process the data
X_processed = imputer.fit_transform(X)
X_balanced, y_balanced = smote.fit_resample(X_processed, y)
X_train, X_test, y_train, y_test = train_test_split(
    X_balanced, y_balanced, test_size=0.2, random_state=42, stratify=y_balanced
)
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Train and evaluate final model
final_model.fit(X_train_scaled, y_train)
y_pred_final = final_model.predict(X_test_scaled)
y_pred_proba_final = final_model.predict_proba(X_test_scaled)[:, 1]

print(f"\n2. FINAL MODEL PERFORMANCE METRICS")
print("-"*40)
print(f"Accuracy: {accuracy_score(y_test, y_pred_final):.4f}")
print(f"Precision: {precision_score(y_test, y_pred_final):.4f}")
print(f"Recall: {recall_score(y_test, y_pred_final):.4f}")
print(f"F1-Score: {f1_score(y_test, y_pred_final):.4f}")
print(f"AUC-ROC: {roc_auc_score(y_test, y_pred_proba_final):.4f}")

# Create detailed classification report
print(f"\n3. DETAILED CLASSIFICATION REPORT")
print("-"*40)
print(classification_report(y_test, y_pred_final, 
                          target_names=['Not Potable', 'Potable']))

# Feature importance from the bagged random forest
feature_importances = []
for estimator in final_model.estimators_:
    feature_importances.append(estimator.feature_importances_)

avg_importance = np.mean(feature_importances, axis=0)
feature_importance_final = pd.DataFrame({
    'Feature': X.columns,
    'Importance': avg_importance
}).sort_values('Importance', ascending=False)

print(f"\n4. FEATURE IMPORTANCE ANALYSIS")
print("-"*40)
print(feature_importance_final.to_string(index=False))

# Create deployment guidelines
print(f"\n5. MODEL DEPLOYMENT GUIDELINES")
print("-"*40)
print("To use this model in production:")
print("1. Collect water quality measurements for all 9 parameters")
print("2. Handle missing values with median imputation")
print("3. Apply SMOTE if training data is imbalanced")
print("4. Standardize features using the fitted scaler")
print("5. Apply the trained Bagging Random Forest model")
print("6. Interpret probabilities: >0.5 = Potable, <0.5 = Not Potable")

# Save the final model components for future use
print(f"\n6. SAVING MODEL ARTIFACTS")
print("-"*40)

# Save comprehensive results and model information
final_results = pd.DataFrame([{
    'Model_Type': 'Bagging_Random_Forest_with_SMOTE',
    'Accuracy': accuracy_score(y_test, y_pred_final),
    'Precision': precision_score(y_test, y_pred_final),
    'Recall': recall_score(y_test, y_pred_final),
    'F1_Score': f1_score(y_test, y_pred_final),
    'AUC_ROC': roc_auc_score(y_test, y_pred_proba_final),
    'Preprocessing': 'Median_Imputation_StandardScaler_SMOTE',
    'Parameters': 'n_estimators=10, base_RF_n_estimators=50'
}])

final_results.to_csv('final_water_potability_model.csv', index=False)
feature_importance_final.to_csv('final_feature_importance.csv', index=False)

print("✓ final_water_potability_model.csv - Model performance metrics")
print("✓ final_feature_importance.csv - Feature importance rankings")

print(f"\n7. KEY INSIGHTS FOR WATER QUALITY ASSESSMENT")
print("-"*40)
print("Most Critical Parameters:")
for i, row in feature_importance_final.head(3).iterrows():
    print(f"• {row['Feature']}: {row['Importance']:.3f} importance")

print(f"\nModel Strengths:")
print("• Handles missing data effectively")
print("• Addresses class imbalance with SMOTE") 
print("• Uses ensemble method for robust predictions")
print("• Achieves balanced precision and recall")
print("• Provides probability estimates for decision confidence")