from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import numpy as np
import pandas as pd
import joblib
import json
import shap
from datetime import datetime
from database import db

app = FastAPI(title="FraudLens Detection API", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = joblib.load("fraud_model.pkl")
scaler = joblib.load("scaler.pkl")
feature_names = joblib.load("feature_names.pkl")

with open("model_metadata.json") as f:
    metadata = json.load(f)

explainer = shap.TreeExplainer(model)
current_threshold = {"value": 0.5}

# Friendly display names for SHAP output
FRIENDLY_NAMES = {
    'Time':  'Transaction Timestamp',
    'V1':    'Spending Pattern Score',
    'V2':    'Merchant Anomaly Score',
    'V3':    'Transaction Velocity Score',
    'V4':    'Purchase Category Score',
    'V5':    'Card Usage Pattern',
    'V6':    'Location Risk Score',
    'V7':    'Time-of-Day Risk Score',
    'V8':    'Device Fingerprint Score',
    'V9':    'Account Age Score',
    'V10':   'IP Risk Score',
    'V11':   'Customer Loyalty Score',
    'V12':   'Balance Deviation Score',
    'V13':   'Credit Utilization Score',
    'V14':   'Transaction Frequency Score',
    'V15':   'Weekend Activity Score',
    'V16':   'Multi-Channel Risk Score',
    'V17':   'High-Value Alert Score',
    'V18':   'Chargeback History Score',
    'V19':   'Login Behavior Score',
    'V20':   'Session Duration Score',
    'V21':   'Cart Behavior Score',
    'V22':   'Shipping Anomaly Score',
    'V23':   'Browser Fingerprint Score',
    'V24':   'Email Domain Score',
    'V25':   'Phone Verification Score',
    'V26':   'Address Match Score',
    'V27':   'CVV Attempt Score',
    'V28':   'Refund Pattern Score',
    'Amount': 'Transaction Amount ($)',
}


class TransactionRequest(BaseModel):
    Time: float
    V1: float; V2: float; V3: float; V4: float; V5: float
    V6: float; V7: float; V8: float; V9: float; V10: float
    V11: float; V12: float; V13: float; V14: float; V15: float
    V16: float; V17: float; V18: float; V19: float; V20: float
    V21: float; V22: float; V23: float; V24: float; V25: float
    V26: float; V27: float; V28: float
    Amount: float

class ThresholdRequest(BaseModel):
    threshold: float = Field(..., ge=0.0, le=1.0)


def prepare_features(tx: TransactionRequest) -> np.ndarray:
    data = {col: [getattr(tx, col)] for col in feature_names}
    df = pd.DataFrame(data)
    df[["Amount", "Time"]] = scaler.transform(df[["Amount", "Time"]])
    return df.values


@app.get("/")
def root():
    return {"message": "FraudLens API running", "docs": "/docs"}


@app.post("/predict")
async def predict(tx: TransactionRequest):
    X = prepare_features(tx)
    prob = float(model.predict_proba(X)[0][1])
    is_fraud = prob >= current_threshold["value"]

    if prob < 0.3:      risk_level = "LOW"
    elif prob < 0.6:    risk_level = "MEDIUM"
    elif prob < 0.8:    risk_level = "HIGH"
    else:               risk_level = "CRITICAL"

    result = {
        "is_fraud": is_fraud,
        "probability": round(prob, 4),
        "risk_score": round(prob * 100, 2),
        "risk_level": risk_level,
        "threshold_used": current_threshold["value"],
        "timestamp": datetime.utcnow().isoformat(),
        "amount": tx.Amount
    }
    await db.predictions.insert_one({**result, "features": tx.dict()})
    return result


@app.post("/explain")
async def explain(tx: TransactionRequest):
    X = prepare_features(tx)
    shap_values = explainer.shap_values(X)
    sv = shap_values[1][0] if isinstance(shap_values, list) else shap_values[0]

    shap_data = [
        {
            "feature": FRIENDLY_NAMES.get(feature_names[i], feature_names[i]),
            "shap_value": round(float(sv[i]), 4),
            "feature_value": round(float(X[0][i]), 4)
        }
        for i in range(len(feature_names))
    ]
    shap_data.sort(key=lambda x: abs(x["shap_value"]), reverse=True)

    return {
        "top_features": shap_data[:10],
        "all_features": shap_data,
        "base_value": round(float(
            explainer.expected_value if not isinstance(explainer.expected_value, list)
            else explainer.expected_value[1]
        ), 4)
    }


@app.get("/metrics")
def get_metrics():
    # We use .get(key, default) to prevent KeyError crashes
    return {
        "best_model": metadata.get("best_model", "XGBoost"),
        "roc_auc": metadata.get("roc_auc", 0),
        "model_comparison": metadata.get("model_comparison", []),
        "dataset_stats": metadata.get("dataset_stats", {}),
        "feature_names": feature_names,
        # Added safety for these keys:
        "roc_curve": metadata.get("roc_curve", {"fpr": [], "tpr": []}),
        "pr_curve": metadata.get("pr_curve", {"precision": [], "recall": []}),
        "confusion_matrix": metadata.get("confusion_matrix", [[0,0],[0,0]])
    }

@app.post("/threshold")
def update_threshold(req: ThresholdRequest):
    current_threshold["value"] = req.threshold
    X_test = joblib.load("X_test.pkl")
    y_test = joblib.load("y_test.pkl")

    X_df = pd.DataFrame(X_test, columns=feature_names)
    X_df[["Amount", "Time"]] = scaler.transform(X_df[["Amount", "Time"]])
    y_prob = model.predict_proba(X_df.values)[:, 1]
    y_pred = (y_prob >= req.threshold).astype(int)

    from sklearn.metrics import precision_score, recall_score, f1_score, confusion_matrix
    cm = confusion_matrix(y_test, y_pred)
    tn, fp, fn, tp = cm.ravel()

    return {
        "threshold": req.threshold,
        "precision": round(precision_score(y_test, y_pred, zero_division=0), 4),
        "recall": round(recall_score(y_test, y_pred, zero_division=0), 4),
        "f1": round(f1_score(y_test, y_pred, zero_division=0), 4),
        "true_positives": int(tp),
        "false_positives": int(fp),
        "true_negatives": int(tn),
        "false_negatives": int(fn),
        "confusion_matrix": cm.tolist()
    }


@app.get("/history")
async def get_history(limit: int = 50):
    cursor = db.predictions.find({}, {"_id": 0}).sort("timestamp", -1).limit(limit)
    history = await cursor.to_list(length=limit)
    return {"predictions": history, "count": len(history)}


@app.get("/stats")
async def get_stats():
    total = await db.predictions.count_documents({})
    fraud_count = await db.predictions.count_documents({"is_fraud": True})
    legit_count = total - fraud_count
    return {
        "total_predictions": total,
        "fraud_detected": fraud_count,
        "legitimate": legit_count,
        "fraud_rate": round((fraud_count / total * 100), 2) if total > 0 else 0,
        "model_name": metadata["best_model"],
        "model_roc_auc": metadata["roc_auc"],
        "current_threshold": current_threshold["value"]
    }
# --- ADD THIS TO YOUR IMPORT LIST AT THE TOP OF MAIN.PY ---
import bcrypt

# ... (Keep all your existing ML code, scaler, explainer, etc. exactly as it is) ...
# ... (Keep all your existing endpoints like /predict, /explain, /metrics, etc.) ...

# --- PASTE THIS ENTIRE BLOCK AT THE VERY BOTTOM OF MAIN.PY ---

# 1. Models for User Data
class UserRegister(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

# 2. Registration Endpoint
@app.post("/register")
async def register_user(user: UserRegister):
    # Check if user already exists (using await for Motor)
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash the password
    hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt())
    
    # Save to MongoDB (using await for Motor)
    new_user = {
        "name": user.name,
        "email": user.email,
        "password": hashed_password.decode('utf-8')
    }
    await db.users.insert_one(new_user)
    
    return {"message": "User created successfully"}

# 3. Login Endpoint
@app.post("/login")
async def login_user(user: UserLogin):
    # Find the user in MongoDB (using await for Motor)
    db_user = await db.users.find_one({"email": user.email})
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    # Check if the provided password matches the hashed password
    if not bcrypt.checkpw(user.password.encode('utf-8'), db_user["password"].encode('utf-8')):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    return {"message": "Login successful", "user_name": db_user["name"]}
