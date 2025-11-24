# File: app/tests/test_inventory.py
"""
Purpose: Unit tests for inventory risk detection.
Tests edge cases, scoring logic, and recommendations.

Run with: pytest app/tests/test_inventory.py -v
"""

import pytest
from datetime import datetime, timedelta
import pandas as pd
from app.services.inventory_service import compute_risk_scores
from app.schemas.inventory_schema import (
    InventoryItem,
    SalesRecord,
    AtRiskThresholds,
    RiskReason
)


def test_low_stock_detection():
    """Test low stock flag is set correctly."""
    inventory = [
        InventoryItem(
            product_id="p1",
            sku="SKU1",
            name="Low Stock Item",
            quantity=5,
            price=10.0
        )
    ]
    
    sales = []
    thresholds = AtRiskThresholds(low_stock=10)
    
    result = compute_risk_scores(inventory, sales, thresholds)
    
    assert len(result) == 1
    assert RiskReason.LOW_STOCK in result[0].reasons
    assert result[0].score > 0


def test_near_expiry_detection():
    """Test near-expiry flag for products expiring soon."""
    expiry_date = (datetime.utcnow() + timedelta(days=3)).isoformat()
    
    inventory = [
        InventoryItem(
            product_id="p1",
            sku="SKU1",
            name="Expiring Item",
            quantity=50,
            expiry_date=expiry_date,
            price=10.0
        )
    ]
    
    sales = []
    thresholds = AtRiskThresholds(expiry_days=7, low_stock=10)
    
    result = compute_risk_scores(inventory, sales, thresholds)
    
    assert len(result) == 1
    assert RiskReason.NEAR_EXPIRY in result[0].reasons
    assert result[0].days_to_expiry == 3


def test_slow_moving_detection():
    """Test slow-moving flag based on sales velocity."""
    inventory = [
        InventoryItem(
            product_id="p1",
            sku="SKU1",
            name="Slow Item",
            quantity=50,
            price=10.0
        )
    ]
    
    # Create minimal sales (slow moving)
    sales = [
        SalesRecord(
            product_id="p1",
            date=(datetime.utcnow() - timedelta(days=i)).isoformat(),
            qty=0.1
        )
        for i in range(30)
    ]
    
    thresholds = AtRiskThresholds(
        low_stock=10,
        slow_moving_window=30,
        slow_moving_threshold=0.5
    )
    
    result = compute_risk_scores(inventory, sales, thresholds)
    
    assert len(result) == 1
    assert RiskReason.SLOW_MOVING in result[0].reasons


def test_combined_risks():
    """Test product with multiple risk factors has higher score."""
    expiry_date = (datetime.utcnow() + timedelta(days=2)).isoformat()
    
    inventory = [
        InventoryItem(
            product_id="p1",
            sku="SKU1",
            name="Critical Item",
            quantity=5,
            expiry_date=expiry_date,
            price=10.0
        )
    ]
    
    sales = [
        SalesRecord(
            product_id="p1",
            date=(datetime.utcnow() - timedelta(days=i)).isoformat(),
            qty=0.1
        )
        for i in range(30)
    ]
    
    thresholds = AtRiskThresholds(
        low_stock=10,
        expiry_days=7,
        slow_moving_window=30,
        slow_moving_threshold=0.5
    )
    
    result = compute_risk_scores(inventory, sales, thresholds)
    
    assert len(result) == 1
    assert len(result[0].reasons) >= 2  # Multiple risk factors
    assert result[0].score > 0.5  # High risk score


def test_no_risk_product():
    """Test product with no risk factors is not flagged."""
    inventory = [
        InventoryItem(
            product_id="p1",
            sku="SKU1",
            name="Healthy Item",
            quantity=100,
            price=10.0
        )
    ]
    
    # Good sales velocity
    sales = [
        SalesRecord(
            product_id="p1",
            date=(datetime.utcnow() - timedelta(days=i)).isoformat(),
            qty=5.0
        )
        for i in range(30)
    ]
    
    thresholds = AtRiskThresholds(
        low_stock=10,
        slow_moving_threshold=0.5
    )
    
    result = compute_risk_scores(inventory, sales, thresholds)
    
    assert len(result) == 0  # No at-risk items


def test_empty_inventory():
    """Test handling of empty inventory list."""
    result = compute_risk_scores([], [], AtRiskThresholds())
    assert len(result) == 0


def test_recommendation_generation():
    """Test that recommendations are generated for at-risk items."""
    expiry_date = (datetime.utcnow() + timedelta(days=3)).isoformat()
    
    inventory = [
        InventoryItem(
            product_id="p1",
            sku="SKU1",
            name="Item",
            quantity=50,
            expiry_date=expiry_date,
            price=10.0
        )
    ]
    
    sales = []
    thresholds = AtRiskThresholds(expiry_days=7)
    
    result = compute_risk_scores(inventory, sales, thresholds)
    
    assert len(result) == 1
    assert result[0].recommended_action is not None
    assert result[0].recommended_action.action_type in ["discount", "clearance", "bundle"]
    assert result[0].recommended_action.reasoning != ""
