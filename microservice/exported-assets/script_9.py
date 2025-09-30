# Install imbalanced-learn and implement ensemble methods
import subprocess
import sys

# Install imbalanced-learn
subprocess.check_call([sys.executable, "-m", "pip", "install", "imbalanced-learn"])

# Now import required libraries
from imblearn.over_sampling import SMOTE
from imblearn.combine import SMOTEENN
import time

print("Successfully installed imbalanced-learn!")