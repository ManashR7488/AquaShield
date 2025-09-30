# Detailed exploratory data analysis
import matplotlib.pyplot as plt
import seaborn as sns

# Check data distributions and correlations
fig, axes = plt.subplots(3, 3, figsize=(15, 12))
axes = axes.ravel()

# Plot histograms for each feature
for i, col in enumerate(df.columns[:-1]):  # Exclude Potability
    axes[i].hist(df[col].dropna(), bins=30, alpha=0.7, edgecolor='black')
    axes[i].set_title(f'Distribution of {col}')
    axes[i].set_xlabel(col)
    axes[i].set_ylabel('Frequency')

plt.tight_layout()
plt.savefig('feature_distributions.png', dpi=300, bbox_inches='tight')
plt.show()

# Correlation matrix
plt.figure(figsize=(10, 8))
correlation_matrix = df.corr()
sns.heatmap(correlation_matrix, annot=True, cmap='coolwarm', center=0, 
            square=True, linewidths=0.5)
plt.title('Correlation Matrix of Water Quality Features')
plt.tight_layout()
plt.savefig('correlation_matrix.png', dpi=300, bbox_inches='tight')
plt.show()

print("Correlation with Potability:")
print(correlation_matrix['Potability'].sort_values(ascending=False))