import requests
import json

# Test data
payload = {
    "shop_id": "2aad5d00-d302-4c57-86ad-99826e19e610",
    "budget": 50000,
    "goal": "balanced",
    "restock_days": 14,
    "products": [
        {
            "product_id": "test-1",
            "name": "Test Product",
            "price": 100,
            "cost": 60,
            "stock": 5,
            "category": "Test",
            "avg_daily_sales": 2.5,
            "profit_margin": 0.4,
            "min_order_qty": 1
        }
    ]
}

print("Testing ML Service Restock Endpoint")
print("====================================")
print(f"Payload: {json.dumps(payload, indent=2)}")

try:
    response = requests.post(
        "http://localhost:8001/api/v1/restock/strategy",
        json=payload,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")
