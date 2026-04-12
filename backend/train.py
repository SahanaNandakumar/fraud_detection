import pandas as pd
import joblib
import json
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import roc_auc_score

print("Loading creditcard dataset...")
df = pd.read_csv("creditcard.csv")

X = df.drop("Class", axis=1)
y = df["Class"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

scaler = StandardScaler()
X_train[['Amount','Time']] = scaler.fit_transform(X_train[['Amount','Time']])
X_test[['Amount','Time']] = scaler.transform(X_test[['Amount','Time']])

# 1. Train Logistic Regression (Baseline)
print("Training Logistic Regression...")
lr_model = LogisticRegression(max_iter=1000)
lr_model.fit(X_train, y_train)
lr_auc = roc_auc_score(y_test, lr_model.predict_proba(X_test)[:,1])

# 2. Train Random Forest
print("Training Random Forest...")
rf_model = RandomForestClassifier(n_estimators=100, max_depth=6, n_jobs=-1)
rf_model.fit(X_train, y_train)
rf_auc = roc_auc_score(y_test, rf_model.predict_proba(X_test)[:,1])

# 3. Train XGBoost (Your Best Model)
print("Training XGBoost...")
scale_pos_weight = len(y_train[y_train==0]) / len(y_train[y_train==1])
xgb_model = XGBClassifier(
    n_estimators=200, max_depth=6, learning_rate=0.1,
    scale_pos_weight=scale_pos_weight, eval_metric='logloss'
)
xgb_model.fit(X_train, y_train)
xgb_auc = roc_auc_score(y_test, xgb_model.predict_proba(X_test)[:,1])

print(f"Comparison: LR: {lr_auc:.4f}, RF: {rf_auc:.4f}, XGB: {xgb_auc:.4f}")

# Save the best model (XGBoost) for the API to use
joblib.dump(xgb_model, "fraud_model.pkl")
joblib.dump(scaler, "scaler.pkl")
joblib.dump(X.columns.tolist(), "feature_names.pkl")
joblib.dump(X_test, "X_test.pkl")
joblib.dump(y_test, "y_test.pkl")

# Update Metadata for the Dashboard
model_metadata = {
    "best_model": "XGBoost",
    "roc_auc": float(xgb_auc),
    "model_comparison": [
        {"name": "Logistic Regression", "roc_auc": round(float(lr_auc), 4)},
        {"name": "Random Forest", "roc_auc": round(float(rf_auc), 4)},
        {"name": "XGBoost (Winner)", "roc_auc": round(float(xgb_auc), 4)}
    ],
    "dataset_stats": {
        "total_records": int(len(df)),
        "fraud_cases": int(y.sum()),
        "legit_cases": int((y == 0).sum()),
        "fraud_pct": float(y.mean() * 100)
    }
}

with open("model_metadata.json", "w") as f:
    json.dump(model_metadata, f, indent=2)

print("✅ All models trained and comparison saved!")
