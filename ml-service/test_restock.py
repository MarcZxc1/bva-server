#!/usr/bin/env python3
"""
Quick Test Script for Restock Strategy ML Service
Tests the Python endpoint directly before full integration
"""

import requests
import json
from datetime import datetime

ML_SERVICE_URL = "http://localhost:8001/api/v1/restock/strategy"

# Sample test data
test_payload = {
    "shop_id": "TEST-SHOP",
    "budget": 5000,
    "goal": "profit",
    "products": [
        {
            "product_id": 1,
            "name": "UFC Banana Catsup",
            "price": 45,
            "cost": 30,
            "stock": 5,
            "category": "Condiments",
            "avg_daily_sales": 12,
            "profit_margin": 0.33,
            "min_order_qty": 1
        },
        {
            "product_id": 2,
            "name": "Coke 1.5L",
            "price": 65,
            "cost": 45,
            "stock": 10,
            "category": "Beverages",
            "avg_daily_sales": 20,
            "profit_margin": 0.31,
            "min_order_qty": 6
        },
        {
            "product_id": 3,
            "name": "Lucky Me Pancit Canton",
            "price": 12,
            "cost": 7,
            "stock": 50,
            "category": "Snacks",
            "avg_daily_sales": 25,
            "profit_margin": 0.42,
            "min_order_qty": 24
        },
        {
            "product_id": 4,
            "name": "Tide Powder 1kg",
            "price": 125,
            "cost": 88,
            "stock": 3,
            "category": "Household",
            "avg_daily_sales": 5,
            "profit_margin": 0.30,
            "min_order_qty": 1
        },
        {
            "product_id": 5,
            "name": "Century Tuna 155g",
            "price": 38,
            "cost": 25,
            "stock": 15,
            "category": "Canned Goods",
            "avg_daily_sales": 8,
            "profit_margin": 0.34,
            "min_order_qty": 12
        }
    ],
    "restock_days": 14
}

def test_strategy(goal: str):
    """Test a specific strategy"""
    print(f"\n{'='*60}")
    print(f"Testing {goal.upper()} Strategy")
    print(f"{'='*60}")
    
    payload = test_payload.copy()
    payload['goal'] = goal
    
    try:
        response = requests.post(
            ML_SERVICE_URL,
            json=payload,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            
            print(f"\n✅ Success! Strategy: {data['strategy']}")
            print(f"\nBudget: ₱{data['budget']:,.2f}")
            print(f"Products Analyzed: {data['meta']['products_analyzed']}")
            print(f"Products Selected: {len(data['items'])}")
            
            print(f"\n📊 Summary:")
            totals = data['totals']
            print(f"   Total Items: {totals['total_items']}")
            print(f"   Total Quantity: {totals['total_qty']} units")
            print(f"   Total Cost: ₱{totals['total_cost']:,.2f}")
            print(f"   Budget Used: {totals['budget_used_pct']:.1f}%")
            print(f"   Expected Revenue: ₱{totals['expected_revenue']:,.2f}")
            print(f"   Expected Profit: ₱{totals['expected_profit']:,.2f}")
            print(f"   Expected ROI: {totals['expected_roi']:.1f}%")
            print(f"   Avg Days of Stock: {totals['avg_days_of_stock']:.1f} days")
            
            print(f"\n🛒 Recommended Items:")
            for i, item in enumerate(data['items'], 1):
                print(f"\n   {i}. {item['name']}")
                print(f"      Qty: {item['qty']} units")
                print(f"      Cost: ₱{item['total_cost']:,.2f}")
                print(f"      Expected Profit: ₱{item['expected_profit']:,.2f}")
                print(f"      Days of Stock: {item['days_of_stock']:.1f}")
                print(f"      Priority Score: {item['priority_score']:.2f}")
                if item.get('reasoning'):
                    print(f"      Reasoning: {item['reasoning']}")
            
            print(f"\n💡 Insights:")
            for insight in data['reasoning']:
                print(f"   • {insight}")
            
            if data.get('warnings'):
                print(f"\n⚠️ Warnings:")
                for warning in data['warnings']:
                    print(f"   • {warning}")
            
            return True
        else:
            print(f"❌ Error {response.status_code}")
            print(response.json())
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"❌ Connection Error: ML service not running at {ML_SERVICE_URL}")
        print(f"\n   Start it with:")
        print(f"   cd ml-service")
        print(f"   python -m uvicorn app.main:app --port 8001")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    print("🧪 ML Service Restock Strategy Test")
    print("="*60)
    
    # Test all three strategies
    strategies = ['profit', 'volume', 'balanced']
    results = {}
    
    for strategy in strategies:
        results[strategy] = test_strategy(strategy)
    
    # Summary
    print(f"\n{'='*60}")
    print("📊 Test Summary")
    print(f"{'='*60}")
    
    passed = sum(results.values())
    total = len(results)
    
    for strategy, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{strategy.capitalize():12} : {status}")
    
    print(f"\nSuccess Rate: {passed}/{total} ({passed/total*100:.0f}%)")
    
    if passed == total:
        print("\n🎉 All tests passed! ML service is working correctly.")
        print("\nNext steps:")
        print("1. Start the main Express server: cd server && npm run dev")
        print("2. Seed the database: npx prisma db seed")
        print("3. Test full integration: ts-node test/restock-integration.test.ts")
    else:
        print("\n⚠️ Some tests failed. Please check the ML service.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
