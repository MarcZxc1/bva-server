import prisma from "../lib/prisma";

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
  const products = await prisma.product.findMany({
    where: { shopId },
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
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  }));
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

  return product;
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

  return product;
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
