import pandas as pd

# Load CSV
data = pd.read_csv("water_quality.csv")

# Clean missing values
data = data.fillna(data.mean())

print(data.head())  # just to check


# analysis.py
# Water Quality Dataset Analysis

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

# Load dataset (make sure water_quality.csv is in the same folder)
data = pd.read_csv("water_quality.csv")
data = data.fillna(data.mean())   # clean missing values

print("\n--- Missing Values After Cleaning ---")
print(data.isnull().sum())

# Step 2: Split features (X) and target (y)
X = data.drop("Potability", axis=1)  # all columns except Potability
y = data["Potability"]               # Potability column only

print("\n✅ Features and Target prepared")
print("X shape:", X.shape)
print("y shape:", y.shape)



# 1. Show first 5 rows
print("\n--- First 5 Rows ---")
print(data.head())

# 2. Dataset Info
print("\n--- Dataset Info ---")
print(data.info())

# 3. Summary Statistics
print("\n--- Summary Statistics ---")
print(data.describe())

# 4. Check Missing Values
print("\n--- Missing Values ---")
print(data.isnull().sum())

# 5. Visualization: Histogram of pH
if 'ph' in data.columns:
    sns.histplot(data['ph'], kde=True, bins=30)
    plt.title('pH Distribution in Water')
    plt.show()

# 6. Correlation Heatmap
plt.figure(figsize=(10,6))
sns.heatmap(data.corr(), annot=True, cmap="coolwarm")
plt.title("Correlation Heatmap")
plt.show()