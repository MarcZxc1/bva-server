import prisma from "../lib/prisma";
import { hasActiveIntegration } from "../utils/integrationCheck";

export async function getAllProducts(platform?: string) {
  // Build where clause with optional platform filter
  const whereClause: any = {};
  
  if (platform && ['LAZADA', 'SHOPEE', 'TIKTOK'].includes(platform.toUpperCase())) {
    whereClause.Shop = {
      platform: platform.toUpperCase()
    };
  }
  
  const products = await prisma.product.findMany({
    where: whereClause,
    include: {
      Shop: {
        select: {
          id: true,
          name: true,
          platform: true,
        },
      },
      Inventory: {
        take: 1,
        orderBy: {
          updatedAt: "desc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return products.map((product) => ({
    id: product.id,
    sku: product.sku,
    name: product.name,
    description: product.description,
    price: product.price,
    cost: product.cost,
    stock: product.stock,
    quantity: product.Inventory[0]?.quantity || product.stock || 0,
    expiryDate: product.expiryDate,
    category: product.category,
    imageUrl: product.imageUrl,
    shopId: product.shopId,
    shopName: product.Shop.name,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  }));
}

export async function getProductsByShop(shopId: string, platform?: string) {
  // Get the shop to verify its platform
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { platform: true },
  });

  if (!shop) {
    throw new Error('Shop not found');
  }

  // Build where clause - filter by shopId and optionally by platform
  const whereClause: any = { shopId };
  
  // If platform is specified in query, verify it matches the shop's platform
  // This prevents cross-platform product leakage
  if (platform && platform.toUpperCase() !== shop.platform) {
    console.log(`⚠️ Platform mismatch: requested ${platform}, shop is ${shop.platform}`);
    return []; // Return empty array if platform doesn't match
  }

  // Get ALL products for the shop that match the shop's platform
  // Products created in Lazada-clone will only appear in Lazada shops
  // Products created in Shopee-clone will only appear in Shopee shops
  const products = await prisma.product.findMany({
    where: whereClause,
    include: {
      Inventory: {
        take: 1,
        orderBy: {
          updatedAt: "desc",
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  // Get all sales for this shop to map products to platforms
  const allSales = await prisma.sale.findMany({
    where: { shopId },
    select: {
      platform: true,
      items: true,
    },
  });

  // Create a map of product IDs to platforms based on sales
  const productPlatformMap = new Map<string, string>();
  allSales.forEach((sale) => {
    if (sale.items && typeof sale.items === 'object') {
      const items = sale.items as any;
      if (Array.isArray(items)) {
        items.forEach((item: any) => {
          if (item.productId) {
            productPlatformMap.set(item.productId, sale.platform);
          }
        });
      }
    }
  });

  // Use the shop's platform as default
  const defaultPlatform = shop.platform;

  return products.map((product) => {
    // Determine platform: from sales data, externalId pattern, or shop platform
    let productPlatform: string | null = productPlatformMap.get(product.id) || null;
    
    // If no platform from sales, check externalId pattern
    if (!productPlatform && product.externalId) {
      if (product.externalId.includes('SHOPEE') || product.externalId.startsWith('SHOPEE')) {
        productPlatform = 'SHOPEE';
      } else if (product.externalId.includes('LAZADA') || product.externalId.startsWith('LAZADA')) {
        productPlatform = 'LAZADA';
      } else if (product.externalId.includes('TIKTOK') || product.externalId.startsWith('TIKTOK')) {
        productPlatform = 'TIKTOK';
      }
    }

    // Use shop platform if still no platform found
    if (!productPlatform) {
      productPlatform = defaultPlatform;
    }

    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      description: product.description,
      price: product.price,
      cost: product.cost,
      stock: product.stock,
      quantity: product.Inventory[0]?.quantity || product.stock || 0,
      expiryDate: product.expiryDate ? product.expiryDate.toISOString() : null,
      category: product.category,
      imageUrl: product.imageUrl,
      platform: productPlatform,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  });
}

export async function getProductById(productId: string) {
  // First, try to find product by internal ID
  let product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      Shop: {
        select: {
          id: true,
          name: true,
        },
      },
      Inventory: {
        take: 1,
        orderBy: {
          updatedAt: "desc",
        },
      },
    },
  });

  // If not found by internal ID, try to find by externalId
  if (!product) {
    product = await prisma.product.findFirst({
      where: { externalId: productId },
      include: {
        Shop: {
          select: {
            id: true,
            name: true,
          },
        },
        Inventory: {
          take: 1,
          orderBy: {
            updatedAt: "desc",
          },
        },
      },
    });
  }

  if (!product) {
    throw new Error("Product not found");
  }

  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    description: product.description,
    price: product.price,
    cost: product.cost,
    stock: product.stock,
    quantity: product.Inventory[0]?.quantity || product.stock || 0,
    expiryDate: product.expiryDate,
    category: product.category,
    imageUrl: product.imageUrl,
    shopId: product.shopId,
    shopName: product.Shop.name,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

/**
 * Get products from all shops accessible to a user (owned + linked)
 */
export async function getProductsForUser(userId: string, platform?: string) {
  // Get all shops the user owns
  const ownedShops = await prisma.shop.findMany({
    where: { ownerId: userId },
    select: { id: true, platform: true },
  });

  // Get all shops the user has access to via ShopAccess
  const linkedShops = await prisma.shopAccess.findMany({
    where: { userId: userId },
    include: {
      Shop: {
        select: { id: true, platform: true },
      },
    },
  });

  // Combine all shop IDs
  const allShopIds = [
    ...ownedShops.map(s => s.id),
    ...linkedShops.map(sa => sa.Shop.id),
  ];

  if (allShopIds.length === 0) {
    return [];
  }

  // Build where clause
  const where: any = {
    shopId: { in: allShopIds },
  };

  // Fetch all products from accessible shops
  const products = await prisma.product.findMany({
    where,
    include: {
      Shop: {
        select: {
          id: true,
          name: true,
          platform: true,
        },
      },
      Inventory: {
        take: 1,
        orderBy: {
          updatedAt: "desc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  console.log(`📦 getProductsForUser: Found ${products.length} products across ${allShopIds.length} shops for user ${userId}`);

  // Map products with inferred platform
  return products.map((product) => {
    // Get shop's platform as default
    const defaultPlatform = product.Shop.platform;

    // Try to infer platform from externalId if available
    let productPlatform = defaultPlatform;
    if (product.externalId) {
      if (product.externalId.includes('SHOPEE') || product.externalId.startsWith('SPE')) {
        productPlatform = 'SHOPEE';
      } else if (product.externalId.includes('LAZADA') || product.externalId.startsWith('LAZ')) {
        productPlatform = 'LAZADA';
      } else if (product.externalId.includes('TIKTOK') || product.externalId.startsWith('TIKTOK')) {
        productPlatform = 'TIKTOK';
      }
    }

    // Use shop platform if still no platform found
    if (!productPlatform) {
      productPlatform = defaultPlatform;
    }

    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      description: product.description,
      price: product.price,
      cost: product.cost,
      stock: product.stock,
      quantity: product.Inventory[0]?.quantity || product.stock || 0,
      expiryDate: product.expiryDate ? product.expiryDate.toISOString() : null,
      category: product.category,
      imageUrl: product.imageUrl,
      platform: productPlatform,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  });
}

import { notifyNewProduct } from "../services/socket.service";

// ... (existing code)

export async function createProduct(data: {
  shopId: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  stock?: number;
  sku?: string;
  category?: string;
  imageUrl?: string;
}) {
  // Generate SKU if not provided
  const sku = data.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const product = await prisma.product.create({
    data: {
      shopId: data.shopId,
      sku,
      name: data.name,
      description: data.description ?? null,
      price: data.price,
      cost: data.cost ?? null,
      stock: data.stock || 0,
      category: data.category ?? null,
      imageUrl: data.imageUrl ?? null,
    },
  });

  // Create initial inventory record
  await prisma.inventory.create({
    data: {
      productId: product.id,
      quantity: data.stock || 0,
      threshold: 10,
    },
  });

  const createdProduct = {
    id: product.id,
    sku: product.sku,
    name: product.name,
    description: product.description,
    price: product.price,
    cost: product.cost,
    stock: product.stock,
    category: product.category,
    imageUrl: product.imageUrl,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };

  notifyNewProduct(createdProduct);

  return createdProduct;
}

export async function updateProduct(
  productId: string,
  data: Partial<{
    name: string;
    description: string;
    price: number;
    cost: number;
    stock: number;
    sku: string;
    category: string;
    imageUrl: string;
  }>
) {
  const product = await prisma.product.update({
    where: { id: productId },
    data,
  });

  // Update inventory if stock changed
  if (data.stock !== undefined) {
    const inventory = await prisma.inventory.findFirst({
      where: { productId },
      orderBy: { updatedAt: "desc" },
    });

    if (inventory) {
      const delta = data.stock - inventory.quantity;
      await prisma.inventory.update({
        where: { id: inventory.id },
        data: { quantity: data.stock },
      });

      if (delta !== 0) {
        await prisma.inventoryLog.create({
          data: {
            inventoryId: inventory.id,
            delta,
            reason: "Manual stock update",
          },
        });
      }
    }
  }

  // Return product with serialized dates and proper format
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    description: product.description,
    price: product.price,
    cost: product.cost,
    stock: product.stock,
    category: product.category,
    imageUrl: product.imageUrl,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

export async function deleteProduct(productId: string) {
  // Delete inventory logs first
  const Inventory = await prisma.inventory.findMany({
    where: { productId },
  });

  for (const inventory of Inventory) {
    await prisma.inventoryLog.deleteMany({
      where: { inventoryId: inventory.id },
    });
  }

  // Delete Inventory
  await prisma.inventory.deleteMany({
    where: { productId },
  });

  // Delete forecasts
  await prisma.forecast.deleteMany({
    where: { productId },
  });

  // Delete product
  await prisma.product.delete({
    where: { id: productId },
  });
}
