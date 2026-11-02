-- =========================================================================
-- AI-Powered Insurance Fraud Detection System - PostgreSQL DDL Schema
-- Production Database Definition with Indexes, Constraints, & Audit Trail
-- =========================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table (Role-Based Access Control)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'Fraud Investigator',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    customer_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    age INTEGER NOT NULL CHECK (age >= 18 AND age <= 120),
    annual_income NUMERIC(14, 2) NOT NULL CHECK (annual_income >= 0),
    credit_score INTEGER NOT NULL CHECK (credit_score >= 300 AND credit_score <= 850),
    email VARCHAR(100),
    phone VARCHAR(30),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customers_customer_id ON customers(customer_id);

-- 3. Insurance Policies Table
CREATE TABLE IF NOT EXISTS insurance_policies (
    id SERIAL PRIMARY KEY,
    policy_id VARCHAR(50) UNIQUE NOT NULL,
    policy_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id VARCHAR(50) NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
    insurance_type VARCHAR(30) NOT NULL CHECK (insurance_type IN ('Auto', 'Property', 'Health', 'Life')),
    coverage_limit NUMERIC(14, 2) NOT NULL CHECK (coverage_limit > 0),
    deductible NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    premium_amount NUMERIC(14, 2) NOT NULL CHECK (premium_amount >= 0),
    start_date VARCHAR(30) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_policies_number ON insurance_policies(policy_number);
CREATE INDEX IF NOT EXISTS idx_policies_customer ON insurance_policies(customer_id);
CREATE INDEX IF NOT EXISTS idx_policies_type ON insurance_policies(insurance_type);

-- 4. Insurance Claims Table
CREATE TABLE IF NOT EXISTS insurance_claims (
    id SERIAL PRIMARY KEY,
    claim_id VARCHAR(50) UNIQUE NOT NULL,
    customer_id VARCHAR(50) NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    policy_number VARCHAR(50) NOT NULL,
    customer_age INTEGER NOT NULL,
    insurance_type VARCHAR(30) NOT NULL,
    claim_amount NUMERIC(14, 2) NOT NULL CHECK (claim_amount > 0),
    policy_start_date VARCHAR(30) NOT NULL,
    incident_date VARCHAR(30) NOT NULL,
    claim_submission_date VARCHAR(30) NOT NULL,
    incident_location VARCHAR(100) NOT NULL,
    region VARCHAR(50) NOT NULL,
    incident_type VARCHAR(100) NOT NULL,
    damage_severity VARCHAR(30) NOT NULL,
    police_report_filed VARCHAR(10) NOT NULL DEFAULT 'No',
    witness_present VARCHAR(10) NOT NULL DEFAULT 'No',
    previous_claim_history TEXT,
    number_of_previous_claims INTEGER DEFAULT 0,
    previous_claim_payouts NUMERIC(14, 2) DEFAULT 0.00,
    incident_description TEXT NOT NULL,
    supporting_documents TEXT,
    status VARCHAR(40) NOT NULL DEFAULT 'Under Review',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_claims_claim_id ON insurance_claims(claim_id);
CREATE INDEX IF NOT EXISTS idx_claims_policy_num ON insurance_claims(policy_number);
CREATE INDEX IF NOT EXISTS idx_claims_customer ON insurance_claims(customer_id);
CREATE INDEX IF NOT EXISTS idx_claims_insurance_type ON insurance_claims(insurance_type);
CREATE INDEX IF NOT EXISTS idx_claims_region ON insurance_claims(region);
CREATE INDEX IF NOT EXISTS idx_claims_status ON insurance_claims(status);

-- 5. Fraud Predictions Table
CREATE TABLE IF NOT EXISTS fraud_predictions (
    id SERIAL PRIMARY KEY,
    claim_id VARCHAR(50) UNIQUE NOT NULL REFERENCES insurance_claims(claim_id) ON DELETE CASCADE,
    risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    risk_category VARCHAR(20) NOT NULL CHECK (risk_category IN ('Low', 'Medium', 'High')),
    anomaly_score NUMERIC(6, 4) DEFAULT 0.0000,
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(20) NOT NULL,
    top_risk_indicators TEXT,
    shap_values_json TEXT,
    checklist_json TEXT,
    explanation_text TEXT,
    predicted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_predictions_claim_id ON fraud_predictions(claim_id);
CREATE INDEX IF NOT EXISTS idx_predictions_category ON fraud_predictions(risk_category);
CREATE INDEX IF NOT EXISTS idx_predictions_score ON fraud_predictions(risk_score);

-- 6. Investigations Table
CREATE TABLE IF NOT EXISTS investigations (
    id SERIAL PRIMARY KEY,
    claim_id VARCHAR(50) UNIQUE NOT NULL REFERENCES insurance_claims(claim_id) ON DELETE CASCADE,
    assigned_to_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    assigned_to_name VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'Pending Review',
    priority VARCHAR(20) NOT NULL DEFAULT 'Medium',
    outcome_reason TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_investigations_claim_id ON investigations(claim_id);
CREATE INDEX IF NOT EXISTS idx_investigations_status ON investigations(status);
CREATE INDEX IF NOT EXISTS idx_investigations_priority ON investigations(priority);
CREATE INDEX IF NOT EXISTS idx_investigations_assigned ON investigations(assigned_to_id);

-- 7. Investigation Notes Table
CREATE TABLE IF NOT EXISTS investigation_notes (
    id SERIAL PRIMARY KEY,
    investigation_id INTEGER NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    author_name VARCHAR(100) NOT NULL,
    note_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inv_notes_inv_id ON investigation_notes(investigation_id);

-- 8. Supporting Documents Table
CREATE TABLE IF NOT EXISTS supporting_documents (
    id SERIAL PRIMARY KEY,
    claim_id VARCHAR(50) NOT NULL REFERENCES insurance_claims(claim_id) ON DELETE CASCADE,
    investigation_id INTEGER REFERENCES investigations(id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    uploaded_by VARCHAR(100) NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_documents_claim ON supporting_documents(claim_id);

-- 9. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    username VARCHAR(100) NOT NULL DEFAULT 'System',
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(50),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
