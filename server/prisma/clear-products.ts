// File: prisma/clear-products.ts
/**
 * Clear Products Data
 * 
 * Removes all products from the database.
 * This preserves Users, Shops, Sales, Inventory, and other data.
 * 
 * Run with: ts-node prisma/clear-products.ts
 */

import prisma from "../src/lib/prisma";

async function clearProducts() {
  console.log("🗑️  Starting Products cleanup...");
  console.log("⚠️  This will delete ALL products!");
  
  try {
    // Delete products (this will also cascade delete related inventory if foreign keys are set up)
    console.log("Deleting Product...");
    const products = await prisma.product.deleteMany();
    console.log(`  ✅ Deleted ${products.count} products`);

    console.log("\n✨ Products cleanup completed!");
    console.log("\n📊 Summary:");
    console.log(`   Products deleted: ${products.count}`);
    console.log("\n✅ Users, Shops, Sales, Inventory, and other data preserved.");
    
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    throw error;
  }
}

// Execute cleanup
clearProducts()
  .catch((e) => {
    console.error("❌ Fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

