import prisma from "./src/lib/prisma";

async function checkShopData() {
  console.log("🔍 Checking database for accounts with shops and products...\n");

  try {
    // Get all users with their shops
    const users = await prisma.user.findMany({
      include: {
        shops: {
          include: {
            products: {
              include: {
                inventories: true,
              },
            },
            sales: {
              take: 1, // Just check if sales exist
            },
          },
        },
      },
    });

    console.log(`📊 Found ${users.length} users in database\n`);

    const accountsWithData: Array<{
      user: any;
      shop: any;
      productCount: number;
      inventoryCount: number;
      salesCount: number;
      hasCompleteData: boolean;
    }> = [];

    for (const user of users) {
      for (const shop of user.shops) {
        const productCount = shop.products.length;
        const inventoryCount = shop.products.reduce(
          (sum, p) => sum + p.inventories.length,
          0
        );
        const salesCount = await prisma.sale.count({
          where: { shopId: shop.id },
        });

        // Check if has complete data for all three features:
        // 1. Dashboard: needs sales data
        // 2. Inventory/SmartShelf: needs products with inventory
        // 3. Restock Planner: needs products with inventory and sales history
        const hasCompleteData =
          productCount > 0 && inventoryCount > 0 && salesCount > 0;

        accountsWithData.push({
          user,
          shop,
          productCount,
          inventoryCount,
          salesCount,
          hasCompleteData,
        });
      }
    }

    // Sort by completeness
    accountsWithData.sort((a, b) => {
      if (a.hasCompleteData !== b.hasCompleteData) {
        return a.hasCompleteData ? -1 : 1;
      }
      return b.productCount - a.productCount;
    });

    console.log("=".repeat(80));
    console.log("📋 ACCOUNTS WITH SHOPS AND DATA");
    console.log("=".repeat(80));

    if (accountsWithData.length === 0) {
      console.log("❌ No accounts with shops found!");
      return;
    }

    for (const account of accountsWithData) {
      const status = account.hasCompleteData ? "✅ COMPLETE" : "⚠️  INCOMPLETE";
      console.log(`\n${status}`);
      console.log(`  User: ${account.user.name || account.user.email}`);
      console.log(`  Email: ${account.user.email}`);
      console.log(`  Role: ${account.user.role}`);
      console.log(`  Shop: ${account.shop.name} (ID: ${account.shop.id})`);
      console.log(`  Products: ${account.productCount}`);
      console.log(`  Inventory Records: ${account.inventoryCount}`);
      console.log(`  Sales Records: ${account.salesCount}`);

      // Feature readiness
      console.log(`\n  Feature Readiness:`);
      console.log(
        `    📊 Dashboard: ${account.salesCount > 0 ? "✅ Ready" : "❌ Needs sales data"}`
      );
      console.log(
        `    📦 Inventory/SmartShelf: ${
          account.productCount > 0 && account.inventoryCount > 0
            ? "✅ Ready"
            : "❌ Needs products/inventory"
        }`
      );
      console.log(
        `    📈 Restock Planner: ${
          account.productCount > 0 &&
          account.inventoryCount > 0 &&
          account.salesCount > 0
            ? "✅ Ready"
            : "❌ Needs products, inventory, and sales"
        }`
      );
    }

    // Summary
    const completeAccounts = accountsWithData.filter((a) => a.hasCompleteData);
    console.log("\n" + "=".repeat(80));
    console.log("📊 SUMMARY");
    console.log("=".repeat(80));
    console.log(`Total accounts with shops: ${accountsWithData.length}`);
    console.log(`Accounts with complete data: ${completeAccounts.length}`);
    console.log(`Accounts with incomplete data: ${accountsWithData.length - completeAccounts.length}`);

    if (completeAccounts.length > 0) {
      console.log("\n✅ RECOMMENDED ACCOUNTS FOR TESTING:");
      for (const account of completeAccounts.slice(0, 3)) {
        console.log(
          `  - ${account.user.email} (${account.shop.name}) - ${account.productCount} products, ${account.salesCount} sales`
        );
      }
    }
  } catch (error) {
    console.error("❌ Error checking shop data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkShopData();

