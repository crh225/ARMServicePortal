"""
Memphis Housing Price Prediction API

FastAPI application for serving the trained XGBoost model.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
import joblib
import numpy as np
from pathlib import Path
import json
import os

# Initialize FastAPI app
app = FastAPI(
    title="Memphis Housing Price Prediction API",
    description="Predict housing prices in Memphis, TN using machine learning",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model and metadata
model = None
feature_info = None
model_metadata = None


class HousingFeatures(BaseModel):
    """Input features for price prediction."""
    sqft: int = Field(..., ge=400, le=10000, description="Square footage")
    beds: int = Field(..., ge=1, le=10, description="Number of bedrooms")
    baths: float = Field(..., ge=1, le=10, description="Number of bathrooms")
    year_built: int = Field(..., ge=1900, le=2024, description="Year built")
    lot_size_acres: float = Field(..., ge=0.01, le=10, description="Lot size in acres")
    stories: float = Field(default=1.0, ge=1, le=4, description="Number of stories")
    garage_spaces: int = Field(default=0, ge=0, le=5, description="Garage spaces")
    has_pool: bool = Field(default=False, description="Has swimming pool")
    renovated: bool = Field(default=False, description="Recently renovated")
    neighborhood: str = Field(..., description="Memphis neighborhood name")
    distance_to_downtown: float = Field(..., ge=0, le=30, description="Miles from downtown")
    crime_index: float = Field(..., ge=0, le=1, description="Crime index (0=low, 1=high)")
    school_rating: int = Field(..., ge=1, le=10, description="School rating (1-10)")
    property_type: str = Field(default="Single Family", description="Property type")

    class Config:
        json_schema_extra = {
            "example": {
                "sqft": 1800,
                "beds": 3,
                "baths": 2,
                "year_built": 1995,
                "lot_size_acres": 0.25,
                "stories": 2,
                "garage_spaces": 2,
                "has_pool": False,
                "renovated": True,
                "neighborhood": "Midtown",
                "distance_to_downtown": 3.5,
                "crime_index": 0.3,
                "school_rating": 7,
                "property_type": "Single Family"
            }
        }


class PredictionResponse(BaseModel):
    """Response with predicted price."""
    predicted_price: float
    confidence_range: dict
    features_used: dict


class BatchPredictionRequest(BaseModel):
    """Request for batch predictions."""
    properties: List[HousingFeatures]


class BatchPredictionResponse(BaseModel):
    """Response for batch predictions."""
    predictions: List[PredictionResponse]


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    model_loaded: bool
    model_version: Optional[str] = None


def load_model():
    """Load the trained model and metadata."""
    global model, feature_info, model_metadata

    # Try multiple model locations
    model_paths = [
        Path(__file__).parent.parent.parent / "models" / "model.joblib",
        Path("/app/models/model.joblib"),
        Path(os.environ.get("MODEL_PATH", "models/model.joblib")),
    ]

    for model_path in model_paths:
        if model_path.exists():
            model = joblib.load(model_path)
            print(f"Model loaded from {model_path}")

            # Load metadata
            metadata_path = model_path.parent / "model_metadata.json"
            if metadata_path.exists():
                with open(metadata_path) as f:
                    model_metadata = json.load(f)

            # Load feature info
            feature_info_path = model_path.parent.parent / "data" / "processed" / "feature_info.json"
            if feature_info_path.exists():
                with open(feature_info_path) as f:
                    feature_info = json.load(f)

            return True

    print("Warning: No model found, running in demo mode")
    return False


def engineer_features(features: HousingFeatures) -> np.ndarray:
    """Convert input features to model input format."""
    # Calculate derived features
    age = 2024 - features.year_built
    bed_bath_ratio = features.beds / max(features.baths, 1)
    total_rooms = features.beds + features.baths
    sqft_per_bed = features.sqft / max(features.beds, 1)
    has_pool_num = 1 if features.has_pool else 0
    renovated_num = 1 if features.renovated else 0
    neighborhood_quality = (10 - features.crime_index * 10 + features.school_rating) / 2
    location_score = 1 / (1 + features.distance_to_downtown / 10)

    # Encode categoricals (simple mapping for common neighborhoods)
    neighborhood_map = {
        "Downtown": 0, "Midtown": 1, "East Memphis": 2, "Germantown": 3,
        "Collierville": 4, "Bartlett": 5, "Cordova": 6, "Whitehaven": 7,
        "Frayser": 8, "Raleigh": 9, "Orange Mound": 10, "Hickory Hill": 11,
        "South Memphis": 12, "North Memphis": 13, "Berclair": 14,
        "Cooper-Young": 15, "Harbor Town": 16, "Mud Island": 17,
        "High Point Terrace": 18, "Parkway Village": 19
    }
    neighborhood_encoded = neighborhood_map.get(features.neighborhood, 0)

    property_type_map = {
        "Single Family": 0, "Townhouse": 1, "Condo": 2, "Multi-Family": 3
    }
    property_type_encoded = property_type_map.get(features.property_type, 0)

    # Build feature array in correct order
    feature_array = np.array([
        features.sqft,
        features.beds,
        features.baths,
        age,
        features.lot_size_acres,
        features.stories,
        features.garage_spaces,
        has_pool_num,
        renovated_num,
        features.distance_to_downtown,
        features.crime_index,
        features.school_rating,
        neighborhood_quality,
        location_score,
        bed_bath_ratio,
        total_rooms,
        sqft_per_bed,
        neighborhood_encoded,
        property_type_encoded,
    ]).reshape(1, -1)

    return feature_array


@app.on_event("startup")
async def startup_event():
    """Load model on startup."""
    load_model()


@app.get("/", response_model=dict)
async def root():
    """Root endpoint."""
    return {
        "message": "Memphis Housing Price Prediction API",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        model_loaded=model is not None,
        model_version=model_metadata.get("xgboost_version") if model_metadata else None
    )


@app.post("/predict", response_model=PredictionResponse)
async def predict(features: HousingFeatures):
    """Predict housing price for given features."""
    if model is None:
        # Demo mode - simple estimation
        base_price = features.sqft * 120
        predicted_price = base_price * (1 + features.school_rating * 0.05)
    else:
        # Use trained model
        X = engineer_features(features)
        predicted_price = float(model.predict(X)[0])

    # Confidence range (±10% for demo)
    confidence_range = {
        "low": round(predicted_price * 0.90, -3),
        "high": round(predicted_price * 1.10, -3),
    }

    return PredictionResponse(
        predicted_price=round(predicted_price, -3),
        confidence_range=confidence_range,
        features_used={
            "sqft": features.sqft,
            "beds": features.beds,
            "baths": features.baths,
            "neighborhood": features.neighborhood,
            "year_built": features.year_built,
        }
    )


@app.post("/predict/batch", response_model=BatchPredictionResponse)
async def predict_batch(request: BatchPredictionRequest):
    """Batch prediction endpoint."""
    predictions = []

    for property_features in request.properties:
        if model is None:
            base_price = property_features.sqft * 120
            predicted_price = base_price * (1 + property_features.school_rating * 0.05)
        else:
            X = engineer_features(property_features)
            predicted_price = float(model.predict(X)[0])

        confidence_range = {
            "low": round(predicted_price * 0.90, -3),
            "high": round(predicted_price * 1.10, -3),
        }

        predictions.append(PredictionResponse(
            predicted_price=round(predicted_price, -3),
            confidence_range=confidence_range,
            features_used={
                "sqft": property_features.sqft,
                "beds": property_features.beds,
                "neighborhood": property_features.neighborhood,
            }
        ))

    return BatchPredictionResponse(predictions=predictions)


@app.get("/model/info")
async def model_info():
    """Get model information."""
    if model_metadata is None:
        return {"status": "No model metadata available"}

    return {
        "model_type": model_metadata.get("model_type"),
        "features": model_metadata.get("feature_columns"),
        "metrics": model_metadata.get("metrics"),
        "xgboost_version": model_metadata.get("xgboost_version"),
    }


@app.get("/neighborhoods")
async def list_neighborhoods():
    """List available Memphis neighborhoods."""
    return {
        "neighborhoods": [
            "Downtown", "Midtown", "East Memphis", "Germantown", "Collierville",
            "Bartlett", "Cordova", "Whitehaven", "Frayser", "Raleigh",
            "Orange Mound", "Hickory Hill", "South Memphis", "North Memphis",
            "Berclair", "Cooper-Young", "Harbor Town", "Mud Island",
            "High Point Terrace", "Parkway Village"
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
