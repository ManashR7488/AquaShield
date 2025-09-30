# Check for missing values and basic statistics
print("Missing Values:")
print(df.isnull().sum())
print("\nBasic Statistics:")
print(df.describe())

# Check target variable distribution
print("\nTarget Variable (Potability) Distribution:")
print(df['Potability'].value_counts())
print(f"Percentage of potable water: {df['Potability'].mean()*100:.2f}%")

# Check for duplicates
print(f"\nNumber of duplicate rows: {df.duplicated().sum()}")