/**
 * Shopee Demo Data Seeding Script
 * 
 * Seeds realistic demo data specifically for Shopee shop
 * - Products (Electronics, Fashion, Beauty)
 * - Sales data (past month + current month)
 * - Inventory records
 * - Campaigns and notifications
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

// Shopee-specific product templates - Electronics, Fashion, Beauty focus
const shopeeProductTemplates = [
  // Electronics - Best Sellers (High volume, good margins)
  { name: "Wireless Bluetooth Earbuds Pro", category: "Electronics", basePrice: 1299, baseCost: 550, avgDailySales: 8, hasExpiry: false, stockLevel: "high" },
  { name: "USB-C Fast Charging Cable 2m", category: "Electronics", basePrice: 199, baseCost: 80, avgDailySales: 12, hasExpiry: false, stockLevel: "high" },
  { name: "Phone Case with Stand & Card Holder", category: "Electronics", basePrice: 399, baseCost: 150, avgDailySales: 6, hasExpiry: false, stockLevel: "medium" },
  { name: "Portable Power Bank 20000mAh", category: "Electronics", basePrice: 899, baseCost: 400, avgDailySales: 5, hasExpiry: false, stockLevel: "medium" },
  { name: "Wireless Mouse Ergonomic", category: "Electronics", basePrice: 499, baseCost: 200, avgDailySales: 4, hasExpiry: false, stockLevel: "low" },
  { name: "Smart Watch Fitness Tracker", category: "Electronics", basePrice: 2499, baseCost: 1100, avgDailySales: 3, hasExpiry: false, stockLevel: "medium" },
  { name: "Bluetooth Speaker Portable", category: "Electronics", basePrice: 799, baseCost: 350, avgDailySales: 4, hasExpiry: false, stockLevel: "high" },
  { name: "Laptop Stand Adjustable", category: "Electronics", basePrice: 599, baseCost: 250, avgDailySales: 2, hasExpiry: false, stockLevel: "critical" },
  
  // Fashion - Seasonal & Trending
  { name: "Premium Cotton T-Shirt (Pack of 3)", category: "Fashion", basePrice: 599, baseCost: 250, avgDailySales: 10, hasExpiry: false, stockLevel: "high" },
  { name: "Slim Fit Denim Jeans", category: "Fashion", basePrice: 1299, baseCost: 550, avgDailySales: 4, hasExpiry: false, stockLevel: "medium" },
  { name: "Running Shoes Air Cushion", category: "Fashion", basePrice: 1999, baseCost: 900, avgDailySales: 3, hasExpiry: false, stockLevel: "low" },
  { name: "Genuine Leather Wallet", category: "Fashion", basePrice: 599, baseCost: 250, avgDailySales: 5, hasExpiry: false, stockLevel: "medium" },
  { name: "Summer Dress Floral Print", category: "Fashion", basePrice: 799, baseCost: 320, avgDailySales: 2, hasExpiry: false, stockLevel: "critical" },
  { name: "Backpack Laptop 15.6 inch", category: "Fashion", basePrice: 899, baseCost: 380, avgDailySales: 3, hasExpiry: false, stockLevel: "medium" },
  
  // Beauty & Personal Care - WITH EXPIRY DATES (for SmartShelf expiry detection)
  { name: "Face Moisturizer SPF 30 (50ml)", category: "Beauty", basePrice: 399, baseCost: 160, avgDailySales: 9, hasExpiry: true, stockLevel: "high", expiryDays: 180 },
  { name: "Shampoo & Conditioner Set (500ml each)", category: "Beauty", basePrice: 499, baseCost: 200, avgDailySales: 7, hasExpiry: true, stockLevel: "medium", expiryDays: 365 },
  { name: "Professional Makeup Brush Set (12pc)", category: "Beauty", basePrice: 799, baseCost: 320, avgDailySales: 4, hasExpiry: false, stockLevel: "medium" },
  { name: "Vitamin C Serum 30ml", category: "Beauty", basePrice: 599, baseCost: 240, avgDailySales: 6, hasExpiry: true, stockLevel: "low", expiryDays: 90 },
  { name: "Sunscreen SPF 50+ (100ml)", category: "Beauty", basePrice: 349, baseCost: 140, avgDailySales: 8, hasExpiry: true, stockLevel: "critical", expiryDays: -5 },
  { name: "Lipstick Set (6 Colors)", category: "Beauty", basePrice: 449, baseCost: 180, avgDailySales: 5, hasExpiry: true, stockLevel: "medium", expiryDays: 730 },
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

  // Create products for Shopee - optimized for BVA features
  console.log("📦 Creating Shopee products (Electronics, Fashion, Beauty)...");
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

    // Shopee product
    const shopeeProduct = await prisma.product.create({
      data: {
        shopId: shopeeShop.id,
        sku: `SHOPEE-${template.name.substring(0, 5).toUpperCase().replace(/\s/g, '')}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: template.name,
        description: `High-quality ${template.name.toLowerCase()}. ${template.hasExpiry ? 'Check expiry date before purchase.' : 'Durable and reliable product.'} Perfect for your needs with excellent value.`,
        price: template.basePrice + randomInt(-50, 100),
        cost: template.baseCost + randomInt(-20, 50),
        category: template.category,
        stock: stock,
        expiryDate: expiryDate,
        imageUrl: `https://via.placeholder.com/400x400/4F46E5/FFFFFF?text=${encodeURIComponent(template.name.substring(0, 20))}`,
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

  // Generate sales data with patterns for Restock Planner and Analytics
  console.log("💰 Generating Shopee sales data with realistic patterns...");

  const now = new Date();
  const oneMonthAgo = new Date(now);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  // Generate sales for past month (30 days) with patterns
  const pastMonthSales = [];
  const currentMonthSales = [];

  // Helper to get sales boost for paydays (15th and month-end)
  const getPaydayBoost = (day: number): number => {
    if (day === 14 || day === 15 || day === 29 || day === 30) return 1.5;
    if (day === 0 || day === 6) return 1.2;
    return 1.0;
  };

  // Past month: Variable sales with patterns (2-8 sales per day)
  for (let day = 0; day < 30; day++) {
    const saleDate = new Date(oneMonthAgo);
    saleDate.setDate(saleDate.getDate() + day);
    
    const dayOfMonth = saleDate.getDate();
    const boost = getPaydayBoost(dayOfMonth);
    const baseSales = randomInt(2, 5);
    const salesPerDay = Math.floor(baseSales * boost);

    for (let i = 0; i < salesPerDay; i++) {
      const hour = randomInt(0, 100) < 60 ? randomInt(14, 20) : randomInt(9, 13);
      saleDate.setHours(hour, randomInt(0, 59), randomInt(0, 59));
      
      const numItems = randomInt(1, 4);
      const selectedProducts = [];
      let total = 0;
      const usedProductIds = new Set<string>();

      for (let j = 0; j < numItems; j++) {
        let product = shopeeProducts[randomInt(0, shopeeProducts.length - 1)];
        if (!product) continue;
        let attempts = 0;
        while (usedProductIds.has(product.id) && attempts < 3) {
          product = shopeeProducts[randomInt(0, shopeeProducts.length - 1)];
          attempts++;
          if (!product) break;
        }
        if (!product || usedProductIds.has(product.id)) continue;
        usedProductIds.add(product.id);
        
        const template = shopeeProductTemplates.find(t => {
          if (!product || !product.name || !t || !t.name) return false;
          const productFirstWord = product.name.split(' ')[0];
          const templateFirstWord = t.name.split(' ')[0];
          if (!productFirstWord || !templateFirstWord) return false;
          return product.name.includes(templateFirstWord) || t.name.includes(productFirstWord);
        });
        const isBestSeller = template && template.avgDailySales >= 8;
        const quantity = isBestSeller ? randomInt(1, 4) : randomInt(1, 2);
        const price = product.price;
        const subtotal = price * quantity;
        total += subtotal;

        selectedProducts.push({
          productId: product.id,
          productName: product.name,
          quantity,
          price,
          subtotal,
        });
      }

      const profit = selectedProducts.reduce((sum, item) => {
        const product = shopeeProducts.find(p => p.id === item.productId);
        if (product && product.cost) {
          return sum + ((item.price - product.cost) * item.quantity);
        }
        return sum + (item.subtotal * 0.2);
      }, 0);

      pastMonthSales.push({
        shopId: shopeeShop.id,
        platform: Platform.SHOPEE,
        platformOrderId: `ORDER-SHOPEE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        externalId: `EXT-SHOPEE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        items: selectedProducts,
        total,
        revenue: total,
        profit,
        status: OrderStatus.COMPLETED,
        customerName: customerNames[randomInt(0, customerNames.length - 1)] || null,
        customerEmail: customerEmails[randomInt(0, customerEmails.length - 1)] || null,
        createdAt: new Date(saleDate),
      });
    }
  }

  // Current month: Variable sales with patterns (1-6 sales per day)
  const daysInCurrentMonth = now.getDate();
  for (let day = 0; day < daysInCurrentMonth; day++) {
    const saleDate = new Date(now.getFullYear(), now.getMonth(), day + 1);
    const dayOfMonth = saleDate.getDate();
    const boost = getPaydayBoost(dayOfMonth);
    const baseSales = randomInt(1, 4);
    const salesPerDay = Math.floor(baseSales * boost);

    for (let i = 0; i < salesPerDay; i++) {
      const hour = randomInt(0, 100) < 60 ? randomInt(14, 20) : randomInt(9, 13);
      saleDate.setHours(hour, randomInt(0, 59), randomInt(0, 59));
      
      const numItems = randomInt(1, 4);
      const selectedProducts = [];
      let total = 0;
      const usedProductIds = new Set<string>();

      for (let j = 0; j < numItems; j++) {
        let product = shopeeProducts[randomInt(0, shopeeProducts.length - 1)];
        if (!product) continue;
        let attempts = 0;
        while (usedProductIds.has(product.id) && attempts < 3) {
          product = shopeeProducts[randomInt(0, shopeeProducts.length - 1)];
          attempts++;
          if (!product) break;
        }
        if (!product || usedProductIds.has(product.id)) continue;
        usedProductIds.add(product.id);
        
        const template = shopeeProductTemplates.find(t => {
          if (!product || !product.name || !t || !t.name) return false;
          const productFirstWord = product.name.split(' ')[0];
          const templateFirstWord = t.name.split(' ')[0];
          if (!productFirstWord || !templateFirstWord) return false;
          return product.name.includes(templateFirstWord) || t.name.includes(productFirstWord);
        });
        const isBestSeller = template && template.avgDailySales >= 8;
        const quantity = isBestSeller ? randomInt(1, 4) : randomInt(1, 2);
        const price = product.price;
        const subtotal = price * quantity;
        total += subtotal;

        selectedProducts.push({
          productId: product.id,
          productName: product.name,
          quantity,
          price,
          subtotal,
        });
      }

      const profit = selectedProducts.reduce((sum, item) => {
        const product = shopeeProducts.find(p => p.id === item.productId);
        if (product && product.cost) {
          return sum + ((item.price - product.cost) * item.quantity);
        }
        return sum + (item.subtotal * 0.2);
      }, 0);

      currentMonthSales.push({
        shopId: shopeeShop.id,
        platform: Platform.SHOPEE,
        platformOrderId: `ORDER-SHOPEE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        externalId: `EXT-SHOPEE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        items: selectedProducts,
        total,
        revenue: total,
        profit,
        status: day === daysInCurrentMonth - 1 ? OrderStatus.TO_RECEIVE : OrderStatus.COMPLETED,
        customerName: customerNames[randomInt(0, customerNames.length - 1)] || null,
        customerEmail: customerEmails[randomInt(0, customerEmails.length - 1)] || null,
        createdAt: new Date(saleDate),
      });
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
  
  const bestSellerProduct = shopeeProducts.find(p => p.name.includes("Earbuds")) || shopeeProducts[0];
  const campaignLowStockProduct = shopeeProducts.find(p => p.stock < 15) || shopeeProducts[1];
  const campaignExpiredProduct = shopeeProducts.find(p => p.expiryDate && new Date(p.expiryDate) < now) || null;
  
  if (!bestSellerProduct) {
    console.error("❌ No products found for campaigns!");
    process.exit(1);
  }
  
  const campaigns = [
    {
      shopId: shopeeShop.id,
      name: "Flash Sale - Premium Electronics",
      content: {
        playbook: "Flash Sale",
        product_name: bestSellerProduct.name,
        ad_copy: "🎧 LIMITED TIME OFFER! Premium wireless earbuds at unbeatable price! Don't miss out - stock is limited!",
        discount: "30% OFF",
      },
      status: CampaignStatus.DRAFT,
    },
    {
      shopId: shopeeShop.id,
      name: "Best Seller Spotlight - Power Bank",
      content: {
        playbook: "Best Seller Spotlight",
        product_name: "Portable Power Bank 20000mAh",
        ad_copy: "🔥 BEST SELLER! Our most popular power bank - trusted by thousands! Get yours today!",
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

  // Summary
  console.log("✨ Shopee demo data seeding completed!\n");
  console.log("📊 Summary:");
  console.log(`   - Shop: 1 (Shopee)`);
  console.log(`   - Products: ${shopeeProducts.length} (Electronics, Fashion, Beauty)`);
  console.log(`     • With expiry dates: ${shopeeProducts.filter(p => p.expiryDate).length}`);
  console.log(`     • Low/Critical stock: ${shopeeProducts.filter(p => p.stock < 15).length}`);
  console.log(`   - Sales: ${pastMonthSales.length + currentMonthSales.length} (${pastMonthSales.length} past month + ${currentMonthSales.length} current month)`);
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

