# Advanced ensemble methods and hyperparameter tuning implementation
from sklearn.ensemble import VotingClassifier, BaggingClassifier
from sklearn.model_selection import GridSearchCV, RandomizedSearchCV
from imblearn.over_sampling import SMOTE
from imblearn.combine import SMOTEENN
from imblearn.pipeline import Pipeline as ImbPipeline
import time

print("ADVANCED WATER POTABILITY PREDICTION MODELING")
print("="*60)

# Use median imputation for consistency with best results
X_imputed = pd.DataFrame(median_imputer.fit_transform(X), columns=X.columns)

# Handle class imbalance with SMOTE
print("\n1. Addressing Class Imbalance with SMOTE")
print("-"*40)
smote = SMOTE(random_state=42)
X_balanced, y_balanced = smote.fit_resample(X_imputed, y)

print(f"Original distribution: {y.value_counts().to_dict()}")
print(f"Balanced distribution: {pd.Series(y_balanced).value_counts().to_dict()}")

# Split balanced data
X_train, X_test, y_train, y_test = train_test_split(
    X_balanced, y_balanced, test_size=0.2, random_state=42, stratify=y_balanced
)

# Scale features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

print(f"\nTraining set size: {X_train_scaled.shape}")
print(f"Testing set size: {X_test_scaled.shape}")

# Define ensemble models
ensemble_models = {
    'Voting_Soft': VotingClassifier(
        estimators=[
            ('rf', RandomForestClassifier(n_estimators=100, random_state=42)),
            ('svm', SVC(probability=True, random_state=42)),
            ('xgb', XGBClassifier(random_state=42, eval_metric='logloss'))
        ],
        voting='soft'
    ),
    'Voting_Hard': VotingClassifier(
        estimators=[
            ('rf', RandomForestClassifier(n_estimators=100, random_state=42)),
            ('svm', SVC(random_state=42)),
            ('xgb', XGBClassifier(random_state=42, eval_metric='logloss'))
        ],
        voting='hard'
    ),
    'Bagging_RF': BaggingClassifier(
        base_estimator=RandomForestClassifier(n_estimators=50, random_state=42),
        n_estimators=10,
        random_state=42
    ),
    'Optimized_XGB': XGBClassifier(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        random_state=42,
        eval_metric='logloss'
    ),
    'Optimized_RF': RandomForestClassifier(
        n_estimators=200,
        max_depth=10,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42
    )
}

# Evaluate ensemble models
print("\n2. Ensemble Model Performance")
print("-"*40)
ensemble_results = []

for model_name, model in ensemble_models.items():
    start_time = time.time()
    
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
    
    training_time = time.time() - start_time
    
    ensemble_results.append({
        'Model': model_name,
        'Accuracy': accuracy,
        'Precision': precision,
        'Recall': recall,
        'F1_Score': f1,
        'AUC_ROC': auc_score,
        'Training_Time': training_time
    })
    
    auc_display = f"{auc_score:.4f}" if auc_score is not None else "N/A"
    print(f"{model_name:15} | Acc: {accuracy:.4f} | F1: {f1:.4f} | AUC: {auc_display} | Time: {training_time:.2f}s")

# Create ensemble results DataFrame
ensemble_df = pd.DataFrame(ensemble_results)

print("\n3. Best Ensemble Model Results")
print("-"*40)
best_ensemble = ensemble_df.loc[ensemble_df['Accuracy'].idxmax()]
print(f"Best Model: {best_ensemble['Model']}")
print(f"Accuracy: {best_ensemble['Accuracy']:.4f}")
print(f"F1-Score: {best_ensemble['F1_Score']:.4f}")
print(f"AUC-ROC: {best_ensemble['AUC_ROC']:.4f}")

# Save ensemble results
ensemble_df.to_csv('ensemble_model_results.csv', index=False)
print(f"\nEnsemble results saved to: ensemble_model_results.csv")