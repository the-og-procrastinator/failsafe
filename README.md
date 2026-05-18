# Failsafe — Student Failure Risk Prediction System

> A web-based ML system that helps faculty identify at-risk students early, understand *why* they're struggling, and auto-generate personalised intervention plans; before it's too late.

## 📌 Project Overview

**Failsafe** is a web-based machine learning system designed to identify students who may be at risk of academic failure before final examination results. Traditional methods often detect academic difficulties too late for meaningful intervention, limiting opportunities to support struggling students.

The system uses student-related factors such as attendance, assignment completion, participation, and academic performance to generate early risk predictions using an XGBoost model. To ensure transparency, SHAP-based explainability is integrated so faculty can understand the factors influencing each prediction rather than relying on black-box outputs.

Beyond prediction, Failsafe also generates personalized intervention recommendations tailored to each student’s risk profile. Through an interactive dashboard, faculty can monitor student risk patterns, review model explanations, and support timely academic interventions.

---

## 🗂️ Repository Structure

```
failsafe/
├── api/                        # FastAPI backend
│   └── main.py                 # Endpoints: /predict, /explain, /interventions, /upload
├── data/                       # Raw and processed student datasets
├── frontend/
│   └── src/                    # React application
│       ├── components/         # Dashboard, StudentCard, ShapChart, InterventionPanel
│       └── App.js
├── models/                     # Serialised model artefacts (.pkl / .json)
├── notebooks/                  # Jupyter EDA & training notebooks
│   ├── 01_eda.ipynb            # Exploratory data analysis
│   ├── 02_preprocessing.ipynb  # Feature engineering & preprocessing
│   ├── 03_model_training.ipynb # XGBoost training & evaluation
│   └── 04_shap_analysis.ipynb  # SHAP explainability analysis
├── reports/                    # Generated plots and evaluation reports
├── requirements.txt            # Python dependencies (pinned)
└── README.md
```

---

## ✨ Key Features

- **XGBoost Classifier** trained on student performance data (UCI dataset) with cross-validated hyperparameter tuning
- **Imbalanced data handling** using SMOTE (via `imbalanced-learn`) to handle the class imbalance between at-risk and non-at-risk students
- **SHAP Explainability** — global beeswarm plots for overall insights, and per-student waterfall charts for individual explanations
- **Auto-generated Intervention Plans** — tailored recommendations (extra classes, counselling, study plan) based on each student's SHAP profile
- **FastAPI Backend** with JWT authentication, CSV upload endpoint, and structured prediction responses
- **React Dashboard** with student risk overview, individual SHAP explanations, and intervention tracking
- **Faculty & HOD views** — track semester-wide trends and drill down on individual students

---

## 📦 Dataset

This project uses the **Student Performance Data Set by UCI**, available on [Kaggle](https://www.kaggle.com/datasets/uciml/student-performance-data-set).

Download the dataset and place it in the `data/` folder before running the notebooks.

**Key features used:** attendance rate, assignment submission rate, mid-semester scores, participation score, number of absences, previous academic performance, demographic features.

---

## ⚙️ Setup & Installation

### Prerequisites

- Python 3.10+
- Node.js 18+
- Git

### 1 — Clone the repository

```bash
git clone https://github.com/the-og-procrastinator/failsafe.git
cd failsafe
```

### 2 — Python environment

```bash
# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# Install all dependencies
pip install -r requirements.txt
```

### 3 — Download the dataset

Download the UCI Student Performance dataset from Kaggle and place the CSV file(s) in `data/`.

### 4 — Train the model (or use the pre-trained artefact)

```bash
jupyter lab
# Run notebooks in order: 01 → 02 → 03 → 04
```

A pre-trained model is also included in `models/` and can be used directly without retraining.

### 5 — Start the API server

```bash
cd api
uvicorn main:app --reload --port 8000
```

API docs available at `http://localhost:8000/docs`.

### 6 — Start the frontend

```bash
cd frontend
npm install
npm start
```


---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Service health check |
| `POST` | `/upload` | Upload a student CSV file for batch prediction |
| `POST` | `/predict` | Predict failure risk for a single student |
| `POST` | `/explain` | Return SHAP values for a student |
| `GET` | `/interventions/{student_id}` | Get auto-generated intervention plan |

---

## 🧪 Model Performance

| Metric | Score |
|--------|-------|
| ROC-AUC | **0.94** |
| Precision (at-risk class) | **0.88** |
| Recall (at-risk class) | **0.85** |
| F1-Score (at-risk class) | **0.865** |
| Average Precision (PR-AUC) | **0.91** |

> Evaluated on a held-out test set (20% stratified split). See `notebooks/03_model_training.ipynb` for the full confusion matrix and calibration curves.

---

## 🔍 SHAP Explainability

Failsafe uses **SHAP TreeExplainer** to generate:

- **Global explanations** — Beeswarm and bar plots showing which features most drive at-risk predictions across the student cohort
- **Local explanations** — Per-student waterfall plots shown in the dashboard, explaining exactly which factors pushed a particular student's risk score up or down

Top features identified by SHAP:
1. Attendance rate
2. Assignment submission rate
3. Mid-semester score
4. Number of absences
5. Participation score

---

## 💡 Intervention Plan Generation

For each at-risk student, the system uses their SHAP feature profile to auto-generate a targeted intervention:

| Trigger Feature | Suggested Intervention |
|----------------|------------------------|
| Low attendance | Attendance counselling; parental notification |
| Missing assignments | Academic mentor; deadline extension review |
| Low mid-semester score | Extra tutorial sessions; peer study group |
| Low participation | One-on-one faculty check-in |
| High absences | Welfare referral; student support services |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| ML Model | XGBoost 3.2, scikit-learn 1.8 |
| Explainability | SHAP 0.51 |
| Imbalanced Learning | imbalanced-learn 0.14 (SMOTE) |
| Data Processing | Pandas, NumPy |
| Visualisation | Matplotlib, Seaborn |
| Backend API | FastAPI 0.136, Uvicorn |
| Database | PostgreSQL |
| Frontend | React, HTML/CSS |
| Notebooks | Jupyter Lab 4.5 |

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

## 📄 License

This project is licensed under the MIT License.
