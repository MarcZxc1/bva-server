#!/bin/bash

# Test order status update endpoint

# Get token first
TOKEN=$(cat << 'TOKENEOF'
# Replace with actual token from localStorage
# You can get this by opening browser console and running: localStorage.getItem('token')
TOKENEOF
)

echo "Testing order status update..."
echo ""
echo "First, let's get seller orders to find an order ID to test with:"
curl -X GET "http://localhost:3000/api/orders/seller/d4cc7b60-7bd6-4a70-b0a1-adab13bfa1b4" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  2>/dev/null | jq '.'

echo ""
echo "To test status update, run:"
echo "curl -X PATCH 'http://localhost:3000/api/orders/ORDER_ID/status' \\"
echo "  -H 'Authorization: Bearer YOUR_TOKEN' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"status\": \"TO_RECEIVE\"}'"

