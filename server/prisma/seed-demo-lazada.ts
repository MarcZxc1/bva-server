/**
 * Lazada Demo Data Seeding Script
 * 
 * Seeds realistic demo data specifically for Lazada shop
 * - Products (Clothing, Hoodies, Apparel)
 * - Sales data (past month + current month)
 * - Only 1/3 of products have sales (first 7 products)
 * - Target: 50,000 PHP total sales, 17,000 PHP revenue (34% margin)
 * - Inventory records
 * - Campaigns and notifications
 * 
 * BVA FEATURES INTEGRATION:
 * 
 * 1. SmartShelf:
 *    - Low Stock Alerts: Products with "low" or "critical" stock levels
 *    - Product Trends:
 *      * Best Seller (top 20%): avgDailySales >= 8 - Premium Cotton T-Shirt, V-Neck T-Shirt, Premium Pullover Hoodie
 *      * Trending (top 50%): avgDailySales 5-7 - Tank Top, Oversized Hoodie, Zip-Up Hoodie, Jogger Pants
 *      * Normal: avgDailySales 3-6 - Long Sleeve T-Shirt, Graphic Print Hoodie, Polo Shirt, etc.
 *      * Slow Moving (bottom 20%): avgDailySales <= 4 - Fleece-Lined Hoodie, Henley Shirt, Slim Fit Jeans, etc.
 *      * Flop (zero sales): Remaining 14 products without sales - for MarketMate "Bundle Up!" campaigns
 * 
 * 2. Restock Planner:
 *    - Uses avgDailySales for demand forecasting
 *    - Profit margins calculated from basePrice - baseCost
 *    - Best sellers prioritized for restocking recommendations
 * 
 * 3. MarketMate:
 *    - Best Seller Spotlight: Premium Cotton T-Shirt, V-Neck T-Shirt, Premium Pullover Hoodie
 *    - Bundle Up!: Products with zero sales (14 products)
 *    - Flash Sale: Low stock items
 * 
 * 4. Analytics/Reports:
 *    - Revenue tracking: 17,000 PHP target
 *    - Sales velocity from avgDailySales
 *    - Profit margins: ~34% (17k revenue / 50k sales)
 * 
 * Usage:
 *   npm run db:seed-demo-lazada <userId>
 * 
 * Example:
 *   npm run db:seed-demo-lazada 7687fe79-fced-4fcc-bf19-8ee33990b152
 */

import * as path from "path";
import * as dotenv from "dotenv";
import prisma from "../src/lib/prisma";
import { Platform, OrderStatus, CampaignStatus } from "../src/generated/prisma";

dotenv.config({ path: path.join(__dirname, "../.env") });

// Type alias for Product
type Product = Awaited<ReturnType<typeof prisma.product.create>>;

// Lazada-specific product templates - Clothing & Apparel focus
// NOTE: These products are unique to Lazada and do NOT overlap with Shopee products.
// Shopee uses: Filipino Pasalubong (Food & Beverages)
// Lazada uses: Clothing, Hoodies, and Apparel categories
//
// PRODUCT PERFORMANCE CATEGORIZATION (for BVA features):
// - Best Seller: Top 20% by sales velocity (avgDailySales >= 8) - Used in MarketMate "Best Seller Spotlight"
// - Trending: Top 50% by sales velocity (avgDailySales >= 5) - Good performance, steady sales
// - Normal: Middle range (avgDailySales 3-4) - Average performance
// - Slow Moving: Bottom 20% by sales velocity (avgDailySales <= 2) - Needs promotion
// - Flop: Zero sales (not included in sales generation) - Used in MarketMate "Bundle Up!"
//
// STOCK LEVELS (for SmartShelf alerts):
// - high: 60-150 units (above threshold, no alerts)
// - medium: 20-50 units (near threshold, watch)
// - low: 6-15 units (below threshold, restock needed)
// - critical: 1-5 units (urgent restock, high risk)
//
// Only 1/3 of products will have sales (first 7 products) to demonstrate:
// - Best Sellers with sales
// - Flop products without sales (for MarketMate bundle campaigns)
const lazadaProductTemplates = [
  // ========== PRODUCTS WITH SALES (1/3 - First 7 products) ==========
  
  // BEST SELLERS (Top 20% - avgDailySales >= 8) - MarketMate "Best Seller Spotlight"
  { name: "Premium Cotton T-Shirt (Pack of 3)", category: "Clothing", basePrice: 599, baseCost: 250, avgDailySales: 10, hasExpiry: false, stockLevel: "high" },
  { name: "V-Neck T-Shirt (Basic)", category: "Clothing", basePrice: 349, baseCost: 150, avgDailySales: 9, hasExpiry: false, stockLevel: "high" },
  { name: "Premium Pullover Hoodie (Unisex)", category: "Clothing", basePrice: 899, baseCost: 380, avgDailySales: 8, hasExpiry: false, stockLevel: "high" },
  
  // TRENDING (Top 50% - avgDailySales 5-7) - Good performance
  { name: "Tank Top (Sleeveless)", category: "Clothing", basePrice: 299, baseCost: 130, avgDailySales: 8, hasExpiry: false, stockLevel: "low" },
  { name: "Oversized Hoodie (Streetwear Style)", category: "Clothing", basePrice: 799, baseCost: 340, avgDailySales: 7, hasExpiry: false, stockLevel: "medium" },
  { name: "Zip-Up Hoodie with Pockets", category: "Clothing", basePrice: 1099, baseCost: 460, avgDailySales: 6, hasExpiry: false, stockLevel: "high" },
  { name: "Jogger Pants (Athletic)", category: "Clothing", basePrice: 799, baseCost: 340, avgDailySales: 6, hasExpiry: false, stockLevel: "high" },
  
  // ========== PRODUCTS WITHOUT SALES (2/3 - Remaining 14 products) ==========
  
  // NORMAL PERFORMANCE (avgDailySales 3-4) - Will be FLOP (no sales)
  { name: "Long Sleeve T-Shirt", category: "Clothing", basePrice: 499, baseCost: 210, avgDailySales: 6, hasExpiry: false, stockLevel: "medium" },
  { name: "Graphic Print Hoodie", category: "Clothing", basePrice: 949, baseCost: 400, avgDailySales: 5, hasExpiry: false, stockLevel: "low" },
  { name: "Polo Shirt (Classic)", category: "Clothing", basePrice: 699, baseCost: 290, avgDailySales: 5, hasExpiry: false, stockLevel: "medium" },
  { name: "Cargo Pants (Multi-Pocket)", category: "Clothing", basePrice: 999, baseCost: 420, avgDailySales: 5, hasExpiry: false, stockLevel: "high" },
  { name: "Sweatpants (Comfort Fit)", category: "Clothing", basePrice: 749, baseCost: 320, avgDailySales: 5, hasExpiry: false, stockLevel: "medium" },
  { name: "Windbreaker Jacket", category: "Clothing", basePrice: 999, baseCost: 420, avgDailySales: 5, hasExpiry: false, stockLevel: "high" },
  
  // SLOW MOVING / FLOP (avgDailySales <= 4) - MarketMate "Bundle Up!" campaigns
  { name: "Fleece-Lined Hoodie (Winter)", category: "Clothing", basePrice: 1299, baseCost: 550, avgDailySales: 4, hasExpiry: false, stockLevel: "medium" },
  { name: "Henley Shirt (Button Placket)", category: "Clothing", basePrice: 649, baseCost: 270, avgDailySales: 4, hasExpiry: false, stockLevel: "medium" },
  { name: "Slim Fit Denim Jeans", category: "Clothing", basePrice: 1299, baseCost: 550, avgDailySales: 4, hasExpiry: false, stockLevel: "medium" },
  { name: "Bomber Jacket (Lightweight)", category: "Clothing", basePrice: 1199, baseCost: 500, avgDailySales: 4, hasExpiry: false, stockLevel: "low" },
  { name: "Chino Pants (Casual)", category: "Clothing", basePrice: 899, baseCost: 380, avgDailySales: 3, hasExpiry: false, stockLevel: "low" },
  { name: "Denim Jacket (Classic)", category: "Clothing", basePrice: 1499, baseCost: 650, avgDailySales: 3, hasExpiry: false, stockLevel: "medium" },
  
  // CRITICAL STOCK - FLOP (for SmartShelf low stock alerts)
  { name: "Athletic Hoodie (Sports)", category: "Clothing", basePrice: 849, baseCost: 360, avgDailySales: 6, hasExpiry: false, stockLevel: "critical" },
];

// Customer names for demo
const customerNames = [
  "Maria Santos", "Juan Dela Cruz", "Anna Garcia", "Carlos Rodriguez",
  "Lisa Tan", "Michael Chen", "Sarah Lim", "David Wong",
  "Jennifer Lee", "Robert Kim", "Michelle Ong", "James Yu"
];

const customerEmails = [
  "maria.santos@email.com", "juan.delacruz@email.com", "anna.garcia@email.com",
  "carlos.rodriguez@email.com", "lisa.tan@email.com", "michael.chen@email.com"
];

/**
 * Generate random date within range
 */
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

/**
 * Generate random number between min and max
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate random float between min and max
 */
function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Main seeding function for Lazada
 */
async function seedLazadaDemoData(userId: string) {
  console.log(`\n🌱 Starting Lazada demo data seeding for user: ${userId}\n`);

  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    console.error(`❌ User with ID ${userId} not found!`);
    process.exit(1);
  }

  console.log(`✅ Found user: ${user.name || user.email}\n`);

  // Create or get Lazada shop
  console.log("📦 Creating Lazada shop...");
  
  const lazadaShop = await prisma.shop.upsert({
    where: {
      ownerId_platform: {
        ownerId: userId,
        platform: Platform.LAZADA,
      },
    },
    update: {},
    create: {
      name: `${user.name || "Demo"}'s Lazada Shop`,
      ownerId: userId,
      platform: Platform.LAZADA,
    },
  });

  console.log(`✅ Lazada Shop: ${lazadaShop.id}\n`);

  // Create products for Lazada - Clothing & Apparel
  console.log("📦 Creating Lazada products (Clothing, Hoodies, Apparel)...");
  const lazadaProducts: Product[] = [];
  
  // Get current date for expiry calculations
  const productNow = new Date();
  
  for (const template of lazadaProductTemplates) {
    // Determine stock level based on template
    let stock: number;
    let threshold: number;
    switch (template.stockLevel) {
      case "critical":
        stock = randomInt(1, 5);
        threshold = 10;
        break;
      case "low":
        stock = randomInt(6, 15);
        threshold = 15;
        break;
      case "medium":
        stock = randomInt(20, 50);
        threshold = 20;
        break;
      case "high":
        stock = randomInt(60, 150);
        threshold = 30;
        break;
      default:
        stock = randomInt(20, 100);
        threshold = 20;
    }

    // Calculate expiry date if product has expiry (clothing typically doesn't expire)
    let expiryDate: Date | null = null;
    // Clothing products don't have expiry dates

    // Generate realistic image URL based on category and product name
    const getImageUrl = (category: string, productName: string): string => {
      const categoryKeywords: Record<string, string> = {
        "Clothing": "clothing-apparel-fashion",
      };
      
      const keyword = categoryKeywords[category] || "clothing";
      const productSlug = productName.toLowerCase().replace(/\s+/g, "-").substring(0, 30);
      
      // Use Unsplash Source API for realistic product images
      // Using seed parameter for consistent images per product
      const seed = productSlug.replace(/[^a-z0-9-]/g, "");
      return `https://source.unsplash.com/400x400/?${keyword},${productSlug}&sig=${seed}`;
    };

    // Lazada product
    const lazadaProduct = await prisma.product.create({
      data: {
        shopId: lazadaShop.id,
        sku: `LAZADA-${template.name.substring(0, 5).toUpperCase().replace(/\s/g, '')}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: template.name,
        description: `Premium quality ${template.name.toLowerCase()}. Made with comfortable materials and excellent craftsmanship. Perfect for everyday wear with great value and style.`,
        price: template.basePrice + randomInt(-30, 80),
        cost: template.baseCost + randomInt(-15, 40),
        category: template.category,
        stock: stock,
        expiryDate: expiryDate,
        imageUrl: getImageUrl(template.category, template.name),
      },
    });

    // Create inventory for Lazada product
    await prisma.inventory.create({
      data: {
        productId: lazadaProduct.id,
        quantity: lazadaProduct.stock,
        threshold: threshold,
        location: "Warehouse B",
        batchNumber: expiryDate ? `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 4)}` : null,
      },
    });

    lazadaProducts.push(lazadaProduct);
  }

  console.log(`✅ Created ${lazadaProducts.length} Lazada products\n`);

  // Generate sales data - Only 1/3 of products should have sales
  // Target: 50,000 PHP total sales, 17,000 PHP revenue
  console.log("💰 Generating Lazada sales data (1/3 of products only)...");

  const now = new Date();
  const oneMonthAgo = new Date(now);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  // Type definitions for order items and sales
  type OrderItem = {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    subtotal: number;
  };

  type SaleData = {
    shopId: string;
    platform: typeof Platform.LAZADA;
    platformOrderId: string;
    externalId: string;
    items: OrderItem[];
    total: number;
    revenue: number;
    profit: number;
    status: typeof OrderStatus.COMPLETED;
    customerName: string | null;
    customerEmail: string | null;
    createdAt: Date;
  };

  // Select only 1/3 of products to have sales
  const productsWithSales = lazadaProducts.slice(0, Math.ceil(lazadaProducts.length / 3));
  console.log(`   Selected ${productsWithSales.length} products (out of ${lazadaProducts.length}) to have sales\n`);

  // Target values
  const TARGET_TOTAL = 50000; // 50k PHP total sales
  const TARGET_REVENUE = 17000; // 17k PHP revenue (profit)
  
  const allSales: SaleData[] = [];
  let currentTotal = 0;
  let currentRevenue = 0;

  // Generate sales until we reach targets
  const startDate = new Date(oneMonthAgo);
  let dayOffset = 0;
  const maxDays = 60; // Allow up to 60 days to generate sales

  while ((currentTotal < TARGET_TOTAL || currentRevenue < TARGET_REVENUE) && dayOffset < maxDays) {
    const saleDate = new Date(startDate);
    saleDate.setDate(saleDate.getDate() + dayOffset);
    saleDate.setHours(randomInt(9, 20), randomInt(0, 59), randomInt(0, 59));
    
    // Determine how much we still need
    const remainingTotal = TARGET_TOTAL - currentTotal;
    const remainingRevenue = TARGET_REVENUE - currentRevenue;
    
    // Calculate target order value (aim for remaining total, but ensure we get revenue)
    const targetOrderValue = Math.min(remainingTotal, randomInt(800, 2500));
    
    const selectedProducts: OrderItem[] = [];
    let orderTotal = 0;
    const usedProductIds = new Set<string>();
    const numItems = randomInt(1, 3);

    for (let j = 0; j < numItems && orderTotal < targetOrderValue; j++) {
      const product = productsWithSales[randomInt(0, productsWithSales.length - 1)];
      if (!product || usedProductIds.has(product.id)) continue;
      usedProductIds.add(product.id);
      
      // Calculate quantity to reach target
      const remaining = targetOrderValue - orderTotal;
      const maxQty = Math.min(Math.ceil(remaining / product.price), 5);
      const quantity = maxQty > 0 ? randomInt(1, maxQty) : 1;
      const price = product.price;
      const subtotal = price * quantity;
      
      if (orderTotal + subtotal > targetOrderValue * 1.2) break; // Don't exceed too much
      
      orderTotal += subtotal;
      selectedProducts.push({
        productId: product.id,
        productName: product.name,
        quantity,
        price,
        subtotal,
      });
    }

    // Calculate profit (revenue)
    const profit = selectedProducts.reduce((sum, item) => {
      const product = productsWithSales.find(p => p.id === item.productId);
      if (product && product.cost) {
        return sum + ((item.price - product.cost) * item.quantity);
      }
      return sum + (item.subtotal * 0.34); // 34% margin to reach 17k revenue from 50k total
    }, 0);

    // Only add if we haven't exceeded targets too much
    if (currentTotal + orderTotal <= TARGET_TOTAL * 1.1 && currentRevenue + profit <= TARGET_REVENUE * 1.1) {
      allSales.push({
        shopId: lazadaShop.id,
        platform: Platform.LAZADA,
        platformOrderId: `ORDER-LAZADA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        externalId: `EXT-LAZADA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        items: selectedProducts,
        total: orderTotal,
        revenue: orderTotal,
        profit,
        status: OrderStatus.COMPLETED,
        customerName: customerNames[randomInt(0, customerNames.length - 1)] || null,
        customerEmail: customerEmails[randomInt(0, customerEmails.length - 1)] || null,
        createdAt: new Date(saleDate),
      });

      currentTotal += orderTotal;
      currentRevenue += profit;
    }

    dayOffset++;
    
    // If we're close to targets, add one more order to finish
    if (currentTotal >= TARGET_TOTAL * 0.95 && currentRevenue >= TARGET_REVENUE * 0.95) {
      break;
    }
  }

  // Split sales into past month and current month
  const pastMonthSales: SaleData[] = [];
  const currentMonthSales: SaleData[] = [];
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  for (const sale of allSales) {
    if (new Date(sale.createdAt) < currentMonthStart) {
      pastMonthSales.push(sale);
    } else {
      currentMonthSales.push(sale);
    }
  }

  // Insert all sales
  console.log(`   Creating ${pastMonthSales.length} past month sales...`);
  for (const saleData of pastMonthSales) {
    await prisma.sale.create({ data: saleData });
  }

  console.log(`   Creating ${currentMonthSales.length} current month sales...`);
  for (const saleData of currentMonthSales) {
    await prisma.sale.create({ data: saleData });
  }

  console.log(`✅ Created ${pastMonthSales.length + currentMonthSales.length} total sales\n`);

  // Create demo campaigns optimized for MarketMate
  console.log("📢 Creating demo campaigns for MarketMate...");
  
  const bestSellerProduct = lazadaProducts.find(p => p.name.includes("Hoodie") || p.name.includes("T-Shirt")) || lazadaProducts[0];
  const campaignLowStockProduct = lazadaProducts.find(p => p.stock < 15) || lazadaProducts[1];
  
  if (!bestSellerProduct) {
    console.error("❌ No products found for campaigns!");
    process.exit(1);
  }
  
  const campaigns: Array<{
    shopId: string;
    name: string;
    content: {
      playbook: string;
      product_name: string;
      ad_copy: string;
      discount?: string;
    };
    status: CampaignStatus;
    scheduledAt?: Date;
  }> = [
    {
      shopId: lazadaShop.id,
      name: "New Arrival - Premium Hoodies",
      content: {
        playbook: "New Arrival",
        product_name: "Premium Pullover Hoodie (Unisex)",
        ad_copy: "✨ Brand New Clothing Collection! Comfortable and stylish hoodies now available. Limited stock!",
      },
      status: CampaignStatus.SCHEDULED,
      scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    },
    {
      shopId: lazadaShop.id,
      name: "Best Seller - Premium Hoodie",
      content: {
        playbook: "Best Seller Spotlight",
        product_name: bestSellerProduct.name,
        ad_copy: "🔥 BEST SELLER! Our most popular hoodie - trusted by thousands! Get yours today!",
      },
      status: CampaignStatus.PUBLISHED,
    },
  ];
  
  if (campaignLowStockProduct) {
    campaigns.push({
      shopId: lazadaShop.id,
      name: "Flash Sale - Low Stock Items",
      content: {
        playbook: "Flash Sale",
        product_name: campaignLowStockProduct.name,
        ad_copy: `⚡ FLASH SALE! ${campaignLowStockProduct.name} - Limited stock available! Get it before it's gone!`,
        discount: "30% OFF",
      },
      status: CampaignStatus.DRAFT,
    });
  }

  for (const campaignData of campaigns) {
    await prisma.campaign.create({ data: campaignData });
  }

  console.log(`✅ Created ${campaigns.length} campaigns\n`);

  // Create demo notifications
  console.log("🔔 Creating demo notifications...");
  
  const notifLowStockProduct = lazadaProducts.find(p => p.stock < 15);
  
  const notifications = [
    {
      userId,
      title: "Low Stock Alert",
      message: notifLowStockProduct 
        ? `${notifLowStockProduct.name} is running low (${notifLowStockProduct.stock} units remaining). Consider restocking soon.`
        : "Some products are running low on stock. Check SmartShelf for details.",
      type: "warning",
    },
    {
      userId,
      title: "New Sale Completed",
      message: `You received a new order worth ₱${randomInt(500, 3000).toLocaleString()}.00`,
      type: "success",
    },
  ];

  for (const notifData of notifications) {
    await prisma.notification.create({ data: notifData });
  }

  console.log(`✅ Created ${notifications.length} notifications\n`);

  // Calculate totals
  const totalSalesValue = allSales.reduce((sum, s) => sum + s.total, 0);
  const totalRevenue = allSales.reduce((sum, s) => sum + s.profit, 0);

  // Summary
  console.log("✨ Lazada demo data seeding completed!\n");
  console.log("📊 Summary:");
  console.log(`   - Shop: 1 (Lazada)`);
  console.log(`   - Products: ${lazadaProducts.length} (Clothing, Hoodies, Apparel)`);
  console.log(`     • Products with sales: ${productsWithSales.length} (1/3 of total)`);
  console.log(`     • Low/Critical stock: ${lazadaProducts.filter(p => p.stock < 15).length}`);
  console.log(`   - Sales: ${allSales.length} (${pastMonthSales.length} past month + ${currentMonthSales.length} current month)`);
  console.log(`   - Total Sales Value: ₱${totalSalesValue.toLocaleString()}.00`);
  console.log(`   - Total Revenue: ₱${totalRevenue.toLocaleString()}.00`);
  console.log(`   - Campaigns: ${campaigns.length}`);
  console.log(`   - Notifications: ${notifications.length}\n`);
}

// Get user ID from command line
const userId = process.argv[2];

if (!userId) {
  console.error("❌ Error: User ID is required!");
  console.log("\nUsage:");
  console.log("  npm run db:seed-demo-lazada <userId>");
  console.log("\nExample:");
  console.log("  npm run db:seed-demo-lazada 7687fe79-fced-4fcc-bf19-8ee33990b152\n");
  process.exit(1);
}

// Run seeding
seedLazadaDemoData(userId)
  .catch((error) => {
    console.error("❌ Error seeding Lazada demo data:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

