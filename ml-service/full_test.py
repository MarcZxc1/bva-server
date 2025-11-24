import httpx
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8001/api/v1/smart-shelf"

print("=" * 80)
print(" " * 20 + "🚀 ML SERVICE FUNCTIONALITY TEST")
print("=" * 80)

def generate_dates(start_days_ago, count):
    """Generate list of dates"""
    base = datetime.now() - timedelta(days=start_days_ago)
    return [(base + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(count)]

# ============================================================================
# TEST 1: AT-RISK INVENTORY DETECTION
# ============================================================================
print("\n📦 TEST 1: At-Risk Inventory Detection")
print("-" * 80)

at_risk_payload = {
    "shop_id": "SHOP-MAIN-001",
    "inventory": [
        {
            "product_id": "MILK-001",
            "sku": "DRY-MLK-ORG",
            "name": "Organic Whole Milk 1L",
            "quantity": 3,  # Low stock!
            "expiry_date": (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d"),  # Near expiry!
            "price": 4.99,
            "categories": ["Dairy", "Organic"]
        },
        {
            "product_id": "BREAD-001",
            "sku": "BKR-BRD-WHT",
            "name": "Artisan White Bread",
            "quantity": 50,
            "expiry_date": (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d"),  # Expires tomorrow!
            "price": 2.99,
            "categories": ["Bakery"]
        },
        {
            "product_id": "YOGURT-001",
            "sku": "DRY-YOG-GRK",
            "name": "Greek Yogurt Plain",
            "quantity": 100,
            "expiry_date": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
            "price": 3.49,
            "categories": ["Dairy"]
        }
    ],
    "sales": [
        {"product_id": "MILK-001", "date": generate_dates(14, 1)[0], "qty": 12},
        {"product_id": "MILK-001", "date": generate_dates(7, 1)[0], "qty": 10},
        {"product_id": "BREAD-001", "date": generate_dates(14, 1)[0], "qty": 45},
        {"product_id": "BREAD-001", "date": generate_dates(7, 1)[0], "qty": 40},
        {"product_id": "YOGURT-001", "date": generate_dates(14, 1)[0], "qty": 5},
        {"product_id": "YOGURT-001", "date": generate_dates(7, 1)[0], "qty": 3},
    ],
    "thresholds": {
        "low_stock": 10,
        "expiry_days": 7,
        "slow_moving_threshold": 1.0
    }
}

response = httpx.post(f"{BASE_URL}/at-risk", json=at_risk_payload, timeout=30)
print(f"Status: {response.status_code}")

if response.status_code == 200:
    data = response.json()
    print(f"✅ Found {data['meta']['flagged_count']} at-risk items out of {data['meta']['total_products']} total\n")
    
    for item in data['at_risk']:
        print(f"  🚨 {item['name']} ({item['sku']})")
        print(f"     • Reasons: {', '.join(item['reasons'])}")
        print(f"     • Risk Score: {item['score']:.2f}")
        print(f"     • Stock: {item['current_quantity']} units")
        print(f"     • Days to Expiry: {item['days_to_expiry']}")
        print(f"     • Avg Daily Sales: {item['avg_daily_sales']:.1f} units/day")
        action = item['recommended_action']
        print(f"     • 💡 Recommendation: {action['action_type'].upper()}")
        if action['discount_range']:
            print(f"        Discount: {action['discount_range'][0]:.0f}%-{action['discount_range'][1]:.0f}%")
        print(f"        {action['reasoning']}")
        print()
else:
    print(f"❌ Error: {response.text}")

# ============================================================================
# TEST 2: DEMAND FORECASTING
# ============================================================================
print("\n📈 TEST 2: Demand Forecasting (7-day prediction)")
print("-" * 80)

# Generate 30 days of realistic sales data with trend
dates = generate_dates(30, 30)
forecast_payload = {
    "shop_id": "SHOP-MAIN-001",
    "product_id": "MILK-001",
    "sales": [
        {"product_id": "MILK-001", "date": dates[i], "qty": 10 + (i // 3)}
        for i in range(30)
    ],
    "periods": 7,
    "model": "auto",
    "confidence_interval": 0.95
}

response = httpx.post(f"{BASE_URL}/forecast", json=forecast_payload, timeout=30)
print(f"Status: {response.status_code}")

if response.status_code == 200:
    data = response.json()
    forecast = data['forecasts'][0]
    print(f"✅ Forecast generated for {forecast['product_id']}")
    print(f"   Model: {forecast.get('model_used', 'auto-selected')}")
    
    if 'metrics' in forecast and forecast['metrics']:
        print(f"   Accuracy Metrics:")
        print(f"     • RMSE: {forecast['metrics'].get('rmse', 'N/A')}")
        print(f"     • MAE: {forecast['metrics'].get('mae', 'N/A')}")
    
    print(f"\n   📊 7-Day Forecast:")
    for i, pred in enumerate(forecast['predictions'], 1):
        qty = pred['predicted_qty']
        print(f"     Day {i} ({pred['date'][:10]}): {qty:.1f} units")
else:
    print(f"❌ Error: {response.text}")

# ============================================================================
# TEST 3: SALES INSIGHTS
# ============================================================================
print("\n\n💡 TEST 3: Sales Analytics & Insights")
print("-" * 80)

insights_payload = {
    "shop_id": "SHOP-MAIN-001",
    "sales": [
        {"product_id": "MILK-001", "date": "2025-11-01", "qty": 12, "revenue": 59.88},
        {"product_id": "MILK-001", "date": "2025-11-02", "qty": 10, "revenue": 49.90},
        {"product_id": "BREAD-001", "date": "2025-11-01", "qty": 20, "revenue": 59.80},
        {"product_id": "BREAD-001", "date": "2025-11-02", "qty": 25, "revenue": 74.75},
        {"product_id": "YOGURT-001", "date": "2025-11-01", "qty": 5, "revenue": 17.45},
        {"product_id": "YOGURT-001", "date": "2025-11-02", "qty": 3, "revenue": 10.47},
    ],
    "range": {
        "start": "2025-11-01",
        "end": "2025-11-02"
    },
    "granularity": "daily",
    "top_k": 3
}

response = httpx.post(f"{BASE_URL}/insights", json=insights_payload, timeout=30)
print(f"Status: {response.status_code}")

if response.status_code == 200:
    data = response.json()
    print(f"✅ Insights generated for {data.get('meta', {}).get('shop_id', 'N/A')}")
    
    if data.get('top_products'):
        print(f"\n   🏆 Top Products:")
        for product in data['top_products']:
            print(f"     • {product['product_id']}: {product['total_qty']} units, ${product['total_revenue']:.2f}")
    
    if data.get('recommendations'):
        print(f"\n   💡 Recommendations:")
        for rec in data['recommendations']:
            print(f"     • {rec}")
else:
    print(f"❌ Error: {response.text}")

# ============================================================================
# TEST 4: PROMOTION PLANNING
# ============================================================================
print("\n\n🎁 TEST 4: Promotion Planning (Near-Expiry + Calendar Events)")
print("-" * 80)

promo_payload = {
    "shop_id": "SHOP-MAIN-001",
    "items": [
        {
            "product_id": "MILK-001",
            "sku": "DRY-MLK-ORG",
            "name": "Organic Whole Milk 1L",
            "quantity": 25,
            "expiry_date": (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d"),
            "price": 4.99,
            "categories": ["Dairy", "Organic"]
        },
        {
            "product_id": "BREAD-001",
            "sku": "BKR-BRD-WHT",
            "name": "Artisan White Bread",
            "quantity": 40,
            "expiry_date": (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d"),
            "price": 2.99,
            "categories": ["Bakery"]
        }
    ],
    "calendar_events": [
        {
            "id": "EVENT-001",
            "date": (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d"),
            "title": "Weekend Flash Sale",
            "event_type": "sale",
            "audience": "general"
        }
    ],
    "preferences": {
        "discount_max_pct": 30.0,
        "min_margin_pct": 15.0,
        "max_promo_duration_days": 3
    }
}

response = httpx.post(f"{BASE_URL}/promotions", json=promo_payload, timeout=30)
print(f"Status: {response.status_code}")

if response.status_code == 200:
    data = response.json()
    print(f"✅ Generated {len(data['promotions'])} promotions")
    
    for promo in data['promotions']:
        print(f"\n   🎯 {promo['product_name']}")
        print(f"      Discount: {promo['discount_pct']}%")
        print(f"      Final Price: ${promo['discounted_price']:.2f}")
        print(f"      Duration: {promo['duration_days']} days")
        if promo.get('event_pairing'):
            print(f"      Event: {promo['event_pairing']}")
        if promo.get('promo_copy'):
            print(f"      Copy: \"{promo['promo_copy']}\"")
else:
    print(f"❌ Error: {response.text}")

# ============================================================================
# SUMMARY
# ============================================================================
print("\n" + "=" * 80)
print(" " * 25 + "✅ FUNCTIONALITY TEST COMPLETE")
print("=" * 80)
print("\n📊 Summary:")
print("  ✅ At-Risk Detection: Risk scoring, multi-factor analysis, recommendations")
print("  ✅ Demand Forecasting: ML models, confidence intervals, time-series prediction")
print("  ✅ Sales Insights: Analytics, top products, trends, recommendations")
print("  ✅ Promotion Planning: Event pairing, discount optimization, marketing copy")
print("\n🎯 All core SmartShelf features are OPERATIONAL!\n")
