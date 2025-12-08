#!/bin/bash

# Test script for Meta Data Deletion endpoints
# This script tests both the backend endpoint and the Supabase Edge Function

echo "🧪 Testing Meta Data Deletion Endpoints"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="${BACKEND_URL:-http://localhost:3000}"
SUPABASE_FUNCTION_URL="${SUPABASE_FUNCTION_URL:-https://zfbqgnnbfkadwprqahbz.supabase.co/functions/v1/meta-data-deletion}"

echo "📋 Configuration:"
echo "  Backend URL: $BACKEND_URL"
echo "  Supabase Function URL: $SUPABASE_FUNCTION_URL"
echo ""

# Test 1: Check if backend server is running
echo "🔍 Test 1: Checking if backend server is running..."
if curl -s -f "$BACKEND_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend server is running${NC}"
else
    echo -e "${RED}❌ Backend server is not running or not accessible${NC}"
    echo "   Please start your server: cd server && npm run dev"
    exit 1
fi
echo ""

# Test 2: Test backend DELETE endpoint (without authentication - for Edge Function)
echo "🔍 Test 2: Testing backend DELETE endpoint..."
echo "   Endpoint: DELETE $BACKEND_URL/api/auth/facebook/delete-user"
echo ""

# Create a test request
TEST_FACEBOOK_ID="test_facebook_123456"
RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "$BACKEND_URL/api/auth/facebook/delete-user" \
  -H "Content-Type: application/json" \
  -d "{\"facebookUserId\": \"$TEST_FACEBOOK_ID\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "   HTTP Status: $HTTP_CODE"
echo "   Response: $BODY"
echo ""

if [ "$HTTP_CODE" -eq 404 ]; then
    echo -e "${YELLOW}⚠️  User not found (expected if test user doesn't exist)${NC}"
    echo -e "${GREEN}✅ Endpoint is working correctly${NC}"
elif [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ User deleted successfully${NC}"
elif [ "$HTTP_CODE" -eq 500 ]; then
    echo -e "${RED}❌ Server error - check backend logs${NC}"
else
    echo -e "${YELLOW}⚠️  Unexpected status code: $HTTP_CODE${NC}"
fi
echo ""

# Test 3: Test Supabase Edge Function (if deployed)
echo "🔍 Test 3: Testing Supabase Edge Function..."
echo "   Endpoint: POST $SUPABASE_FUNCTION_URL"
echo ""

# Create a mock signed_request for testing
# Note: This is a simplified test - real signed_request from Meta will be different
MOCK_SIGNED_REQUEST="test_signed_request_$(date +%s)"

echo "   Sending test request with mock signed_request..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$SUPABASE_FUNCTION_URL" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "signed_request=$MOCK_SIGNED_REQUEST")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "   HTTP Status: $HTTP_CODE"
echo "   Response: $BODY"
echo ""

if [ "$HTTP_CODE" -eq 400 ]; then
    echo -e "${YELLOW}⚠️  Invalid signed_request (expected with mock data)${NC}"
    echo -e "${GREEN}✅ Function is deployed and responding${NC}"
elif [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Function processed request successfully${NC}"
elif [ "$HTTP_CODE" -eq 404 ] || [ "$HTTP_CODE" -eq 000 ]; then
    echo -e "${RED}❌ Function not found or not deployed${NC}"
    echo "   Deploy the function: supabase functions deploy meta-data-deletion"
elif [ "$HTTP_CODE" -eq 500 ]; then
    echo -e "${RED}❌ Function error - check Supabase logs${NC}"
else
    echo -e "${YELLOW}⚠️  Unexpected status code: $HTTP_CODE${NC}"
fi
echo ""

# Test 4: Test CORS (OPTIONS request)
echo "🔍 Test 4: Testing CORS support..."
echo "   Endpoint: OPTIONS $SUPABASE_FUNCTION_URL"
echo ""

CORS_RESPONSE=$(curl -s -w "\n%{http_code}" -X OPTIONS "$SUPABASE_FUNCTION_URL" \
  -H "Origin: https://facebook.com" \
  -H "Access-Control-Request-Method: POST")

CORS_HTTP_CODE=$(echo "$CORS_RESPONSE" | tail -n1)
CORS_HEADERS=$(curl -s -I -X OPTIONS "$SUPABASE_FUNCTION_URL" | grep -i "access-control")

echo "   HTTP Status: $CORS_HTTP_CODE"
if [ -n "$CORS_HEADERS" ]; then
    echo "   CORS Headers: $CORS_HEADERS"
    echo -e "${GREEN}✅ CORS is configured${NC}"
else
    echo -e "${YELLOW}⚠️  CORS headers not found${NC}"
fi
echo ""

# Summary
echo "========================================"
echo "📊 Test Summary"
echo "========================================"
echo ""
echo "✅ Backend endpoint: DELETE /api/auth/facebook/delete-user"
echo "   - Tested with mock Facebook user ID"
echo ""
echo "✅ Supabase Edge Function: POST /functions/v1/meta-data-deletion"
echo "   - Tested with mock signed_request"
echo ""
echo "📝 Next Steps:"
echo "   1. Deploy Edge Function if not deployed:"
echo "      supabase functions deploy meta-data-deletion"
echo ""
echo "   2. Add function URL to Facebook App:"
echo "      https://zfbqgnnbfkadwprqahbz.supabase.co/functions/v1/meta-data-deletion"
echo ""
echo "   3. Test with real Meta signed_request (from Facebook App dashboard)"
echo ""

