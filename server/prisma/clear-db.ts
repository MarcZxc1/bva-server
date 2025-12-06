// File: prisma/clear-db.ts
/**
 * Database Cleanup Script
 * 
 * Removes ALL data from all tables in the database.
 * Use with caution - this is irreversible!
 * 
 * Run with: ts-node prisma/clear-db.ts
 */

import prisma from "../src/lib/prisma";

async function clearDatabase() {
  console.log("🗑️  Starting database cleanup...");
  console.log("⚠️  WARNING: This will delete ALL data from ALL tables!");
  
  try {
    // Delete in correct order (respecting foreign key constraints)
    console.log("Deleting InventoryLog...");
    const inventoryLogs = await prisma.inventoryLog.deleteMany();
    console.log(`  ✅ Deleted ${inventoryLogs.count} inventory logs`);

    console.log("Deleting Inventory...");
    const inventories = await prisma.inventory.deleteMany();
    console.log(`  ✅ Deleted ${inventories.count} inventory records`);

    console.log("Deleting Forecast...");
    const forecasts = await prisma.forecast.deleteMany();
    console.log(`  ✅ Deleted ${forecasts.count} forecasts`);

    console.log("Deleting Sale...");
    const sales = await prisma.sale.deleteMany();
    console.log(`  ✅ Deleted ${sales.count} sales`);

    console.log("Deleting Campaign...");
    const campaigns = await prisma.campaign.deleteMany();
    console.log(`  ✅ Deleted ${campaigns.count} campaigns`);

    console.log("Deleting Integration...");
    const integrations = await prisma.integration.deleteMany();
    console.log(`  ✅ Deleted ${integrations.count} integrations`);

    console.log("Deleting Product...");
    const products = await prisma.product.deleteMany();
    console.log(`  ✅ Deleted ${products.count} products`);

    console.log("Deleting Notification...");
    const notifications = await prisma.notification.deleteMany();
    console.log(`  ✅ Deleted ${notifications.count} notifications`);

    console.log("Deleting Shop...");
    const shops = await prisma.shop.deleteMany();
    console.log(`  ✅ Deleted ${shops.count} shops`);

    console.log("Deleting User...");
    const users = await prisma.user.deleteMany();
    console.log(`  ✅ Deleted ${users.count} users`);

    console.log("\n✨ Database cleanup completed!");
    console.log("\n📊 Summary:");
    console.log(`   Users deleted: ${users.count}`);
    console.log(`   Shops deleted: ${shops.count}`);
    console.log(`   Products deleted: ${products.count}`);
    console.log(`   Sales deleted: ${sales.count}`);
    console.log(`   Inventories deleted: ${inventories.count}`);
    console.log(`   Campaigns deleted: ${campaigns.count}`);
    console.log(`   Integrations deleted: ${integrations.count}`);
    console.log(`   Notifications deleted: ${notifications.count}`);
    console.log(`   Forecasts deleted: ${forecasts.count}`);
    console.log(`   Inventory Logs deleted: ${inventoryLogs.count}`);
    
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    throw error;
  }
}

// Execute cleanup
clearDatabase()
  .catch((e) => {
    console.error("❌ Fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

