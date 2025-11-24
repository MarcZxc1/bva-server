# File: app/utils/pandas_utils.py
"""
Purpose: Vectorized pandas operations for efficient time-series processing.
Provides reusable helpers for aggregation, rolling windows, and feature engineering.

Key functions:
- prepare_sales_dataframe: Convert list of dicts to typed DataFrame
- compute_moving_averages: Vectorized rolling window calculations
- compute_daily_sales_velocity: Aggregate sales to daily granularity per product
- detect_trend: Linear regression-based trend detection
- resample_timeseries: Aggregate to different granularities (daily/weekly/monthly)

Performance characteristics:
- All operations use pandas vectorized methods (groupby, rolling, resample)
- Complexity: O(n log n) for groupby operations, O(n * window) for rolling
- Memory: Operates on DataFrames in-place when possible to reduce copies
- Assumes input data fits in memory (validated at API layer with MAX_PAYLOAD_ROWS)
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Any, Tuple, Optional
from datetime import datetime, timedelta


def prepare_sales_dataframe(sales_records: List[Dict[str, Any]]) -> pd.DataFrame:
    """
    Convert sales records to properly-typed DataFrame with datetime index.
    
    Args:
        sales_records: List of dicts with keys: date, qty, product_id, revenue (optional)
    
    Returns:
        DataFrame with columns: [product_id, qty, revenue] and DatetimeIndex
    
    Performance: O(n) for conversion + O(n log n) for sorting
    """
    if not sales_records:
        return pd.DataFrame(columns=['product_id', 'qty', 'revenue', 'date'])
    
    df = pd.DataFrame(sales_records)
    
    # Convert date column to datetime
    df['date'] = pd.to_datetime(df['date'], errors='coerce')
    
    # Drop rows with invalid dates
    df = df.dropna(subset=['date'])
    
    # Ensure numeric types
    df['qty'] = pd.to_numeric(df['qty'], errors='coerce').fillna(0)
    if 'revenue' in df.columns:
        df['revenue'] = pd.to_numeric(df['revenue'], errors='coerce').fillna(0)
    else:
        df['revenue'] = 0.0
    
    # Sort by date for time-series operations
    df = df.sort_values('date').reset_index(drop=True)
    
    return df


def prepare_inventory_dataframe(inventory_items: List[Dict[str, Any]]) -> pd.DataFrame:
    """
    Convert inventory items to DataFrame with typed columns.
    
    Args:
        inventory_items: List of dicts with keys: product_id, sku, name, quantity, expiry_date
    
    Returns:
        DataFrame with proper types and parsed expiry dates
    
    Performance: O(n)
    """
    if not inventory_items:
        return pd.DataFrame()
    
    df = pd.DataFrame(inventory_items)
    
    # Parse expiry dates
    if 'expiry_date' in df.columns:
        df['expiry_date'] = pd.to_datetime(df['expiry_date'], errors='coerce')
    
    # Ensure quantity is numeric
    df['quantity'] = pd.to_numeric(df['quantity'], errors='coerce').fillna(0).astype(int)
    
    return df


def compute_daily_sales_velocity(
    sales_df: pd.DataFrame,
    window_days: int,
    end_date: Optional[datetime] = None
) -> pd.DataFrame:
    """
    Compute average daily sales velocity per product over a rolling window.
    
    Uses vectorized groupby and aggregation to compute mean daily sales.
    
    Args:
        sales_df: DataFrame with columns [product_id, date, qty]
        window_days: Number of days to average over
        end_date: End of analysis window (default: latest date in data)
    
    Returns:
        DataFrame with columns [product_id, avg_daily_sales, total_sales, days_with_sales]
    
    Performance: O(n log n) due to groupby, where n = number of sales records
    
    Algorithm:
    1. Filter to window_days before end_date
    2. Group by product_id and date, sum quantities (handles multiple sales same day)
    3. Compute mean across days (including zero-sale days in denominator)
    """
    if sales_df.empty:
        return pd.DataFrame(columns=['product_id', 'avg_daily_sales', 'total_sales', 'days_with_sales'])
    
    if end_date is None:
        end_date = sales_df['date'].max()
    
    start_date = end_date - timedelta(days=window_days)
    
    # Filter to window
    window_df = sales_df[(sales_df['date'] >= start_date) & (sales_df['date'] <= end_date)].copy()
    
    if window_df.empty:
        return pd.DataFrame(columns=['product_id', 'avg_daily_sales', 'total_sales', 'days_with_sales'])
    
    # Aggregate by product and date
    daily_sales = window_df.groupby(['product_id', 'date'])['qty'].sum().reset_index()
    
    # Compute statistics per product
    velocity = daily_sales.groupby('product_id').agg(
        total_sales=('qty', 'sum'),
        days_with_sales=('date', 'count')
    ).reset_index()
    
    # Average over entire window (including zero-sale days)
    velocity['avg_daily_sales'] = velocity['total_sales'] / window_days
    
    return velocity


def compute_moving_averages(
    series_df: pd.DataFrame,
    date_col: str,
    value_col: str,
    windows: List[int]
) -> pd.DataFrame:
    """
    Compute multiple rolling window averages for time-series data.
    
    Uses pandas rolling() for vectorized computation.
    
    Args:
        series_df: DataFrame with date and value columns
        date_col: Name of date column
        value_col: Name of value column
        windows: List of window sizes (e.g., [7, 30] for 7-day and 30-day MAs)
    
    Returns:
        Original DataFrame with added columns: ma_7, ma_30, etc.
    
    Performance: O(n * w) where w = max window size
    Assumes data is pre-sorted by date_col.
    """
    df = series_df.copy()
    
    # Ensure sorted by date
    df = df.sort_values(date_col).reset_index(drop=True)
    
    for window in windows:
        col_name = f'ma_{window}'
        df[col_name] = df[value_col].rolling(window=window, min_periods=1).mean()
    
    return df


def detect_trend(
    series_df: pd.DataFrame,
    date_col: str,
    value_col: str
) -> Tuple[str, float]:
    """
    Detect trend direction using simple linear regression.
    
    Fits y = mx + b where x is days since first observation.
    
    Args:
        series_df: DataFrame with date and value columns
        date_col: Date column name
        value_col: Value column name
    
    Returns:
        Tuple of (trend_label, slope) where:
            trend_label: "increasing", "decreasing", or "stable"
            slope: regression coefficient (units per day)
    
    Performance: O(n) for linear regression
    
    Classification thresholds:
    - |slope| < 0.01 * mean(value): "stable"
    - slope > 0: "increasing"
    - slope < 0: "decreasing"
    """
    if len(series_df) < 2:
        return "stable", 0.0
    
    df = series_df.sort_values(date_col).copy()
    
    # Convert dates to numeric (days since first date)
    df['days'] = (df[date_col] - df[date_col].min()).dt.days
    
    # Simple linear regression using numpy polyfit
    valid_data = df[[value_col, 'days']].dropna()
    
    if len(valid_data) < 2:
        return "stable", 0.0
    
    slope, _ = np.polyfit(valid_data['days'], valid_data[value_col], 1)
    
    # Classify trend
    mean_val = valid_data[value_col].mean()
    threshold = 0.01 * mean_val if mean_val > 0 else 0.01
    
    if abs(slope) < threshold:
        trend = "stable"
    elif slope > 0:
        trend = "increasing"
    else:
        trend = "decreasing"
    
    return trend, float(slope)


def resample_timeseries(
    series_df: pd.DataFrame,
    date_col: str,
    value_cols: List[str],
    granularity: str
) -> pd.DataFrame:
    """
    Resample time-series to different granularity (daily -> weekly/monthly).
    
    Uses pandas resample() for efficient aggregation.
    
    Args:
        series_df: DataFrame with date column
        date_col: Date column name
        value_cols: Columns to aggregate (will be summed)
        granularity: 'daily', 'weekly', or 'monthly'
    
    Returns:
        Resampled DataFrame with aggregated values
    
    Performance: O(n) where n = number of input rows
    Output rows = input_days / granularity_days
    """
    df = series_df.copy()
    
    # Set date as index
    df = df.set_index(date_col)
    
    # Map granularity to pandas frequency
    freq_map = {
        'daily': 'D',
        'weekly': 'W',
        'monthly': 'MS'  # Month start
    }
    
    freq = freq_map.get(granularity, 'D')
    
    # Resample and sum
    resampled = df[value_cols].resample(freq).sum().reset_index()
    
    return resampled


def detect_seasonality_patterns(sales_df: pd.DataFrame) -> Dict[str, Any]:
    """
    Detect basic seasonality patterns (day-of-week, monthly).
    
    Computes mean sales by day-of-week and month to identify patterns.
    
    Args:
        sales_df: DataFrame with columns [date, qty]
    
    Returns:
        Dict with keys:
            - day_of_week: {0-6: mean_sales} where 0=Monday
            - monthly: {1-12: mean_sales}
            - peak_day: Day name with highest average
            - peak_month: Month name with highest average
    
    Performance: O(n) for groupby operations
    """
    if sales_df.empty or 'date' not in sales_df.columns:
        return {}
    
    df = sales_df.copy()
    df['day_of_week'] = df['date'].dt.dayofweek
    df['month'] = df['date'].dt.month
    
    # Day of week pattern
    dow_pattern = df.groupby('day_of_week')['qty'].mean().to_dict()
    
    # Monthly pattern
    monthly_pattern = df.groupby('month')['qty'].mean().to_dict()
    
    # Identify peaks
    day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    month_names = ['', 'January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December']
    
    peak_day_idx = max(dow_pattern, key=dow_pattern.get) if dow_pattern else 0
    peak_month_idx = max(monthly_pattern, key=monthly_pattern.get) if monthly_pattern else 1
    
    return {
        'day_of_week': dow_pattern,
        'monthly': monthly_pattern,
        'peak_day': day_names[peak_day_idx],
        'peak_month': month_names[peak_month_idx]
    }


def compute_percentile_bounds(
    series: pd.Series,
    lower_percentile: float = 0.025,
    upper_percentile: float = 0.975
) -> Tuple[float, float]:
    """
    Compute percentile-based confidence bounds for predictions.
    
    Used as fallback when statistical confidence intervals unavailable.
    
    Args:
        series: Pandas Series of values
        lower_percentile: Lower bound percentile (default 2.5% for 95% CI)
        upper_percentile: Upper bound percentile (default 97.5% for 95% CI)
    
    Returns:
        Tuple of (lower_bound, upper_bound)
    
    Performance: O(n log n) due to sorting for percentile calculation
    """
    if series.empty:
        return 0.0, 0.0
    
    lower = series.quantile(lower_percentile)
    upper = series.quantile(upper_percentile)
    
    return float(lower), float(upper)
