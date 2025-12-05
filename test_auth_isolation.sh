#!/bin/bash

echo "========================================="
echo "Testing Data Isolation Between Accounts"
echo "========================================="
echo ""

# Test admin@test.com (20 sales)
echo "1. Testing admin@test.com account:"
echo "   Expected: 20 sales, 20 products"
echo "   -----------------------------------"
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password123"}' | jq -r '.data.token')

if [ "$ADMIN_TOKEN" != "null" ] && [ -n "$ADMIN_TOKEN" ]; then
  echo "   ✓ Login successful"
  
  # Test dashboard metrics (filtered by shopId in JWT)
  echo "   Fetching dashboard metrics..."
  METRICS=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
    "http://localhost:3000/api/reports/metrics")
  echo "   $METRICS" | jq .
  
  # Test smart shelf dashboard
  echo "   Fetching SmartShelf data..."
  DASHBOARD=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
    "http://localhost:3000/api/smart-shelf/2aad5d00-d302-4c57-86ad-99826e19e610/dashboard")
  echo "   Sales: $(echo $DASHBOARD | jq -r '.data.metrics.totalSales')"
  echo "   Products: $(echo $DASHBOARD | jq -r '.data.metrics.totalProducts')"
else
  echo "   ✗ Login failed"
fi

echo ""
echo "2. Testing tester@test.com account:"
echo "   Expected: No shop, should get error"
echo "   -----------------------------------"
TESTER_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tester@test.com","password":"password123"}' | jq -r '.data.token')

if [ "$TESTER_TOKEN" != "null" ] && [ -n "$TESTER_TOKEN" ]; then
  echo "   ✓ Login successful"
  
  # This should fail because tester has no shop
  echo "   Fetching dashboard metrics (should fail)..."
  ERROR_RESPONSE=$(curl -s -H "Authorization: Bearer $TESTER_TOKEN" \
    "http://localhost:3000/api/reports/metrics")
  echo "   $ERROR_RESPONSE" | jq .
else
  echo "   ✗ Login failed"
fi

echo ""
echo "========================================="
echo "Test Summary:"
echo "- admin@test.com should only see their 20 sales"
echo "- tester@test.com has no shop and should get error"
echo "- Each user's shopId is embedded in their JWT token"
echo "- All data queries filter by authenticated user's shopId"
echo "========================================="
