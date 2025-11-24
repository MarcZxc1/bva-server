import httpx
import json

BASE_URL = "http://localhost:8001/api/v1/smart-shelf"

print("=" * 60)
print("Testing ML Service Endpoints")
print("=" * 60)

# Test 2: Demand Forecasting
print("\n2️⃣ Testing /forecast endpoint...")
forecast_payload = {
    "shop_id": "SHOP-001",
    "product_id": "PROD-001",
    "sales": [
        {"product_id": "PROD-001", "date": "2025-10-01", "qty": 10},
        {"product_id": "PROD-001", "date": "2025-10-02", "qty": 12},
        {"product_id": "PROD-001", "date": "2025-10-03", "qty": 11},
        {"product_id": "PROD-001", "date": "2025-10-04", "qty": 15},
        {"product_id": "PROD-001", "date": "2025-10-05", "qty": 13},
        {"product_id": "PROD-001", "date": "2025-10-06", "qty": 9},
        {"product_id": "PROD-001", "date": "2025-10-07", "qty": 8},
        {"product_id": "PROD-001", "date": "2025-10-08", "qty": 14},
        {"product_id": "PROD-001", "date": "2025-10-09", "qty": 16},
        {"product_id": "PROD-001", "date": "2025-10-10", "qty": 12},
        {"product_id": "PROD-001", "date": "2025-10-11", "qty": 11},
        {"product_id": "PROD-001", "date": "2025-10-12", "qty": 13}
    ],
    "periods": 7
}

try:
    response = httpx.post(f"{BASE_URL}/forecast", json=forecast_payload, timeout=30)
    print(f"✅ Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        forecast = data.get("forecasts", [{}])[0]
        print(f"📈 Model Used: {forecast.get('model_used', 'N/A')}")
        print(f"📊 Predictions: {len(forecast.get('predictions', []))} days")
        print(f"📉 RMSE: {forecast.get('metrics', {}).get('rmse', 'N/A')}")
        print("\nFirst 3 predictions:")
        for pred in forecast.get("predictions", [])[:3]:
            print(f"  {pred['date']}: {pred['predicted_qty']:.2f} units")
    else:
        print(f"❌ Error: {response.text[:500]}")
except Exception as e:
    print(f"❌ Error: {e}")

# Test 3: Sales Insights
print("\n3️⃣ Testing /insights endpoint...")
insights_payload = {
    "shop_id": "SHOP-001",
    "sales": [
        {"product_id": "PROD-001", "date": "2025-11-01", "qty": 10},
        {"product_id": "PROD-001", "date": "2025-11-02", "qty": 12},
        {"product_id": "PROD-002", "date": "2025-11-01", "qty": 15},
        {"product_id": "PROD-002", "date": "2025-11-02", "qty": 18}
    ],
    "range": {
        "start": "2025-11-01",
        "end": "2025-11-02"
    },
    "top_k": 5
}

try:
    response = httpx.post(f"{BASE_URL}/insights", json=insights_payload, timeout=30)
    print(f"✅ Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"📦 Top Products: {len(data.get('top_products', []))}")
        print(f"📈 Trends: {len(data.get('trends', []))}")
        if data.get('top_products'):
            print(f"🏆 Best Seller: {data['top_products'][0].get('product_id')}")
    else:
        print(f"❌ Error: {response.text[:500]}")
except Exception as e:
    print(f"❌ Error: {e}")

# Test 4: Promotions
print("\n4️⃣ Testing /promotions endpoint...")
promo_payload = {
    "shop_id": "SHOP-001",
    "items": [
        {
            "product_id": "PROD-001",
            "sku": "MLK-001",
            "name": "Milk",
            "quantity": 20,
            "expiry_date": "2025-11-20",
            "price": 4.99
        }
    ],
    "calendar_events": [
        {
            "id": "EVENT-001",
            "date": "2025-11-25",
            "title": "Thanksgiving Sale",
            "event_type": "holiday",
            "audience": "families"
        }
    ]
}

try:
    response = httpx.post(f"{BASE_URL}/promotions", json=promo_payload, timeout=30)
    print(f"✅ Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"🎁 Promotions Generated: {len(data.get('promotions', []))}")
        if data.get('promotions'):
            promo = data['promotions'][0]
            print(f"📌 Product: {promo.get('product_name')}")
            print(f"💰 Discount: {promo.get('discount_pct')}%")
    else:
        print(f"❌ Error: {response.text[:500]}")
except Exception as e:
    print(f"❌ Error: {e}")

print("\n" + "=" * 60)
print("✅ All endpoint tests completed!")
print("=" * 60)
