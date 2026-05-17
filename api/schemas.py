"""
FAILSAFE API — schemas.py
Defines the shape of data coming IN and going OUT of the API.
Think of these as contracts: the API will reject anything that doesn't match.
"""

from pydantic import BaseModel, Field
from typing import List, Optional


# ─────────────────────────────────────────────
# INPUT — what the frontend sends us
# ─────────────────────────────────────────────

class StudentInput(BaseModel):
    """
    All the features we collected about a student.
    Every field matches a column in the processed dataset.
    """

    # Original dataset features
    school: int = Field(..., ge=0, le=1, description="School: 0=GP, 1=MS")
    sex: int = Field(..., ge=0, le=1, description="Sex: 0=F, 1=M")
    age: int = Field(..., ge=15, le=22, description="Student age")
    address: int = Field(..., ge=0, le=1, description="Address: 0=Rural, 1=Urban")
    famsize: int = Field(..., ge=0, le=1, description="Family size: 0=LE3, 1=GT3")
    Pstatus: int = Field(..., ge=0, le=1, description="Parent status: 0=Apart, 1=Together")
    Medu: int = Field(..., ge=0, le=4, description="Mother education (0-4)")
    Fedu: int = Field(..., ge=0, le=4, description="Father education (0-4)")
    Mjob: int = Field(..., ge=0, le=4, description="Mother job (encoded)")
    Fjob: int = Field(..., ge=0, le=4, description="Father job (encoded)")
    reason: int = Field(..., ge=0, le=3, description="Reason for school choice (encoded)")
    guardian: int = Field(..., ge=0, le=2, description="Guardian (encoded)")
    traveltime: int = Field(..., ge=1, le=4, description="Travel time (1-4)")
    studytime: int = Field(..., ge=1, le=4, description="Weekly study time (1-4)")
    failures: int = Field(..., ge=0, le=3, description="Past class failures (0-3)")
    schoolsup: int = Field(..., ge=0, le=1, description="Extra school support: 0=No, 1=Yes")
    famsup: int = Field(..., ge=0, le=1, description="Family support: 0=No, 1=Yes")
    paid: int = Field(..., ge=0, le=1, description="Extra paid classes: 0=No, 1=Yes")
    activities: int = Field(..., ge=0, le=1, description="Extracurricular: 0=No, 1=Yes")
    nursery: int = Field(..., ge=0, le=1, description="Attended nursery: 0=No, 1=Yes")
    higher: int = Field(..., ge=0, le=1, description="Wants higher education: 0=No, 1=Yes")
    internet: int = Field(..., ge=0, le=1, description="Internet at home: 0=No, 1=Yes")
    romantic: int = Field(..., ge=0, le=1, description="Romantic relationship: 0=No, 1=Yes")
    famrel: int = Field(..., ge=1, le=5, description="Family relationship quality (1-5)")
    freetime: int = Field(..., ge=1, le=5, description="Free time after school (1-5)")
    goout: int = Field(..., ge=1, le=5, description="Going out with friends (1-5)")
    Dalc: int = Field(..., ge=1, le=5, description="Workday alcohol consumption (1-5)")
    Walc: int = Field(..., ge=1, le=5, description="Weekend alcohol consumption (1-5)")
    health: int = Field(..., ge=1, le=5, description="Current health status (1-5)")
    absences: int = Field(..., ge=0, le=93, description="Number of absences")
    G1: float = Field(..., ge=0, le=20, description="Period 1 grade (0-20)")
    G2: float = Field(..., ge=0, le=20, description="Period 2 grade (0-20)")
    subject: int = Field(..., ge=0, le=1, description="Subject: 0=math, 1=portuguese")

    class Config:
        json_schema_extra = {
            "example": {
                "school": 0, "sex": 0, "age": 17, "address": 1,
                "famsize": 1, "Pstatus": 1, "Medu": 2, "Fedu": 1,
                "Mjob": 2, "Fjob": 0, "reason": 1, "guardian": 0,
                "traveltime": 2, "studytime": 1, "failures": 2,
                "schoolsup": 0, "famsup": 0, "paid": 0, "activities": 0,
                "nursery": 1, "higher": 0, "internet": 1, "romantic": 0,
                "famrel": 3, "freetime": 4, "goout": 4, "Dalc": 2,
                "Walc": 3, "health": 3, "absences": 12,
                "G1": 5.0, "G2": 4.0, "subject": 0
            }
        }


# ─────────────────────────────────────────────
# OUTPUT — what the API sends back
# ─────────────────────────────────────────────

class Intervention(BaseModel):
    """A single intervention recommendation."""
    rank: int
    issue: str
    shap_impact: float
    action: str


class PredictionResponse(BaseModel):
    """Full prediction result returned to the frontend."""
    student_id: Optional[str] = None
    risk_score: float = Field(..., description="Probability of being at-risk (0.0–1.0)")
    risk_percent: str = Field(..., description="e.g. '87.3%'")
    risk_level: str = Field(..., description="HIGH / MODERATE / LOW")
    prediction: str = Field(..., description="AT-RISK or PASSING")
    top_risk_factors: List[dict] = Field(..., description="Top SHAP features increasing risk")
    top_protective_factors: List[dict] = Field(..., description="Top SHAP features decreasing risk")
    interventions: List[Intervention] = Field(..., description="Recommended actions")
    model_version: str = "1.0.0"


class BatchStudentInput(BaseModel):
    """For uploading a CSV of multiple students at once."""
    students: List[StudentInput]


class BatchPredictionResponse(BaseModel):
    """Results for a whole class."""
    total_students: int
    at_risk_count: int
    passing_count: int
    at_risk_percent: str
    predictions: List[PredictionResponse]


class HealthResponse(BaseModel):
    """API health check response."""
    status: str
    model_loaded: bool
    explainer_loaded: bool
    message: str
