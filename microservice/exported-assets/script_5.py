# Comprehensive machine learning model comparison for water potability prediction
import pandas as pd
import numpy as np

# Prepare data for modeling
X = df.drop('Potability', axis=1)
y = df['Potability']

print("Dataset Overview:")
print(f"Total samples: {len(X)}")
print(f"Features: {X.columns.tolist()}")
print(f"Target distribution: {y.value_counts().to_dict()}")

# Compare different imputation methods
imputation_methods = {
    'Mean': SimpleImputer(strategy='mean'),
    'Median': SimpleImputer(strategy='median'),
    'KNN': KNNImputer(n_neighbors=5),
    'Iterative': IterativeImputer(random_state=42, max_iter=10)
}

# Store results for comparison
results_comparison = []

# Define models to test
models = {
    'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42),
    'XGBoost': XGBClassifier(random_state=42, eval_metric='logloss'),
    'SVM': SVC(random_state=42, probability=True),
    'Logistic Regression': LogisticRegression(random_state=42, max_iter=1000),
    'Decision Tree': DecisionTreeClassifier(random_state=42),
    'KNN': KNeighborsClassifier(n_neighbors=5),
    'Gradient Boosting': GradientBoostingClassifier(random_state=42),
    'AdaBoost': AdaBoostClassifier(random_state=42),
    'Naive Bayes': GaussianNB()
}

# Test each imputation method with each model
for imp_name, imputer in imputation_methods.items():
    print(f"\n{'='*50}")
    print(f"Testing {imp_name} Imputation")
    print(f"{'='*50}")
    
    # Apply imputation
    X_imputed = pd.DataFrame(imputer.fit_transform(X), columns=X.columns)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X_imputed, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Convert back to DataFrame for consistency
    X_train_scaled = pd.DataFrame(X_train_scaled, columns=X.columns)
    X_test_scaled = pd.DataFrame(X_test_scaled, columns=X.columns)
    
    for model_name, model in models.items():
        try:
            # Train model
            model.fit(X_train_scaled, y_train)
            
            # Make predictions
            y_pred = model.predict(X_test_scaled)
            y_pred_proba = model.predict_proba(X_test_scaled)[:, 1] if hasattr(model, 'predict_proba') else None
            
            # Calculate metrics
            accuracy = accuracy_score(y_test, y_pred)
            precision = precision_score(y_test, y_pred)
            recall = recall_score(y_test, y_pred)
            f1 = f1_score(y_test, y_pred)
            auc_score = roc_auc_score(y_test, y_pred_proba) if y_pred_proba is not None else None
            
            # Store results
            results_comparison.append({
                'Imputation': imp_name,
                'Model': model_name,
                'Accuracy': accuracy,
                'Precision': precision,
                'Recall': recall,
                'F1_Score': f1,
                'AUC_ROC': auc_score
            })
            
            print(f"{model_name:20} | Accuracy: {accuracy:.4f} | F1: {f1:.4f} | AUC: {auc_score:.4f if auc_score else 'N/A'}")
            
        except Exception as e:
            print(f"{model_name:20} | Error: {str(e)}")
            continue

# Create results DataFrame and find best combinations
results_df = pd.DataFrame(results_comparison)
print(f"\n{'='*80}")
print("COMPREHENSIVE RESULTS SUMMARY")
print(f"{'='*80}")

# Best models by accuracy
print("\nTop 10 Model-Imputation Combinations by Accuracy:")
top_accuracy = results_df.nlargest(10, 'Accuracy')[['Imputation', 'Model', 'Accuracy', 'F1_Score', 'AUC_ROC']]
print(top_accuracy.to_string(index=False))