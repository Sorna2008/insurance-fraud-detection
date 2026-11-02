# AI-Powered Insurance Fraud Detection System (InsureGuard AI)

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg?style=flat&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0+-38B2AC.svg?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![XGBoost](https://img.shields.io/badge/XGBoost-3.4+-FF6600.svg?style=flat)](https://xgboost.readthedocs.io)
[![SHAP](https://img.shields.io/badge/SHAP-Explainable_AI-blue.svg?style=flat)](https://shap.readthedocs.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org)

> **Enterprise Fraud Surveillance, Explainable Machine Learning, and Special Investigation Unit (SIU) Workspace for Insurance Carriers.**

---

## 1. Project Objective & Core Mission

InsureGuard AI is a full-stack, enterprise-grade insurance fraud detection and explainable intelligence platform. It analyzes insurance claims across multiple lines (**Auto, Property, Health, Life**) and classifies risk into:

- **Legitimate** (Risk Score 0–30)
- **Suspicious** (Risk Score 31–69)
- **Potentially Fraudulent / High Risk** (Risk Score 70–100)

### Critical Compliance & Ethical Rule
> **Human-in-the-Loop Imperative:** The AI engine identifies behavioral risk indicators to support human investigators. It **never** automatically rejects claims solely based on machine model predictions. Final outcomes must be determined and recorded by an authorized human investigator.

---

## 2. Technology Stack

- **Frontend:** React.js, TypeScript, Tailwind CSS, Lucide Icons, Recharts, Vite
- **Backend:** Python, FastAPI, SQLAlchemy ORM, Pydantic, REST APIs, JWT Authentication
- **Machine Learning & Analytics:** Scikit-learn, XGBoost, SHAP (SHapley Additive exPlanations), Isolation Forest, Pandas, NumPy, Joblib
- **Database:** PostgreSQL (with out-of-the-box local SQLite development fallback)
- **DevOps & Security:** Docker, Docker Compose, Bcrypt password hashing, Role-Based Access Control (RBAC), Immutable Audit Logging

---

## 3. Key Modules & Functional Architecture

### A. Executive Admin Dashboard
- **8 Primary Real-Time KPIs:** Total Claims, Legitimate Claims, Suspicious Claims, High-Risk Claims, Fraud Risk %, Total Claim Amount, Estimated Potential Fraud Exposure, Pending Investigations.
- **Interactive Recharts Visualizations:**
  - Trailing 8-Month Claim Intake vs. Flagged Fraud Area Trends.
  - Risk Category Distribution Donut Chart (Low, Medium, High).
  - Fraud Rate Breakdown by Insurance Line (Auto, Property, Health, Life).
  - Regional Geographic Exposure Breakdown.
  - High-Risk Claim Alerts Live Ticker.

### B. Insurance Claim Management
- Complete claim intake, editing, and query lifecycle.
- 18+ rich fields including: Claim ID, Customer ID, Policy Number, Age, Insurance Type, Claim Amount, Policy Start Date, Claim Submission Date, Incident Date, Incident Location, Region, Prior Claim Count, Cumulative Prior Payouts, Police Report Filed, Witness Present, Damage Severity, Narrative, and Supporting Evidence.
- Multi-parameter search and live filtering by line, risk tier, and status.

### C. AI Fraud Detection Engine
- Multi-model comparative ensemble:
  - **XGBoost 3.4 (Champion Model, ROC-AUC: 0.9225)**
  - **Random Forest Ensemble (Challenger Model, ROC-AUC: 0.9187)**
  - **Logistic Regression (Linear Baseline, ROC-AUC: 0.8768)**
  - **Isolation Forest (Unsupervised Multi-Dimensional Anomaly Detector)**
- 32 engineered features capturing:
  - Inception proximity (claims within 30 days of policy start).
  - Reporting lag (delays between incident and submission).
  - Claim-to-coverage limit ratios and claim-to-income distress correlations.
  - Corroboration gaps (absence of police/fire report on major losses).

### D. Explainable AI (SHAP) & What-If Simulation Lab
- **TreeSHAP Attribution:** Quantified mathematical contribution for each feature (+risk in red, mitigating factors in green).
- **Interactive Simulator:** Tweak claim parameters (amount, delay, prior claims, police reports) to observe real-time risk trajectory changes.
- **Natural Language Risk Rationale:** Plain-language synthesis explaining why a claim was flagged.
- **Actionable Verification Checklist:** Step-by-step verification checklist for human investigators.
- **Fairness Guarantee:** Demographic attributes and geographic location alone are never treated as proof of fraud.

### E. Fraud Investigation Management (SIU Workspace)
- Dedicated investigation triage workspace.
- Multi-stage investigation status transitions:
  - *Pending Review*
  - *Under Investigation*
  - *Additional Information Required*
  - *Verified Legitimate*
  - *Confirmed Fraud*
  - *Inconclusive*
- Staff assignment, investigator notes log, supporting evidence attachment, and mandatory outcome determination recording.

### F. Advanced Analytics & Model Performance
- Stratified 20% test split evaluation metrics: Accuracy, Precision, Recall, F1-Score, and ROC-AUC.
- Interactive Receiver Operating Characteristic (ROC) curve visualizer.
- 2x2 Confusion Matrix with live False Positive Rate (FPR) and False Negative Rate (FNR) telemetry.
- Global feature importance ranking.

### G. Role-Based Access Control (RBAC) & Audit Trail
- 3 Pre-configured Enterprise Personas:
  1. **Admin** (`admin` / `admin123`): Full access, user management, global analytics.
  2. **Fraud Investigator** (`investigator` / `investigator123`): SIU workspace, note logs, records determinations.
  3. **Claims Officer** (`claimsofficer` / `officer123`): Claim intake, status tracking.
- Interactive **Role Switcher** in the top navigation bar for immediate testing without logout hassle.
- Immutable **Audit Log** tracking every prediction, login, investigation update, and file upload.

---

## 4. Synthetic Dataset Disclosure

This application includes a synthetic insurance dataset containing **12,000 realistic records** generated via `dataset/generate_synthetic_data.py`.
- **Fraud Rate:** 10.03% (realistic industry benchmark).
- **Insurance Distribution:** Auto (45%), Property (30%), Health (18%), Life (7%).
- **Notice:** All synthetic records are explicitly tagged (`is_synthetic=True`). Model performance on synthetic data is presented strictly for demonstration and design validation, and not as production accuracy on real-world claims.

---

## 5. Quickstart Guide (Run Locally in 2 Minutes)

### Prerequisites
- Python 3.10+ (Python 3.11–3.14 supported)
- Node.js 18+ & npm 9+

### Option A: Direct Local Execution (Zero-Friction Default)

#### Step 1: Start Backend (FastAPI + ML Engine + SQLite DB)
```bash
# In terminal 1:
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*The backend automatically creates all database tables and seeds 600 rich demo claims and user accounts on initial startup.*

- API Base: `http://127.0.0.1:8000`
- Swagger Documentation: `http://127.0.0.1:8000/docs`
- Health Check: `http://127.0.0.1:8000/health`

#### Step 2: Start Frontend (React + Vite)
```bash
# In terminal 2:
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 3000
```
- Frontend UI: `http://127.0.0.1:3000`

---

### Option B: Docker Compose (Full Stack with PostgreSQL)

```bash
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- FastAPI Backend: `http://localhost:8000`
- PostgreSQL 16: `localhost:5432`

---

## 6. Default Login Credentials

| Role | Username | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | Full administrative access, global KPIs, user management |
| **Fraud Investigator** | `investigator` | `investigator123` | SIU queue, evidence review, record final outcomes |
| **Claims Officer** | `claimsofficer` | `officer123` | Intake new claims, review policy details |

*(You can also use the one-click Role Switcher in the top right navbar to swap personas instantly).*

---

## 7. Machine Learning Pipeline Execution

To regenerate the 12,000 synthetic records or re-train all models:

```bash
# 1. Generate fresh 12,000 synthetic claims
python dataset/generate_synthetic_data.py

# 2. Train and evaluate all 4 algorithms (XGBoost, RF, LR, Isolation Forest)
python ml/train.py
```
Model artifacts and benchmarks will be updated in `models/`.

---

## 8. REST API Specification Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user & return JWT token |
| `GET` | `/api/auth/me` | Fetch active user profile and role |
| `GET` | `/api/claims` | List claims with pagination, search, and filtering |
| `POST` | `/api/claims` | Submit new claim (triggers real-time ML inference) |
| `GET` | `/api/claims/{id}` | Full claim details with SHAP and notes |
| `POST` | `/api/predictions/evaluate` | What-if simulation risk scoring & SHAP waterfall |
| `GET` | `/api/predictions/{id}/explain` | SHAP explainability for stored claim |
| `GET` | `/api/predictions/metrics/benchmarks`| Cross-model metrics (AUC, F1, Confusion Matrix) |
| `GET` | `/api/investigations` | SIU investigation queue filtered by status/priority |
| `PUT` | `/api/investigations/{id}` | Update status, assign investigator, record outcome |
| `POST`| `/api/investigations/{id}/notes`| Add note to investigation timeline |
| `GET` | `/api/analytics/overview` | Dashboard KPIs and monthly trend distributions |
| `GET` | `/api/analytics/audit-logs` | Retrieve system compliance audit trail |
| `POST`| `/api/documents/upload` | Securely upload supporting evidence document |

Full interactive API documentation is available at `http://127.0.0.1:8000/docs`.

---

## 9. License & Ethical Disclaimer

Distributed under the MIT License. This software is developed for decision-support and educational demonstration purposes using synthetic datasets. It must be calibrated and audited with licensed actuarial datasets before production deployment in compliance with applicable insurance laws.
