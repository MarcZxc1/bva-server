#!/bin/bash

# Script to organize root directory files
# This will move files to appropriate directories

echo "🧹 Organizing root directory files..."

# Create directories if they don't exist
mkdir -p docs
mkdir -p scripts
mkdir -p config

# Move documentation files to docs/
echo "📚 Moving documentation files..."
mv -v DATA_ISOLATION_FIX.md docs/ 2>/dev/null
mv -v DOCKER_DEPLOYMENT.md docs/ 2>/dev/null
mv -v FACEBOOK_INSTAGRAM_INTEGRATION.md docs/ 2>/dev/null
mv -v GEMINI_SETUP_GUIDE.md docs/ 2>/dev/null
mv -v GIT_COMMANDS.md docs/ 2>/dev/null
mv -v IMAGE_GENERATION.md docs/ 2>/dev/null
mv -v LINUX_SETUP.md docs/ 2>/dev/null
mv -v MVP_INTEGRATION_COMPLETE.md docs/ 2>/dev/null
mv -v MVP_INTEGRATION_SUMMARY.md docs/ 2>/dev/null
mv -v PROJECT_DOCUMENTATION.md docs/ 2>/dev/null
mv -v QUICK_REFERENCE.md docs/ 2>/dev/null
mv -v SETUP_COMPLETE.md docs/ 2>/dev/null
mv -v SHOPEE_CLONE_SETUP.md docs/ 2>/dev/null
mv -v SHOPEE_DELIVERY_SUMMARY.md docs/ 2>/dev/null
mv -v SHOPEE_README.md docs/ 2>/dev/null
mv -v SSO_IMPLEMENTATION_REPORT.md docs/ 2>/dev/null

# Move test/script files to scripts/
echo "🔧 Moving test and script files..."
mv -v test_auth_isolation.sh scripts/ 2>/dev/null
mv -v test_image_generation.sh scripts/ 2>/dev/null
mv -v shopee-api-tests.http scripts/ 2>/dev/null

# Move config files to config/
echo "⚙️  Moving config files..."
mv -v shopee-clone-schema.prisma config/ 2>/dev/null
mv -v shopee-package.json config/ 2>/dev/null
mv -v shopee-tsconfig.json config/ 2>/dev/null

# Clean up temporary files (these should be in .gitignore)
echo "🗑️  Removing temporary files..."
rm -f body.json
rm -f result.json
rm -f response.json
rm -f server.log

echo "✅ Cleanup complete!"
echo ""
echo "📁 New structure:"
echo "   docs/     - All documentation files"
echo "   scripts/  - Test scripts and HTTP files"
echo "   config/   - Configuration files"
echo ""
echo "💡 Tip: Update your .gitignore to exclude temporary files"

