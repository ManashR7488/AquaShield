# Fix the formatting issue and rerun the analysis
# Comprehensive machine learning model comparison for water potability prediction

# Clear results and rerun with corrected formatting
results_comparison = []

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
            
            # Fixed formatting
            auc_display = f"{auc_score:.4f}" if auc_score is not None else "N/A"
            print(f"{model_name:20} | Accuracy: {accuracy:.4f} | F1: {f1:.4f} | AUC: {auc_display}")
            
        except Exception as e:
            print(f"{model_name:20} | Error: {str(e)}")
            continue

# Create comprehensive results summary
results_df = pd.DataFrame(results_comparison)

print(f"\n{'='*80}")
print("COMPREHENSIVE RESULTS SUMMARY")
print(f"{'='*80}")

# Best models by different metrics
print("\nTop 10 Model-Imputation Combinations by Accuracy:")
top_accuracy = results_df.nlargest(10, 'Accuracy')[['Imputation', 'Model', 'Accuracy', 'F1_Score', 'AUC_ROC']]
print(top_accuracy.to_string(index=False))

print("\nTop 10 Model-Imputation Combinations by F1-Score:")
top_f1 = results_df.nlargest(10, 'F1_Score')[['Imputation', 'Model', 'F1_Score', 'Accuracy', 'AUC_ROC']]
print(top_f1.to_string(index=False))

print("\nTop 10 Model-Imputation Combinations by AUC-ROC:")
top_auc = results_df.dropna(subset=['AUC_ROC']).nlargest(10, 'AUC_ROC')[['Imputation', 'Model', 'AUC_ROC', 'Accuracy', 'F1_Score']]
print(top_auc.to_string(index=False))