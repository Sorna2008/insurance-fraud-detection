"""
Synthetic Insurance Fraud Dataset Generator
Generates 12,000+ realistic claims with multi-factor fraud indicators,
clearly tagged as synthetic demonstration data.
"""

import os
import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# Set seed for reproducible synthetic generation
np.random.seed(42)
random.seed(42)

TOTAL_RECORDS = 12000

FIRST_NAMES = [
    "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda",
    "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica",
    "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy", "Daniel", "Lisa",
    "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra", "Donald", "Ashley",
    "Steven", "Kimberly", "Paul", "Emily", "Andrew", "Donna", "Joshua", "Michelle",
    "Kenneth", "Dorothy", "Kevin", "Carol", "Brian", "Amanda", "George", "Melissa"
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
    "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
    "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
    "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker",
    "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores"
]

REGIONS = {
    "Northeast": ["New York, NY", "Boston, MA", "Philadelphia, PA", "Newark, NJ", "Hartford, CT"],
    "Midwest": ["Chicago, IL", "Detroit, MI", "Columbus, OH", "Indianapolis, IN", "Milwaukee, WI"],
    "South": ["Atlanta, GA", "Miami, FL", "Dallas, TX", "Houston, TX", "Charlotte, NC", "Nashville, TN"],
    "West": ["Los Angeles, CA", "San Francisco, CA", "Seattle, WA", "Denver, CO", "Phoenix, AZ", "Las Vegas, NV"]
}

INSURANCE_TYPES = ["Auto", "Property", "Health", "Life"]
INSURANCE_TYPE_WEIGHTS = [0.45, 0.30, 0.18, 0.07]

INCIDENT_TYPES = {
    "Auto": ["Single Vehicle Collision", "Multi-Vehicle Collision", "Vehicle Theft", "Hit and Run", "Parked Vehicle Damage", "Vandalism"],
    "Property": ["Water Damage / Burst Pipe", "Kitchen / Electrical Fire", "Burglary & Theft", "Roof Storm Damage", "Structural Liability"],
    "Health": ["Emergency Surgery", "Specialist Inpatient Stay", "Orthopedic Rehabilitation", "Diagnostic Imaging & Labs", "Prescription Compounding"],
    "Life": ["Accidental Death Benefit", "Critical Illness Acceleration", "Terminal Illness Claim", "Disability Waiver"]
}

SEVERITIES = ["Minor", "Moderate", "Major", "Total Loss"]

def generate_records(num_records=TOTAL_RECORDS):
    base_date = datetime(2024, 1, 1)
    end_date = datetime(2026, 10, 15)
    total_days_span = (end_date - base_date).days

    records = []

    for i in range(num_records):
        claim_id = f"CLM-{10001 + i}"
        customer_id = f"CUST-{random.randint(1000, 4999)}"
        customer_name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
        customer_age = int(np.clip(np.random.normal(45, 14), 19, 82))
        annual_income = int(np.clip(np.random.lognormal(10.8, 0.6), 24000, 280000))
        credit_score = int(np.clip(np.random.normal(670, 85), 320, 850))

        insurance_type = np.random.choice(INSURANCE_TYPES, p=INSURANCE_TYPE_WEIGHTS)
        policy_id = f"POL-{random.randint(100000, 999999)}"
        policy_number = f"{insurance_type[:3].upper()}-{policy_id[4:]}"

        # Coverage limits & deductibles by type
        if insurance_type == "Auto":
            coverage_limit = random.choice([25000, 50000, 100000, 250000, 500000])
            deductible = random.choice([250, 500, 1000, 2000])
            premium_amount = round(random.uniform(900, 2800), 2)
        elif insurance_type == "Property":
            coverage_limit = random.choice([150000, 300000, 500000, 750000, 1200000])
            deductible = random.choice([1000, 2000, 2500, 5000])
            premium_amount = round(random.uniform(1200, 4200), 2)
        elif insurance_type == "Health":
            coverage_limit = random.choice([100000, 250000, 500000, 1000000])
            deductible = random.choice([500, 1500, 3000, 6000])
            premium_amount = round(random.uniform(3600, 9500), 2)
        else: # Life
            coverage_limit = random.choice([250000, 500000, 1000000, 2000000])
            deductible = 0
            premium_amount = round(random.uniform(800, 3500), 2)

        # Dates
        pol_start_offset = random.randint(0, total_days_span - 60)
        policy_start_date = base_date + timedelta(days=pol_start_offset)
        
        # Incident date happens after policy start
        inc_offset = random.randint(3, min(600, (end_date - policy_start_date).days))
        incident_date = policy_start_date + timedelta(days=inc_offset)
        
        # Policy age at incident (days)
        policy_age_days = (incident_date - policy_start_date).days

        # Region
        region = random.choice(list(REGIONS.keys()))
        incident_location = random.choice(REGIONS[region])
        incident_type = random.choice(INCIDENT_TYPES[insurance_type])
        damage_severity = random.choice(SEVERITIES)

        # Base probability of fraud ~ 13.5%
        # We synthesize realistic fraud correlation drivers
        fraud_triggers = []
        fraud_score_bias = 0.0

        # Pattern 1: Inception fraud (incident right after buying policy)
        is_quick_claim = policy_age_days <= 28
        if is_quick_claim and random.random() < 0.40:
            fraud_triggers.append("Incident occurred within 28 days of policy inception (staging pattern)")
            fraud_score_bias += 0.30

        # Pattern 2: Prior claims frequency
        num_prior_claims = int(np.random.choice([0, 1, 2, 3, 4, 5, 6], p=[0.55, 0.22, 0.12, 0.06, 0.03, 0.015, 0.005]))
        prior_payouts = round(num_prior_claims * random.uniform(2500, 18000), 2)
        if num_prior_claims >= 3:
            fraud_triggers.append(f"High prior claim frequency ({num_prior_claims} claims in last 3 years)")
            fraud_score_bias += 0.25

        # Pattern 3: Submission delay
        # Normal submissions happen within 1-10 days
        submission_delay_days = int(np.random.exponential(scale=6))
        # Fraud claims sometimes have severe delay (>35 days) or suspicious immediate 0-day same-night rush
        if random.random() < 0.08:
            submission_delay_days = random.randint(35, 90)
            fraud_triggers.append(f"Extended reporting delay ({submission_delay_days} days after incident)")
            fraud_score_bias += 0.20

        claim_submission_date = incident_date + timedelta(days=submission_delay_days)

        # Pattern 4: Claim Amount calibration
        if damage_severity == "Minor":
            base_amount = random.uniform(500, 3500)
        elif damage_severity == "Moderate":
            base_amount = random.uniform(3500, 14000)
        elif damage_severity == "Major":
            base_amount = random.uniform(14000, 48000)
        else: # Total Loss
            base_amount = random.uniform(35000, min(coverage_limit, 180000))

        # Disproportionate claim amount inflation
        is_amount_inflated = False
        if random.random() < 0.10:
            base_amount = min(coverage_limit * random.uniform(0.92, 0.99), base_amount * 2.8)
            is_amount_inflated = True
            fraud_triggers.append(f"Claim amount approaches policy maximum limit ({round(base_amount/coverage_limit*100, 1)}% of limit)")
            fraud_score_bias += 0.25

        claim_amount = round(base_amount, 2)
        claim_to_coverage_ratio = round(claim_amount / max(coverage_limit, 1), 4)
        claim_to_income_ratio = round(claim_amount / max(annual_income, 1), 4)

        # Pattern 5: Reporting anomalies (no police report on major/total loss, or no witnesses)
        police_report = "Yes"
        if damage_severity in ["Major", "Total Loss"] and insurance_type in ["Auto", "Property"]:
            if random.random() < 0.22:
                police_report = "No"
                fraud_triggers.append("Absence of official police or fire report for severe loss event")
                fraud_score_bias += 0.22
        else:
            police_report = "Yes" if random.random() < 0.70 else "No"

        witness_present = "Yes" if random.random() < 0.35 else "No"
        if witness_present == "No" and police_report == "No" and damage_severity in ["Major", "Total Loss"]:
            fraud_triggers.append("No third-party witnesses or corroborating authorities recorded")
            fraud_score_bias += 0.18

        # Pattern 6: Financial distress indicator (low credit + high claim ratio)
        if credit_score < 560 and claim_to_income_ratio > 0.40:
            fraud_triggers.append("Financial distress correlation: Low credit rating with claim exceeding 40% annual income")
            fraud_score_bias += 0.20

        # Pattern 7: Weekend / Nighttime unverified incident timing
        incident_hour = random.randint(0, 23)
        incident_weekend = incident_date.weekday() >= 5
        if incident_weekend and (incident_hour >= 23 or incident_hour <= 4) and random.random() < 0.3:
            fraud_triggers.append("Late night weekend incident with limited immediate documentation")
            fraud_score_bias += 0.12

        # Final fraud assignment logic
        fraud_prob = 1 / (1 + np.exp(-(fraud_score_bias * 3.2 - 2.1)))
        is_fraud = 1 if (np.random.random() < fraud_prob and len(fraud_triggers) >= 1) else 0

        # Continuous risk score 0 - 100
        if is_fraud == 1:
            risk_score = int(np.clip(np.random.normal(82, 10), 65, 99))
            risk_category = "High" if risk_score >= 70 else "Medium"
        else:
            # Legitimate claims may have 0-1 mild triggers (false alarms)
            if len(fraud_triggers) > 0 and random.random() < 0.35:
                risk_score = int(np.clip(np.random.normal(48, 12), 31, 68))
                risk_category = "Medium"
            else:
                fraud_triggers = [] # Clear trivial triggers for clean claims
                risk_score = int(np.clip(np.random.normal(16, 9), 2, 35))
                risk_category = "Low" if risk_score <= 30 else "Medium"

        # Investigation status
        if risk_category == "High":
            investigation_status = random.choice([
                "Pending Review", "Under Investigation", "Under Investigation", "Confirmed Fraud", "Additional Information Required"
            ])
        elif risk_category == "Medium":
            investigation_status = random.choice([
                "Pending Review", "Under Investigation", "Verified Legitimate", "Additional Information Required"
            ])
        else:
            investigation_status = "Verified Legitimate" if random.random() < 0.85 else "Pending Review"

        # Documents count
        doc_count = random.randint(1, 5) if risk_category != "High" else random.randint(0, 2)
        doc_names = []
        if doc_count >= 1:
            doc_names.append(f"{insurance_type.lower()}_incident_report.pdf")
        if doc_count >= 2:
            doc_names.append("repair_estimate_invoice.pdf")
        if doc_count >= 3:
            doc_names.append("photos_evidence_bundle.zip")
        if doc_count >= 4:
            doc_names.append("official_police_incident_log.pdf")

        # Incident description narrative
        descriptions = {
            "Auto": f"Insured vehicle involved in {incident_type.lower()} on local roadway in {incident_location}. Estimated damages categorized as {damage_severity.lower()}.",
            "Property": f"Insured premises experienced {incident_type.lower()} during recent weather/utility event in {incident_location}. Claim filed for building and contents restoration.",
            "Health": f"Emergency admission for {incident_type.lower()} requiring specialist treatment and inpatient recovery in {incident_location}.",
            "Life": f"Claim filed for policy benefits regarding {incident_type.lower()} with attending physician verification documentation."
        }
        incident_description = descriptions[insurance_type]

        records.append({
            "claim_id": claim_id,
            "customer_id": customer_id,
            "customer_name": customer_name,
            "customer_age": customer_age,
            "annual_income": annual_income,
            "credit_score": credit_score,
            "policy_id": policy_id,
            "policy_number": policy_number,
            "insurance_type": insurance_type,
            "coverage_limit": coverage_limit,
            "deductible": deductible,
            "premium_amount": premium_amount,
            "policy_start_date": policy_start_date.strftime("%Y-%m-%d"),
            "incident_date": incident_date.strftime("%Y-%m-%d"),
            "claim_submission_date": claim_submission_date.strftime("%Y-%m-%d"),
            "policy_age_days": policy_age_days,
            "submission_delay_days": submission_delay_days,
            "claim_amount": claim_amount,
            "claim_to_coverage_ratio": claim_to_coverage_ratio,
            "claim_to_income_ratio": claim_to_income_ratio,
            "incident_location": incident_location,
            "region": region,
            "incident_type": incident_type,
            "damage_severity": damage_severity,
            "police_report_filed": police_report,
            "witness_present": witness_present,
            "incident_hour": incident_hour,
            "incident_weekend": 1 if incident_weekend else 0,
            "number_of_previous_claims": num_prior_claims,
            "previous_claim_payouts": prior_payouts,
            "incident_description": incident_description,
            "supporting_documents_count": doc_count,
            "supporting_documents": ";".join(doc_names),
            "fraud_risk_score": risk_score,
            "fraud_risk_category": risk_category,
            "investigation_status": investigation_status,
            "fraud_indicators": "; ".join(fraud_triggers) if fraud_triggers else "No anomalous risk indicators detected",
            "is_fraud": is_fraud,
            "is_synthetic": True
        })

    df = pd.DataFrame(records)
    return df

if __name__ == "__main__":
    output_dir = os.path.dirname(os.path.abspath(__file__))
    output_csv = os.path.join(output_dir, "synthetic_claims_12k.csv")
    print(f"Generating {TOTAL_RECORDS} synthetic insurance claims...")
    df = generate_records(TOTAL_RECORDS)
    df.to_csv(output_csv, index=False)
    print(f"Generated {len(df)} records. Saved to: {output_csv}")
    print(f"Fraud distribution:\n{df['is_fraud'].value_counts(normalize=True)}")
    print(f"Risk categories:\n{df['fraud_risk_category'].value_counts()}")
    print(f"Insurance types:\n{df['insurance_type'].value_counts()}")
