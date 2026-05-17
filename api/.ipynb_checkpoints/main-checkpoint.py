"""
FAILSAFE API — main.py
FastAPI backend that serves predictions from the trained XGBoost + SHAP model.

Run with:
    uvicorn api.main:app --reload --port 8000

Then visit: http://localhost:8000/docs  (auto-generated API documentation)
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import joblib
import json
import os
import warnings
warnings.filterwarnings("ignore")

# Import our schemas (the data shape definitions)
# When running from project root: python -m uvicorn api.main:app --reload
try:
    from api.schemas import (
        StudentInput, PredictionResponse,
        BatchStudentInput, BatchPredictionResponse,
        Intervention, HealthResponse
    )
except ImportError:
    from schemas import (
        StudentInput, PredictionResponse,
        BatchStudentInput, BatchPredictionResponse,
        Intervention, HealthResponse
    )


# ─────────────────────────────────────────────
# 1. Create the FastAPI app
# ─────────────────────────────────────────────

app = FastAPI(
    title="FAILSAFE — Student Risk Prediction API",
    description="""
## FAILSAFE: Early Warning System for Student Academic Risk

This API takes student data and returns:
- **Risk score** (0–100%) of academic failure
- **Risk level** (HIGH / MODERATE / LOW)
- **Top factors** driving the prediction (via SHAP)
- **Intervention plan** — specific actions for each risk factor

### How to use
1. `GET /health` — Check if the model is loaded
2. `POST /predict` — Predict risk for one student
3. `POST /predict/batch` — Predict risk for a whole class
4. `GET /features` — See what features the model expects
    """,
    version="1.0.0",
)

# Allow the React frontend (running on port 3000) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────
# 2. Load model artifacts at startup
# ─────────────────────────────────────────────

# Resolve paths relative to this file's location
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")
DATA_DIR = os.path.join(BASE_DIR, "data", "processed")

print(f"[FAILSAFE] Loading model artifacts from: {MODELS_DIR}")

try:
    model = joblib.load(os.path.join(MODELS_DIR, "failsafe_model.pkl"))
    print(f"[FAILSAFE] Model loaded: {type(model).__name__}")
except Exception as e:
    model = None
    print(f"[FAILSAFE] WARNING: Could not load model — {e}")

try:
    explainer = joblib.load(os.path.join(MODELS_DIR, "shap_explainer.pkl"))
    print("[FAILSAFE] SHAP explainer loaded")
except Exception as e:
    explainer = None
    print(f"[FAILSAFE] WARNING: Could not load explainer — {e}")

try:
    with open(os.path.join(MODELS_DIR, "intervention_rules.json")) as f:
        INTERVENTION_RULES = json.load(f)
    print(f"[FAILSAFE] Intervention rules loaded: {len(INTERVENTION_RULES)} rules")
except Exception as e:
    INTERVENTION_RULES = {}
    print(f"[FAILSAFE] WARNING: Could not load intervention rules — {e}")

try:
    scaler = joblib.load(os.path.join(MODELS_DIR, "scaler.pkl"))
    print("[FAILSAFE] Scaler loaded")
except Exception as e:
    scaler = None
    print(f"[FAILSAFE] WARNING: Could not load scaler — {e}")

try:
    feature_names = pd.read_csv(
        os.path.join(DATA_DIR, "feature_names.csv")
    ).squeeze().tolist()
    print(f"[FAILSAFE] Feature names loaded: {len(feature_names)} features")
except Exception as e:
    feature_names = []
    print(f"[FAILSAFE] WARNING: Could not load feature names — {e}")

try:
    encoders = joblib.load(os.path.join(MODELS_DIR, "label_encoders.pkl"))
    print("[FAILSAFE] Label encoders loaded")
except Exception as e:
    encoders = {}
    print(f"[FAILSAFE] WARNING: Could not load encoders — {e}")


# ─────────────────────────────────────────────
# 3. Helper functions
# ─────────────────────────────────────────────

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Apply the same feature engineering from preprocessing Step 3.
    Must match EXACTLY what was done in 02_preprocessing.ipynb — any
    difference here will cause a feature mismatch error at prediction time.
    """
    df = df.copy()

    # 1. Grade trend: positive = improving, negative = declining
    if "G1" in df.columns and "G2" in df.columns:
        df["grade_trend"] = df["G2"] - df["G1"]

    # 2. Average of G1 and G2 (overall mid-semester performance)
    if "G1" in df.columns and "G2" in df.columns:
        df["avg_grade"] = (df["G1"] + df["G2"]) / 2

    # 3. Study efficiency: study time relative to absences
    #    MUST match notebook: studytime / (absences + 1)
    df["study_efficiency"] = df["studytime"] / (df["absences"] + 1)

    # 4. Social risk: combines going out and alcohol use
    df["social_risk"] = df["goout"] + df["Dalc"] + df["Walc"]

    # 5. Support score: school support + family support + paid classes
    #    This was the missing feature causing the 500 error
    df["support_score"] = df["schoolsup"] + df["famsup"] + df["paid"]

    # 6. Parental education average
    df["parent_edu"] = (df["Medu"] + df["Fedu"]) / 2

    return df


def preprocess_student(student_data: dict) -> pd.DataFrame:
    """
    Convert raw student input dict → scaled DataFrame ready for model.
    """
    df = pd.DataFrame([student_data])

    # Engineer features (same as Step 3)
    df = engineer_features(df)

    # Apply scaler if available
    if scaler is not None and feature_names:
        # Only scale columns the model was trained on
        available_cols = [c for c in feature_names if c in df.columns]
        df_scaled = df[available_cols].copy()
        df_scaled[available_cols] = scaler.transform(df_scaled[available_cols])
        return df_scaled[feature_names] if all(f in df_scaled.columns for f in feature_names) else df_scaled
    return df


def get_risk_level(prob: float) -> str:
    if prob >= 0.70:
        return "HIGH"
    elif prob >= 0.50:
        return "MODERATE"
    else:
        return "LOW"


def build_intervention_plan(shap_vals: np.ndarray, feat_names: list) -> list:
    """
    Match SHAP values to intervention rules and return ranked list.
    """
    interventions = []
    rank = 0

    # Sort features by SHAP impact (highest first)
    sorted_indices = np.argsort(shap_vals)[::-1]

    for idx in sorted_indices:
        feature = feat_names[idx]
        shap_val = float(shap_vals[idx])

        if shap_val <= 0:
            break  # Only show risk-increasing features

        if feature in INTERVENTION_RULES:
            rule = INTERVENTION_RULES[feature]
            if shap_val >= rule["threshold"]:
                rank += 1
                interventions.append(Intervention(
                    rank=rank,
                    issue=rule["message"],
                    shap_impact=round(shap_val, 4),
                    action=rule["action"]
                ))

    return interventions


# ─────────────────────────────────────────────
# 4. API Endpoints
# ─────────────────────────────────────────────

@app.get("/", tags=["Root"])
def root():
    """Welcome message."""
    return {
        "message": "FAILSAFE Student Risk Prediction API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health", response_model=HealthResponse, tags=["System"])
def health_check():
    """
    Check if the API is running and models are loaded.
    Always call this first to verify everything is working.
    """
    return HealthResponse(
        status="ok" if model is not None else "degraded",
        model_loaded=model is not None,
        explainer_loaded=explainer is not None,
        message="All systems operational" if model else "Model not loaded — check models/ folder"
    )


@app.get("/features", tags=["System"])
def get_features():
    """
    Returns the list of features the model expects.
    Useful for building frontend forms.
    """
    return {
        "feature_count": len(feature_names),
        "features": feature_names,
        "engineered_features": [
            "grade_trend", "avg_grade", "study_efficiency",
            "social_risk", "parent_edu", "absence_severity"
        ]
    }


@app.post("/predict", response_model=PredictionResponse, tags=["Prediction"])
def predict_single(student: StudentInput):
    """
    Predict academic risk for a single student.

    **Input:** All student features (grades, absences, demographics, etc.)

    **Output:**
    - Risk score and level
    - Top factors increasing/decreasing risk
    - Personalized intervention plan
    """
    if model is None:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Ensure failsafe_model.pkl is in models/ folder."
        )

    try:
        # Step 1: Convert input to dict
        student_dict = student.model_dump()

        # Step 2: Preprocess (engineer features + scale)
        X = preprocess_student(student_dict)

        # Step 3: Get prediction probability
        prob = float(model.predict_proba(X)[0][1])
        prediction = "AT-RISK" if prob >= 0.5 else "PASSING"
        risk_level = get_risk_level(prob)

        # Step 4: Compute SHAP values
        if explainer is not None:
            shap_vals = explainer.shap_values(X)[0]
        else:
            shap_vals = np.zeros(len(feature_names))

        current_feature_names = list(X.columns)

        # Step 5: Build factor lists
        shap_df = pd.DataFrame({
            "feature": current_feature_names,
            "shap": shap_vals
        }).sort_values("shap", ascending=False)

        top_risk_factors = [
            {"feature": row["feature"], "shap_impact": round(row["shap"], 4)}
            for _, row in shap_df[shap_df["shap"] > 0].head(5).iterrows()
        ]

        top_protective_factors = [
            {"feature": row["feature"], "shap_impact": round(row["shap"], 4)}
            for _, row in shap_df[shap_df["shap"] < 0].tail(5).iterrows()
        ]

        # Step 6: Build intervention plan
        interventions = build_intervention_plan(shap_vals, current_feature_names)

        return PredictionResponse(
            risk_score=round(prob, 4),
            risk_percent=f"{prob:.1%}",
            risk_level=risk_level,
            prediction=prediction,
            top_risk_factors=top_risk_factors,
            top_protective_factors=top_protective_factors,
            interventions=interventions,
            model_version="1.0.0"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.post("/predict/batch", response_model=BatchPredictionResponse, tags=["Prediction"])
def predict_batch(batch: BatchStudentInput):
    """
    Predict academic risk for a whole class at once.

    **Input:** List of students (same format as single predict)

    **Output:** Summary stats + individual predictions for every student
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded.")

    if len(batch.students) == 0:
        raise HTTPException(status_code=400, detail="No students provided.")

    if len(batch.students) > 500:
        raise HTTPException(status_code=400, detail="Maximum 500 students per batch.")

    try:
        predictions = []
        for i, student in enumerate(batch.students):
            student_dict = student.model_dump()
            X = preprocess_student(student_dict)
            prob = float(model.predict_proba(X)[0][1])
            prediction = "AT-RISK" if prob >= 0.5 else "PASSING"
            risk_level = get_risk_level(prob)

            if explainer is not None:
                shap_vals = explainer.shap_values(X)[0]
            else:
                shap_vals = np.zeros(len(feature_names))

            current_feature_names = list(X.columns)

            shap_df = pd.DataFrame({
                "feature": current_feature_names,
                "shap": shap_vals
            }).sort_values("shap", ascending=False)

            top_risk = [
                {"feature": r["feature"], "shap_impact": round(r["shap"], 4)}
                for _, r in shap_df[shap_df["shap"] > 0].head(3).iterrows()
            ]

            top_protective = [
                {"feature": r["feature"], "shap_impact": round(r["shap"], 4)}
                for _, r in shap_df[shap_df["shap"] < 0].tail(3).iterrows()
            ]

            interventions = build_intervention_plan(shap_vals, current_feature_names)

            predictions.append(PredictionResponse(
                student_id=f"student_{i}",
                risk_score=round(prob, 4),
                risk_percent=f"{prob:.1%}",
                risk_level=risk_level,
                prediction=prediction,
                top_risk_factors=top_risk,
                top_protective_factors=top_protective,
                interventions=interventions,
                model_version="1.0.0"
            ))

        at_risk_count = sum(1 for p in predictions if p.prediction == "AT-RISK")
        total = len(predictions)

        return BatchPredictionResponse(
            total_students=total,
            at_risk_count=at_risk_count,
            passing_count=total - at_risk_count,
            at_risk_percent=f"{at_risk_count / total:.1%}",
            predictions=predictions
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch prediction failed: {str(e)}")


# ─────────────────────────────────────────────
# 5. Run directly (for testing only)
# ─────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
