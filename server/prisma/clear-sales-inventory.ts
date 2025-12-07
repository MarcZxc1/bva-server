// File: prisma/clear-sales-inventory.ts
/**
 * Clear Sales and Inventory Data
 * 
 * Removes data from Sales and Inventory tables only.
 * This preserves Users, Shops, Products, and other data.
 * 
 * Run with: ts-node prisma/clear-sales-inventory.ts
 */

import prisma from "../src/lib/prisma";

async function clearSalesAndInventory() {
  console.log("🗑️  Starting Sales and Inventory cleanup...");
  console.log("⚠️  This will delete ALL sales and inventory data!");
  
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

    console.log("\n✨ Sales and Inventory cleanup completed!");
    console.log("\n📊 Summary:");
    console.log(`   Sales deleted: ${sales.count}`);
    console.log(`   Inventories deleted: ${inventories.count}`);
    console.log(`   Inventory Logs deleted: ${inventoryLogs.count}`);
    console.log(`   Forecasts deleted: ${forecasts.count}`);
    console.log("\n✅ Users, Shops, Products, and other data preserved.");
    
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    throw error;
  }
}

// Execute cleanup
clearSalesAndInventory()
  .catch((e) => {
    console.error("❌ Fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

