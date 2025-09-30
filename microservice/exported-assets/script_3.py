# Handle missing values using different imputation strategies
from sklearn.impute import SimpleImputer, KNNImputer
from sklearn.experimental import enable_iterative_imputer
from sklearn.impute import IterativeImputer
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.ensemble import GradientBoostingClassifier, AdaBoostClassifier
from sklearn.naive_bayes import GaussianNB
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, roc_auc_score, f1_score, precision_score, recall_score
import warnings
warnings.filterwarnings('ignore')

# Prepare data for modeling
X = df.drop('Potability', axis=1)
y = df['Potability']

print("Original dataset shape:", X.shape)
print("Missing values before imputation:")
print(X.isnull().sum())

# Compare different imputation methods
imputation_methods = {
    'Mean': SimpleImputer(strategy='mean'),
    'Median': SimpleImputer(strategy='median'),
    'KNN': KNNImputer(n_neighbors=5),
    'Iterative': IterativeImputer(random_state=42, max_iter=10)
}

# Store imputed datasets
imputed_datasets = {}

for method_name, imputer in imputation_methods.items():
    X_imputed = pd.DataFrame(imputer.fit_transform(X), columns=X.columns)
    imputed_datasets[method_name] = X_imputed
    print(f"\n{method_name} Imputation - Missing values after imputation:")
    print(X_imputed.isnull().sum().sum())

print("\nImputation methods comparison completed.")