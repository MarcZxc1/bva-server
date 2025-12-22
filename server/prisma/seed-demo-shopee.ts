/**
 * Shopee Demo Data Seeding Script
 * 
 * Seeds realistic demo data specifically for Shopee shop
 * - Products (Filipino Pasalubong - Homecoming Gifts)
 * - Sales data (past month + current month)
 * - All products have sales to reach targets
 * - Target: 30,000 PHP total sales, 15,000 PHP revenue (50% margin)
 * - Inventory records
 * - Campaigns and notifications
 * 
 * BVA FEATURES INTEGRATION:
 * 
 * 1. SmartShelf:
 *    - Low Stock Alerts: Products with "low" or "critical" stock levels
 *    - Expiry Alerts: All products have expiry dates
 *      * Expired: Buko Pie (expired 2 days ago) - triggers urgent alert
 *      * Expiring Soon: Pastillas, Yema, Tocino (30 days) - triggers warning
 *    - Product Trends:
 *      * Best Seller (top 20%): avgDailySales >= 12 - Banana Chips, Chicharon, Dried Mangoes, Polvoron
 *      * Trending (top 50%): avgDailySales 7-11 - Pancit Canton, Pastillas, Bagoong, Calamansi Juice, etc.
 *      * Normal: avgDailySales 5-6 - Tocino, Patis, Champorado, Adobo Mix, Buko Pandan
 *      * Slow Moving (bottom 20%): avgDailySales <= 4 - Sago't Gulaman, Buko Pie
 * 
 * 2. Restock Planner:
 *    - Uses avgDailySales for demand forecasting
 *    - Profit margins calculated from basePrice - baseCost (50% margin)
 *    - Best sellers prioritized for restocking recommendations
 *    - Expiry dates considered for perishable items
 * 
 * 3. MarketMate:
 *    - Best Seller Spotlight: Chicharon, Dried Mangoes, Banana Chips
 *    - Flash Sale: Low stock items
 *    - Clearance Sale: Expired items (Buko Pie)
 *    - Bundle Up!: Slow moving products
 * 
 * 4. Analytics/Reports:
 *    - Revenue tracking: 15,000 PHP target
 *    - Sales velocity from avgDailySales
 *    - Profit margins: 50% (15k revenue / 30k sales)
 *    - Expiry tracking for food safety
 * 
 * Usage:
 *   npm run db:seed-demo-shopee <userId>
 * 
 * Example:
 *   npm run db:seed-demo-shopee 7687fe79-fced-4fcc-bf19-8ee33990b152
 */

import * as path from "path";
import * as dotenv from "dotenv";
import prisma from "../src/lib/prisma";
import { Platform, OrderStatus, CampaignStatus } from "../src/generated/prisma";

dotenv.config({ path: path.join(__dirname, "../.env") });

// Shopee-specific product templates - Filipino Pasalubong (Homecoming Gifts) focus
//
// PRODUCT PERFORMANCE CATEGORIZATION (for BVA features):
// - Best Seller: Top 20% by sales velocity (avgDailySales >= 12) - Used in MarketMate "Best Seller Spotlight"
// - Trending: Top 50% by sales velocity (avgDailySales >= 7) - Good performance, steady sales
// - Normal: Middle range (avgDailySales 5-6) - Average performance
// - Slow Moving: Bottom 20% by sales velocity (avgDailySales <= 4) - Needs promotion
// - Flop: Zero sales (not included in sales generation) - Used in MarketMate "Bundle Up!"
//
// STOCK LEVELS (for SmartShelf alerts):
// - high: 60-150 units (above threshold, no alerts)
// - medium: 20-50 units (near threshold, watch)
// - low: 6-15 units (below threshold, restock needed)
// - critical: 1-5 units (urgent restock, high risk)
//
// EXPIRY DATES (for SmartShelf expiry alerts):
// - Positive days: Future expiry (e.g., 90 = expires in 90 days)
// - Negative days: Already expired (e.g., -2 = expired 2 days ago) - Used in MarketMate "Clearance Sale"
// - Long expiry: Non-perishable items (365+ days)
//
// All products have sales to reach 30k total / 15k revenue target
const shopeeProductTemplates = [
  // BEST SELLERS (Top 20% - avgDailySales >= 12) - MarketMate "Best Seller Spotlight"
  { name: "Banana Chips (Sweet) 250g", category: "Food & Beverages", basePrice: 129, baseCost: 65, avgDailySales: 14, hasExpiry: true, stockLevel: "medium", expiryDays: 90 },
  { name: "Chicharon (Pork Cracklings) 200g", category: "Food & Beverages", basePrice: 149, baseCost: 75, avgDailySales: 15, hasExpiry: true, stockLevel: "high", expiryDays: 90 },
  { name: "Dried Mangoes (Philippine Brand) 200g", category: "Food & Beverages", basePrice: 199, baseCost: 100, avgDailySales: 12, hasExpiry: true, stockLevel: "high", expiryDays: 180 },
  { name: "Polvoron (Milk Candy) Assorted 12pcs", category: "Food & Beverages", basePrice: 179, baseCost: 90, avgDailySales: 10, hasExpiry: true, stockLevel: "high", expiryDays: 60 },
  
  // TRENDING (Top 50% - avgDailySales 7-11) - Good performance
  { name: "Pancit Canton (Instant Noodles) Pack of 10", category: "Food & Beverages", basePrice: 199, baseCost: 100, avgDailySales: 11, hasExpiry: true, stockLevel: "high", expiryDays: 180 },
  { name: "Pastillas de Leche (Milk Candy) 20pcs", category: "Food & Beverages", basePrice: 249, baseCost: 125, avgDailySales: 9, hasExpiry: true, stockLevel: "high", expiryDays: 30 },
  { name: "Bagoong (Shrimp Paste) 250ml", category: "Food & Beverages", basePrice: 99, baseCost: 50, avgDailySales: 9, hasExpiry: true, stockLevel: "high", expiryDays: 365 },
  { name: "Calamansi Juice Concentrate 500ml", category: "Food & Beverages", basePrice: 199, baseCost: 100, avgDailySales: 8, hasExpiry: true, stockLevel: "high", expiryDays: 90 },
  { name: "Vinegar (Cane) 1L", category: "Food & Beverages", basePrice: 79, baseCost: 40, avgDailySales: 8, hasExpiry: true, stockLevel: "medium", expiryDays: 730 },
  { name: "Bibingka Mix (Rice Cake) 500g", category: "Food & Beverages", basePrice: 149, baseCost: 75, avgDailySales: 8, hasExpiry: true, stockLevel: "medium", expiryDays: 365 },
  { name: "Yema (Custard Candy) 15pcs", category: "Food & Beverages", basePrice: 199, baseCost: 100, avgDailySales: 7, hasExpiry: true, stockLevel: "medium", expiryDays: 30 },
  { name: "Soy Sauce (Premium Filipino Brand) 1L", category: "Food & Beverages", basePrice: 149, baseCost: 75, avgDailySales: 7, hasExpiry: true, stockLevel: "high", expiryDays: 730 },
  { name: "Sinigang Mix (Sour Soup) Assorted 10pcs", category: "Food & Beverages", basePrice: 179, baseCost: 90, avgDailySales: 7, hasExpiry: true, stockLevel: "medium", expiryDays: 365 },
  
  // NORMAL PERFORMANCE (avgDailySales 5-6) - Average sales
  { name: "Tocino (Sweet Cured Meat) 500g", category: "Food & Beverages", basePrice: 249, baseCost: 125, avgDailySales: 6, hasExpiry: true, stockLevel: "medium", expiryDays: 30 },
  { name: "Patis (Fish Sauce) 500ml", category: "Food & Beverages", basePrice: 119, baseCost: 60, avgDailySales: 6, hasExpiry: true, stockLevel: "medium", expiryDays: 365 },
  { name: "Champorado (Chocolate Rice) Mix 200g", category: "Food & Beverages", basePrice: 129, baseCost: 65, avgDailySales: 6, hasExpiry: true, stockLevel: "medium", expiryDays: 180 },
  { name: "Adobo Mix (Marinade) 10pcs", category: "Food & Beverages", basePrice: 149, baseCost: 75, avgDailySales: 5, hasExpiry: true, stockLevel: "low", expiryDays: 365 },
  { name: "Buko Pandan Drink Mix 200g", category: "Food & Beverages", basePrice: 149, baseCost: 75, avgDailySales: 5, hasExpiry: true, stockLevel: "medium", expiryDays: 180 },
  
  // SLOW MOVING (Bottom 20% - avgDailySales <= 4) - Needs promotion
  { name: "Sago't Gulaman (Jelly Drink) Mix 500g", category: "Food & Beverages", basePrice: 179, baseCost: 90, avgDailySales: 4, hasExpiry: true, stockLevel: "low", expiryDays: 365 },
  
  // EXPIRED ITEM (for SmartShelf expiry alerts & MarketMate "Clearance Sale")
  { name: "Buko Pie (Coconut Pie) 1 whole", category: "Food & Beverages", basePrice: 349, baseCost: 175, avgDailySales: 3, hasExpiry: true, stockLevel: "critical", expiryDays: -2 },
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
 * Main seeding function for Shopee
 */
async function seedShopeeDemoData(userId: string) {
  console.log(`\n🌱 Starting Shopee demo data seeding for user: ${userId}\n`);

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

  // Create or get Shopee shop
  console.log("📦 Creating Shopee shop...");
  
  const shopeeShop = await prisma.shop.upsert({
    where: {
      ownerId_platform: {
        ownerId: userId,
        platform: Platform.SHOPEE,
      },
    },
    update: {},
    create: {
      name: `${user.name || "Demo"}'s Shopee Shop`,
      ownerId: userId,
      platform: Platform.SHOPEE,
    },
  });

  console.log(`✅ Shopee Shop: ${shopeeShop.id}\n`);

  // Create products for Shopee - Filipino Pasalubong items
  console.log("📦 Creating Shopee products (Filipino Pasalubong - Homecoming Gifts)...");
  const shopeeProducts: Awaited<ReturnType<typeof prisma.product.create>>[] = [];
  
  // Get current date for expiry calculations
  const productNow = new Date();
  
  for (const template of shopeeProductTemplates) {
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

    // Calculate expiry date if product has expiry
    let expiryDate: Date | null = null;
    if (template.hasExpiry && template.expiryDays !== undefined) {
      expiryDate = new Date(productNow);
      expiryDate.setDate(expiryDate.getDate() + template.expiryDays);
    }

    // Generate realistic image URL based on category and product name
    const getImageUrl = (category: string, productName: string): string => {
      const categoryKeywords: Record<string, string> = {
        "Food & Beverages": "filipino-food-snacks",
      };
      
      const keyword = categoryKeywords[category] || "filipino-product";
      const productSlug = productName.toLowerCase().replace(/\s+/g, "-").substring(0, 30);
      
      // Use Unsplash Source API for realistic product images
      // Using seed parameter for consistent images per product
      const seed = productSlug.replace(/[^a-z0-9-]/g, "");
      return `https://source.unsplash.com/400x400/?${keyword},${productSlug}&sig=${seed}`;
    };

    // Shopee product
    const shopeeProduct = await prisma.product.create({
      data: {
        shopId: shopeeShop.id,
        sku: `SHOPEE-${template.name.substring(0, 5).toUpperCase().replace(/\s/g, '')}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: template.name,
        description: `Authentic Filipino ${template.name.toLowerCase()}. ${template.hasExpiry ? 'Check expiry date before purchase.' : 'Perfect pasalubong (homecoming gift) from the Philippines.'} Made with quality ingredients.`,
        price: template.basePrice + randomInt(-20, 50),
        cost: template.baseCost + randomInt(-10, 25),
        category: template.category,
        stock: stock,
        expiryDate: expiryDate,
        imageUrl: getImageUrl(template.category, template.name),
      },
    });

    // Create inventory for Shopee product
    await prisma.inventory.create({
      data: {
        productId: shopeeProduct.id,
        quantity: shopeeProduct.stock,
        threshold: threshold,
        location: "Warehouse A",
        batchNumber: expiryDate ? `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 4)}` : null,
      },
    });

    shopeeProducts.push(shopeeProduct);
  }

  console.log(`✅ Created ${shopeeProducts.length} Shopee products\n`);

  // Generate sales data - Target: 30,000 PHP total sales, 15,000 PHP revenue
  console.log("💰 Generating Shopee sales data (Filipino Pasalubong)...");

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
    platform: typeof Platform.SHOPEE;
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

  // Target values
  const TARGET_TOTAL = 30000; // 30k PHP total sales
  const TARGET_REVENUE = 15000; // 15k PHP revenue (50% margin)
  
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
    const targetOrderValue = Math.min(remainingTotal, randomInt(500, 1500));
    
    const selectedProducts: OrderItem[] = [];
    let orderTotal = 0;
    const usedProductIds = new Set<string>();
    const numItems = randomInt(1, 3);

    for (let j = 0; j < numItems && orderTotal < targetOrderValue; j++) {
      const product = shopeeProducts[randomInt(0, shopeeProducts.length - 1)];
      if (!product || usedProductIds.has(product.id)) continue;
      usedProductIds.add(product.id);
      
      // Calculate quantity to reach target
      const remaining = targetOrderValue - orderTotal;
      const maxQty = Math.min(Math.ceil(remaining / product.price), 4);
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

    // Calculate profit (revenue) - 50% margin
    const profit = selectedProducts.reduce((sum, item) => {
      const product = shopeeProducts.find(p => p.id === item.productId);
      if (product && product.cost) {
        return sum + ((item.price - product.cost) * item.quantity);
      }
      return sum + (item.subtotal * 0.5); // 50% margin
    }, 0);

    // Only add if we haven't exceeded targets too much
    if (currentTotal + orderTotal <= TARGET_TOTAL * 1.1 && currentRevenue + profit <= TARGET_REVENUE * 1.1) {
      allSales.push({
        shopId: shopeeShop.id,
        platform: Platform.SHOPEE,
        platformOrderId: `ORDER-SHOPEE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        externalId: `EXT-SHOPEE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
  
  const bestSellerProduct = shopeeProducts.find(p => p.name.includes("Chicharon") || p.name.includes("Mangoes")) || shopeeProducts[0];
  const campaignLowStockProduct = shopeeProducts.find(p => p.stock < 15) || shopeeProducts[1];
  const campaignExpiredProduct = shopeeProducts.find(p => p.expiryDate && new Date(p.expiryDate) < now) || null;
  
  if (!bestSellerProduct) {
    console.error("❌ No products found for campaigns!");
    process.exit(1);
  }
  
  const campaigns = [
    {
      shopId: shopeeShop.id,
      name: "Flash Sale - Filipino Pasalubong",
      content: {
        playbook: "Flash Sale",
        product_name: bestSellerProduct.name,
        ad_copy: "🇵🇭 LIMITED TIME OFFER! Authentic Filipino pasalubong at unbeatable price! Perfect for homecoming gifts!",
        discount: "25% OFF",
      },
      status: CampaignStatus.DRAFT,
    },
    {
      shopId: shopeeShop.id,
      name: "Best Seller Spotlight - Dried Mangoes",
      content: {
        playbook: "Best Seller Spotlight",
        product_name: "Dried Mangoes (Philippine Brand) 200g",
        ad_copy: "🔥 BEST SELLER! Our most popular Filipino snack - trusted by thousands! Perfect pasalubong!",
      },
      status: CampaignStatus.PUBLISHED,
    },
  ];
  
  if (campaignExpiredProduct) {
    campaigns.push({
      shopId: shopeeShop.id,
      name: "Clearance Sale - Expiring Soon",
      content: {
        playbook: "Flash Sale",
        product_name: campaignExpiredProduct.name,
        ad_copy: `⚠️ CLEARANCE SALE! ${campaignExpiredProduct.name} - Limited time offer! Get it before it's gone!`,
        discount: "50% OFF",
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
  
  const notifLowStockProduct = shopeeProducts.find(p => p.stock < 15);
  const notifExpiredProduct = shopeeProducts.find(p => p.expiryDate && new Date(p.expiryDate) < now);
  const expiringSoonProduct = shopeeProducts.find(p => {
    if (!p.expiryDate) return false;
    const expiry = new Date(p.expiryDate);
    const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  });
  
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
  
  if (notifExpiredProduct) {
    notifications.push({
      userId,
      title: "⚠️ Expired Product Detected",
      message: `${notifExpiredProduct.name} has expired. Create a clearance sale in MarketMate to move inventory.`,
      type: "warning",
    });
  }
  
  if (expiringSoonProduct) {
    const expiry = new Date(expiringSoonProduct.expiryDate!);
    const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    notifications.push({
      userId,
      title: "⏰ Product Expiring Soon",
      message: `${expiringSoonProduct.name} will expire in ${daysUntilExpiry} days. Consider creating a promotion.`,
      type: "warning",
    });
  }

  for (const notifData of notifications) {
    await prisma.notification.create({ data: notifData });
  }

  console.log(`✅ Created ${notifications.length} notifications\n`);

  // Calculate totals
  const totalSalesValue = allSales.reduce((sum, s) => sum + s.total, 0);
  const totalRevenue = allSales.reduce((sum, s) => sum + s.profit, 0);

  // Summary
  console.log("✨ Shopee demo data seeding completed!\n");
  console.log("📊 Summary:");
  console.log(`   - Shop: 1 (Shopee)`);
  console.log(`   - Products: ${shopeeProducts.length} (Filipino Pasalubong - Homecoming Gifts)`);
  console.log(`     • With expiry dates: ${shopeeProducts.filter(p => p.expiryDate).length}`);
  console.log(`     • Low/Critical stock: ${shopeeProducts.filter(p => p.stock < 15).length}`);
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
  console.log("  npm run db:seed-demo-shopee <userId>");
  console.log("\nExample:");
  console.log("  npm run db:seed-demo-shopee 7687fe79-fced-4fcc-bf19-8ee33990b152\n");
  process.exit(1);
}

// Run seeding
seedShopeeDemoData(userId)
  .catch((error) => {
    console.error("❌ Error seeding Shopee demo data:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

