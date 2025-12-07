# How to View Your Database

Your database is PostgreSQL. Here are several ways to view and interact with it:

## 🎨 Method 1: Prisma Studio (Easiest - Visual Browser)

**Prisma Studio** is a visual database browser that lets you view and edit data through a web interface.

### Run Prisma Studio:
```bash
cd server
npm run studio
```

Or directly:
```bash
cd server
npx prisma studio
```

This will:
- Open a web browser automatically at `http://localhost:5555`
- Show all your tables in a sidebar
- Let you browse, search, and edit data visually
- No SQL knowledge required!

### Features:
- ✅ View all tables and their data
- ✅ Search and filter records
- ✅ Add, edit, and delete records
- ✅ See relationships between tables
- ✅ Export data

---

## 💻 Method 2: Command Line (psql)

If you have PostgreSQL client installed, you can use `psql`:

### Connect to database:
```bash
# Get your DATABASE_URL from .env file first
psql $DATABASE_URL
```

Or if you have connection details:
```bash
psql -h localhost -U your_username -d your_database_name
```

### Useful psql commands:
```sql
-- List all tables
\dt

-- View all users
SELECT * FROM "User";

-- View all shops
SELECT * FROM "Shop";

-- View all products
SELECT * FROM "Product";

-- View all sales
SELECT * FROM "Sale";

-- Count records in each table
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
SELECT 'Integration', COUNT(*) FROM "Integration";

-- Exit psql
\q
```

---

## 🖥️ Method 3: Database GUI Tools

### Option A: pgAdmin (Official PostgreSQL Tool)
1. Download from: https://www.pgadmin.org/download/
2. Install and open pgAdmin
3. Add server connection using your `DATABASE_URL` details
4. Browse database visually

### Option B: DBeaver (Free, Cross-platform)
1. Download from: https://dbeaver.io/download/
2. Install and create new PostgreSQL connection
3. Enter connection details from your `DATABASE_URL`
4. Browse and query database

### Option C: TablePlus (Mac/Windows/Linux)
1. Download from: https://tableplus.com/
2. Create new PostgreSQL connection
3. Enter connection details
4. Modern, clean interface

### Option D: VS Code Extensions
1. Install "PostgreSQL" extension by Chris Kolkman
2. Or install "SQLTools" with "SQLTools PostgreSQL/Cockroach Driver"
3. Connect using your `DATABASE_URL`

---

## 📝 Method 4: Quick Query Script

Create a simple script to query your database:

```typescript
// server/view-db.ts
import prisma from "./src/lib/prisma";

async function viewDatabase() {
  console.log("📊 Database Summary\n");
  
  const users = await prisma.user.findMany();
  const shops = await prisma.shop.findMany();
  const products = await prisma.product.findMany();
  const sales = await prisma.sale.findMany();
  const inventories = await prisma.inventory.findMany();
  const campaigns = await prisma.campaign.findMany();
  const integrations = await prisma.integration.findMany();
  const notifications = await prisma.notification.findMany();
  const forecasts = await prisma.forecast.findMany();
  const inventoryLogs = await prisma.inventoryLog.findMany();

  console.log(`Users: ${users.length}`);
  users.forEach(u => console.log(`  - ${u.email} (${u.name})`));
  
  console.log(`\nShops: ${shops.length}`);
  shops.forEach(s => console.log(`  - ${s.name} (ID: ${s.id})`));
  
  console.log(`\nProducts: ${products.length}`);
  products.forEach(p => console.log(`  - ${p.name} (${p.sku}) - Price: ₱${p.price}`));
  
  console.log(`\nSales: ${sales.length}`);
  console.log(`Inventories: ${inventories.length}`);
  console.log(`Campaigns: ${campaigns.length}`);
  console.log(`Integrations: ${integrations.length}`);
  console.log(`Notifications: ${notifications.length}`);
  console.log(`Forecasts: ${forecasts.length}`);
  console.log(`Inventory Logs: ${inventoryLogs.length}`);
  
  await prisma.$disconnect();
}

viewDatabase().catch(console.error);
```

Run it:
```bash
cd server
ts-node view-db.ts
```

---

## 🚀 Quick Start (Recommended)

**Just run this:**
```bash
cd server
npm run studio
```

Then open your browser to `http://localhost:5555` and you'll see all your data!

---

## 📋 Your Current Database Structure

Based on your Prisma schema, you have these tables:

1. **User** - User accounts
2. **Notification** - User notifications
3. **Shop** - Shops owned by users
4. **Product** - Products in shops
5. **Inventory** - Inventory records for products
6. **InventoryLog** - Inventory change logs
7. **Sale** - Sales transactions
8. **Forecast** - Demand forecasts
9. **Campaign** - Marketing campaigns
10. **Integration** - Platform integrations (Shopee, Lazada, etc.)

---

## 🔍 Find Your Database URL

Your database connection string is in:
- `server/.env` file
- Look for `DATABASE_URL=postgresql://...`

Example format:
```
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
```

