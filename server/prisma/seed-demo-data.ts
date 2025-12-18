/**
 * Demo Data Seeding Script
 * 
 * Seeds realistic demo data for Shopee and Lazada shops
 * - Products (10-15 per shop)
 * - Sales data (past month + current month)
 * - Inventory records
 * - Some campaigns and notifications
 * 
 * Usage:
 *   ts-node prisma/seed-demo-data.ts <userId>
 * 
 * Example:
 *   ts-node prisma/seed-demo-data.ts 7687fe79-fced-4fcc-bf19-8ee33990b152
 */

import * as path from "path";
import * as dotenv from "dotenv";
import prisma from "../src/lib/prisma";
import { Platform, OrderStatus, CampaignStatus } from "../src/generated/prisma";

dotenv.config({ path: path.join(__dirname, "../.env") });

// Product templates for demo - optimized for BVA features
const productTemplates = [
  // Electronics - Best Sellers (High volume, good margins)
  { name: "Wireless Bluetooth Earbuds Pro", category: "Electronics", basePrice: 1299, baseCost: 550, avgDailySales: 8, hasExpiry: false, stockLevel: "high" },
  { name: "USB-C Fast Charging Cable 2m", category: "Electronics", basePrice: 199, baseCost: 80, avgDailySales: 12, hasExpiry: false, stockLevel: "high" },
  { name: "Phone Case with Stand & Card Holder", category: "Electronics", basePrice: 399, baseCost: 150, avgDailySales: 6, hasExpiry: false, stockLevel: "medium" },
  { name: "Portable Power Bank 20000mAh", category: "Electronics", basePrice: 899, baseCost: 400, avgDailySales: 5, hasExpiry: false, stockLevel: "medium" },
  { name: "Wireless Mouse Ergonomic", category: "Electronics", basePrice: 499, baseCost: 200, avgDailySales: 4, hasExpiry: false, stockLevel: "low" }, // Low stock for SmartShelf
  
  // Fashion - Seasonal & Trending
  { name: "Premium Cotton T-Shirt (Pack of 3)", category: "Fashion", basePrice: 599, baseCost: 250, avgDailySales: 10, hasExpiry: false, stockLevel: "high" },
  { name: "Slim Fit Denim Jeans", category: "Fashion", basePrice: 1299, baseCost: 550, avgDailySales: 4, hasExpiry: false, stockLevel: "medium" },
  { name: "Running Shoes Air Cushion", category: "Fashion", basePrice: 1999, baseCost: 900, avgDailySales: 3, hasExpiry: false, stockLevel: "low" }, // Low stock
  { name: "Genuine Leather Wallet", category: "Fashion", basePrice: 599, baseCost: 250, avgDailySales: 5, hasExpiry: false, stockLevel: "medium" },
  { name: "Summer Dress Floral Print", category: "Fashion", basePrice: 799, baseCost: 320, avgDailySales: 2, hasExpiry: false, stockLevel: "critical" }, // Critical stock
  
  // Home & Living - Various stock levels
  { name: "Stainless Steel Kitchen Knife Set (7pc)", category: "Home & Living", basePrice: 1299, baseCost: 550, avgDailySales: 2, hasExpiry: false, stockLevel: "medium" },
  { name: "Premium Bed Sheet Set Queen Size", category: "Home & Living", basePrice: 899, baseCost: 380, avgDailySales: 4, hasExpiry: false, stockLevel: "high" },
  { name: "Storage Baskets Set of 3 (Large)", category: "Home & Living", basePrice: 599, baseCost: 250, avgDailySales: 5, hasExpiry: false, stockLevel: "low" },
  { name: "LED Desk Lamp with USB Charging", category: "Home & Living", basePrice: 699, baseCost: 280, avgDailySales: 3, hasExpiry: false, stockLevel: "medium" },
  
  // Beauty & Personal Care - WITH EXPIRY DATES (for SmartShelf expiry detection)
  { name: "Face Moisturizer SPF 30 (50ml)", category: "Beauty", basePrice: 399, baseCost: 160, avgDailySales: 9, hasExpiry: true, stockLevel: "high", expiryDays: 180 },
  { name: "Shampoo & Conditioner Set (500ml each)", category: "Beauty", basePrice: 499, baseCost: 200, avgDailySales: 7, hasExpiry: true, stockLevel: "medium", expiryDays: 365 },
  { name: "Professional Makeup Brush Set (12pc)", category: "Beauty", basePrice: 799, baseCost: 320, avgDailySales: 4, hasExpiry: false, stockLevel: "medium" },
  { name: "Vitamin C Serum 30ml", category: "Beauty", basePrice: 599, baseCost: 240, avgDailySales: 6, hasExpiry: true, stockLevel: "low", expiryDays: 90 }, // Expiring soon
  { name: "Sunscreen SPF 50+ (100ml)", category: "Beauty", basePrice: 349, baseCost: 140, avgDailySales: 8, hasExpiry: true, stockLevel: "critical", expiryDays: -5 }, // EXPIRED
  
  // Food & Beverages - WITH EXPIRY DATES (critical for SmartShelf)
  { name: "Premium Instant Coffee (Pack of 12)", category: "Food & Beverages", basePrice: 299, baseCost: 120, avgDailySales: 15, hasExpiry: true, stockLevel: "high", expiryDays: 365 },
  { name: "Gourmet Snack Mix Variety Pack (500g)", category: "Food & Beverages", basePrice: 249, baseCost: 100, avgDailySales: 18, hasExpiry: true, stockLevel: "high", expiryDays: 180 },
  { name: "Organic Green Tea (100 tea bags)", category: "Food & Beverages", basePrice: 399, baseCost: 160, avgDailySales: 5, hasExpiry: true, stockLevel: "medium", expiryDays: 730 },
  { name: "Protein Energy Bars (Pack of 12)", category: "Food & Beverages", basePrice: 349, baseCost: 140, avgDailySales: 10, hasExpiry: true, stockLevel: "low", expiryDays: 30 }, // Expiring soon
  { name: "Chocolate Gift Box (500g)", category: "Food & Beverages", basePrice: 599, baseCost: 240, avgDailySales: 4, hasExpiry: true, stockLevel: "critical", expiryDays: -10 }, // EXPIRED
  { name: "Canned Goods Variety Pack (6 cans)", category: "Food & Beverages", basePrice: 449, baseCost: 180, avgDailySales: 7, hasExpiry: true, stockLevel: "medium", expiryDays: 365 },
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
 * Main seeding function
 */
async function seedDemoData(userId: string) {
  console.log(`\n🌱 Starting demo data seeding for user: ${userId}\n`);

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

  // Create or get shops
  console.log("📦 Creating shops...");
  
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

  console.log(`✅ Shopee Shop: ${shopeeShop.id}`);
  console.log(`✅ Lazada Shop: ${lazadaShop.id}\n`);

  // Create products for both shops - optimized for BVA features
  console.log("📦 Creating products optimized for BVA features...");
  const shopeeProducts = [];
  const lazadaProducts = [];
  
  // Get current date for expiry calculations
  const productNow = new Date();
  
  for (const template of productTemplates) {
    // Determine stock level based on template
    let stock: number;
    let threshold: number;
    switch (template.stockLevel) {
      case "critical":
        stock = randomInt(1, 5); // Very low stock
        threshold = 10;
        break;
      case "low":
        stock = randomInt(6, 15); // Low stock
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

    // Create inventory for Shopee product with batch numbers for expiry tracking
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

    // Lazada product (slightly different pricing and stock)
    const lazadaStock = stock + randomInt(-5, 10); // Slightly different stock
    const lazadaExpiryDate = expiryDate ? new Date(expiryDate.getTime() + randomInt(-5, 5) * 24 * 60 * 60 * 1000) : null;
    
    const lazadaProduct = await prisma.product.create({
      data: {
        shopId: lazadaShop.id,
        sku: `LAZADA-${template.name.substring(0, 5).toUpperCase().replace(/\s/g, '')}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: template.name,
        description: `Premium ${template.name.toLowerCase()}. ${template.hasExpiry ? 'Check expiry date before purchase.' : 'Top-quality product.'} Excellent value and customer satisfaction guaranteed.`,
        price: template.basePrice + randomInt(-30, 80),
        cost: template.baseCost + randomInt(-15, 40),
        category: template.category,
        stock: Math.max(1, lazadaStock), // Ensure at least 1
        expiryDate: lazadaExpiryDate,
        imageUrl: `https://via.placeholder.com/400x400/DC2626/FFFFFF?text=${encodeURIComponent(template.name.substring(0, 20))}`,
      },
    });

    // Create inventory for Lazada product
    await prisma.inventory.create({
      data: {
        productId: lazadaProduct.id,
        quantity: lazadaProduct.stock,
        threshold: threshold,
        location: "Warehouse B",
        batchNumber: lazadaExpiryDate ? `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 4)}` : null,
      },
    });

    lazadaProducts.push(lazadaProduct);
  }

  console.log(`✅ Created ${shopeeProducts.length} Shopee products`);
  console.log(`✅ Created ${lazadaProducts.length} Lazada products\n`);

  // Generate sales data with patterns for Restock Planner and Analytics
  console.log("💰 Generating sales data with realistic patterns...");

  const now = new Date();
  const oneMonthAgo = new Date(now);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const twoMonthsAgo = new Date(oneMonthAgo);
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 1);

  // Generate sales for past month (30 days) with patterns
  const pastMonthSales = [];
  const currentMonthSales = [];

  // Helper to get sales boost for paydays (15th and month-end)
  const getPaydayBoost = (day: number): number => {
    if (day === 14 || day === 15 || day === 29 || day === 30) return 1.5; // Payday boost
    if (day === 0 || day === 6) return 1.2; // Weekend boost
    return 1.0;
  };

  // Past month: Variable sales with patterns (2-8 sales per day, more on paydays/weekends)
  for (let day = 0; day < 30; day++) {
    const saleDate = new Date(oneMonthAgo);
    saleDate.setDate(saleDate.getDate() + day);
    
    const dayOfWeek = saleDate.getDay();
    const dayOfMonth = saleDate.getDate();
    const boost = getPaydayBoost(dayOfMonth);
    const baseSales = randomInt(2, 5);
    const salesPerDay = Math.floor(baseSales * boost);
    
    // Alternate platforms but favor Shopee slightly
    const useShopee = day % 3 !== 0; // 2/3 Shopee, 1/3 Lazada
    const products = useShopee ? shopeeProducts : lazadaProducts;
    const shop = useShopee ? shopeeShop : lazadaShop;
    const platform = useShopee ? Platform.SHOPEE : Platform.LAZADA;

    for (let i = 0; i < salesPerDay; i++) {
      // More sales in afternoon/evening (60% chance)
      const hour = randomInt(0, 100) < 60 ? randomInt(14, 20) : randomInt(9, 13);
      saleDate.setHours(hour, randomInt(0, 59), randomInt(0, 59));
      
      // 1-4 products per sale (some bundle purchases)
      const numItems = randomInt(1, 4);
      const selectedProducts = [];
      let total = 0;
      const usedProductIds = new Set<string>(); // Avoid duplicate products in same sale

      for (let j = 0; j < numItems; j++) {
        let product = products[randomInt(0, products.length - 1)];
        if (!product) continue;
        let attempts = 0;
        // Try to get unique product (max 3 attempts)
        while (usedProductIds.has(product.id) && attempts < 3) {
          product = products[randomInt(0, products.length - 1)];
          attempts++;
          if (!product) break;
        }
        if (!product || usedProductIds.has(product.id)) continue;
        usedProductIds.add(product.id);
        
        // Find template for this product to get avgDailySales (match by name prefix)
        const template = productTemplates.find(t => {
          if (!product || !product.name || !t || !t.name) return false;
          const productFirstWord = product.name.split(' ')[0];
          const templateFirstWord = t.name.split(' ')[0];
          if (!productFirstWord || !templateFirstWord) return false;
          return product.name.includes(templateFirstWord) || t.name.includes(productFirstWord);
        });
        const isBestSeller = template && template.avgDailySales >= 8;
        // Higher quantity for best sellers
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
        const product = products.find(p => p.id === item.productId);
        if (product && product.cost) {
          return sum + ((item.price - product.cost) * item.quantity);
        }
        return sum + (item.subtotal * 0.2); // 20% margin fallback
      }, 0);

      pastMonthSales.push({
        shopId: shop.id,
        platform,
        platformOrderId: `ORDER-${platform}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        externalId: `EXT-${platform}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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

  // Current month: Variable sales with patterns (1-6 sales per day, more on paydays/weekends)
  const daysInCurrentMonth = now.getDate();
  for (let day = 0; day < daysInCurrentMonth; day++) {
    const saleDate = new Date(now.getFullYear(), now.getMonth(), day + 1);
    const dayOfMonth = saleDate.getDate();
    const boost = getPaydayBoost(dayOfMonth);
    const baseSales = randomInt(1, 4);
    const salesPerDay = Math.floor(baseSales * boost);
    
    // Alternate platforms
    const useShopee = day % 3 !== 0;
    const products = useShopee ? shopeeProducts : lazadaProducts;
    const shop = useShopee ? shopeeShop : lazadaShop;
    const platform = useShopee ? Platform.SHOPEE : Platform.LAZADA;

    for (let i = 0; i < salesPerDay; i++) {
      // More sales in afternoon/evening
      const hour = randomInt(0, 100) < 60 ? randomInt(14, 20) : randomInt(9, 13);
      saleDate.setHours(hour, randomInt(0, 59), randomInt(0, 59));
      
      // 1-4 products per sale
      const numItems = randomInt(1, 4);
      const selectedProducts = [];
      let total = 0;
      const usedProductIds = new Set<string>();

      for (let j = 0; j < numItems; j++) {
        let product = products[randomInt(0, products.length - 1)];
        if (!product) continue;
        let attempts = 0;
        while (usedProductIds.has(product.id) && attempts < 3) {
          product = products[randomInt(0, products.length - 1)];
          attempts++;
          if (!product) break;
        }
        if (!product || usedProductIds.has(product.id)) continue;
        usedProductIds.add(product.id);
        
        // Find template for this product (match by name prefix)
        const template = productTemplates.find(t => {
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
        const product = products.find(p => p.id === item.productId);
        if (product && product.cost) {
          return sum + ((item.price - product.cost) * item.quantity);
        }
        return sum + (item.subtotal * 0.2);
      }, 0);

      currentMonthSales.push({
        shopId: shop.id,
        platform,
        platformOrderId: `ORDER-${platform}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        externalId: `EXT-${platform}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        items: selectedProducts,
        total,
        revenue: total,
        profit,
        status: day === daysInCurrentMonth - 1 ? OrderStatus.TO_RECEIVE : OrderStatus.COMPLETED, // Some recent orders pending
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
  
  // Find best seller and low stock products for campaigns
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
      shopId: lazadaShop.id,
      name: "New Arrival - Fashion Collection",
      content: {
        playbook: "New Arrival",
        product_name: "Premium Cotton T-Shirt (Pack of 3)",
        ad_copy: "✨ Brand New Fashion Collection! Comfortable and stylish cotton t-shirts now available. Limited stock!",
      },
      status: CampaignStatus.SCHEDULED,
      scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
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
  
  // Add clearance sale campaign if expired product exists
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

  // Create demo notifications for various BVA features
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
    {
      userId,
      title: "Campaign Scheduled",
      message: "Your 'New Arrival - Fashion Collection' campaign is scheduled for tomorrow",
      type: "info",
    },
  ];
  
  // Add expiry notifications if applicable
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
  console.log("✨ Demo data seeding completed!\n");
  console.log("📊 Summary:");
  console.log(`   - Shops: 2 (Shopee + Lazada)`);
  console.log(`   - Products: ${shopeeProducts.length + lazadaProducts.length} (${shopeeProducts.length} Shopee + ${lazadaProducts.length} Lazada)`);
  console.log(`     • With expiry dates: ${shopeeProducts.filter(p => p.expiryDate).length + lazadaProducts.filter(p => p.expiryDate).length}`);
  console.log(`     • Low/Critical stock: ${shopeeProducts.filter(p => p.stock < 15).length + lazadaProducts.filter(p => p.stock < 15).length}`);
  console.log(`   - Sales: ${pastMonthSales.length + currentMonthSales.length} (${pastMonthSales.length} past month + ${currentMonthSales.length} current month)`);
  console.log(`   - Campaigns: ${campaigns.length} (Draft, Scheduled, Published)`);
  console.log(`   - Notifications: ${notifications.length}\n`);
  console.log("🎉 Your BVA demo is ready! All features optimized:\n");
  console.log("   ✅ SmartShelf: Products with expiry dates, low stock, and at-risk inventory");
  console.log("   ✅ Restock Planner: Diverse sales patterns, profit margins, and demand trends");
  console.log("   ✅ MarketMate: Campaign-ready products with various statuses");
  console.log("   ✅ Reports: Sales data across platforms with profit/loss tracking");
  console.log("   ✅ Forecast Calendar: Payday patterns and sales trends\n");
}

// Get user ID from command line
const userId = process.argv[2];

if (!userId) {
  console.error("❌ Error: User ID is required!");
  console.log("\nUsage:");
  console.log("  ts-node prisma/seed-demo-data.ts <userId>");
  console.log("\nExample:");
  console.log("  ts-node prisma/seed-demo-data.ts 7687fe79-fced-4fcc-bf19-8ee33990b152\n");
  process.exit(1);
}

// Run seeding
seedDemoData(userId)
  .catch((error) => {
    console.error("❌ Error seeding demo data:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

