"""
Memphis Housing Data Generator

Generates synthetic but realistic Memphis housing data for ML training.
Based on actual Memphis housing market characteristics.
"""

import pandas as pd
import numpy as np
from pathlib import Path

# Memphis neighborhoods with their characteristics
# (neighborhood, median_price_factor, avg_sqft, crime_index, school_rating)
MEMPHIS_NEIGHBORHOODS = [
    ("Downtown", 1.2, 1400, 0.7, 6),
    ("Midtown", 1.3, 1600, 0.5, 7),
    ("East Memphis", 1.8, 2200, 0.2, 9),
    ("Germantown", 2.2, 2800, 0.1, 10),
    ("Collierville", 2.0, 2600, 0.1, 9),
    ("Bartlett", 1.4, 1800, 0.2, 8),
    ("Cordova", 1.5, 2000, 0.3, 8),
    ("Whitehaven", 0.7, 1400, 0.6, 5),
    ("Frayser", 0.5, 1200, 0.8, 4),
    ("Raleigh", 0.6, 1300, 0.7, 5),
    ("Orange Mound", 0.5, 1100, 0.8, 4),
    ("Hickory Hill", 0.6, 1400, 0.6, 5),
    ("South Memphis", 0.5, 1200, 0.8, 4),
    ("North Memphis", 0.5, 1100, 0.9, 3),
    ("Berclair", 0.8, 1500, 0.5, 6),
    ("Cooper-Young", 1.4, 1500, 0.4, 7),
    ("Harbor Town", 1.6, 1800, 0.3, 8),
    ("Mud Island", 1.7, 1700, 0.2, 8),
    ("High Point Terrace", 1.5, 1900, 0.3, 8),
    ("Parkway Village", 0.7, 1400, 0.5, 6),
]

# Memphis ZIP codes by general area
MEMPHIS_ZIPS = {
    "Downtown": ["38103", "38105"],
    "Midtown": ["38104", "38112"],
    "East Memphis": ["38117", "38119", "38120"],
    "Germantown": ["38138", "38139"],
    "Collierville": ["38017"],
    "Bartlett": ["38133", "38134", "38135"],
    "Cordova": ["38016", "38018"],
    "Whitehaven": ["38109", "38116"],
    "Frayser": ["38127"],
    "Raleigh": ["38128"],
    "Orange Mound": ["38114"],
    "Hickory Hill": ["38115", "38118"],
    "South Memphis": ["38106", "38126"],
    "North Memphis": ["38107", "38108"],
    "Berclair": ["38122"],
    "Cooper-Young": ["38104"],
    "Harbor Town": ["38103"],
    "Mud Island": ["38103"],
    "High Point Terrace": ["38111"],
    "Parkway Village": ["38118"],
}


def generate_memphis_housing_data(n_samples: int = 5000, seed: int = 42) -> pd.DataFrame:
    """
    Generate synthetic Memphis housing data.

    Args:
        n_samples: Number of housing records to generate
        seed: Random seed for reproducibility

    Returns:
        DataFrame with Memphis housing data
    """
    np.random.seed(seed)

    # Base median price for Memphis (realistic for 2024)
    base_median_price = 180000

    records = []

    for _ in range(n_samples):
        # Pick a random neighborhood
        neighborhood_idx = np.random.randint(0, len(MEMPHIS_NEIGHBORHOODS))
        neighborhood, price_factor, avg_sqft, crime_idx, school_rating = MEMPHIS_NEIGHBORHOODS[neighborhood_idx]

        # Generate house characteristics
        sqft = int(np.random.normal(avg_sqft, avg_sqft * 0.25))
        sqft = max(600, min(sqft, 6000))  # Clamp to realistic range

        # Bedrooms based on sqft
        if sqft < 1000:
            beds = np.random.choice([1, 2], p=[0.6, 0.4])
        elif sqft < 1500:
            beds = np.random.choice([2, 3], p=[0.5, 0.5])
        elif sqft < 2500:
            beds = np.random.choice([3, 4], p=[0.6, 0.4])
        else:
            beds = np.random.choice([4, 5, 6], p=[0.5, 0.35, 0.15])

        # Bathrooms based on bedrooms
        baths = max(1, beds - np.random.randint(0, 2))
        baths = min(baths, beds + 1)
        # Add half baths sometimes
        if np.random.random() > 0.6:
            baths += 0.5

        # Year built - Memphis has lots of older homes
        # Probabilities: 30% (1920-1949), 30% (1950-1969), 20% (1970-1989), 12% (1990-2009), 8% (2010-2024)
        year_probs = np.concatenate([
            np.full(30, 0.30 / 30),   # 1920-1949: 30%
            np.full(20, 0.30 / 20),   # 1950-1969: 30%
            np.full(20, 0.20 / 20),   # 1970-1989: 20%
            np.full(20, 0.12 / 20),   # 1990-2009: 12%
            np.full(15, 0.08 / 15),   # 2010-2024: 8%
        ])
        year_built = int(np.random.choice(range(1920, 2025), p=year_probs))

        # Lot size (in acres)
        lot_size = np.random.exponential(0.25)
        lot_size = max(0.05, min(lot_size, 5.0))

        # Stories
        stories = np.random.choice([1, 1.5, 2, 2.5, 3], p=[0.35, 0.1, 0.45, 0.05, 0.05])

        # Garage
        has_garage = np.random.random() > 0.3
        garage_spaces = np.random.choice([1, 2, 3], p=[0.3, 0.6, 0.1]) if has_garage else 0

        # Pool (more common in wealthier areas)
        has_pool = np.random.random() > (0.95 - price_factor * 0.15)

        # Renovated recently
        renovated = np.random.random() > 0.7 if year_built < 2000 else False

        # Distance to downtown (Memphis center is ~35.1495, -90.0490)
        # Neighborhoods have different typical distances
        distance_downtown = np.random.uniform(
            1 if neighborhood in ["Downtown", "Midtown", "Cooper-Young"] else 5,
            5 if neighborhood in ["Downtown", "Midtown", "Cooper-Young"] else 25
        )

        # Calculate sale price
        # Base price per sqft varies by neighborhood
        price_per_sqft = base_median_price / avg_sqft * price_factor

        # Adjustments
        base_price = sqft * price_per_sqft

        # Age adjustment (newer = more valuable)
        age = 2024 - year_built
        age_factor = 1 - (age * 0.003)  # 0.3% decrease per year
        age_factor = max(0.6, age_factor)

        # Lot size bonus
        lot_bonus = (lot_size - 0.2) * 15000 if lot_size > 0.2 else 0

        # Garage bonus
        garage_bonus = garage_spaces * 8000

        # Pool bonus
        pool_bonus = 25000 if has_pool else 0

        # Renovation bonus
        reno_bonus = 20000 if renovated else 0

        # Calculate final price with some randomness
        sale_price = (base_price * age_factor + lot_bonus + garage_bonus + pool_bonus + reno_bonus)
        sale_price *= np.random.uniform(0.9, 1.1)  # +/- 10% variance
        sale_price = int(round(sale_price, -3))  # Round to nearest 1000
        sale_price = max(50000, sale_price)  # Minimum price floor

        # Get ZIP code
        zip_code = np.random.choice(MEMPHIS_ZIPS.get(neighborhood, ["38103"]))

        # Sale date (last 2 years)
        days_ago = np.random.randint(0, 730)
        sale_date = pd.Timestamp.now() - pd.Timedelta(days=days_ago)

        # Property type
        property_type = np.random.choice(
            ["Single Family", "Townhouse", "Condo", "Multi-Family"],
            p=[0.75, 0.12, 0.08, 0.05]
        )

        records.append({
            "sale_price": sale_price,
            "sqft": sqft,
            "beds": beds,
            "baths": baths,
            "year_built": year_built,
            "lot_size_acres": round(lot_size, 3),
            "stories": stories,
            "garage_spaces": garage_spaces,
            "has_pool": has_pool,
            "renovated": renovated,
            "neighborhood": neighborhood,
            "zip_code": zip_code,
            "distance_to_downtown": round(distance_downtown, 2),
            "crime_index": crime_idx,
            "school_rating": school_rating,
            "property_type": property_type,
            "sale_date": sale_date.strftime("%Y-%m-%d"),
            "city": "Memphis",
            "state": "TN",
        })

    df = pd.DataFrame(records)
    return df


def main():
    """Generate and save Memphis housing data."""
    print("Generating Memphis Housing Data...")

    # Generate 5000 records
    df = generate_memphis_housing_data(n_samples=5000, seed=42)

    # Save to data/raw directory
    output_dir = Path(__file__).parent.parent.parent / "data" / "raw"
    output_dir.mkdir(parents=True, exist_ok=True)

    output_path = output_dir / "memphis_housing.csv"
    df.to_csv(output_path, index=False)

    print(f"Generated {len(df)} records")
    print(f"Saved to {output_path}")
    print("\nData Summary:")
    print(f"  Price range: ${df['sale_price'].min():,} - ${df['sale_price'].max():,}")
    print(f"  Median price: ${df['sale_price'].median():,.0f}")
    print(f"  Avg sqft: {df['sqft'].mean():.0f}")
    print(f"  Neighborhoods: {df['neighborhood'].nunique()}")
    print("\nPrice by neighborhood (median):")
    print(df.groupby('neighborhood')['sale_price'].median().sort_values(ascending=False).head(10))


if __name__ == "__main__":
    main()
