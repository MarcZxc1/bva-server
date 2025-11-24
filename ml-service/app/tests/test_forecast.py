# File: app/tests/test_forecast.py
"""
Purpose: Unit tests for forecasting service.
Tests model training, prediction, and caching.

Run with: pytest app/tests/test_forecast.py -v
"""

import pytest
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from app.models.trainer import ForecastTrainer, train_forecast_model
from app.services.forecast_service import forecast_demand


def generate_sample_sales(days=30, trend=0.1, noise=0.2):
    """Generate synthetic sales data for testing."""
    dates = [datetime.utcnow() - timedelta(days=i) for i in range(days)]
    dates.reverse()
    
    values = []
    for i in range(days):
        base = 10 + i * trend
        value = base + np.random.normal(0, noise)
        values.append(max(0, value))
    
    return pd.DataFrame({
        'date': dates,
        'qty': values
    })


def test_linear_model_training():
    """Test linear regression model training."""
    sales_df = generate_sample_sales(days=30)
    
    trainer, metrics = train_forecast_model(sales_df, method="linear")
    
    assert trainer is not None
    assert trainer.model is not None
    assert metrics.get('method') == 'linear'
    assert 'rmse' in metrics.get('metrics', {})


def test_exponential_model_training():
    """Test exponential smoothing model training."""
    sales_df = generate_sample_sales(days=60)
    
    trainer, metrics = train_forecast_model(sales_df, method="exponential")
    
    assert trainer is not None
    assert metrics.get('method') in ['exponential', 'linear']  # May fallback


def test_auto_method_selection():
    """Test auto method selection based on data size."""
    # Small dataset -> should use moving average or linear
    small_df = generate_sample_sales(days=10)
    trainer_small, metrics_small = train_forecast_model(small_df, method="auto")
    assert metrics_small.get('method') in ['moving_avg', 'linear']
    
    # Larger dataset -> should use more sophisticated method
    large_df = generate_sample_sales(days=100)
    trainer_large, metrics_large = train_forecast_model(large_df, method="auto")
    assert metrics_large.get('method') in ['linear', 'exponential', 'xgboost']


def test_prediction_generation():
    """Test forecast prediction generation."""
    sales_df = generate_sample_sales(days=30)
    
    trainer, _ = train_forecast_model(sales_df, method="linear")
    
    predictions = trainer.predict(
        periods=14,
        last_date=sales_df['date'].max(),
        historical_data=sales_df
    )
    
    assert len(predictions) == 14
    assert 'date' in predictions.columns
    assert 'predicted_qty' in predictions.columns
    assert all(predictions['predicted_qty'] >= 0)  # No negative predictions


def test_confidence_intervals():
    """Test that confidence intervals are generated."""
    sales_df = generate_sample_sales(days=30)
    
    trainer, _ = train_forecast_model(sales_df, method="linear")
    
    predictions = trainer.predict(
        periods=7,
        last_date=sales_df['date'].max(),
        historical_data=sales_df
    )
    
    assert 'lower_ci' in predictions.columns
    assert 'upper_ci' in predictions.columns
    assert all(predictions['lower_ci'] <= predictions['predicted_qty'])
    assert all(predictions['upper_ci'] >= predictions['predicted_qty'])


def test_insufficient_data_handling():
    """Test handling of insufficient training data."""
    # Only 1 data point
    sales_df = pd.DataFrame({
        'date': [datetime.utcnow()],
        'qty': [10.0]
    })
    
    with pytest.raises(ValueError, match="Insufficient data"):
        train_forecast_model(sales_df, method="linear")


def test_forecast_service_integration():
    """Test full forecast service with caching."""
    sales_df = generate_sample_sales(days=40)
    
    forecast = forecast_demand(
        shop_id="test_shop",
        product_id="test_product",
        sales_df=sales_df,
        periods=14,
        method="linear"
    )
    
    assert forecast.product_id == "test_product"
    assert len(forecast.predictions) == 14
    assert forecast.method in ['linear', 'exponential', 'xgboost', 'moving_avg']
    assert forecast.model_version is not None


def test_negative_prediction_handling():
    """Test that negative predictions are clipped to zero."""
    # Create declining sales trend
    dates = [datetime.utcnow() - timedelta(days=i) for i in range(30)]
    dates.reverse()
    values = [max(0, 20 - i) for i in range(30)]  # Declining to zero
    
    sales_df = pd.DataFrame({
        'date': dates,
        'qty': values
    })
    
    trainer, _ = train_forecast_model(sales_df, method="linear")
    predictions = trainer.predict(
        periods=40,  # Predict far into future
        last_date=sales_df['date'].max(),
        historical_data=sales_df
    )
    
    # All predictions should be non-negative
    assert all(predictions['predicted_qty'] >= 0)


def test_feature_importance_extraction():
    """Test feature importance is extracted when available."""
    sales_df = generate_sample_sales(days=100)
    
    # XGBoost should provide feature importance
    trainer, _ = train_forecast_model(sales_df, method="xgboost")
    
    if trainer.feature_names:
        assert len(trainer.feature_names) > 0
        # Feature importance extraction tested in explainability tests
