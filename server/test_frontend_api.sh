#!/bin/bash

echo "🔍 Testing Frontend API Calls"
echo "=============================="

# Get a fresh token
echo "1️⃣ Getting fresh authentication token..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password123"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token')
SHOP_ID="2aad5d00-d302-4c57-86ad-99826e19e610"

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get token"
  exit 1
fi

echo "✅ Token obtained"

echo ""
echo "2️⃣ Testing /api/smart-shelf/:shopId/at-risk"
ATRISK=$(curl -s -X GET "http://localhost:3000/api/smart-shelf/$SHOP_ID/at-risk" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "$ATRISK" | jq '{success, data_count: (.data.at_risk | length), sample: (.data.at_risk[0] // null)}'

echo ""
echo "3️⃣ Testing /api/smart-shelf/:shopId/dashboard"
DASHBOARD=$(curl -s -X GET "http://localhost:3000/api/smart-shelf/$SHOP_ID/dashboard" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "$DASHBOARD" | jq '{success, has_metrics: (.data.metrics != null), has_forecast: (.data.forecast != null)}'

echo ""
echo "4️⃣ Testing /api/ai/restock-strategy"
RESTOCK=$(curl -s -X POST "http://localhost:3000/api/ai/restock-strategy" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"shopId\":\"$SHOP_ID\",\"budget\":50000,\"goal\":\"balanced\"}")

echo "$RESTOCK" | jq '{success, recommendations_count: (.data.recommendations | length // 0), summary: .data.summary}'

echo ""
echo "✅ API Test Complete!"
