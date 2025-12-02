#!/bin/bash

echo "Testing Image Generation Feature"
echo "=================================="
echo ""

# Test 1: Direct ML Service Call
echo "1. Testing ML Service directly..."
RESPONSE=$(curl -s -X POST http://localhost:8001/api/v1/ads/generate-image \
  -H "Content-Type: application/json" \
  -d '{"product_name": "Test Product", "playbook": "Flash Sale"}')

if echo "$RESPONSE" | jq -e '.image_url' > /dev/null 2>&1; then
    echo "✅ ML Service image generation works!"
    echo "   Image URL: $(echo $RESPONSE | jq -r '.image_url')"
else
    echo "❌ ML Service image generation failed"
    echo "   Response: $RESPONSE"
fi

echo ""

# Test 2: Ad Copy Generation
echo "2. Testing ad copy generation..."
RESPONSE=$(curl -s -X POST http://localhost:8001/api/v1/ads/generate \
  -H "Content-Type: application/json" \
  -d '{"product_name": "Test Product", "playbook": "Flash Sale", "discount": "50% OFF"}')

if echo "$RESPONSE" | jq -e '.ad_copy' > /dev/null 2>&1; then
    echo "✅ Ad copy generation works!"
    echo "   Ad Copy: $(echo $RESPONSE | jq -r '.ad_copy')"
else
    echo "❌ Ad copy generation failed"
    echo "   Response: $RESPONSE"
fi

echo ""
echo "=================================="
echo "Test Complete!"
echo ""
echo "Next Steps:"
echo "1. Start the backend: cd server && npm run dev"
echo "2. Test through backend: POST http://localhost:5000/api/v1/ads/generate-ad-image"
echo "3. Test from frontend MarketMate page"
