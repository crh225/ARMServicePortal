# Memphis Housing Data (MHD) - MLOps Project

End-to-end machine learning pipeline for Memphis housing price prediction using Azure ML and the ARM Service Portal.

## Overview

This project demonstrates a complete MLOps workflow:
- **Data Generation**: Synthetic Memphis housing data based on real market characteristics
- **Model Training**: XGBoost regression with MLflow tracking
- **Model Serving**: FastAPI REST API for predictions
- **Infrastructure**: Azure ML Workspace provisioned via ARM Portal blueprints
- **CI/CD**: GitHub Actions for automated training and deployment

## Project Structure

```
MHD/
├── data/
│   ├── raw/              # Raw generated housing data
│   └── processed/        # Train/test splits and feature info
├── src/
│   ├── training/
│   │   ├── generate_data.py   # Memphis housing data generator
│   │   ├── prep_data.py       # Data preprocessing and splits
│   │   ├── train_model.py     # XGBoost training with MLflow
│   │   └── evaluate.py        # Model evaluation and reports
│   └── serving/
│       └── app.py             # FastAPI prediction service
├── models/               # Trained model artifacts
├── reports/              # Evaluation reports
├── infra/
│   ├── terraform/        # (Provisioned via ARM Portal)
│   └── aml/
│       ├── train-job.yml # Azure ML job config
│       └── conda.yml     # Training environment
├── .github/workflows/
│   ├── train.yml         # Training pipeline
│   └── deploy.yml        # Deployment pipeline
├── Dockerfile            # Inference service container
└── requirements.txt      # Python dependencies
```

## Azure Infrastructure (via ARM Portal)

Infrastructure was provisioned via ARM Portal PR #248. Current deployed resources:

| Resource | Name | Location |
|----------|------|----------|
| ML Workspace | `mlws-mhd-dev` | eastus2 |
| Resource Group | `test3-dev-rg` | eastus2 |
| Storage Account | `mlstormhd364x9k` | eastus2 |
| Container Registry | `mlacrmhd364x9k.azurecr.io` | eastus2 |
| Key Vault | `mlkvmhd364x9k` | eastus2 |
| Application Insights | `mlinsights-mhd-dev` | eastus2 |

**Azure ML Studio:** [Open Workspace](https://ml.azure.com/home?wsid=/subscriptions/f989de0f-8697-4a05-8c34-b82c941767c0/resourceGroups/test3-dev-rg/providers/Microsoft.MachineLearningServices/workspaces/mlws-mhd-dev)

### Submit Training Job

```bash
az ml job create \
  --file MHD/infra/aml/train-job.yml \
  --workspace-name mlws-mhd-dev \
  --resource-group test3-dev-rg
```


## Memphis Neighborhoods

The model covers 20 Memphis neighborhoods with varying price factors:

| Tier | Neighborhoods | Price Factor |
|------|--------------|--------------|
| $$$ | Germantown, Collierville, East Memphis | 1.8-2.2x |
| $$ | Midtown, Harbor Town, Bartlett, Cordova | 1.3-1.6x |
| $ | Whitehaven, Frayser, South Memphis | 0.5-0.7x |

## Model Features

**Input Features:**
- Square footage, bedrooms, bathrooms
- Year built, lot size, stories
- Garage spaces, pool, renovation status
- Neighborhood, property type
- Distance to downtown, crime index, school rating

**Engineered Features:**
- House age, neighborhood quality score
- Location score, bed/bath ratio
- Square feet per bedroom

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API info |
| `/health` | GET | Health check |
| `/predict` | POST | Single prediction |
| `/predict/batch` | POST | Batch predictions |
| `/model/info` | GET | Model metadata |
| `/neighborhoods` | GET | List neighborhoods |
| `/docs` | GET | OpenAPI documentation |

## CI/CD Pipelines

### Training Pipeline (`train.yml`)
- Triggers on changes to `MHD/src/training/`
- Generates data → Prepares → Trains → Evaluates
- Uploads model artifacts

### Deploy Pipeline (`deploy.yml`)
- Triggers on changes to `MHD/src/serving/`
- Builds container image
- Pushes to GitHub Container Registry
- Deploys to Azure Container Apps

## Running on Azure ML

```bash
# Login to Azure
az login

# Submit training job
az ml job create \
  --file MHD/infra/aml/train-job.yml \
  --workspace-name mlws-mhd-dev \
  --resource-group rg-mhd-dev
```

