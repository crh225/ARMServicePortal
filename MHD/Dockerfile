# Memphis Housing Price Prediction Service
# Multi-stage build for optimized image size

FROM python:3.11-slim as builder

WORKDIR /build

# Install build dependencies
RUN pip install --no-cache-dir --upgrade pip

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip wheel --no-cache-dir --wheel-dir /build/wheels -r requirements.txt

# Production image
FROM python:3.11-slim

WORKDIR /app

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash appuser

# Copy wheels from builder
COPY --from=builder /build/wheels /wheels
RUN pip install --no-cache-dir /wheels/* && rm -rf /wheels

# Copy application code
COPY src/serving/ /app/src/serving/
COPY models/ /app/models/
COPY data/processed/feature_info.json /app/data/processed/feature_info.json

# Set environment variables
ENV MODEL_PATH=/app/models/model.joblib
ENV PYTHONPATH=/app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["uvicorn", "src.serving.app:app", "--host", "0.0.0.0", "--port", "8000"]
