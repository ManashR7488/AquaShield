import plotly.express as px
import plotly.graph_objects as go
import pandas as pd

# Data for feature importance
data = [
    {"Feature": "ph", "Importance": 0.135432},
    {"Feature": "Sulfate", "Importance": 0.123777},
    {"Feature": "Solids", "Importance": 0.117343},
    {"Feature": "Hardness", "Importance": 0.112061},
    {"Feature": "Chloramines", "Importance": 0.109922},
    {"Feature": "Organic_carbon", "Importance": 0.101509},
    {"Feature": "Conductivity", "Importance": 0.100740},
    {"Feature": "Turbidity", "Importance": 0.100283},
    {"Feature": "Trihalomethanes", "Importance": 0.098935}
]

df = pd.DataFrame(data)

# Create horizontal bar chart
fig = go.Figure(go.Bar(
    x=df['Importance'],
    y=df['Feature'],
    orientation='h',
    marker_color='#1FB8CD',  # Using the primary brand color
    text=[f'{val:.3f}' for val in df['Importance']],  # Data labels with 3 decimal places
    textposition='outside',
    textfont=dict(size=12)
))

# Update layout
fig.update_layout(
    title='Water Quality Feature Importance',
    xaxis_title='Importance',
    yaxis_title='Features'
)

# Update x-axis to show range from 0 to 0.14
fig.update_xaxes(range=[0, 0.14])

# Reverse y-axis to show highest importance at top
fig.update_yaxes(autorange='reversed')

# Update traces for better visualization
fig.update_traces(cliponaxis=False)

# Save as PNG and SVG
fig.write_image('feature_importance.png')
fig.write_image('feature_importance.svg', format='svg')

fig.show()