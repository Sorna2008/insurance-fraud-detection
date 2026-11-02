# Multi-stage Dockerfile for AI-Powered Insurance Fraud Detection System
# Stage 1: Build Frontend React Application
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Python Backend & ML Inference Runtime
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY backend/ ./backend/
COPY ml/ ./ml/
COPY dataset/ ./dataset/
COPY models/ ./models/

# Copy built frontend assets to static directory
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Ensure upload directory exists
RUN mkdir -p /app/backend/app/uploads

EXPOSE 8000

ENV PYTHONUNBUFFERED=1
ENV DATABASE_URL=sqlite:///./fraud_detection.db

CMD ["python", "-m", "uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
