# ML Service Data Requirements Guide

## Overview

This document outlines the **minimum and optimal data requirements** for each ML service feature to function at its full potential. Understanding these requirements helps ensure accurate predictions, meaningful insights, and effective recommendations.

---

## Table of Contents

1. [At-Risk Inventory Detection](#at-risk-inventory-detection)
2. [Demand Forecasting](#demand-forecasting)
3. [Restock Strategy Optimization](#restock-strategy-optimization)
4. [Promotion Planning](#promotion-planning)
5. [Sales Analytics & Insights](#sales-analytics--insights)
6. [Ad Generation](#ad-generation)
7. [Data Quality Guidelines](#data-quality-guidelines)
8. [Sample Data Scenarios](#sample-data-scenarios)

---

## At-Risk Inventory Detection

### Purpose
Identifies products needing attention due to low stock, near-expiry dates, or slow sales velocity.

### Minimum Requirements

**Products/Inventory Data**:
- ✅ **Product ID** (unique identifier)
- ✅ **Product Name**
- ✅ **Current Stock Quantity** (integer >= 0)
- ✅ **Price** (float > 0)
- ⚠️ **Expiry Date** (optional but recommended for expiry detection)
- ⚠️ **SKU** (optional, for better tracking)

**Sales History**:
- ✅ **At least 7 days** of sales data (minimum for velocity calculation)
- ✅ **Product ID** in sales records
- ✅ **Sale Date** (timestamp)
- ✅ **Quantity Sold** (integer >= 0)
- ⚠️ **Revenue** (optional, for revenue-based analysis)

### Optimal Requirements

**Products/Inventory Data**:
- ✅ All minimum requirements
- ✅ **Expiry Date** for all perishable products
- ✅ **Category** for better grouping
- ✅ **Cost** (for profit margin calculations)
- ✅ **SKU** for inventory tracking

**Sales History**:
- ✅ **30-90 days** of sales data (better velocity accuracy)
- ✅ **Daily sales records** (not just totals)
- ✅ **Revenue per sale** (for revenue analysis)
- ✅ **Consistent daily data** (no large gaps)

### Thresholds Configuration

Default thresholds (can be customized):
- **Low Stock Threshold**: 10 units (configurable)
- **Expiry Warning Days**: 7 days before expiry (configurable)
- **Slow Moving Window**: 30 days (configurable)
- **Slow Moving Threshold**: 0.5 units/day (configurable)

### Example Input

```json
{
  "shop_id": "SHOP-001",
  "inventory": [
    {
      "product_id": "PROD-001",
      "sku": "SKU-001",
      "name": "UFC Banana Catsup",
      "quantity": 5,
      "price": 18.0,
      "cost": 12.0,
      "expiry_date": "2024-12-31T00:00:00Z",
      "categories": ["Condiments"]
    }
  ],
  "sales": [
    {
      "product_id": "PROD-001",
      "date": "2024-01-15T00:00:00Z",
      "qty": 10,
      "revenue": 180.0
    },
    {
      "product_id": "PROD-001",
      "date": "2024-01-16T00:00:00Z",
      "qty": 8,
      "revenue": 144.0
    }
    // ... at least 7 days, ideally 30-90 days
  ],
  "thresholds": {
    "low_stock": 10,
    "expiry_warning_days": 7,
    "slow_moving_window": 30,
    "slow_moving_threshold": 0.5
  }
}
```

### Expected Output Quality

**With Minimum Data (7 days)**:
- ✅ Basic low stock detection works
- ⚠️ Slow-moving detection may be less accurate
- ⚠️ Velocity calculations may fluctuate

**With Optimal Data (30-90 days)**:
- ✅ Accurate velocity calculations
- ✅ Reliable slow-moving detection
- ✅ Better risk score accuracy
- ✅ More actionable recommendations

---

## Demand Forecasting

### Purpose
Predicts future product demand using time-series forecasting algorithms.

### Minimum Requirements

**Sales History**:
- ✅ **At least 14 days** of historical sales data
- ✅ **Product ID** in sales records
- ✅ **Sale Date** (timestamp, daily granularity preferred)
- ✅ **Quantity Sold** (integer >= 0)
- ✅ **Consistent daily records** (no large gaps)

### Optimal Requirements

**Sales History**:
- ✅ **30-90 days** of historical sales data (best accuracy)
- ✅ **Daily sales records** (not weekly/monthly aggregates)
- ✅ **No missing days** (or minimal gaps)
- ✅ **Revenue per sale** (for revenue forecasting)
- ✅ **Multiple products** (for batch forecasting efficiency)

**Product Information**:
- ✅ **Product ID**
- ✅ **Product Name** (for reporting)
- ✅ **Category** (for category-level forecasting)

### Algorithm Selection Based on Data

| Data Available | Recommended Algorithm | Accuracy |
|---------------|---------------------|----------|
| 14-29 days | Linear Regression | Good for stable products |
| 30-60 days | Exponential Smoothing | Good for seasonal patterns |
| 60+ days | XGBoost | Best for complex patterns |
| Auto (default) | Auto-selection | Chooses best based on data |

### Example Input

```json
{
  "shop_id": "SHOP-001",
  "product_id": "PROD-001",
  "periods": 14,
  "model": "auto",
  "confidence_interval": 0.95,
  "sales": [
    {
      "product_id": "PROD-001",
      "date": "2024-01-01T00:00:00Z",
      "qty": 10,
      "revenue": 180.0
    },
    {
      "product_id": "PROD-001",
      "date": "2024-01-02T00:00:00Z",
      "qty": 12,
      "revenue": 216.0
    }
    // ... at least 14 days, ideally 30-90 days
  ]
}
```

### Expected Output Quality

**With Minimum Data (14 days)**:
- ✅ Basic forecasts work
- ⚠️ Limited pattern detection
- ⚠️ Lower confidence intervals
- ⚠️ May use simpler algorithms (Linear Regression)

**With Optimal Data (30-90 days)**:
- ✅ Accurate trend detection
- ✅ Seasonality pattern recognition
- ✅ Higher confidence in predictions
- ✅ Can use advanced algorithms (XGBoost)
- ✅ Better confidence intervals

---

## Restock Strategy Optimization

### Purpose
Optimizes restocking decisions based on budget and business goals (profit, volume, or balanced).

### Minimum Requirements

**Products Data**:
- ✅ **Product ID** (unique identifier)
- ✅ **Product Name**
- ✅ **Price** (float > 0) - **CRITICAL**
- ✅ **Cost** (float > 0) - **CRITICAL** (for profit calculations)
- ✅ **Current Stock** (integer >= 0)
- ✅ **Category** (optional but recommended)

**Sales History**:
- ✅ **At least 7-14 days** of sales data
- ✅ **Product ID** in sales records
- ✅ **Quantity Sold** per sale
- ✅ **Sale Date** (for calculating average daily sales)

**Business Parameters**:
- ✅ **Budget** (float > 0)
- ✅ **Goal** ("profit" | "volume" | "balanced")
- ✅ **Restock Days** (target coverage period, default: 14 days)

### Optimal Requirements

**Products Data**:
- ✅ All minimum requirements
- ✅ **Accurate Cost** (critical for profit calculations)
- ✅ **Accurate Price** (critical for margin calculations)
- ✅ **Category** for better grouping
- ✅ **Minimum Order Quantity** (if applicable)
- ✅ **Maximum Order Quantity** (if applicable)

**Sales History**:
- ✅ **30-90 days** of sales data (better velocity accuracy)
- ✅ **Daily sales records** (not just totals)
- ✅ **Consistent daily data** (no large gaps)
- ✅ **Revenue per sale** (for revenue-based analysis)

**Business Parameters**:
- ✅ **Realistic Budget** (should be sufficient for meaningful restocking)
- ✅ **Clear Business Goal** (profit vs. volume vs. balanced)
- ✅ **Appropriate Restock Days** (14-30 days typical)

### Critical Data Quality Checks

The service automatically filters out invalid products:
- ❌ Products where `cost >= price` (negative profit margin)
- ❌ Products with `price <= 0` or `cost <= 0`
- ❌ Products with invalid numeric values (NaN, Infinity)

### Example Input

```json
{
  "shop_id": "SHOP-001",
  "budget": 5000.0,
  "goal": "profit",
  "restock_days": 14,
  "products": [
    {
      "product_id": "PROD-001",
      "name": "UFC Banana Catsup",
      "price": 18.0,        // CRITICAL: Must be > cost
      "cost": 12.0,         // CRITICAL: Must be < price
      "stock": 5,
      "category": "Condiments",
      "avg_daily_sales": 12.0,  // Calculated from sales history
      "profit_margin": 0.33,    // Calculated: (price - cost) / price
      "min_order_qty": 1
    }
  ]
}
```

### Expected Output Quality

**With Minimum Data (7-14 days sales)**:
- ✅ Basic recommendations work
- ⚠️ Average daily sales may be less accurate
- ⚠️ Urgency calculations may fluctuate
- ⚠️ May recommend fewer products

**With Optimal Data (30-90 days sales)**:
- ✅ Accurate average daily sales calculations
- ✅ Better urgency factor calculations
- ✅ More reliable profit/volume predictions
- ✅ Optimal product selection
- ✅ Better ROI estimates

### Common Issues

1. **No Valid Products**: If all products have `cost >= price`, service returns empty recommendations
2. **Insufficient Budget**: If budget is too small, may only recommend partial quantities
3. **No Sales History**: Service can't calculate `avg_daily_sales`, defaults to 1.0 (less accurate)

---

## Promotion Planning

### Purpose
Generates intelligent promotion recommendations for near-expiry or slow-moving products.

### Minimum Requirements

**Products Data**:
- ✅ **Product ID**
- ✅ **Product Name**
- ✅ **Current Quantity**
- ✅ **Price** (float > 0)
- ✅ **Cost** (float > 0) - **CRITICAL** (for margin calculations)
- ✅ **Expiry Date** - **CRITICAL** (for near-expiry detection)

**Calendar Events** (Optional but Recommended):
- ✅ **Event Name** (e.g., "Valentine's Day")
- ✅ **Event Date** (ISO date string)
- ✅ **Event Category** (e.g., "holiday", "season")

**Sales History** (Optional but Recommended):
- ✅ **30 days** of sales data (for velocity calculations)

### Optimal Requirements

**Products Data**:
- ✅ All minimum requirements
- ✅ **Accurate Expiry Dates** for all perishable products
- ✅ **Category** for better event matching
- ✅ **Current Stock Quantity** (for clearance estimation)

**Calendar Events**:
- ✅ **Comprehensive event calendar** (holidays, seasons, local events)
- ✅ **Event Categories** for better matching
- ✅ **Event Descriptions** (for marketing copy generation)

**Sales History**:
- ✅ **30-90 days** of sales data
- ✅ **Daily sales records**
- ✅ **Revenue per sale**

**Business Preferences**:
- ✅ **Max Discount %** (default: 40%)
- ✅ **Min Margin %** (default: 10%)
- ✅ **Promotion Elasticity** (demand increase per % discount)

### Example Input

```json
{
  "shop_id": "SHOP-001",
  "items": [
    {
      "product_id": "PROD-001",
      "name": "UFC Banana Catsup",
      "current_quantity": 50,
      "price": 18.0,
      "cost": 12.0,
      "expiry_date": "2024-02-20T00:00:00Z"  // 5 days from now
    }
  ],
  "calendar_events": [
    {
      "event_name": "Valentine's Day",
      "date": "2024-02-14",
      "category": "holiday"
    }
  ],
  "preferences": {
    "max_discount_pct": 40.0,
    "min_margin_pct": 10.0
  }
}
```

### Expected Output Quality

**With Minimum Data**:
- ✅ Basic promotions work
- ⚠️ Discount calculations may be less optimized
- ⚠️ Clearance time estimates may be less accurate

**With Optimal Data**:
- ✅ Optimal discount recommendations
- ✅ Accurate clearance time predictions
- ✅ Better event-product matching
- ✅ More compelling marketing copy
- ✅ Higher confidence scores

---

## Sales Analytics & Insights

### Purpose
Provides time-series analysis, trend detection, and business recommendations.

### Minimum Requirements

**Sales History**:
- ✅ **At least 14 days** of sales data
- ✅ **Product ID** in sales records
- ✅ **Sale Date** (timestamp)
- ✅ **Quantity Sold** (integer >= 0)
- ✅ **Revenue** (float >= 0) - **CRITICAL** for revenue analysis

**Date Range**:
- ✅ **Start Date** and **End Date** (ISO date strings)
- ✅ **At least 7 days** between start and end

### Optimal Requirements

**Sales History**:
- ✅ **30-90 days** of sales data (better trend detection)
- ✅ **Daily sales records** (not aggregated)
- ✅ **No missing days** (or minimal gaps)
- ✅ **Revenue per sale** (for revenue analysis)
- ✅ **Multiple products** (for comparative analysis)

**Product Information**:
- ✅ **Product ID**
- ✅ **Product Name** (for reporting)
- ✅ **Category** (for category-level insights)

**Analysis Parameters**:
- ✅ **Granularity**: "daily", "weekly", or "monthly"
- ✅ **Top K**: Number of top products to analyze (default: 10)

### Example Input

```json
{
  "shop_id": "SHOP-001",
  "sales": [
    {
      "product_id": "PROD-001",
      "date": "2024-01-01T00:00:00Z",
      "qty": 10,
      "revenue": 180.0
    }
    // ... at least 14 days, ideally 30-90 days
  ],
  "range": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  },
  "granularity": "daily",
  "top_k": 10
}
```

### Expected Output Quality

**With Minimum Data (14 days)**:
- ✅ Basic time-series works
- ⚠️ Limited trend detection
- ⚠️ Seasonality patterns may not be detected
- ⚠️ Top products analysis may be less meaningful

**With Optimal Data (30-90 days)**:
- ✅ Accurate trend detection (increasing, decreasing, stable)
- ✅ Seasonality pattern recognition (day-of-week, monthly)
- ✅ Reliable top products analysis
- ✅ Meaningful business recommendations
- ✅ Better moving average calculations

---

## Ad Generation

### Purpose
Creates AI-powered marketing content (copy and images) using Google Gemini.

### Minimum Requirements

**Product Information**:
- ✅ **Product Name** (string) - **CRITICAL**
- ✅ **Playbook Type** - **CRITICAL** (one of: "Flash Sale", "New Arrival", "Best Seller Spotlight", "Bundle Up!")

**Optional**:
- ⚠️ **Discount Percentage** (for discount-based ads)
- ⚠️ **Product Description** (for richer copy)
- ⚠️ **Product Category** (for better hashtags)

### Optimal Requirements

**Product Information**:
- ✅ **Product Name** (clear, descriptive)
- ✅ **Playbook Type** (matching product situation)
- ✅ **Discount Percentage** (if applicable)
- ✅ **Product Description** (detailed, for better AI understanding)
- ✅ **Product Category** (for relevant hashtags)
- ✅ **Product Image URL** (for image generation context)

**Configuration**:
- ✅ **Google Gemini API Key** (required for AI generation)
- ✅ **Valid API credentials** (for image generation)

### Example Input

```json
{
  "product_name": "UFC Banana Catsup 500ml",
  "playbook": "flash_sale",
  "discount": 25.0
}
```

### Expected Output Quality

**With Minimum Data**:
- ✅ Basic ad copy generation works
- ✅ Hashtags generated
- ⚠️ Image generation may use placeholders if API unavailable
- ⚠️ Copy may be less product-specific

**With Optimal Data**:
- ✅ Rich, product-specific ad copy
- ✅ Relevant hashtags
- ✅ High-quality AI-generated images
- ✅ Better playbook matching
- ✅ More compelling marketing content

---

## Data Quality Guidelines

### Critical Data Quality Rules

1. **Numeric Values**:
   - ✅ Must be valid numbers (not NaN, Infinity, or null)
   - ✅ Prices and costs must be > 0
   - ✅ Quantities must be integers >= 0

2. **Dates**:
   - ✅ Must be valid ISO 8601 format
   - ✅ Expiry dates must be in the future (for active products)
   - ✅ Sale dates should be in chronological order

3. **Product Identifiers**:
   - ✅ Product IDs must be unique
   - ✅ Product IDs in sales must match product IDs in inventory

4. **Sales Data Consistency**:
   - ✅ No duplicate sales records
   - ✅ Consistent date format
   - ✅ Quantities must be non-negative

### Data Validation

The ML service automatically validates:
- ✅ Pydantic schema validation (type checking)
- ✅ Business rule validation (e.g., cost < price)
- ✅ Data range validation (e.g., budget > 0)
- ✅ Required field validation

### Common Data Issues

1. **Missing Expiry Dates**:
   - Impact: Can't detect near-expiry products
   - Solution: Add expiry dates for perishable products

2. **Incorrect Cost/Price**:
   - Impact: Invalid profit margin calculations, products filtered out
   - Solution: Ensure cost < price for all products

3. **Insufficient Sales History**:
   - Impact: Less accurate velocity calculations, forecasts
   - Solution: Ensure at least 14-30 days of sales data

4. **Missing Daily Sales**:
   - Impact: Can't calculate accurate average daily sales
   - Solution: Provide daily sales records, not just totals

5. **Large Gaps in Sales Data**:
   - Impact: Less accurate trend detection
   - Solution: Ensure consistent daily sales records

---

## Sample Data Scenarios

### Scenario 1: New Shop (Cold Start)

**Data Available**:
- ✅ Products with inventory
- ❌ No sales history yet

**What Works**:
- ✅ At-risk detection (low stock only)
- ✅ Ad generation
- ❌ Demand forecasting (needs sales history)
- ❌ Restock strategy (needs sales history)
- ❌ Promotion planning (needs sales history)

**Recommendations**:
- Start with basic inventory management
- Begin recording sales immediately
- After 7-14 days, enable forecasting and restock features

---

### Scenario 2: Established Shop (Optimal)

**Data Available**:
- ✅ Products with inventory, prices, costs, expiry dates
- ✅ 60+ days of daily sales history
- ✅ Consistent sales records
- ✅ Product categories

**What Works**:
- ✅ All features at full potential
- ✅ Accurate forecasts
- ✅ Optimal restock recommendations
- ✅ Intelligent promotions
- ✅ Comprehensive insights

**Recommendations**:
- All ML features will work optimally
- Expect high accuracy in predictions
- Get actionable, data-driven recommendations

---

### Scenario 3: Partial Data

**Data Available**:
- ✅ Products with inventory
- ✅ 14-30 days of sales history
- ⚠️ Some missing expiry dates
- ⚠️ Some products missing cost data

**What Works**:
- ✅ Basic at-risk detection (low stock)
- ⚠️ Limited near-expiry detection (missing dates)
- ✅ Basic forecasting (may use simpler algorithms)
- ⚠️ Limited restock strategy (products without cost filtered out)
- ✅ Ad generation

**Recommendations**:
- Add missing expiry dates for perishable products
- Add cost data for all products
- Continue collecting sales data for better accuracy

---

## Quick Reference Checklist

### For At-Risk Detection
- [ ] Products with current stock quantities
- [ ] At least 7 days of sales history (30+ days optimal)
- [ ] Expiry dates for perishable products
- [ ] Product prices

### For Demand Forecasting
- [ ] At least 14 days of sales history (30-90 days optimal)
- [ ] Daily sales records (not aggregated)
- [ ] Consistent date format
- [ ] Product IDs matching inventory

### For Restock Strategy
- [ ] Products with price and cost (cost < price)
- [ ] At least 7-14 days of sales history (30+ days optimal)
- [ ] Current stock quantities
- [ ] Budget and goal parameters

### For Promotion Planning
- [ ] Products with expiry dates
- [ ] Products with price and cost
- [ ] Calendar events (optional but recommended)
- [ ] Sales history for velocity (optional but recommended)

### For Sales Insights
- [ ] At least 14 days of sales history (30-90 days optimal)
- [ ] Revenue data per sale
- [ ] Daily sales records
- [ ] Date range for analysis

### For Ad Generation
- [ ] Product name
- [ ] Playbook type
- [ ] Google Gemini API key (for AI features)
- [ ] Discount percentage (if applicable)

---

## Summary

### Minimum Viable Data
To get **basic functionality**:
- Products with stock, price, cost
- 7-14 days of sales history
- Product names and IDs

### Optimal Data
To get **full potential**:
- Products with complete data (stock, price, cost, expiry, category)
- 30-90 days of daily sales history
- Consistent, high-quality data
- Revenue data for revenue-based analysis
- Calendar events for promotions

### Key Takeaways

1. **Sales History is Critical**: Most features require at least 14-30 days of sales data
2. **Cost Data is Essential**: Restock strategy and promotions need accurate cost data
3. **Expiry Dates Enhance Value**: Near-expiry detection requires expiry dates
4. **Daily Granularity Matters**: Daily sales records provide better accuracy than aggregated data
5. **Data Quality > Quantity**: Consistent, accurate data is better than large amounts of poor data

The ML service is designed to work with minimal data but provides significantly better results with optimal data. Start with what you have and improve data quality over time for better accuracy and insights.

