#!/bin/bash

echo "🔍 Detailed RestockPlanner Test"
echo "================================"

# Get token
LOGIN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password123"}')

TOKEN=$(echo "$LOGIN" | jq -r '.data.token')
SHOP_ID="2aad5d00-d302-4c57-86ad-99826e19e610"

echo "Testing Restock Strategy endpoint..."
RESTOCK=$(curl -v -X POST "http://localhost:3000/api/ai/restock-strategy" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"shopId\":\"$SHOP_ID\",\"budget\":50000,\"goal\":\"balanced\",\"restockDays\":14}" 2>&1)

echo "$RESTOCK" | grep -A 50 "^< HTTP"
echo ""
echo "Response body:"
echo "$RESTOCK" | sed -n '/^{/,/^}/p' | jq '.'
