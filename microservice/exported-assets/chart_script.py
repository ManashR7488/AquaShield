import pandas as pd
import plotly.express as px
import plotly.graph_objects as go

# Create the data
data = [
    {"Model": "Decision Tree (KNN Imp)", "F1_Score": 0.485, "Dataset_Type": "Original Imbalanced"},
    {"Model": "Decision Tree (Iterative)", "F1_Score": 0.474, "Dataset_Type": "Original Imbalanced"},
    {"Model": "Decision Tree (Mean)", "F1_Score": 0.467, "Dataset_Type": "Original Imbalanced"},
    {"Model": "Decision Tree (Median)", "F1_Score": 0.467, "Dataset_Type": "Original Imbalanced"},
    {"Model": "XGBoost (Median)", "F1_Score": 0.465, "Dataset_Type": "Original Imbalanced"},
    {"Model": "XGBoost (KNN)", "F1_Score": 0.450, "Dataset_Type": "Original Imbalanced"},
    {"Model": "XGBoost (Mean)", "F1_Score": 0.436, "Dataset_Type": "Original Imbalanced"},
    {"Model": "Random Forest (Iterative)", "F1_Score": 0.421, "Dataset_Type": "Original Imbalanced"},
    {"Model": "Bagging RF", "F1_Score": 0.701, "Dataset_Type": "SMOTE Balanced"},
    {"Model": "Voting Hard", "F1_Score": 0.700, "Dataset_Type": "SMOTE Balanced"},
    {"Model": "Optimized RF", "F1_Score": 0.690, "Dataset_Type": "SMOTE Balanced"},
    {"Model": "Voting Soft", "F1_Score": 0.688, "Dataset_Type": "SMOTE Balanced"},
    {"Model": "Optimized XGB", "F1_Score": 0.645, "Dataset_Type": "SMOTE Balanced"}
]

df = pd.DataFrame(data)

# Abbreviate model names to fit character limit
model_abbreviations = {
    "Decision Tree (KNN Imp)": "DT (KNN Imp)",
    "Decision Tree (Iterative)": "DT (Iterative)",
    "Decision Tree (Mean)": "DT (Mean)",
    "Decision Tree (Median)": "DT (Median)",
    "XGBoost (Median)": "XGB (Median)",
    "XGBoost (KNN)": "XGB (KNN)",
    "XGBoost (Mean)": "XGB (Mean)",
    "Random Forest (Iterative)": "RF (Iterative)",
    "Bagging RF": "Bagging RF",
    "Voting Hard": "Voting Hard",
    "Optimized RF": "Optimized RF",
    "Voting Soft": "Voting Soft",
    "Optimized XGB": "Optimized XGB"
}

df['Model_Short'] = df['Model'].map(model_abbreviations)

# Create the grouped bar chart
fig = go.Figure()

# Add bars for Original Imbalanced dataset
original_data = df[df['Dataset_Type'] == 'Original Imbalanced']
fig.add_trace(go.Bar(
    name='Original',
    x=original_data['Model_Short'],
    y=original_data['F1_Score'],
    marker_color='#1FB8CD',
    text=[f'{score:.3f}' for score in original_data['F1_Score']],
    textposition='outside'
))

# Add bars for SMOTE Balanced dataset
smote_data = df[df['Dataset_Type'] == 'SMOTE Balanced']
fig.add_trace(go.Bar(
    name='SMOTE',
    x=smote_data['Model_Short'],
    y=smote_data['F1_Score'],
    marker_color='#DB4545',
    text=[f'{score:.3f}' for score in smote_data['F1_Score']],
    textposition='outside'
))

# Update layout
fig.update_layout(
    title='ML Model F1-Scores',
    xaxis_title='Models',
    yaxis_title='F1-Score',
    barmode='group',
    legend=dict(orientation='h', yanchor='bottom', y=1.05, xanchor='center', x=0.5)
)

# Update traces for clipping
fig.update_traces(cliponaxis=False)

# Update x-axis to prevent overlapping labels
fig.update_xaxes(tickangle=45)

# Save as both PNG and SVG
fig.write_image('ml_models_f1_comparison.png')
fig.write_image('ml_models_f1_comparison.svg', format='svg')

fig.show()