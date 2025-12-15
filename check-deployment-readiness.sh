#!/bin/bash

# BVA Project - Deployment Readiness Check
# This script validates your project is ready for deployment

set -e

echo "🚀 BVA Project Deployment Readiness Check"
echo "=========================================="
echo ""

ERRORS=0
WARNINGS=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check functions
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((ERRORS++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

# 1. Check Git Repository
echo "📦 Checking Git Repository..."
if [ -d .git ]; then
    check_pass "Git repository initialized"
    
    # Check for uncommitted changes
    if [[ -n $(git status -s) ]]; then
        check_warn "You have uncommitted changes. Commit them before deploying."
    else
        check_pass "No uncommitted changes"
    fi
    
    # Check remote
    if git remote get-url origin &>/dev/null; then
        REMOTE=$(git remote get-url origin)
        check_pass "Git remote configured: $REMOTE"
    else
        check_fail "No Git remote configured. Add one with: git remote add origin <url>"
    fi
else
    check_fail "Not a Git repository. Initialize with: git init"
fi
echo ""

# 2. Check Server Files
echo "🖥️  Checking Server Files..."
if [ -f "server/package.json" ]; then
    check_pass "server/package.json exists"
else
    check_fail "server/package.json missing"
fi

if [ -f "server/tsconfig.json" ]; then
    check_pass "server/tsconfig.json exists"
else
    check_fail "server/tsconfig.json missing"
fi

if [ -f "server/prisma/schema.prisma" ]; then
    check_pass "server/prisma/schema.prisma exists"
else
    check_fail "server/prisma/schema.prisma missing"
fi

if [ -f "server/.env.example" ]; then
    check_pass "server/.env.example exists"
else
    check_warn "server/.env.example missing (recommended for documentation)"
fi
echo ""

# 3. Check ML Service Files
echo "🤖 Checking ML Service Files..."
if [ -f "ml-service/requirements.txt" ]; then
    check_pass "ml-service/requirements.txt exists"
else
    check_fail "ml-service/requirements.txt missing"
fi

if [ -f "ml-service/app/main.py" ]; then
    check_pass "ml-service/app/main.py exists"
else
    check_fail "ml-service/app/main.py missing"
fi

if [ -f "ml-service/.env.example" ]; then
    check_pass "ml-service/.env.example exists"
else
    check_warn "ml-service/.env.example missing"
fi
echo ""

# 4. Check Frontend Files
echo "🎨 Checking Frontend Files..."
FRONTENDS=("bva-frontend" "shopee-clone" "lazada-clone" "tiktokseller-clone")
for frontend in "${FRONTENDS[@]}"; do
    if [ -d "$frontend" ]; then
        if [ -f "$frontend/package.json" ]; then
            check_pass "$frontend/package.json exists"
        else
            check_fail "$frontend/package.json missing"
        fi
    else
        check_warn "$frontend directory not found (optional)"
    fi
done
echo ""

# 5. Check Deployment Files
echo "📋 Checking Deployment Configuration Files..."
if [ -f "render.yaml" ]; then
    check_pass "render.yaml exists"
else
    check_warn "render.yaml missing (needed for Render deployment)"
fi

if [ -f "bva-frontend/vercel.json" ]; then
    check_pass "bva-frontend/vercel.json exists"
else
    check_warn "bva-frontend/vercel.json missing (needed for Vercel)"
fi

if [ -f "DEPLOYMENT_GUIDE.md" ]; then
    check_pass "DEPLOYMENT_GUIDE.md exists"
else
    check_warn "DEPLOYMENT_GUIDE.md missing (documentation)"
fi
echo ""

# 6. Check Environment Files
echo "🔐 Checking Environment Configuration..."
if [ -f ".env.production.example" ]; then
    check_pass ".env.production.example exists"
else
    check_warn ".env.production.example missing"
fi

if [ -f "server/.env" ]; then
    check_warn "server/.env exists (should NOT be committed to Git)"
    
    # Check if .env is in .gitignore
    if grep -q "\.env" .gitignore 2>/dev/null; then
        check_pass ".env is in .gitignore"
    else
        check_fail ".env NOT in .gitignore - This is a security risk!"
    fi
fi
echo ""

# 7. Check Dependencies
echo "📦 Checking Dependencies..."
cd server
if [ -f "package-lock.json" ]; then
    check_pass "server/package-lock.json exists"
else
    check_warn "server/package-lock.json missing. Run: npm install"
fi
cd ..

cd ml-service
if command -v python3 &>/dev/null; then
    check_pass "Python 3 is installed"
else
    check_fail "Python 3 is not installed"
fi
cd ..
echo ""

# 8. Build Tests
echo "🔨 Testing Builds..."
echo "Testing server build..."
cd server
if npm run build &>/dev/null; then
    check_pass "Server builds successfully"
else
    check_fail "Server build failed. Run: cd server && npm run build"
fi
cd ..

echo "Testing frontend build..."
cd bva-frontend
if npm run build &>/dev/null; then
    check_pass "Frontend builds successfully"
else
    check_fail "Frontend build failed. Run: cd bva-frontend && npm run build"
fi
cd ..
echo ""

# Summary
echo "=========================================="
echo "📊 Summary"
echo "=========================================="
echo -e "Passed: ${GREEN}$(($(find . -name "*.md" | wc -l) - ERRORS - WARNINGS))${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo -e "Errors: ${RED}$ERRORS${NC}"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ Your project is ready for deployment!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Review DEPLOYMENT_GUIDE.md"
    echo "2. Set up accounts on Neon, Upstash, Render, and Vercel"
    echo "3. Push your code to GitHub"
    echo "4. Follow the deployment guide to deploy each service"
    exit 0
else
    echo -e "${RED}❌ Please fix the errors above before deploying${NC}"
    exit 1
fi
