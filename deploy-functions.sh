#!/bin/bash

# Deploy all Supabase Edge Functions with public access configuration

echo "🚀 Deploying Supabase Edge Functions"
echo "====================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if logged in
echo "1️⃣ Checking Supabase login status..."
if ! supabase projects list &>/dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in. Logging in...${NC}"
    supabase login
else
    echo -e "${GREEN}✅ Already logged in${NC}"
fi
echo ""

# Check if project is linked
echo "2️⃣ Checking project link..."
if [ ! -f ".supabase/config.toml" ] && [ ! -f "supabase/.temp/project-ref" ]; then
    echo -e "${YELLOW}⚠️  Project not linked. Linking...${NC}"
    supabase link --project-ref zfbqgnnbfkadwprqahbz
else
    echo -e "${GREEN}✅ Project is linked${NC}"
fi
echo ""

# Verify config files exist
echo "3️⃣ Verifying configuration files..."
MISSING_CONFIGS=0

for func in privacy-policy terms-of-service meta-data-deletion; do
    if [ -f "supabase/functions/$func/supabase.functions.config.json" ]; then
        echo -e "   ${GREEN}✅ $func/config.json exists${NC}"
    else
        echo -e "   ${RED}❌ $func/config.json missing${NC}"
        MISSING_CONFIGS=1
    fi
done

if [ -f "supabase/config.toml" ]; then
    echo -e "   ${GREEN}✅ Root config.toml exists${NC}"
else
    echo -e "   ${RED}❌ Root config.toml missing${NC}"
    MISSING_CONFIGS=1
fi

if [ $MISSING_CONFIGS -eq 1 ]; then
    echo -e "${RED}❌ Some config files are missing. Please create them first.${NC}"
    exit 1
fi
echo ""

# Deploy functions
echo "4️⃣ Deploying functions..."
echo ""

FUNCTIONS=("privacy-policy" "terms-of-service" "meta-data-deletion")
FAILED=0

for func in "${FUNCTIONS[@]}"; do
    echo "   Deploying $func..."
    if supabase functions deploy "$func"; then
        echo -e "   ${GREEN}✅ $func deployed successfully${NC}"
    else
        echo -e "   ${RED}❌ $func deployment failed${NC}"
        FAILED=1
    fi
    echo ""
done

if [ $FAILED -eq 1 ]; then
    echo -e "${RED}❌ Some deployments failed. Please check the errors above.${NC}"
    exit 1
fi

echo "====================================="
echo -e "${GREEN}✅ All functions deployed successfully!${NC}"
echo "====================================="
echo ""
echo "⏳ Waiting 15 seconds for deployment to propagate..."
sleep 15
echo ""
echo "🧪 Testing endpoints..."
echo ""

BASE_URL="https://zfbqgnnbfkadwprqahbz.supabase.co/functions/v1"

# Test Privacy Policy
echo "Testing Privacy Policy..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/privacy-policy")
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "   ${GREEN}✅ Privacy Policy: $HTTP_CODE OK${NC}"
else
    echo -e "   ${RED}❌ Privacy Policy: $HTTP_CODE${NC}"
fi

# Test Terms of Service
echo "Testing Terms of Service..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/terms-of-service")
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "   ${GREEN}✅ Terms of Service: $HTTP_CODE OK${NC}"
else
    echo -e "   ${RED}❌ Terms of Service: $HTTP_CODE${NC}"
fi

# Test Meta Data Deletion
echo "Testing Meta Data Deletion..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/meta-data-deletion" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "signed_request=test")
if [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "200" ]; then
    echo -e "   ${GREEN}✅ Meta Data Deletion: $HTTP_CODE (expected)${NC}"
else
    echo -e "   ${RED}❌ Meta Data Deletion: $HTTP_CODE${NC}"
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Test in incognito browser:"
echo "   Privacy Policy: $BASE_URL/privacy-policy"
echo "   Terms of Service: $BASE_URL/terms-of-service"
echo ""

