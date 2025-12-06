"""
Model Evaluation for Memphis Housing Price Prediction

Comprehensive evaluation of the trained model including:
- Performance metrics
- Error analysis
- Predictions by segment
"""

import pandas as pd
import numpy as np
from pathlib import Path
import argparse
import json
import joblib
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score


def load_model_and_data(model_dir: str, data_dir: str) -> tuple:
    """Load trained model and test data."""
    model_dir = Path(model_dir)
    data_dir = Path(data_dir)

    # Load model
    model = joblib.load(model_dir / 'model.joblib')

    # Load test data
    test_df = pd.read_csv(data_dir / 'test.csv')

    # Load feature info
    with open(data_dir / 'feature_info.json', 'r') as f:
        feature_info = json.load(f)

    feature_cols = feature_info['feature_columns']
    target_col = feature_info['target_column']

    X_test = test_df[feature_cols]
    y_test = test_df[target_col]

    return model, X_test, y_test, test_df, feature_cols


def calculate_metrics(y_true, y_pred) -> dict:
    """Calculate comprehensive regression metrics."""
    metrics = {
        'rmse': np.sqrt(mean_squared_error(y_true, y_pred)),
        'mae': mean_absolute_error(y_true, y_pred),
        'r2': r2_score(y_true, y_pred),
        'mape': np.mean(np.abs((y_true - y_pred) / y_true)) * 100,
        'median_ae': np.median(np.abs(y_true - y_pred)),
        'max_error': np.max(np.abs(y_true - y_pred)),
    }

    # Percentage of predictions within X% of actual
    pct_errors = np.abs((y_true - y_pred) / y_true) * 100
    metrics['within_5pct'] = (pct_errors <= 5).mean() * 100
    metrics['within_10pct'] = (pct_errors <= 10).mean() * 100
    metrics['within_20pct'] = (pct_errors <= 20).mean() * 100

    return metrics


def analyze_by_price_range(y_true, y_pred) -> pd.DataFrame:
    """Analyze model performance by price range."""
    df = pd.DataFrame({
        'actual': y_true,
        'predicted': y_pred,
        'error': y_pred - y_true,
        'abs_error': np.abs(y_pred - y_true),
        'pct_error': np.abs(y_pred - y_true) / y_true * 100
    })

    # Define price ranges
    bins = [0, 100000, 200000, 300000, 500000, float('inf')]
    labels = ['<$100K', '$100K-$200K', '$200K-$300K', '$300K-$500K', '>$500K']
    df['price_range'] = pd.cut(df['actual'], bins=bins, labels=labels)

    # Aggregate by price range
    summary = df.groupby('price_range', observed=True).agg({
        'actual': ['count', 'mean'],
        'abs_error': ['mean', 'median'],
        'pct_error': ['mean', 'median']
    }).round(2)

    summary.columns = ['count', 'avg_price', 'mae', 'median_ae', 'mape', 'median_pct_error']

    return summary


def analyze_errors(y_true, y_pred, threshold_pct: float = 25) -> dict:
    """Analyze prediction errors."""
    errors = y_pred - y_true
    abs_errors = np.abs(errors)
    pct_errors = abs_errors / y_true * 100

    analysis = {
        'mean_error': np.mean(errors),  # Bias indicator
        'std_error': np.std(errors),
        'skew': pd.Series(errors).skew(),
        'overpredict_rate': (errors > 0).mean() * 100,
        'underpredict_rate': (errors < 0).mean() * 100,
        'large_error_rate': (pct_errors > threshold_pct).mean() * 100,
    }

    # Find worst predictions
    worst_idx = np.argsort(pct_errors)[-5:][::-1]
    analysis['worst_predictions'] = [
        {
            'actual': float(y_true.iloc[i]),
            'predicted': float(y_pred[i]),
            'pct_error': float(pct_errors.iloc[i])
        }
        for i in worst_idx
    ]

    return analysis


def generate_evaluation_report(
    model_dir: str,
    data_dir: str,
    output_dir: str = None
) -> dict:
    """
    Generate comprehensive evaluation report.

    Args:
        model_dir: Directory containing trained model
        data_dir: Directory containing processed test data
        output_dir: Optional directory to save report

    Returns:
        Dictionary with evaluation results
    """
    # Load model and data
    model, X_test, y_test, test_df, feature_cols = load_model_and_data(model_dir, data_dir)

    print("="*60)
    print("Memphis Housing Price Model - Evaluation Report")
    print("="*60)

    # Make predictions
    y_pred = model.predict(X_test)

    # Calculate metrics
    metrics = calculate_metrics(y_test, y_pred)

    print("\n1. OVERALL PERFORMANCE")
    print("-"*40)
    print(f"  RMSE:         ${metrics['rmse']:,.0f}")
    print(f"  MAE:          ${metrics['mae']:,.0f}")
    print(f"  Median AE:    ${metrics['median_ae']:,.0f}")
    print(f"  R² Score:     {metrics['r2']:.4f}")
    print(f"  MAPE:         {metrics['mape']:.2f}%")
    print(f"  Max Error:    ${metrics['max_error']:,.0f}")

    print("\n  Prediction Accuracy:")
    print(f"    Within 5%:  {metrics['within_5pct']:.1f}%")
    print(f"    Within 10%: {metrics['within_10pct']:.1f}%")
    print(f"    Within 20%: {metrics['within_20pct']:.1f}%")

    # Analyze by price range
    print("\n2. PERFORMANCE BY PRICE RANGE")
    print("-"*40)
    price_analysis = analyze_by_price_range(y_test, y_pred)
    print(price_analysis.to_string())

    # Error analysis
    print("\n3. ERROR ANALYSIS")
    print("-"*40)
    error_analysis = analyze_errors(y_test, y_pred)
    print(f"  Mean Error (Bias): ${error_analysis['mean_error']:,.0f}")
    print(f"  Std of Errors:     ${error_analysis['std_error']:,.0f}")
    print(f"  Overpredict Rate:  {error_analysis['overpredict_rate']:.1f}%")
    print(f"  Underpredict Rate: {error_analysis['underpredict_rate']:.1f}%")
    print(f"  Large Errors (>25%): {error_analysis['large_error_rate']:.1f}%")

    print("\n  Worst Predictions:")
    for i, wp in enumerate(error_analysis['worst_predictions'][:3], 1):
        print(f"    {i}. Actual: ${wp['actual']:,.0f}, Predicted: ${wp['predicted']:,.0f} "
              f"(Error: {wp['pct_error']:.1f}%)")

    # Feature importance
    print("\n4. FEATURE IMPORTANCE")
    print("-"*40)
    importance = model.feature_importances_
    importance_df = pd.DataFrame({
        'feature': feature_cols,
        'importance': importance
    }).sort_values('importance', ascending=False)

    for _, row in importance_df.head(10).iterrows():
        bar = "█" * int(row['importance'] * 50)
        print(f"  {row['feature']:<25} {row['importance']:.4f} {bar}")

    # Compile report
    report = {
        'metrics': metrics,
        'price_range_analysis': price_analysis.to_dict(),
        'error_analysis': error_analysis,
        'feature_importance': importance_df.to_dict('records'),
        'test_samples': len(y_test),
    }

    # Save report if output directory specified
    if output_dir:
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        with open(output_dir / 'evaluation_report.json', 'w') as f:
            # Convert numpy types for JSON serialization
            def convert(o):
                if isinstance(o, np.integer):
                    return int(o)
                if isinstance(o, np.floating):
                    return float(o)
                if isinstance(o, np.ndarray):
                    return o.tolist()
                return o

            json.dump(report, f, indent=2, default=convert)

        # Save predictions
        predictions_df = pd.DataFrame({
            'actual': y_test,
            'predicted': y_pred,
            'error': y_pred - y_test,
            'pct_error': np.abs(y_pred - y_test) / y_test * 100
        })
        predictions_df.to_csv(output_dir / 'predictions.csv', index=False)

        print(f"\nReports saved to {output_dir}")

    print("\n" + "="*60)

    return report


def main():
    parser = argparse.ArgumentParser(description='Evaluate Memphis housing price model')
    parser.add_argument('--model-dir', type=str, default='../../models',
                        help='Directory containing trained model')
    parser.add_argument('--data-dir', type=str, default='../../data/processed',
                        help='Directory with processed test data')
    parser.add_argument('--output-dir', type=str, default='../../reports',
                        help='Output directory for evaluation report')

    args = parser.parse_args()

    generate_evaluation_report(
        model_dir=args.model_dir,
        data_dir=args.data_dir,
        output_dir=args.output_dir
    )


if __name__ == '__main__':
    main()
