# Create detailed feature importance analysis and model optimization
# Focus on the best performing models for further analysis

# Best model analysis - SVM with Median imputation
print("DETAILED ANALYSIS OF BEST PERFORMING MODEL")
print("="*60)

# Use median imputation (best overall performer)
median_imputer = SimpleImputer(strategy='median')
X_imputed_median = pd.DataFrame(median_imputer.fit_transform(X), columns=X.columns)

# Split and scale data
X_train, X_test, y_train, y_test = train_test_split(
    X_imputed_median, y, test_size=0.2, random_state=42, stratify=y
)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Train and evaluate the best SVM model
best_svm = SVC(random_state=42, probability=True)
best_svm.fit(X_train_scaled, y_train)
y_pred_svm = best_svm.predict(X_test_scaled)
y_pred_proba_svm = best_svm.predict_proba(X_test_scaled)[:, 1]

# Detailed metrics for best model
print(f"\nBest Model Performance (SVM with Median Imputation):")
print(f"Accuracy: {accuracy_score(y_test, y_pred_svm):.4f}")
print(f"Precision: {precision_score(y_test, y_pred_svm):.4f}")
print(f"Recall: {recall_score(y_test, y_pred_svm):.4f}")
print(f"F1-Score: {f1_score(y_test, y_pred_svm):.4f}")
print(f"AUC-ROC: {roc_auc_score(y_test, y_pred_proba_svm):.4f}")

# Classification report
print(f"\nClassification Report:")
print(classification_report(y_test, y_pred_svm))

# Confusion Matrix
conf_matrix = confusion_matrix(y_test, y_pred_svm)
print(f"\nConfusion Matrix:")
print(conf_matrix)

# Feature importance using Random Forest (as SVM doesn't provide feature importance directly)
rf_for_importance = RandomForestClassifier(n_estimators=100, random_state=42)
rf_for_importance.fit(X_train_scaled, y_train)

feature_importance = pd.DataFrame({
    'Feature': X.columns,
    'Importance': rf_for_importance.feature_importances_
}).sort_values('Importance', ascending=False)

print(f"\nFeature Importance (Random Forest Analysis):")
print(feature_importance.to_string(index=False))

# Save detailed results to CSV
results_df.to_csv('water_potability_model_comparison.csv', index=False)
feature_importance.to_csv('feature_importance.csv', index=False)

print(f"\nFiles saved:")
print(f"- water_potability_model_comparison.csv: Complete model comparison results")
print(f"- feature_importance.csv: Feature importance rankings")

# Best practices recommendations
print(f"\n{'='*60}")
print("RECOMMENDATIONS FOR WATER POTABILITY PREDICTION")
print(f"{'='*60}")
print("1. Best Model: SVM with Median Imputation")
print("2. Expected Accuracy: ~67%")
print("3. Most Important Features:")
for i, row in feature_importance.head(5).iterrows():
    print(f"   - {row['Feature']}: {row['Importance']:.4f}")
print("4. Handle missing values with median imputation")
print("5. Always standardize features before training")
print("6. Consider ensemble methods for improved performance")