# Database Accounts Report - Shop & Product Data

## 📊 Summary

**Total Users:** 21  
**Users with Shops:** 4  
**Accounts with Complete Data:** 3 ✅  
**Accounts with Incomplete Data:** 1 ⚠️

---

## ✅ Accounts with Complete Data (Ready for All Features)

### 1. **Marc Gerald Dagode** (Recommended for Testing)
- **Email:** `dagodemarcgeraldarante@gmail.com`
- **Role:** SELLER
- **Shop:** Marc Gerald Dagode's Shop
- **Shop ID:** `0d1a989a-f359-49e9-93ba-59b399b6bc65`
- **Products:** 64
- **Inventory Records:** 64
- **Sales Records:** 3,710

**Feature Readiness:**
- ✅ **Dashboard:** Ready (3,710 sales records)
- ✅ **Inventory/SmartShelf:** Ready (64 products with inventory)
- ✅ **Restock Planner:** Ready (products, inventory, and sales history)

---

### 2. **Gerald Cram** (Recommended for Testing)
- **Email:** `kagureyasuo@gmail.com`
- **Role:** SELLER
- **Shop:** Gerald Cram's Shop
- **Shop ID:** `0b790497-3db3-4901-803d-6077945fea36`
- **Products:** 64
- **Inventory Records:** 64
- **Sales Records:** 3,712

**Feature Readiness:**
- ✅ **Dashboard:** Ready (3,712 sales records)
- ✅ **Inventory/SmartShelf:** Ready (64 products with inventory)
- ✅ **Restock Planner:** Ready (products, inventory, and sales history)

---

### 3. **Test Admin** (Recommended for Testing)
- **Email:** `admin@test.com`
- **Role:** ADMIN
- **Shop:** Main Store
- **Shop ID:** `2aad5d00-d302-4c57-86ad-99826e19e610`
- **Products:** 20
- **Inventory Records:** 20
- **Sales Records:** 20

**Feature Readiness:**
- ✅ **Dashboard:** Ready (20 sales records)
- ✅ **Inventory/SmartShelf:** Ready (20 products with inventory)
- ✅ **Restock Planner:** Ready (products, inventory, and sales history)

---

## ⚠️ Accounts with Incomplete Data

### 4. **Yoink**
- **Email:** `marc11@example.com`
- **Role:** SELLER
- **Shop:** Yoink's Shop
- **Shop ID:** `dbe8333d-66a2-484b-8cd9-4f442153ac6c`
- **Products:** 0
- **Inventory Records:** 0
- **Sales Records:** 0

**Feature Readiness:**
- ❌ **Dashboard:** Needs sales data
- ❌ **Inventory/SmartShelf:** Needs products/inventory
- ❌ **Restock Planner:** Needs products, inventory, and sales

**Note:** This account has a shop but no seeded data. It was likely created without the seeding process.

---

## 🎯 Recommended Testing Accounts

For testing the three main features, use these accounts:

1. **Best for Full Testing:** `dagodemarcgeraldarante@gmail.com`
   - Most comprehensive data (64 products, 3,710 sales)
   - Perfect for testing all features with realistic data

2. **Alternative:** `kagureyasuo@gmail.com`
   - Similar data to account #1 (64 products, 3,712 sales)
   - Good for parallel testing or comparison

3. **Quick Testing:** `admin@test.com`
   - Smaller dataset (20 products, 20 sales)
   - Good for quick feature validation

---

## 📋 Data Requirements by Feature

### Dashboard
- ✅ **Required:** Sales records
- ✅ **Optional:** Products, Inventory

### Inventory/SmartShelf
- ✅ **Required:** Products with Inventory records
- ✅ **Optional:** Sales data (for better insights)

### Restock Planner
- ✅ **Required:** Products, Inventory, and Sales history
- ✅ **Needs:** Historical sales data for forecasting

---

## 🔧 How to Use These Accounts

### Option 1: Login via Frontend
1. Go to `/login`
2. Use one of the recommended email addresses
3. You'll need the password (check your `.env` or database)

### Option 2: Use Shop ID Directly
If you're testing via API, use the Shop IDs:
- `0d1a989a-f359-49e9-93ba-59b399b6bc65` (Marc Gerald Dagode)
- `0b790497-3db3-4901-803d-6077945fea36` (Gerald Cram)
- `2aad5d00-d302-4c57-86ad-99826e19e610` (Test Admin)

---

## 📝 Notes

- All complete accounts have been seeded with the `seedShopData()` function
- The seeding process creates:
  - 64 products (or 20 for Test Admin)
  - Inventory records for each product
  - 60 days of sales history (or 20 sales for Test Admin)
- The incomplete account (`marc11@example.com`) needs to be seeded manually if you want to use it for testing

---

**Generated:** December 2024  
**Script:** `server/check_shop_data.ts`

