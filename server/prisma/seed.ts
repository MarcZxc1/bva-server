// File: prisma/seed.ts
/**
 * Prisma Database Seeder
 *
 * Populates the database with realistic sample data for testing the
 * AI-powered restocking strategy feature.
 *
 * Generates:
 * - 2 test users (admin and tester)
 * - 1 shop
 * - 50 products with varying prices, costs, and categories
 * - Inventory records (random stock levels 0-30)
 * - 60 days of sales history with realistic patterns:
 *   - Fast-moving items (high daily sales)
 *   - Slow-moving items (low daily sales)
 *   - Seasonal variations
 *
 * Run with: npx prisma db seed
 */

import { Role, Platform } from "../src/generated/prisma";
import prisma from "../src/lib/prisma";
import bcrypt from "bcrypt";

// Product categories
const CATEGORIES = [
  "Condiments",
  "Beverages",
  "Snacks",
  "Canned Goods",
  "Dairy",
  "Bakery",
  "Household",
  "Personal Care",
];

// Sample products with realistic Filipino grocery items
const SAMPLE_PRODUCTS = [
  // Condiments
  {
    name: "UFC Banana Catsup 320g",
    category: "Condiments",
    price: 45,
    cost: 30,
  },
  {
    name: "Datu Puti Soy Sauce 385ml",
    category: "Condiments",
    price: 28,
    cost: 18,
  },
  {
    name: "Silver Swan Soy Sauce 1L",
    category: "Condiments",
    price: 55,
    cost: 38,
  },
  { name: "Lorins Vinegar 385ml", category: "Condiments", price: 22, cost: 14 },
  {
    name: "Mama Sita Oyster Sauce",
    category: "Condiments",
    price: 48,
    cost: 32,
  },

  // Beverages
  { name: "Coke 1.5L", category: "Beverages", price: 65, cost: 45 },
  { name: "Sprite 1.5L", category: "Beverages", price: 65, cost: 45 },
  { name: "Royal 1.5L", category: "Beverages", price: 58, cost: 40 },
  { name: "C2 Green Tea 500ml", category: "Beverages", price: 28, cost: 18 },
  { name: "Zest-O Orange 200ml", category: "Beverages", price: 12, cost: 7 },
  { name: "Nestea Iced Tea 1L", category: "Beverages", price: 45, cost: 30 },

  // Snacks
  { name: "Chippy BBQ Flavor", category: "Snacks", price: 15, cost: 9 },
  { name: "Piattos Cheese", category: "Snacks", price: 15, cost: 9 },
  { name: "Nova Multigrain", category: "Snacks", price: 15, cost: 9 },
  { name: "Oishi Prawn Crackers", category: "Snacks", price: 12, cost: 7 },
  { name: "Clover Chips", category: "Snacks", price: 12, cost: 7 },
  { name: "Skyflakes Crackers", category: "Snacks", price: 38, cost: 25 },

  // Canned Goods
  { name: "Century Tuna 155g", category: "Canned Goods", price: 38, cost: 25 },
  { name: "Ligo Sardines 155g", category: "Canned Goods", price: 28, cost: 18 },
  {
    name: "Argentina Corned Beef 175g",
    category: "Canned Goods",
    price: 42,
    cost: 28,
  },
  { name: "555 Tuna 155g", category: "Canned Goods", price: 35, cost: 23 },
  {
    name: "CDO Liver Spread 85g",
    category: "Canned Goods",
    price: 28,
    cost: 18,
  },

  // Dairy
  {
    name: "Alaska Evaporated Milk 370ml",
    category: "Dairy",
    price: 45,
    cost: 32,
  },
  { name: "Bear Brand 300ml", category: "Dairy", price: 52, cost: 38 },
  {
    name: "Anchor Powdered Milk 900g",
    category: "Dairy",
    price: 385,
    cost: 280,
  },
  { name: "Nestle Fresh Milk 1L", category: "Dairy", price: 95, cost: 68 },
  { name: "Eden Cheese 165g", category: "Dairy", price: 78, cost: 55 },

  // Bakery
  { name: "Gardenia White Bread", category: "Bakery", price: 58, cost: 40 },
  { name: "Gardenia Wheat Bread", category: "Bakery", price: 62, cost: 43 },
  { name: "Pandesal (6pcs)", category: "Bakery", price: 25, cost: 15 },
  { name: "Tasty Bread Loaf", category: "Bakery", price: 45, cost: 30 },

  // Household
  { name: "Tide Powder 1kg", category: "Household", price: 125, cost: 88 },
  {
    name: "Downy Fabric Softener 1L",
    category: "Household",
    price: 145,
    cost: 105,
  },
  {
    name: "Joy Dishwashing Liquid 250ml",
    category: "Household",
    price: 35,
    cost: 22,
  },
  { name: "Zonrox Bleach 500ml", category: "Household", price: 28, cost: 18 },
  { name: "Domex Toilet Cleaner", category: "Household", price: 48, cost: 32 },

  // Personal Care
  {
    name: "Safeguard Bar Soap",
    category: "Personal Care",
    price: 38,
    cost: 25,
  },
  {
    name: "Palmolive Shampoo 180ml",
    category: "Personal Care",
    price: 68,
    cost: 48,
  },
  {
    name: "Colgate Toothpaste 150g",
    category: "Personal Care",
    price: 75,
    cost: 52,
  },
  {
    name: "Close-Up Toothpaste 100g",
    category: "Personal Care",
    price: 55,
    cost: 38,
  },
  {
    name: "Johnson Baby Powder 200g",
    category: "Personal Care",
    price: 95,
    cost: 68,
  },

  // Additional fast-moving items
  { name: "Lucky Me Pancit Canton", category: "Snacks", price: 12, cost: 7 },
  { name: "Nissin Cup Noodles", category: "Snacks", price: 25, cost: 16 },
  { name: "Mang Juan Chicharron", category: "Snacks", price: 15, cost: 9 },
  { name: "Magic Sarap 8g", category: "Condiments", price: 8, cost: 5 },
  { name: "AJI-NO-MOTO 10g", category: "Condiments", price: 8, cost: 5 },
  { name: "Knorr Pork Cube", category: "Condiments", price: 35, cost: 23 },
  {
    name: "Del Monte Tomato Sauce",
    category: "Condiments",
    price: 28,
    cost: 18,
  },
  { name: "San Mig Light 330ml", category: "Beverages", price: 45, cost: 32 },
  { name: "Red Horse Beer 500ml", category: "Beverages", price: 55, cost: 40 },
  { name: "Tang Orange 25g", category: "Beverages", price: 12, cost: 7 },
];

/**
 * Generate random sales data with realistic patterns
 */
function generateSalesPattern(
  productIndex: number,
  days: number = 60
): number[] {
  const sales: number[] = [];

  // Different products have different sales velocities
  let baseVelocity: number;

  // Fast movers (20% of products)
  if (productIndex < SAMPLE_PRODUCTS.length * 0.2) {
    baseVelocity = 15 + Math.random() * 10; // 15-25 units/day
  }
  // Medium movers (50% of products)
  else if (productIndex < SAMPLE_PRODUCTS.length * 0.7) {
    baseVelocity = 5 + Math.random() * 8; // 5-13 units/day
  }
  // Slow movers (30% of products)
  else {
    baseVelocity = 1 + Math.random() * 3; // 1-4 units/day
  }

  for (let day = 0; day < days; day++) {
    // Add weekly seasonality (higher on weekends)
    const dayOfWeek = day % 7;
    const weekendBoost = dayOfWeek === 5 || dayOfWeek === 6 ? 1.3 : 1.0;

    // Add some random variation (±30%)
    const randomFactor = 0.7 + Math.random() * 0.6;

    // Calculate daily sales
    const dailySales = Math.max(
      0,
      Math.round(baseVelocity * weekendBoost * randomFactor)
    );
    sales.push(dailySales);
  }

  return sales;
}

/**
 * Main seed function
 */
async function main() {
  console.log("🌱 Starting database seed...");

  // Clear existing data (optional - comment out if you want to preserve data)
  console.log("🗑️  Clearing existing data...");
  await prisma.sale.deleteMany();
  await prisma.inventoryLog.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.forecast.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.integration.deleteMany();
  await prisma.product.deleteMany();
  await prisma.shop.deleteMany();
  await prisma.user.deleteMany();

  // Create test users
  console.log("👤 Creating test users...");

  // Hash the password properly
  const hashedPassword = await bcrypt.hash("password123", 10);

  const adminUser = await prisma.user.create({
    data: {
      email: "admin@test.com",
      password: hashedPassword,
      name: "Test Admin",
      role: Role.ADMIN,
    },
  });
  console.log(`✅ Created admin user: ${adminUser.email}`);

  const testerUser = await prisma.user.create({
    data: {
      email: "tester@test.com",
      password: hashedPassword,
      name: "Test Seller",
      role: Role.SELLER,
    },
  });
  console.log(`✅ Created tester user: ${testerUser.email}`);

  const user = adminUser; // Keep reference for backwards compatibility

  // Create shop
  console.log("🏪 Creating shop...");
  const shop = await prisma.shop.create({
    data: {
      name: "Main Store",
      ownerId: user.id,
    },
  });
  console.log(`✅ Created shop: ${shop.name} (ID: ${shop.id})`);

  // Create products
  console.log(`📦 Creating ${SAMPLE_PRODUCTS.length} products...`);
  const products = [];

  for (let i = 0; i < SAMPLE_PRODUCTS.length; i++) {
    const productData = SAMPLE_PRODUCTS[i]!;
    const sku = `SKU-${String(i + 1).padStart(4, "0")}`;

    const product = await prisma.product.create({
      data: {
        shopId: shop.id,
        sku,
        name: productData.name,
        description: `${productData.name} - ${productData.category}`,
        price: productData.price,
        cost: productData.cost,
        expiryDate: null, // Can be set for perishables if needed
      },
    });

    products.push(product);

    // Create inventory with random stock level
    const stockLevel = Math.floor(Math.random() * 31); // 0-30 units
    await prisma.inventory.create({
      data: {
        productId: product.id,
        quantity: stockLevel,
        location: "Main Warehouse",
      },
    });

    if ((i + 1) % 10 === 0) {
      console.log(`  Created ${i + 1}/${SAMPLE_PRODUCTS.length} products...`);
    }
  }
  console.log(`✅ Created ${products.length} products with inventory`);

  // Generate sales history (60 days)
  console.log("📊 Generating 60 days of sales history...");
  const salesCount = 60; // days
  let totalSalesRecords = 0;

  for (let day = 0; day < salesCount; day++) {
    const saleDate = new Date();
    saleDate.setDate(saleDate.getDate() - (salesCount - day));

    // Generate sales for each product
    for (let i = 0; i < products.length; i++) {
      const product = products[i]!;
      const salesPattern = generateSalesPattern(i, salesCount);
      const dailyQty = salesPattern[day]!;

      if (dailyQty > 0) {
        // Create sale record
        await prisma.sale.create({
          data: {
            shopId: shop.id,
            platform: Platform.OTHER,
            platformOrderId: `ORDER-${saleDate.toISOString().split("T")[0]}-${
              product.sku
            }-${Math.random().toString(36).substring(7)}`,
            items: JSON.stringify([
              {
                productId: product.id,
                sku: product.sku,
                name: product.name,
                quantity: dailyQty,
                price: product.price,
              },
            ]),
            total: product.price * dailyQty,
            createdAt: saleDate,
          },
        });

        totalSalesRecords++;
      }
    }

    if ((day + 1) % 10 === 0) {
      console.log(`  Generated sales for day ${day + 1}/${salesCount}...`);
    }
  }
  console.log(`✅ Created ${totalSalesRecords} sales records`);

  console.log("\n✨ Database seeding completed!");
  console.log("\n📊 Summary:");
  console.log(`   Users: 1`);
  console.log(`   Shops: 1`);
  console.log(`   Products: ${products.length}`);
  console.log(`   Inventory Records: ${products.length}`);
  console.log(`   Sales Records: ${totalSalesRecords}`);
  console.log("\n🎯 You can now test the restocking strategy API!");
  console.log("\nTest credentials:");
  console.log("   Email: admin@test.com");
  console.log("   Password: password123");
  console.log(`   Shop ID: ${shop.id}`);
}

// Execute seed
main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
