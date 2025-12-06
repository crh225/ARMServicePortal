"""
Model Training for Memphis Housing Price Prediction

Trains an XGBoost model with MLflow tracking.
"""

import pandas as pd
import numpy as np
from pathlib import Path
import argparse
import json
import joblib
import xgboost as xgb
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

# MLflow for experiment tracking
try:
    import mlflow
    import mlflow.xgboost
    MLFLOW_AVAILABLE = True
except ImportError:
    MLFLOW_AVAILABLE = False
    print("MLflow not available - training will proceed without experiment tracking")


def load_training_data(data_dir: str) -> tuple:
    """Load prepared training data."""
    data_dir = Path(data_dir)

    train_df = pd.read_csv(data_dir / 'train.csv')
    test_df = pd.read_csv(data_dir / 'test.csv')

    with open(data_dir / 'feature_info.json', 'r') as f:
        feature_info = json.load(f)

    feature_cols = feature_info['feature_columns']
    target_col = feature_info['target_column']

    X_train = train_df[feature_cols]
    y_train = train_df[target_col]
    X_test = test_df[feature_cols]
    y_test = test_df[target_col]

    print(f"Loaded training data: {len(X_train)} train, {len(X_test)} test samples")

    return X_train, X_test, y_train, y_test, feature_cols


def train_xgboost(X_train, y_train, X_test, y_test, params: dict = None) -> tuple:
    """
    Train XGBoost model.

    Args:
        X_train, y_train: Training data
        X_test, y_test: Test data for early stopping
        params: XGBoost hyperparameters

    Returns:
        Trained model and evaluation metrics
    """
    if params is None:
        params = {
            'objective': 'reg:squarederror',
            'max_depth': 6,
            'learning_rate': 0.1,
            'n_estimators': 200,
            'min_child_weight': 3,
            'subsample': 0.8,
            'colsample_bytree': 0.8,
            'reg_alpha': 0.1,
            'reg_lambda': 1.0,
            'random_state': 42,
        }

    print("\nTraining XGBoost model...")
    print(f"Parameters: {params}")

    # Create and train model
    model = xgb.XGBRegressor(**params)

    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        verbose=50
    )

    # Predictions
    y_pred_train = model.predict(X_train)
    y_pred_test = model.predict(X_test)

    # Calculate metrics
    metrics = {
        'train_rmse': np.sqrt(mean_squared_error(y_train, y_pred_train)),
        'test_rmse': np.sqrt(mean_squared_error(y_test, y_pred_test)),
        'train_mae': mean_absolute_error(y_train, y_pred_train),
        'test_mae': mean_absolute_error(y_test, y_pred_test),
        'train_r2': r2_score(y_train, y_pred_train),
        'test_r2': r2_score(y_test, y_pred_test),
        'train_mape': np.mean(np.abs((y_train - y_pred_train) / y_train)) * 100,
        'test_mape': np.mean(np.abs((y_test - y_pred_test) / y_test)) * 100,
    }

    return model, metrics


def get_feature_importance(model, feature_cols: list) -> pd.DataFrame:
    """Extract and format feature importance."""
    importance = model.feature_importances_

    importance_df = pd.DataFrame({
        'feature': feature_cols,
        'importance': importance
    }).sort_values('importance', ascending=False)

    return importance_df


def save_model(model, output_dir: str, feature_cols: list, metrics: dict):
    """Save model and metadata."""
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Save model
    model_path = output_dir / 'model.joblib'
    joblib.dump(model, model_path)
    print(f"Model saved to {model_path}")

    # Save as XGBoost native format too
    xgb_path = output_dir / 'model.xgb'
    model.save_model(xgb_path)
    print(f"XGBoost model saved to {xgb_path}")

    # Save metadata
    metadata = {
        'model_type': 'XGBRegressor',
        'feature_columns': feature_cols,
        'metrics': metrics,
        'xgboost_version': xgb.__version__,
    }

    with open(output_dir / 'model_metadata.json', 'w') as f:
        json.dump(metadata, f, indent=2)

    # Save feature importance
    importance_df = get_feature_importance(model, feature_cols)
    importance_df.to_csv(output_dir / 'feature_importance.csv', index=False)

    return model_path


def train_with_mlflow(X_train, X_test, y_train, y_test, feature_cols: list,
                      output_dir: str, experiment_name: str = "memphis-housing"):
    """Train model with MLflow tracking."""

    if MLFLOW_AVAILABLE:
        mlflow.set_experiment(experiment_name)

        with mlflow.start_run():
            # Define hyperparameters
            params = {
                'objective': 'reg:squarederror',
                'max_depth': 6,
                'learning_rate': 0.1,
                'n_estimators': 200,
                'min_child_weight': 3,
                'subsample': 0.8,
                'colsample_bytree': 0.8,
                'reg_alpha': 0.1,
                'reg_lambda': 1.0,
                'random_state': 42,
            }

            # Log parameters
            mlflow.log_params(params)

            # Train model
            model, metrics = train_xgboost(X_train, y_train, X_test, y_test, params)

            # Log metrics
            mlflow.log_metrics(metrics)

            # Log model
            mlflow.xgboost.log_model(model, "model")

            # Save locally too
            model_path = save_model(model, output_dir, feature_cols, metrics)

            # Log artifacts
            mlflow.log_artifact(str(Path(output_dir) / 'feature_importance.csv'))
            mlflow.log_artifact(str(Path(output_dir) / 'model_metadata.json'))

            print(f"\nMLflow run ID: {mlflow.active_run().info.run_id}")

    else:
        # Train without MLflow
        params = {
            'objective': 'reg:squarederror',
            'max_depth': 6,
            'learning_rate': 0.1,
            'n_estimators': 200,
            'min_child_weight': 3,
            'subsample': 0.8,
            'colsample_bytree': 0.8,
            'reg_alpha': 0.1,
            'reg_lambda': 1.0,
            'random_state': 42,
        }

        model, metrics = train_xgboost(X_train, y_train, X_test, y_test, params)
        model_path = save_model(model, output_dir, feature_cols, metrics)

    return model, metrics


def main():
    parser = argparse.ArgumentParser(description='Train Memphis housing price model')
    parser.add_argument('--data-dir', type=str, default='../../data/processed',
                        help='Directory with processed data')
    parser.add_argument('--output-dir', type=str, default='../../models',
                        help='Output directory for model')
    parser.add_argument('--experiment-name', type=str, default='memphis-housing',
                        help='MLflow experiment name')

    args = parser.parse_args()

    # Load data
    X_train, X_test, y_train, y_test, feature_cols = load_training_data(args.data_dir)

    # Train model
    model, metrics = train_with_mlflow(
        X_train, X_test, y_train, y_test, feature_cols,
        output_dir=args.output_dir,
        experiment_name=args.experiment_name
    )

    # Print results
    print("\n" + "="*50)
    print("Training Complete")
    print("="*50)
    print(f"\nModel Performance:")
    print(f"  Test RMSE:  ${metrics['test_rmse']:,.0f}")
    print(f"  Test MAE:   ${metrics['test_mae']:,.0f}")
    print(f"  Test R²:    {metrics['test_r2']:.4f}")
    print(f"  Test MAPE:  {metrics['test_mape']:.2f}%")

    print(f"\nTop 5 Important Features:")
    importance_df = get_feature_importance(model, feature_cols)
    for _, row in importance_df.head(5).iterrows():
        print(f"  - {row['feature']}: {row['importance']:.4f}")


if __name__ == '__main__':
    main()
