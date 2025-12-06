"""
Data Preparation for Memphis Housing Model

Loads raw data, performs feature engineering, and splits into train/test sets.
"""

import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import argparse
import json


def load_data(data_path: str) -> pd.DataFrame:
    """Load the raw Memphis housing data."""
    df = pd.read_csv(data_path)
    print(f"Loaded {len(df)} records from {data_path}")
    return df


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Perform feature engineering on the housing data.

    Creates derived features that may improve model performance.
    """
    df = df.copy()

    # Age of the house
    df['age'] = 2024 - df['year_built']

    # Price per sqft (for analysis, not as a feature for prediction)
    df['price_per_sqft'] = df['sale_price'] / df['sqft']

    # Rooms ratio
    df['bed_bath_ratio'] = df['beds'] / df['baths'].replace(0, 1)

    # Total rooms estimate
    df['total_rooms'] = df['beds'] + df['baths']

    # Sqft per bedroom
    df['sqft_per_bed'] = df['sqft'] / df['beds'].replace(0, 1)

    # Binary features to numeric
    df['has_pool_num'] = df['has_pool'].astype(int)
    df['renovated_num'] = df['renovated'].astype(int)
    df['has_garage'] = (df['garage_spaces'] > 0).astype(int)

    # Neighborhood quality score (combining crime and schools)
    df['neighborhood_quality'] = (10 - df['crime_index'] * 10 + df['school_rating']) / 2

    # Location score (inverse of distance to downtown, capped)
    df['location_score'] = 1 / (1 + df['distance_to_downtown'] / 10)

    return df


def encode_categoricals(df: pd.DataFrame, fit: bool = True, encoders: dict = None) -> tuple:
    """
    Encode categorical variables.

    Args:
        df: DataFrame with categorical columns
        fit: Whether to fit new encoders or use existing ones
        encoders: Dict of pre-fitted encoders (if fit=False)

    Returns:
        Tuple of (encoded DataFrame, encoders dict)
    """
    df = df.copy()

    categorical_cols = ['neighborhood', 'zip_code', 'property_type']

    if encoders is None:
        encoders = {}

    for col in categorical_cols:
        if fit:
            le = LabelEncoder()
            df[f'{col}_encoded'] = le.fit_transform(df[col].astype(str))
            encoders[col] = le
        else:
            le = encoders[col]
            # Handle unseen categories
            df[f'{col}_encoded'] = df[col].astype(str).apply(
                lambda x: le.transform([x])[0] if x in le.classes_ else -1
            )

    return df, encoders


def get_feature_columns() -> list:
    """Return the list of feature columns for the model."""
    return [
        'sqft',
        'beds',
        'baths',
        'age',
        'lot_size_acres',
        'stories',
        'garage_spaces',
        'has_pool_num',
        'renovated_num',
        'distance_to_downtown',
        'crime_index',
        'school_rating',
        'neighborhood_quality',
        'location_score',
        'bed_bath_ratio',
        'total_rooms',
        'sqft_per_bed',
        'neighborhood_encoded',
        'property_type_encoded',
    ]


def prepare_data(input_path: str, output_dir: str, test_size: float = 0.2, seed: int = 42):
    """
    Main data preparation function.

    Args:
        input_path: Path to raw data CSV
        output_dir: Directory to save processed data
        test_size: Fraction of data for testing
        seed: Random seed for reproducibility
    """
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Load data
    df = load_data(input_path)

    # Feature engineering
    print("Performing feature engineering...")
    df = engineer_features(df)

    # Encode categoricals
    print("Encoding categorical variables...")
    df, encoders = encode_categoricals(df, fit=True)

    # Get feature columns
    feature_cols = get_feature_columns()
    target_col = 'sale_price'

    # Prepare X and y
    X = df[feature_cols]
    y = df[target_col]

    # Split data
    print(f"Splitting data (test_size={test_size})...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=seed
    )

    # Save processed data
    print(f"Saving processed data to {output_dir}...")

    # Save train/test sets
    train_df = X_train.copy()
    train_df['sale_price'] = y_train
    train_df.to_csv(output_dir / 'train.csv', index=False)

    test_df = X_test.copy()
    test_df['sale_price'] = y_test
    test_df.to_csv(output_dir / 'test.csv', index=False)

    # Save feature info
    feature_info = {
        'feature_columns': feature_cols,
        'target_column': target_col,
        'encoders': {col: list(le.classes_) for col, le in encoders.items()},
        'train_size': len(X_train),
        'test_size': len(X_test),
    }

    with open(output_dir / 'feature_info.json', 'w') as f:
        json.dump(feature_info, f, indent=2)

    # Print summary
    print("\n" + "="*50)
    print("Data Preparation Complete")
    print("="*50)
    print(f"Training samples: {len(X_train)}")
    print(f"Test samples: {len(X_test)}")
    print(f"Features: {len(feature_cols)}")
    print(f"\nTarget (sale_price) statistics:")
    print(f"  Train - Mean: ${y_train.mean():,.0f}, Median: ${y_train.median():,.0f}")
    print(f"  Test  - Mean: ${y_test.mean():,.0f}, Median: ${y_test.median():,.0f}")
    print(f"\nOutput files:")
    print(f"  - {output_dir / 'train.csv'}")
    print(f"  - {output_dir / 'test.csv'}")
    print(f"  - {output_dir / 'feature_info.json'}")

    return X_train, X_test, y_train, y_test


def main():
    parser = argparse.ArgumentParser(description='Prepare Memphis housing data for training')
    parser.add_argument('--input', type=str, default='../../data/raw/memphis_housing.csv',
                        help='Path to raw data CSV')
    parser.add_argument('--output', type=str, default='../../data/processed',
                        help='Output directory for processed data')
    parser.add_argument('--test-size', type=float, default=0.2,
                        help='Test set size fraction')
    parser.add_argument('--seed', type=int, default=42,
                        help='Random seed')

    args = parser.parse_args()

    prepare_data(
        input_path=args.input,
        output_dir=args.output,
        test_size=args.test_size,
        seed=args.seed
    )


if __name__ == '__main__':
    main()
