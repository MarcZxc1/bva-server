// File: prisma/seed.ts
/**
 * Comprehensive Database Seeder
 * 
 * Deletes all existing data and creates 2 users with 12-30 products each,
 * ensuring every table in the database is populated.
 * 
 * Run with: npx prisma db seed
 */

import { Role, Platform, CampaignStatus } from "../src/generated/prisma";
import prisma from "../src/lib/prisma";
import bcrypt from "bcrypt";

// Sample product categories
const CATEGORIES = [
  "Electronics",
  "Clothing",
  "Food & Beverages",
  "Home & Garden",
  "Sports & Outdoors",
  "Books",
  "Toys & Games",
  "Health & Beauty",
  "Automotive",
  "Pet Supplies",
];

// Sample product names by category
const PRODUCT_TEMPLATES = [
  // Electronics
  { name: "Wireless Mouse", category: "Electronics", basePrice: 25, baseCost: 15 },
  { name: "USB-C Cable", category: "Electronics", basePrice: 12, baseCost: 6 },
  { name: "Bluetooth Speaker", category: "Electronics", basePrice: 45, baseCost: 25 },
  { name: "Phone Case", category: "Electronics", basePrice: 15, baseCost: 8 },
  { name: "Screen Protector", category: "Electronics", basePrice: 8, baseCost: 3 },
  { name: "Power Bank", category: "Electronics", basePrice: 30, baseCost: 18 },
  
  // Clothing
  { name: "Cotton T-Shirt", category: "Clothing", basePrice: 20, baseCost: 10 },
  { name: "Jeans", category: "Clothing", basePrice: 50, baseCost: 30 },
  { name: "Sneakers", category: "Clothing", basePrice: 80, baseCost: 50 },
  { name: "Hoodie", category: "Clothing", basePrice: 45, baseCost: 25 },
  { name: "Baseball Cap", category: "Clothing", basePrice: 15, baseCost: 8 },
  { name: "Socks Pack", category: "Clothing", basePrice: 10, baseCost: 5 },
  
  // Food & Beverages
  { name: "Coffee Beans", category: "Food & Beverages", basePrice: 25, baseCost: 15 },
  { name: "Energy Drink", category: "Food & Beverages", basePrice: 3, baseCost: 1.5 },
  { name: "Protein Bar", category: "Food & Beverages", basePrice: 4, baseCost: 2 },
  { name: "Bottled Water", category: "Food & Beverages", basePrice: 1.5, baseCost: 0.5 },
  { name: "Snack Chips", category: "Food & Beverages", basePrice: 3.5, baseCost: 1.8 },
  { name: "Chocolate Bar", category: "Food & Beverages", basePrice: 2.5, baseCost: 1.2 },
  
  // Home & Garden
  { name: "Plant Pot", category: "Home & Garden", basePrice: 12, baseCost: 6 },
  { name: "Garden Tool Set", category: "Home & Garden", basePrice: 35, baseCost: 20 },
  { name: "LED Light Bulb", category: "Home & Garden", basePrice: 8, baseCost: 4 },
  { name: "Storage Box", category: "Home & Garden", basePrice: 15, baseCost: 8 },
  { name: "Kitchen Utensil Set", category: "Home & Garden", basePrice: 25, baseCost: 15 },
  { name: "Throw Pillow", category: "Home & Garden", basePrice: 18, baseCost: 10 },
  
  // Sports & Outdoors
  { name: "Yoga Mat", category: "Sports & Outdoors", basePrice: 30, baseCost: 18 },
  { name: "Dumbbells Set", category: "Sports & Outdoors", basePrice: 60, baseCost: 40 },
  { name: "Water Bottle", category: "Sports & Outdoors", basePrice: 12, baseCost: 6 },
  { name: "Resistance Bands", category: "Sports & Outdoors", basePrice: 15, baseCost: 8 },
  { name: "Jump Rope", category: "Sports & Outdoors", basePrice: 8, baseCost: 4 },
  { name: "Exercise Ball", category: "Sports & Outdoors", basePrice: 25, baseCost: 15 },
  
  // Books
  { name: "Novel", category: "Books", basePrice: 15, baseCost: 8 },
  { name: "Cookbook", category: "Books", basePrice: 20, baseCost: 12 },
  { name: "Self-Help Book", category: "Books", basePrice: 18, baseCost: 10 },
  { name: "Notebook", category: "Books", basePrice: 5, baseCost: 2 },
  { name: "Journal", category: "Books", basePrice: 12, baseCost: 6 },
  { name: "Puzzle Book", category: "Books", basePrice: 8, baseCost: 4 },
  
  // Toys & Games
  { name: "Board Game", category: "Toys & Games", basePrice: 35, baseCost: 20 },
  { name: "Puzzle Set", category: "Toys & Games", basePrice: 15, baseCost: 8 },
  { name: "Action Figure", category: "Toys & Games", basePrice: 25, baseCost: 15 },
  { name: "Building Blocks", category: "Toys & Games", basePrice: 30, baseCost: 18 },
  { name: "Card Game", category: "Toys & Games", basePrice: 10, baseCost: 5 },
  { name: "Stuffed Animal", category: "Toys & Games", basePrice: 20, baseCost: 12 },
  
  // Health & Beauty
  { name: "Face Mask", category: "Health & Beauty", basePrice: 8, baseCost: 4 },
  { name: "Shampoo", category: "Health & Beauty", basePrice: 12, baseCost: 6 },
  { name: "Body Lotion", category: "Health & Beauty", basePrice: 15, baseCost: 8 },
  { name: "Toothbrush", category: "Health & Beauty", basePrice: 5, baseCost: 2 },
  { name: "Hand Sanitizer", category: "Health & Beauty", basePrice: 6, baseCost: 3 },
  { name: "Lip Balm", category: "Health & Beauty", basePrice: 4, baseCost: 2 },
  
  // Automotive
  { name: "Car Air Freshener", category: "Automotive", basePrice: 5, baseCost: 2 },
  { name: "Phone Mount", category: "Automotive", basePrice: 15, baseCost: 8 },
  { name: "Car Charger", category: "Automotive", basePrice: 12, baseCost: 6 },
  { name: "Tire Gauge", category: "Automotive", basePrice: 10, baseCost: 5 },
  { name: "Car Mat Set", category: "Automotive", basePrice: 40, baseCost: 25 },
  { name: "Windshield Wiper", category: "Automotive", basePrice: 18, baseCost: 10 },
  
  // Pet Supplies
  { name: "Dog Toy", category: "Pet Supplies", basePrice: 12, baseCost: 6 },
  { name: "Cat Litter", category: "Pet Supplies", basePrice: 20, baseCost: 12 },
  { name: "Pet Food Bowl", category: "Pet Supplies", basePrice: 15, baseCost: 8 },
  { name: "Leash", category: "Pet Supplies", basePrice: 18, baseCost: 10 },
  { name: "Pet Bed", category: "Pet Supplies", basePrice: 35, baseCost: 20 },
  { name: "Treats", category: "Pet Supplies", basePrice: 8, baseCost: 4 },
];

/**
 * Generate random number between min and max (inclusive)
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate random date within last N days
 */
function randomDate(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - randomInt(0, daysAgo));
  return date;
}

/**
 * Main seed function
 */
async function main() {
  console.log("🌱 Starting comprehensive database seed...");

  // Clear existing data in correct order (respecting foreign key constraints)
  console.log("🗑️  Clearing existing data...");
  
  await prisma.inventoryLog.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.forecast.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.integration.deleteMany();
  await prisma.product.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.shop.deleteMany();
  await prisma.user.deleteMany();

  console.log("✅ All existing data cleared");

  // Hash password
  const hashedPassword = await bcrypt.hash("password123", 10);

  // Create 2 users
  console.log("👤 Creating 2 users...");
  
  const user1 = await prisma.user.create({
    data: {
      email: "user1@test.com",
      password: hashedPassword,
      name: "User One",
      firstName: "User",
      lastName: "One",
      role: Role.SELLER,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: "user2@test.com",
      password: hashedPassword,
      name: "User Two",
      firstName: "User",
      lastName: "Two",
      role: Role.SELLER,
    },
  });

  console.log(`✅ Created users: ${user1.email}, ${user2.email}`);

  // Create multiple notifications for each user
  console.log("🔔 Creating notifications...");
  
  const notificationTypes = [
    { title: "Welcome!", message: "Welcome to BVA! Your shop has been set up.", type: "info" },
    { title: "New Product Added", message: "You've successfully added a new product to your shop.", type: "success" },
    { title: "Low Stock Alert", message: "Some of your products are running low on stock.", type: "warning" },
    { title: "Sale Completed", message: "Congratulations! You've completed a sale.", type: "success" },
    { title: "Campaign Created", message: "Your marketing campaign has been created.", type: "info" },
  ];

  for (const notif of notificationTypes) {
    await prisma.notification.create({
      data: {
        userId: user1.id,
        ...notif,
        isRead: Math.random() > 0.5,
      },
    });
    await prisma.notification.create({
      data: {
        userId: user2.id,
        ...notif,
        isRead: Math.random() > 0.5,
      },
    });
  }

  console.log(`✅ Created ${notificationTypes.length * 2} notifications`);

  // Create 2 shops (one per user)
  console.log("🏪 Creating 2 shops...");
  
  const shop1 = await prisma.shop.create({
    data: {
      name: "Shop One",
      ownerId: user1.id,
    },
  });

  const shop2 = await prisma.shop.create({
    data: {
      name: "Shop Two",
      ownerId: user2.id,
    },
  });

  console.log(`✅ Created shops: ${shop1.name}, ${shop2.name}`);

  // Create 12-30 products for each shop
  const productsPerShop = randomInt(12, 30);
  console.log(`📦 Creating ${productsPerShop} products for Shop One...`);
  
  const shop1Products: any[] = [];
  const usedTemplates1 = new Set<number>();
  
  // Define critical item types
  const numLowStock = Math.min(3, Math.floor(productsPerShop * 0.15)); // 15% low stock
  const numNearExpiry = Math.min(3, Math.floor(productsPerShop * 0.15)); // 15% near expiry
  const numSlowMoving = Math.min(3, Math.floor(productsPerShop * 0.15)); // 15% slow moving
  
  for (let i = 0; i < productsPerShop; i++) {
    // Pick a random template that hasn't been used yet
    let templateIndex;
    do {
      templateIndex = randomInt(0, PRODUCT_TEMPLATES.length - 1);
    } while (usedTemplates1.has(templateIndex) && usedTemplates1.size < PRODUCT_TEMPLATES.length);
    usedTemplates1.add(templateIndex);
    
    const template = PRODUCT_TEMPLATES[templateIndex]!;
    if (!template) {
      throw new Error(`Template at index ${templateIndex} not found`);
    }
    const variation = randomInt(1, 5); // Add variation to product names
    const priceVariation = 0.8 + Math.random() * 0.4; // ±20% price variation
    const costVariation = 0.8 + Math.random() * 0.4;
    
    // Determine if this is a critical item
    let stockLevel: number;
    let expiryDate: Date | null = null;
    let isCritical = false;
    let criticalType = "";
    
    if (i < numLowStock) {
      // Low stock items (0-5 units) - CRITICAL
      stockLevel = randomInt(0, 5);
      isCritical = true;
      criticalType = "LOW_STOCK";
    } else if (i < numLowStock + numNearExpiry) {
      // Near expiry items (expiring in 3-7 days) - CRITICAL
      stockLevel = randomInt(10, 30);
      expiryDate = new Date(Date.now() + randomInt(3, 7) * 24 * 60 * 60 * 1000);
      isCritical = true;
      criticalType = "NEAR_EXPIRY";
    } else if (i < numLowStock + numNearExpiry + numSlowMoving) {
      // Slow-moving items (high stock 50-100 units) - CRITICAL
      stockLevel = randomInt(50, 100);
      isCritical = true;
      criticalType = "SLOW_MOVING";
    } else {
      // Normal items
      stockLevel = randomInt(10, 50);
      expiryDate = template.category === "Food & Beverages" && Math.random() > 0.5 
        ? new Date(Date.now() + randomInt(30, 90) * 24 * 60 * 60 * 1000)
        : null;
    }
    
    const productName = isCritical 
      ? `${template.name} [${criticalType}]`
      : `${template.name} ${variation > 1 ? `(Variant ${variation})` : ""}`;
    
    const product = await prisma.product.create({
      data: {
        shopId: shop1.id,
        sku: `SHOP1-SKU-${String(i + 1).padStart(3, "0")}`,
        name: productName,
        description: isCritical 
          ? `⚠️ CRITICAL: ${criticalType} - ${template.name.toLowerCase()} - ${template.category}`
          : `High-quality ${template.name.toLowerCase()} - ${template.category}`,
        price: Math.round(template.basePrice * priceVariation * 100) / 100,
        cost: Math.round(template.baseCost * costVariation * 100) / 100,
        category: template.category,
        stock: stockLevel,
        expiryDate: expiryDate,
      },
    });
    
    shop1Products.push(product);
  }

  console.log(`📦 Creating ${productsPerShop} products for Shop Two...`);
  
  const shop2Products: any[] = [];
  const usedTemplates2 = new Set<number>();
  
  // Define critical item types for shop 2
  const numLowStock2 = Math.min(3, Math.floor(productsPerShop * 0.15)); // 15% low stock
  const numNearExpiry2 = Math.min(3, Math.floor(productsPerShop * 0.15)); // 15% near expiry
  const numSlowMoving2 = Math.min(3, Math.floor(productsPerShop * 0.15)); // 15% slow moving
  
  for (let i = 0; i < productsPerShop; i++) {
    let templateIndex;
    do {
      templateIndex = randomInt(0, PRODUCT_TEMPLATES.length - 1);
    } while (usedTemplates2.has(templateIndex) && usedTemplates2.size < PRODUCT_TEMPLATES.length);
    usedTemplates2.add(templateIndex);
    
    const template = PRODUCT_TEMPLATES[templateIndex]!;
    if (!template) {
      throw new Error(`Template at index ${templateIndex} not found`);
    }
    const variation = randomInt(1, 5);
    const priceVariation = 0.8 + Math.random() * 0.4;
    const costVariation = 0.8 + Math.random() * 0.4;
    
    // Determine if this is a critical item
    let stockLevel: number;
    let expiryDate: Date | null = null;
    let isCritical = false;
    let criticalType = "";
    
    if (i < numLowStock2) {
      // Low stock items (0-5 units) - CRITICAL
      stockLevel = randomInt(0, 5);
      isCritical = true;
      criticalType = "LOW_STOCK";
    } else if (i < numLowStock2 + numNearExpiry2) {
      // Near expiry items (expiring in 3-7 days) - CRITICAL
      stockLevel = randomInt(10, 30);
      expiryDate = new Date(Date.now() + randomInt(3, 7) * 24 * 60 * 60 * 1000);
      isCritical = true;
      criticalType = "NEAR_EXPIRY";
    } else if (i < numLowStock2 + numNearExpiry2 + numSlowMoving2) {
      // Slow-moving items (high stock 50-100 units) - CRITICAL
      stockLevel = randomInt(50, 100);
      isCritical = true;
      criticalType = "SLOW_MOVING";
    } else {
      // Normal items
      stockLevel = randomInt(10, 50);
      expiryDate = template.category === "Food & Beverages" && Math.random() > 0.5 
        ? new Date(Date.now() + randomInt(30, 90) * 24 * 60 * 60 * 1000)
        : null;
    }
    
    const productName = isCritical 
      ? `${template.name} [${criticalType}]`
      : `${template.name} ${variation > 1 ? `(Variant ${variation})` : ""}`;
    
    const product = await prisma.product.create({
      data: {
        shopId: shop2.id,
        sku: `SHOP2-SKU-${String(i + 1).padStart(3, "0")}`,
        name: productName,
        description: isCritical 
          ? `⚠️ CRITICAL: ${criticalType} - ${template.name.toLowerCase()} - ${template.category}`
          : `Premium ${template.name.toLowerCase()} - ${template.category}`,
        price: Math.round(template.basePrice * priceVariation * 100) / 100,
        cost: Math.round(template.baseCost * costVariation * 100) / 100,
        category: template.category,
        stock: stockLevel,
        expiryDate: expiryDate,
      },
    });
    
    shop2Products.push(product);
  }

  console.log(`✅ Created ${shop1Products.length + shop2Products.length} products total`);

  // Create inventory for each product
  console.log("📊 Creating inventory records...");
  
  const allInventories: any[] = [];
  
  for (const product of [...shop1Products, ...shop2Products]) {
    // Set threshold based on stock level for critical items
    let threshold: number;
    if (product.stock <= 5) {
      // Low stock items - threshold should be higher than current stock
      threshold = randomInt(10, 20);
    } else if (product.stock >= 50) {
      // Slow-moving items - threshold should be much lower
      threshold = randomInt(5, 15);
    } else {
      // Normal items
      threshold = randomInt(5, 20);
    }
    
    const inventory = await prisma.inventory.create({
      data: {
        productId: product.id,
        quantity: product.stock,
        threshold: threshold,
        batchNumber: `BATCH-${product.sku}`,
        location: randomInt(1, 3) === 1 ? "Warehouse A" : randomInt(1, 2) === 1 ? "Warehouse B" : "Main Store",
      },
    });
    allInventories.push(inventory);
  }

  console.log(`✅ Created ${allInventories.length} inventory records`);

  // Create multiple inventory logs for each inventory
  console.log("📝 Creating inventory logs...");
  
  for (const inventory of allInventories) {
    // Create initial stock log
    await prisma.inventoryLog.create({
      data: {
        inventoryId: inventory.id,
        delta: inventory.quantity,
        reason: "Initial stock",
        timestamp: randomDate(30),
      },
    });
    
    // Create some additional logs (restocks, sales, adjustments)
    const numLogs = randomInt(2, 5);
    let currentQty = inventory.quantity;
    
    for (let i = 0; i < numLogs; i++) {
      const delta = randomInt(-10, 20);
      currentQty = Math.max(0, currentQty + delta);
      
      const reasons = [
        "Restock from supplier",
        "Sale completed",
        "Stock adjustment",
        "Returned items",
        "Damaged goods removed",
      ];
      
      const reasonIndex = randomInt(0, reasons.length - 1);
      const reason = reasons[reasonIndex];
      if (!reason) {
        throw new Error(`Reason at index ${reasonIndex} not found`);
      }
      
      await prisma.inventoryLog.create({
        data: {
          inventoryId: inventory.id as string,
          delta,
          reason: reason,
          timestamp: randomDate(30),
        },
      });
    }
  }

  console.log(`✅ Created inventory logs`);

  // Create multiple sales for each shop
  console.log("💰 Creating sales records...");
  
  const platforms = [Platform.SHOPEE, Platform.LAZADA, Platform.TIKTOK, Platform.OTHER];
  
  // Helper function to check if product is slow-moving
  const isSlowMoving = (product: any): boolean => {
    return product.stock >= 50 && product.name.includes("[SLOW_MOVING]");
  };
  
  // Helper function to check if product is low stock
  const isLowStock = (product: any): boolean => {
    return product.stock <= 5 && product.name.includes("[LOW_STOCK]");
  };
  
  // Create 15-25 sales for shop1
  const shop1Sales = randomInt(15, 25);
  for (let i = 0; i < shop1Sales; i++) {
    const numItems = randomInt(1, 4);
    const selectedProducts: any[] = [];
    const usedProductIndices = new Set<number>();
    
    // Prefer low stock items (they have demand) and avoid slow-moving items
    const availableProducts = shop1Products.filter((p, idx) => {
      if (isSlowMoving(p)) {
        // Only include slow-moving items 10% of the time (they sell rarely)
        return Math.random() < 0.1;
      }
      return true;
    });
    
    for (let j = 0; j < numItems && j < availableProducts.length; j++) {
      let productIndex;
      let attempts = 0;
      do {
        // Prefer low stock items (they're selling)
        if (Math.random() < 0.3) {
          const lowStockProducts = availableProducts.filter((p, idx) => 
            isLowStock(p) && !usedProductIndices.has(shop1Products.indexOf(p))
          );
          if (lowStockProducts.length > 0) {
            const selected = lowStockProducts[randomInt(0, lowStockProducts.length - 1)];
            productIndex = shop1Products.indexOf(selected);
            break;
          }
        }
        productIndex = shop1Products.findIndex((p, idx) => 
          availableProducts.includes(p) && !usedProductIndices.has(idx)
        );
        if (productIndex === -1) {
          productIndex = randomInt(0, shop1Products.length - 1);
        }
        attempts++;
      } while (usedProductIndices.has(productIndex) && attempts < 10);
      
      if (productIndex >= 0 && productIndex < shop1Products.length) {
        usedProductIndices.add(productIndex);
        selectedProducts.push(shop1Products[productIndex]);
      }
    }
    
    if (selectedProducts.length === 0) continue;
    
    const items = selectedProducts.map(p => ({
      productId: p.id,
      sku: p.sku,
      name: p.name,
      quantity: isSlowMoving(p) ? randomInt(1, 2) : randomInt(1, 5), // Slow-moving: lower quantity
      price: p.price,
    }));
    
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const profit = items.reduce((sum, item) => {
      const product = shop1Products.find(p => p.id === item.productId);
      return sum + ((item.price - (product?.cost || 0)) * item.quantity);
    }, 0);
    
    const platformIndex = randomInt(0, platforms.length - 1);
    const platform = platforms[platformIndex];
    if (!platform) {
      throw new Error(`Platform at index ${platformIndex} not found`);
    }
    
    await prisma.sale.create({
      data: {
        shopId: shop1.id,
        platform: platform,
        platformOrderId: `ORDER-SHOP1-${String(i + 1).padStart(4, "0")}`,
        items: JSON.stringify(items),
        total,
        revenue: total,
        profit,
        customerName: `Customer ${i + 1}`,
        customerEmail: `customer${i + 1}@example.com`,
        status: "completed",
        createdAt: randomDate(60),
      },
    });
  }
  
  // Create 15-25 sales for shop2
  const shop2Sales = randomInt(15, 25);
  for (let i = 0; i < shop2Sales; i++) {
    const numItems = randomInt(1, 4);
    const selectedProducts: any[] = [];
    const usedProductIndices = new Set<number>();
    
    // Prefer low stock items and avoid slow-moving items
    const availableProducts2 = shop2Products.filter((p, idx) => {
      if (isSlowMoving(p)) {
        return Math.random() < 0.1; // Only 10% chance
      }
      return true;
    });
    
    for (let j = 0; j < numItems && j < availableProducts2.length; j++) {
      let productIndex;
      let attempts = 0;
      do {
        // Prefer low stock items
        if (Math.random() < 0.3) {
          const lowStockProducts = availableProducts2.filter((p, idx) => 
            isLowStock(p) && !usedProductIndices.has(shop2Products.indexOf(p))
          );
          if (lowStockProducts.length > 0) {
            const selected = lowStockProducts[randomInt(0, lowStockProducts.length - 1)];
            productIndex = shop2Products.indexOf(selected);
            break;
          }
        }
        productIndex = shop2Products.findIndex((p, idx) => 
          availableProducts2.includes(p) && !usedProductIndices.has(idx)
        );
        if (productIndex === -1) {
          productIndex = randomInt(0, shop2Products.length - 1);
        }
        attempts++;
      } while (usedProductIndices.has(productIndex) && attempts < 10);
      
      if (productIndex >= 0 && productIndex < shop2Products.length) {
        usedProductIndices.add(productIndex);
        selectedProducts.push(shop2Products[productIndex]);
      }
    }
    
    if (selectedProducts.length === 0) continue;
    
    const items = selectedProducts.map(p => ({
      productId: p.id,
      sku: p.sku,
      name: p.name,
      quantity: isSlowMoving(p) ? randomInt(1, 2) : randomInt(1, 5), // Slow-moving: lower quantity
      price: p.price,
    }));
    
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const profit = items.reduce((sum, item) => {
      const product = shop2Products.find(p => p.id === item.productId);
      return sum + ((item.price - (product?.cost || 0)) * item.quantity);
    }, 0);
    
    const platformIndex2 = randomInt(0, platforms.length - 1);
    const platform2 = platforms[platformIndex2];
    if (!platform2) {
      throw new Error(`Platform at index ${platformIndex2} not found`);
    }
    
    await prisma.sale.create({
      data: {
        shopId: shop2.id,
        platform: platform2,
        platformOrderId: `ORDER-SHOP2-${String(i + 1).padStart(4, "0")}`,
        items: JSON.stringify(items),
        total,
        revenue: total,
        profit,
        customerName: `Customer ${i + 1}`,
        customerEmail: `customer${i + 1}@example.com`,
        status: "completed",
        createdAt: randomDate(60),
      },
    });
  }

  console.log(`✅ Created ${shop1Sales + shop2Sales} sales records`);

  // Create forecasts for each product (multiple forecasts per product)
  console.log("📈 Creating forecasts...");
  
  const forecastMethods = ["linear", "exponential", "xgboost", "auto"];
  
  for (const product of [...shop1Products, ...shop2Products]) {
    // Create 3-7 forecasts per product (different dates and methods)
    const numForecasts = randomInt(3, 7);
    for (let i = 0; i < numForecasts; i++) {
      const forecastDate = new Date();
      forecastDate.setDate(forecastDate.getDate() + randomInt(1, 30));
      
      const methodIndex = randomInt(0, forecastMethods.length - 1);
      const method = forecastMethods[methodIndex];
      if (!method) {
        throw new Error(`Forecast method at index ${methodIndex} not found`);
      }
      
      await prisma.forecast.create({
        data: {
          productId: product.id,
          date: forecastDate,
          predicted: randomInt(5, 50),
          method: method,
        },
      });
    }
  }

  console.log(`✅ Created forecasts for all products`);

  // Create multiple campaigns for each shop
  console.log("📢 Creating campaigns...");
  
  const campaignTemplates = [
    { name: "Flash Sale", status: CampaignStatus.PUBLISHED },
    { name: "New Arrival Promotion", status: CampaignStatus.SCHEDULED },
    { name: "Holiday Special", status: CampaignStatus.DRAFT },
    { name: "Clearance Sale", status: CampaignStatus.PUBLISHED },
    { name: "Buy One Get One", status: CampaignStatus.DRAFT },
  ];
  
  for (const template of campaignTemplates) {
    await prisma.campaign.create({
      data: {
        shopId: shop1.id,
        name: `${template.name} - Shop One`,
        content: JSON.stringify({
          title: template.name,
          description: `Special promotion for Shop One customers`,
          discount: randomInt(10, 50),
        }),
        status: template.status,
        scheduledAt: template.status === CampaignStatus.SCHEDULED 
          ? new Date(Date.now() + randomInt(1, 7) * 24 * 60 * 60 * 1000)
          : null,
      },
    });
    
    await prisma.campaign.create({
      data: {
        shopId: shop2.id,
        name: `${template.name} - Shop Two`,
        content: JSON.stringify({
          title: template.name,
          description: `Special promotion for Shop Two customers`,
          discount: randomInt(10, 50),
        }),
        status: template.status,
        scheduledAt: template.status === CampaignStatus.SCHEDULED 
          ? new Date(Date.now() + randomInt(1, 7) * 24 * 60 * 60 * 1000)
          : null,
      },
    });
  }

  console.log(`✅ Created ${campaignTemplates.length * 2} campaigns`);

  // Create integrations for each shop (multiple platforms)
  console.log("🔗 Creating integrations...");
  
  // Shop1 integrations
  await prisma.integration.create({
    data: {
      shopId: shop1.id,
      platform: Platform.SHOPEE,
      settings: JSON.stringify({
        apiKey: "shopee-key-1",
        enabled: true,
        syncEnabled: true,
      }),
    },
  });
  
  await prisma.integration.create({
    data: {
      shopId: shop1.id,
      platform: Platform.LAZADA,
      settings: JSON.stringify({
        apiKey: "lazada-key-1",
        enabled: true,
        syncEnabled: false,
      }),
    },
  });
  
  // Shop2 integrations
  await prisma.integration.create({
    data: {
      shopId: shop2.id,
      platform: Platform.SHOPEE,
      settings: JSON.stringify({
        apiKey: "shopee-key-2",
        enabled: true,
        syncEnabled: true,
      }),
    },
  });
  
  await prisma.integration.create({
    data: {
      shopId: shop2.id,
      platform: Platform.TIKTOK,
      settings: JSON.stringify({
        apiKey: "tiktok-key-2",
        enabled: true,
        syncEnabled: true,
      }),
    },
  });

  console.log(`✅ Created 4 integrations`);

  // Get final counts
  const userCount = await prisma.user.count();
  const notificationCount = await prisma.notification.count();
  const shopCount = await prisma.shop.count();
  const productCount = await prisma.product.count();
  const inventoryCount = await prisma.inventory.count();
  const inventoryLogCount = await prisma.inventoryLog.count();
  const saleCount = await prisma.sale.count();
  const forecastCount = await prisma.forecast.count();
  const campaignCount = await prisma.campaign.count();
  const integrationCount = await prisma.integration.count();

  // Count critical items
  const lowStockCount = await prisma.product.count({
    where: {
      stock: { lte: 5 },
    },
  });
  
  const nearExpiryCount = await prisma.product.count({
    where: {
      expiryDate: {
        lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        gte: new Date(),
      },
    },
  });
  
  const slowMovingCount = await prisma.product.count({
    where: {
      stock: { gte: 50 },
    },
  });

  console.log("\n✨ Comprehensive database seeding completed!");
  console.log("\n📊 Summary:");
  console.log(`   Users: ${userCount}`);
  console.log(`   Notifications: ${notificationCount}`);
  console.log(`   Shops: ${shopCount}`);
  console.log(`   Products: ${productCount} (${productsPerShop} per shop)`);
  console.log(`   Inventory Records: ${inventoryCount}`);
  console.log(`   Inventory Logs: ${inventoryLogCount}`);
  console.log(`   Sales Records: ${saleCount}`);
  console.log(`   Forecasts: ${forecastCount}`);
  console.log(`   Campaigns: ${campaignCount}`);
  console.log(`   Integrations: ${integrationCount}`);
  console.log("\n⚠️  Critical Items:");
  console.log(`   Low Stock (≤5 units): ${lowStockCount}`);
  console.log(`   Near Expiry (≤7 days): ${nearExpiryCount}`);
  console.log(`   Slow Moving (≥50 units): ${slowMovingCount}`);
  console.log("\n🎯 Test credentials:");
  console.log("   User 1 - Email: user1@test.com, Password: password123");
  console.log("   User 2 - Email: user2@test.com, Password: password123");
  console.log(`   Shop 1 ID: ${shop1.id}`);
  console.log(`   Shop 2 ID: ${shop2.id}`);
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
