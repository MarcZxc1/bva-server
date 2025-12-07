# How to Remove All Data from Your Database

There are several ways to clear all data from your database. Choose the method that works best for you:

## 🚀 Method 1: Using the Clear Script (Recommended)

I've created a dedicated script to clear all data:

```bash
cd server
npm run db:clear
```

Or directly:
```bash
cd server
ts-node prisma/clear-db.ts
```

This will:
- ✅ Delete all records from all tables
- ✅ Show a summary of what was deleted
- ✅ Handle foreign key constraints correctly

---

## 🔄 Method 2: Reset Database (Clear + Seed)

To clear all data AND immediately seed with fresh data:

```bash
cd server
npm run db:reset
```

This runs:
1. `clear-db.ts` - Removes all data
2. `seed.ts` - Seeds with 2 entities

---

## 🌱 Method 3: Using Seed Script

The seed script already clears data before seeding:

```bash
cd server
npm run seed
```

**Note:** This will clear data AND create new seed data. If you only want to clear without seeding, use Method 1.

---

## 🗄️ Method 4: Using Prisma Studio (Manual)

1. Open Prisma Studio:
   ```bash
   cd server
   npm run studio
   ```

2. For each table:
   - Click on the table name
   - Select all records (Ctrl+A / Cmd+A)
   - Click "Delete" button
   - Confirm deletion

3. Delete in this order to avoid foreign key errors:
   - InventoryLog
   - Inventory
   - Forecast
   - Sale
   - Campaign
   - Integration
   - Product
   - Notification
   - Shop
   - User

---

## 💻 Method 5: Using SQL (psql)

Connect to your database and run:

```sql
-- Connect to database
psql $DATABASE_URL

-- Delete all data (in correct order)
DELETE FROM "InventoryLog";
DELETE FROM "Inventory";
DELETE FROM "Forecast";
DELETE FROM "Sale";
DELETE FROM "Campaign";
DELETE FROM "Integration";
DELETE FROM "Product";
DELETE FROM "Notification";
DELETE FROM "Shop";
DELETE FROM "User";

-- Verify all tables are empty
SELECT 
  'User' as table_name, COUNT(*) as count FROM "User"
UNION ALL
SELECT 'Shop', COUNT(*) FROM "Shop"
UNION ALL
SELECT 'Product', COUNT(*) FROM "Product"
UNION ALL
SELECT 'Sale', COUNT(*) FROM "Sale"
UNION ALL
SELECT 'Inventory', COUNT(*) FROM "Inventory"
UNION ALL
SELECT 'Campaign', COUNT(*) FROM "Campaign"
UNION ALL
SELECT 'Integration', COUNT(*) FROM "Integration"
UNION ALL
SELECT 'Notification', COUNT(*) FROM "Notification"
UNION ALL
SELECT 'Forecast', COUNT(*) FROM "Forecast"
UNION ALL
SELECT 'InventoryLog', COUNT(*) FROM "InventoryLog";
```

---

## 🔥 Method 6: Drop and Recreate Database (Nuclear Option)

**⚠️ WARNING: This will delete the entire database and recreate it!**

```bash
cd server

# Drop and recreate database
npx prisma migrate reset

# This will:
# 1. Drop the database
# 2. Create a new database
# 3. Run all migrations
# 4. Run seed script (if configured)
```

**Note:** This requires database admin privileges and will lose all schema changes if migrations aren't up to date.

---

## 📋 Quick Reference

| Method | Command | Clears Data | Seeds Data |
|--------|---------|-------------|------------|
| Clear Script | `npm run db:clear` | ✅ | ❌ |
| Reset (Clear + Seed) | `npm run db:reset` | ✅ | ✅ |
| Seed Script | `npm run seed` | ✅ | ✅ |
| Prisma Studio | `npm run studio` | ✅ (manual) | ❌ |
| SQL | `psql` + DELETE | ✅ | ❌ |
| Migrate Reset | `npx prisma migrate reset` | ✅ | ✅ (if configured) |

---

## ⚠️ Important Notes

1. **Backup First**: If you have important data, back it up before clearing:
   ```bash
   pg_dump $DATABASE_URL > backup.sql
   ```

2. **Order Matters**: Always delete in the correct order to respect foreign key constraints:
   - Child tables first (InventoryLog, Inventory, Forecast, Sale, etc.)
   - Parent tables last (Shop, User)

3. **Irreversible**: Once deleted, data cannot be recovered unless you have a backup.

4. **Development Only**: These methods are for development. In production, use proper data migration strategies.

---

## 🎯 Recommended Workflow

For development:
```bash
# Clear everything and start fresh
npm run db:reset
```

This gives you a clean database with 2 test entities ready to use!

