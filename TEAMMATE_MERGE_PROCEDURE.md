# Teammate Repository Merge Procedure

This document outlines the commands used to merge updates from a teammate's repository into the feature branch.

## Teammate Repository Information

**Repository URL:** https://github.com/CODIIIIIIIII/Merge.git  
**Branch Used:** `SHOPEE-FRONTEND`  
**Date Merged:** December 7, 2024

## Merge Process

### Step 1: Add Teammate's Repository as Remote
```bash
git remote add teammate https://github.com/CODIIIIIIIII/Merge.git
```
**Purpose:** Add the teammate's repository as a remote named "teammate" for easy access.

**Note:** If the remote already exists, use:
```bash
git remote set-url teammate https://github.com/CODIIIIIIIII/Merge.git
```

### Step 2: Fetch Latest Changes from Teammate's Repository
```bash
git fetch teammate
```
**Purpose:** Download all branches and commits from the teammate's repository without merging them.

### Step 3: Switch to Feature Branch
```bash
git checkout feature
```
**Purpose:** Ensure we're on the feature branch before merging updates.

### Step 4: Check Available Branches
```bash
git branch -r | grep teammate
```
**Purpose:** Verify which branches are available from the teammate's repository.

**Expected Output:**
```
teammate/SHOPEE-FRONTEND
teammate/main
```

### Step 5: Checkout Shopee-Clone from Teammate's Branch
```bash
git checkout teammate/SHOPEE-FRONTEND -- SHOPEE-CLONEE-seller-copy
```
**Purpose:** Extract the shopee-clone folder from the teammate's repository structure.

### Step 6: Copy and Replace Existing Shopee-Clone
```bash
rm -rf shopee-clone
cp -r SHOPEE-CLONEE-seller-copy/SHOPEE-CLONEE-seller-copy/Shopee-Clone shopee-clone
rm -rf SHOPEE-CLONEE-seller-copy
```
**Purpose:** 
- Remove the old shopee-clone folder
- Copy the updated shopee-clone from the teammate's repository structure
- Clean up the temporary folder structure

### Step 7: Stage and Commit Changes
```bash
git add shopee-clone/
git commit -m "feat: Update shopee-clone from teammate's repository

- Merged latest shopee-clone updates from teammate/SHOPEE-FRONTEND branch
- Updated shopee-clone with latest features and improvements
- Source: https://github.com/CODIIIIIIIII/Merge.git (SHOPEE-FRONTEND branch)"
```
**Purpose:** Stage the updated shopee-clone folder and commit with a descriptive message.

### Step 8: Push to Remote Feature Branch
```bash
git push origin feature
```
**Purpose:** Push the updated feature branch to the remote repository.

## Verification Commands

To verify the merge was successful:

```bash
# Check current branch
git branch --show-current

# View recent commits
git log --oneline -5

# Check shopee-clone structure
ls -la shopee-clone/

# Verify remote is set up correctly
git remote -v

# Check what branches are available from teammate
git branch -r | grep teammate
```

## Future Updates

To update shopee-clone from the teammate's repository in the future:

1. Fetch latest changes:
   ```bash
   git fetch teammate
   ```

2. Checkout the updated shopee-clone:
   ```bash
   git checkout teammate/SHOPEE-FRONTEND -- SHOPEE-CLONEE-seller-copy
   ```

3. Replace existing shopee-clone:
   ```bash
   rm -rf shopee-clone
   cp -r SHOPEE-CLONEE-seller-copy/SHOPEE-CLONEE-seller-copy/Shopee-Clone shopee-clone
   rm -rf SHOPEE-CLONEE-seller-copy
   ```

4. Commit and push:
   ```bash
   git add shopee-clone/
   git commit -m "feat: Update shopee-clone from teammate repository"
   git push origin feature
   ```

## Notes

- The teammate's repository structure has shopee-clone nested in `SHOPEE-CLONEE-seller-copy/SHOPEE-CLONEE-seller-copy/Shopee-Clone/`
- We extract and copy it to the root-level `shopee-clone/` folder to maintain consistency with our project structure
- The remote "teammate" is kept for future updates
- Always verify the shopee-clone structure after merging to ensure all files are present

## Troubleshooting

### If remote already exists:
```bash
git remote set-url teammate https://github.com/CODIIIIIIIII/Merge.git
```

### If there are merge conflicts:
```bash
# Check which files have conflicts
git status

# Resolve conflicts manually, then:
git add .
git commit -m "fix: Resolve merge conflicts from teammate repository"
```

### If shopee-clone structure is different:
```bash
# Check the structure in teammate's repository
git ls-tree -r --name-only teammate/SHOPEE-FRONTEND | grep -i shopee

# Adjust the copy path accordingly
```

