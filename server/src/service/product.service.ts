import prisma from "../lib/prisma";
import { hasActiveIntegration } from "../utils/integrationCheck";

export async function getAllProducts() {
  const products = await prisma.product.findMany({
    include: {
      shop: {
        select: {
          id: true,
          name: true,
        },
      },
      inventories: {
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
    quantity: product.inventories[0]?.quantity || product.stock || 0,
    expiryDate: product.expiryDate,
    category: product.category,
    imageUrl: product.imageUrl,
    shopId: product.shopId,
    shopName: product.shop.name,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  }));
}

export async function getProductsByShop(shopId: string) {
  // For shopee-clone sellers, show ALL products (both synced and locally created)
  // This endpoint is primarily used by shopee-clone, so we show all products
  // BVA frontend can filter on its side if needed
  
  // Get shop integrations to determine platform (for platform assignment)
  const integrations = await prisma.integration.findMany({
    where: { shopId },
    select: { platform: true },
  });

  // Get platform values from integrations
  const integrationPlatforms = integrations.map(integration => integration.platform);

  // Get ALL products for the shop (both synced from integrations and locally created)
  // This allows shopee-clone sellers to see all their products
  const products = await prisma.product.findMany({
    where: { 
      shopId,
      // No filter - show all products regardless of externalId
    },
    include: {
      inventories: {
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

  // Default platform (first integration or null)
  const defaultPlatform = integrations.length > 0 && integrations[0] ? integrations[0].platform : null;

  return products.map((product) => {
    // Determine platform: from sales data, externalId pattern, or default
    let platform: string | null = productPlatformMap.get(product.id) || null;
    
    // If no platform from sales, check externalId pattern
    if (!platform && product.externalId) {
      if (product.externalId.includes('SHOPEE') || product.externalId.startsWith('SHOPEE')) {
        platform = 'SHOPEE';
      } else if (product.externalId.includes('LAZADA') || product.externalId.startsWith('LAZADA')) {
        platform = 'LAZADA';
      } else if (product.externalId.includes('TIKTOK') || product.externalId.startsWith('TIKTOK')) {
        platform = 'TIKTOK';
      }
    }

    // Use default platform if still no platform found
    if (!platform) {
      platform = defaultPlatform;
    }

    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      description: product.description,
      price: product.price,
      cost: product.cost,
      stock: product.stock,
      quantity: product.inventories[0]?.quantity || product.stock || 0,
      expiryDate: product.expiryDate ? product.expiryDate.toISOString() : null,
      category: product.category,
      imageUrl: product.imageUrl,
      platform: platform,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  });
}

export async function getProductById(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      shop: {
        select: {
          id: true,
          name: true,
        },
      },
      inventories: {
        take: 1,
        orderBy: {
          updatedAt: "desc",
        },
      },
    },
  });

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
    quantity: product.inventories[0]?.quantity || product.stock || 0,
    expiryDate: product.expiryDate,
    category: product.category,
    imageUrl: product.imageUrl,
    shopId: product.shopId,
    shopName: product.shop.name,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

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
  const inventories = await prisma.inventory.findMany({
    where: { productId },
  });

  for (const inventory of inventories) {
    await prisma.inventoryLog.deleteMany({
      where: { inventoryId: inventory.id },
    });
  }

  // Delete inventories
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
