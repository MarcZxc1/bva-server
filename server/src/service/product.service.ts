import prisma from "../lib/prisma";
import { hasActiveIntegration } from "../utils/integrationCheck";

export async function getAllProducts(platform?: string) {
  // Import CacheService
  const { CacheService } = await import("../lib/redis");
  
  // Generate cache key
  const cacheKey = `products:all${platform ? `:${platform}` : ''}`;
  
  // Try to get from cache first (5 minute TTL for product lists)
  const cached = await CacheService.get<any[]>(cacheKey);
  if (cached !== null) {
    console.log(`💾 [Cache HIT] getAllProducts: Returning ${cached.length} cached products${platform ? ` for platform ${platform}` : ''}`);
    return cached;
  }
  
  console.log(`💾 [Cache MISS] getAllProducts: Fetching products from database${platform ? ` for platform ${platform}` : ''}...`);
  
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

  const mappedProducts = products.map((product) => ({
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
    shopId: product.shopId,
    shopName: product.Shop.name,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  }));
  
  // Cache the results for 5 minutes (300 seconds)
  await CacheService.set(cacheKey, mappedProducts, 300);
  console.log(`💾 [Cache SET] getAllProducts: Cached ${mappedProducts.length} products${platform ? ` for platform ${platform}` : ''}`);
  
  return mappedProducts;
}

export async function getProductsByShop(shopId: string, platform?: string) {
  // Import CacheService
  const { CacheService } = await import("../lib/redis");
  
  // Generate cache key
  const cacheKey = `products:shop:${shopId}${platform ? `:${platform}` : ''}`;
  
  // Try to get from cache first (5 minute TTL for product lists)
  const cached = await CacheService.get<any[]>(cacheKey);
  if (cached !== null) {
    console.log(`💾 [Cache HIT] getProductsByShop: Returning ${cached.length} cached products for shop ${shopId}`);
    return cached;
  }
  
  console.log(`💾 [Cache MISS] getProductsByShop: Fetching products for shop ${shopId} from database...`);
  
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

  const mappedProducts = products.map((product) => {
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
  
  // Cache the results for 5 minutes (300 seconds)
  await CacheService.set(cacheKey, mappedProducts, 300);
  console.log(`💾 [Cache SET] getProductsByShop: Cached ${mappedProducts.length} products for shop ${shopId}`);
  
  return mappedProducts;
}

export async function getProductById(productId: string) {
  // Import CacheService
  const { CacheService } = await import("../lib/redis");
  
  // Generate cache key
  const cacheKey = `product:${productId}`;
  
  // Try to get from cache first (5 minute TTL for individual products)
  const cached = await CacheService.get<any>(cacheKey);
  if (cached !== null) {
    console.log(`💾 [Cache HIT] getProductById: Returning cached product ${productId}`);
    return cached;
  }
  
  console.log(`💾 [Cache MISS] getProductById: Fetching product ${productId} from database...`);
  
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

  const mappedProduct = {
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
    shopId: product.shopId,
    shopName: product.Shop.name,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
  
  // Cache the result for 5 minutes (300 seconds)
  await CacheService.set(cacheKey, mappedProduct, 300);
  console.log(`💾 [Cache SET] getProductById: Cached product ${productId}`);
  
  return mappedProduct;
}

/**
 * Get products from all shops accessible to a user (owned + linked)
 */
export async function getProductsForUser(userId: string, platform?: string) {
  // Import CacheService
  const { CacheService } = await import("../lib/redis");
  
  // Generate cache key
  const cacheKey = `products:user:${userId}${platform ? `:${platform}` : ''}`;
  
  // Try to get from cache first (5 minute TTL for product lists)
  const cached = await CacheService.get<any[]>(cacheKey);
  if (cached !== null) {
    console.log(`💾 [Cache HIT] getProductsForUser: Returning ${cached.length} cached products for user ${userId}`);
    return cached;
  }
  
  console.log(`💾 [Cache MISS] getProductsForUser: Fetching products for user ${userId} from database...`);
  
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
  const mappedProducts = products.map((product) => {
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
      shopId: product.shopId, // Include shopId for filtering products by shop
      platform: productPlatform,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  });
  
  // Cache the results for 5 minutes (300 seconds)
  await CacheService.set(cacheKey, mappedProducts, 300);
  console.log(`💾 [Cache SET] getProductsForUser: Cached ${mappedProducts.length} products for user ${userId}`);
  
  return mappedProducts;
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
  expiryDate?: string;
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
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
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
    expiryDate: product.expiryDate ? product.expiryDate.toISOString() : null,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };

  // Invalidate product cache after creating a product
  const { CacheService } = await import("../lib/redis");
  await CacheService.invalidateShop(data.shopId);
  // Get shop owner to invalidate user cache
  const shop = await prisma.shop.findUnique({
    where: { id: data.shopId },
    select: { ownerId: true },
  });
  if (shop) {
    await CacheService.invalidateUserProducts(shop.ownerId);
  }
  console.log(`🔄 [Product Service] Invalidated product cache after creating product`);

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
    expiryDate: string;
  }>
) {
  // Transform expiryDate string to Date if provided
  const updateData: any = { ...data };
  if (data.expiryDate !== undefined) {
    updateData.expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;
  }

  const product = await prisma.product.update({
    where: { id: productId },
    data: updateData,
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

  // Invalidate product cache after updating a product
  const { CacheService } = await import("../lib/redis");
  await CacheService.invalidateShop(product.shopId);
  await CacheService.del(`product:${product.id}`); // Invalidate individual product cache
  // Get shop owner to invalidate user cache
  const shop = await prisma.shop.findUnique({
    where: { id: product.shopId },
    select: { ownerId: true },
  });
  if (shop) {
    await CacheService.invalidateUserProducts(shop.ownerId);
  }
  console.log(`🔄 [Product Service] Invalidated product cache after updating product`);

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

export async function restockProduct(
  productId: string,
  quantity: number,
  reason?: string
) {
  if (quantity <= 0) {
    throw new Error("Restock quantity must be greater than 0");
  }

  // Get the product first
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  // Update product stock (increment)
  const updatedProduct = await prisma.product.update({
    where: { id: productId },
    data: {
      stock: {
        increment: quantity,
      },
    },
  });

  // Get or create inventory record
  let inventory = await prisma.inventory.findFirst({
    where: { productId },
    orderBy: { updatedAt: "desc" },
  });

  if (!inventory) {
    // Create inventory if it doesn't exist
    inventory = await prisma.inventory.create({
      data: {
        productId: product.id,
        quantity: quantity,
        threshold: 10,
      },
    });
  } else {
    // Update existing inventory
    inventory = await prisma.inventory.update({
      where: { id: inventory.id },
      data: {
        quantity: {
          increment: quantity,
        },
      },
    });
  }

  // Create inventory log entry
  await prisma.inventoryLog.create({
    data: {
      inventoryId: inventory.id,
      delta: quantity,
      reason: reason || "Manual restock",
    },
  });

  // Return updated product with shopId for socket notifications
  return {
    id: updatedProduct.id,
    sku: updatedProduct.sku,
    name: updatedProduct.name,
    description: updatedProduct.description,
    price: updatedProduct.price,
    cost: updatedProduct.cost,
    stock: updatedProduct.stock,
    category: updatedProduct.category,
    imageUrl: updatedProduct.imageUrl,
    shopId: updatedProduct.shopId,
    createdAt: updatedProduct.createdAt.toISOString(),
    updatedAt: updatedProduct.updatedAt.toISOString(),
  };
}

export async function deleteProduct(productId: string) {
  // Get product info before deletion for cache invalidation
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { shopId: true },
  });

  if (!product) {
    throw new Error("Product not found");
  }

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

  // Invalidate product cache after deleting a product
  const { CacheService } = await import("../lib/redis");
  await CacheService.invalidateShop(product.shopId);
  await CacheService.del(`product:${productId}`); // Invalidate individual product cache
  // Get shop owner to invalidate user cache
  const shop = await prisma.shop.findUnique({
    where: { id: product.shopId },
    select: { ownerId: true },
  });
  if (shop) {
    await CacheService.invalidateUserProducts(shop.ownerId);
  }
  console.log(`🔄 [Product Service] Invalidated product cache after deleting product`);
}
