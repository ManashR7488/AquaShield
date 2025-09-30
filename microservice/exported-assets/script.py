import pandas as pd
import numpy as np

# Load the water quality dataset
df = pd.read_csv('water_quality.csv')

# Display basic information about the dataset
print("Dataset Shape:", df.shape)
print("\nColumn Names and Data Types:")
print(df.dtypes)
print("\nFirst 5 rows:")
print(df.head())
print("\nDataset Info:")
print(df.info())