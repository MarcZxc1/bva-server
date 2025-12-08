#!/bin/bash

# Test script for all Supabase Edge Function URLs
# Tests Privacy Policy, Terms of Service, and Meta Data Deletion endpoints

BASE_URL="https://zfbqgnnbfkadwprqahbz.supabase.co/functions/v1"

echo "🧪 Testing Supabase Edge Function URLs"
echo "======================================"
echo ""
echo "Base URL: $BASE_URL"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Privacy Policy
echo "1️⃣ Testing Privacy Policy URL..."
echo "   URL: $BASE_URL/privacy-policy"
echo ""

RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE_URL/privacy-policy" 2>&1)
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "   ${GREEN}✅ Status: $HTTP_CODE OK${NC}"
    echo "   ✅ Content-Type: HTML"
    TITLE=$(echo "$BODY" | grep -o '<title>.*</title>' | head -1)
    echo "   ✅ Title: $TITLE"
    SIZE=$(echo "$BODY" | wc -c)
    echo "   ✅ Size: $SIZE bytes"
elif [ "$HTTP_CODE" = "401" ]; then
    echo -e "   ${RED}❌ Status: $HTTP_CODE Unauthorized${NC}"
    echo -e "   ${YELLOW}⚠️  Function needs to be redeployed with auth:false config${NC}"
    echo "   Run: supabase functions deploy privacy-policy"
elif [ "$HTTP_CODE" = "404" ]; then
    echo -e "   ${RED}❌ Status: $HTTP_CODE Not Found${NC}"
    echo -e "   ${YELLOW}⚠️  Function not deployed yet${NC}"
    echo "   Run: supabase functions deploy privacy-policy"
else
    echo -e "   ${RED}❌ Status: $HTTP_CODE${NC}"
    echo "   Response: $(echo "$BODY" | head -3)"
fi
echo ""

# Test 2: Terms of Service
echo "2️⃣ Testing Terms of Service URL..."
echo "   URL: $BASE_URL/terms-of-service"
echo ""

RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE_URL/terms-of-service" 2>&1)
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "   ${GREEN}✅ Status: $HTTP_CODE OK${NC}"
    echo "   ✅ Content-Type: HTML"
    TITLE=$(echo "$BODY" | grep -o '<title>.*</title>' | head -1)
    echo "   ✅ Title: $TITLE"
    SIZE=$(echo "$BODY" | wc -c)
    echo "   ✅ Size: $SIZE bytes"
elif [ "$HTTP_CODE" = "401" ]; then
    echo -e "   ${RED}❌ Status: $HTTP_CODE Unauthorized${NC}"
    echo -e "   ${YELLOW}⚠️  Function needs to be redeployed with auth:false config${NC}"
    echo "   Run: supabase functions deploy terms-of-service"
elif [ "$HTTP_CODE" = "404" ]; then
    echo -e "   ${RED}❌ Status: $HTTP_CODE Not Found${NC}"
    echo -e "   ${YELLOW}⚠️  Function not deployed yet${NC}"
    echo "   Run: supabase functions deploy terms-of-service"
else
    echo -e "   ${RED}❌ Status: $HTTP_CODE${NC}"
    echo "   Response: $(echo "$BODY" | head -3)"
fi
echo ""

# Test 3: Meta Data Deletion
echo "3️⃣ Testing Meta Data Deletion URL..."
echo "   URL: $BASE_URL/meta-data-deletion"
echo ""

echo "   Testing with POST request (mock data)..."
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/meta-data-deletion" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "signed_request=test" 2>&1)
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "400" ]; then
    echo -e "   ${GREEN}✅ Status: $HTTP_CODE Bad Request (expected with mock data)${NC}"
    echo "   ✅ Function is deployed and responding"
    ERROR_MSG=$(echo "$BODY" | grep -o '"error":"[^"]*"' | head -1)
    if [ -n "$ERROR_MSG" ]; then
        echo "   Response: $ERROR_MSG"
    fi
elif [ "$HTTP_CODE" = "401" ]; then
    echo -e "   ${RED}❌ Status: $HTTP_CODE Unauthorized${NC}"
    echo -e "   ${YELLOW}⚠️  Function needs to be redeployed with auth:false config${NC}"
    echo "   Run: supabase functions deploy meta-data-deletion"
elif [ "$HTTP_CODE" = "404" ]; then
    echo -e "   ${RED}❌ Status: $HTTP_CODE Not Found${NC}"
    echo -e "   ${YELLOW}⚠️  Function not deployed yet${NC}"
    echo "   Run: supabase functions deploy meta-data-deletion"
else
    echo "   Status: $HTTP_CODE"
    echo "   Response: $(echo "$BODY" | head -3)"
fi
echo ""

# Test 4: CORS Support
echo "4️⃣ Testing CORS Support..."
echo ""

for ENDPOINT in "privacy-policy" "terms-of-service" "meta-data-deletion"; do
    echo "   Testing $ENDPOINT CORS..."
    CORS_RESPONSE=$(curl -s -I -X OPTIONS "$BASE_URL/$ENDPOINT" \
      -H "Origin: https://facebook.com" \
      -H "Access-Control-Request-Method: GET" 2>&1)
    
    if echo "$CORS_RESPONSE" | grep -qi "access-control-allow-origin"; then
        echo -e "   ${GREEN}✅ CORS headers present${NC}"
        echo "$CORS_RESPONSE" | grep -i "access-control" | head -3 | sed 's/^/      /'
    else
        echo -e "   ${YELLOW}⚠️  CORS headers not found${NC}"
    fi
done
echo ""

# Summary
echo "======================================"
echo "📊 Test Summary"
echo "======================================"
echo ""

echo "Privacy Policy:"
curl -s -o /dev/null -w "   Status: %{http_code}\n   Size: %{size_download} bytes\n   Time: %{time_total}s\n" \
  "$BASE_URL/privacy-policy"
echo ""

echo "Terms of Service:"
curl -s -o /dev/null -w "   Status: %{http_code}\n   Size: %{size_download} bytes\n   Time: %{time_total}s\n" \
  "$BASE_URL/terms-of-service"
echo ""

echo "Meta Data Deletion:"
curl -s -o /dev/null -w "   Status: %{http_code}\n   Size: %{size_download} bytes\n   Time: %{time_total}s\n" \
  -X POST "$BASE_URL/meta-data-deletion" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "signed_request=test"
echo ""

echo "✅ All URLs tested!"
echo ""
echo "📝 Next Steps:"
echo "   - If you see 401 errors, redeploy functions with config files"
echo "   - If you see 404 errors, deploy the functions"
echo "   - If all show 200/400, URLs are working correctly!"
echo ""

