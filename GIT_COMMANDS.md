# Git Commands for MVP Integration

## Quick Deploy (Copy and Paste)

```bash
# Stage all changes
git add .

# Commit with conventional commit message
git commit -m "feat: integrate core mvp features (ads, restock, analytics)

- Enhanced mlClient.ts with feature-specific methods for all 3 MVP features
- Updated AdController with proper error handling and image generation
- Added SmartShelf dashboard analytics endpoint
- Improved frontend hooks with better error handling
- Fixed MarketMate to handle new API response structure
- Implemented API Gateway pattern - all ML requests go through Node.js
- Added comprehensive error handling (503 for service unavailable)
- Created type-safe DTOs shared between frontend and backend

Features:
- MarketMate: AI ad copy + image generation
- Smart Restock Planner: Demand forecasting + optimization
- SmartShelf: Dashboard analytics with ML forecasts

Breaking changes: None
Closes: MVP-001"

# Push to main branch
git push origin main
```

---

## Step-by-Step (For Review)

### 1. Check Current Status
```bash
git status
```

### 2. Review Changes
```bash
# See what changed
git diff

# See changed files
git diff --name-only
```

### 3. Stage Changes

**Option A: Stage all changes**
```bash
git add .
```

**Option B: Stage specific files**
```bash
# Backend
git add server/src/utils/mlClient.ts
git add server/src/controllers/ad.controller.ts
git add server/src/controllers/smartShelf.controller.ts
git add server/src/service/ad.service.ts
git add server/src/service/smartShelf.service.ts
git add server/src/api/ads/ad.router.ts
git add server/src/routes/smartShelf.routes.ts

# Frontend
git add bva-frontend/src/api/ai.service.ts
git add bva-frontend/src/hooks/useRestock.ts
git add bva-frontend/src/hooks/useSmartShelf.ts
git add bva-frontend/src/pages/MarketMate.tsx

# Documentation
git add MVP_INTEGRATION_SUMMARY.md
git add GIT_COMMANDS.md
```

### 4. Commit with Conventional Commits

```bash
git commit -m "feat: integrate core mvp features (ads, restock, analytics)

- Enhanced mlClient.ts with feature-specific methods for all 3 MVP features
- Updated AdController with proper error handling and image generation  
- Added SmartShelf dashboard analytics endpoint
- Improved frontend hooks with better error handling
- Fixed MarketMate to handle new API response structure
- Implemented API Gateway pattern - all ML requests go through Node.js
- Added comprehensive error handling (503 for service unavailable)
- Created type-safe DTOs shared between frontend and backend

Features:
- MarketMate: AI ad copy + image generation
- Smart Restock Planner: Demand forecasting + optimization
- SmartShelf: Dashboard analytics with ML forecasts

Breaking changes: None
Closes: MVP-001"
```

### 5. Push to Remote

```bash
# Push to main branch
git push origin main

# If you encounter issues, force push (use with caution)
git push origin main --force
```

### 6. Verify Push

```bash
# Check remote status
git fetch
git status

# View commit history
git log --oneline -5
```

---

## Alternative: Create Feature Branch

If you prefer to create a feature branch instead:

```bash
# Create and switch to feature branch
git checkout -b feat/mvp-integration

# Stage and commit
git add .
git commit -m "feat: integrate core mvp features (ads, restock, analytics)"

# Push feature branch
git push origin feat/mvp-integration

# Create pull request on GitHub
# Then merge to main via GitHub UI
```

---

## Rollback (If Needed)

### Undo Last Commit (Keep Changes)
```bash
git reset --soft HEAD~1
```

### Undo Last Commit (Discard Changes)
```bash
git reset --hard HEAD~1
```

### Revert Specific Commit
```bash
git revert <commit-hash>
```

---

## Conventional Commit Types

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `perf:` Performance improvements
- `test:` Test additions/changes
- `chore:` Build process or auxiliary tool changes

---

## Verification Checklist

Before pushing, verify:

- [ ] All services start without errors
- [ ] Backend server runs on port 5000
- [ ] ML service runs on port 8001
- [ ] Frontend runs on port 8080 (or configured port)
- [ ] MarketMate ad generation works
- [ ] Restock Planner generates recommendations
- [ ] Dashboard displays analytics
- [ ] Error handling works (stop ML service and verify 503 errors)
- [ ] No console errors in browser
- [ ] No TypeScript compilation errors

---

## Tags (Optional)

After pushing, you can tag this release:

```bash
# Create tag
git tag -a v1.0.0-mvp -m "MVP Release: Core features integrated"

# Push tag
git push origin v1.0.0-mvp

# List all tags
git tag -l
```

---

## Quick Fix (After Push)

If you need to make a quick fix:

```bash
# Make your changes
# ...

# Stage and commit
git add .
git commit -m "fix: correct error handling in MarketMate"

# Push
git push origin main
```

---

## GitHub Actions (If Configured)

After pushing, check:
1. Go to GitHub repository
2. Click "Actions" tab
3. Verify CI/CD pipeline passes
4. Check deployment status

---

## Need Help?

- View commit history: `git log`
- View file changes: `git diff <file>`
- Discard local changes: `git checkout -- <file>`
- Show remote URL: `git remote -v`
- Switch branch: `git checkout <branch-name>`
