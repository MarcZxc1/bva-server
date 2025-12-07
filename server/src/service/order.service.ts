import prisma from "../lib/prisma";
import { Platform } from "../generated/prisma";

export async function createOrder(data: {
  userId: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  shippingAddress?: string;
  paymentMethod?: string;
}) {
  // Get shop IDs from products
  const productIds = data.items.map(item => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, shopId: true, shop: { select: { name: true } } },
  });

  if (products.length !== productIds.length) {
    throw new Error("Some products not found");
  }

  // Group items by shop
  const ordersByShop = new Map<string, typeof data.items>();
  for (const item of data.items) {
    const product = products.find(p => p.id === item.productId);
    if (!product) continue;

    if (!ordersByShop.has(product.shopId)) {
      ordersByShop.set(product.shopId, []);
    }
    ordersByShop.get(product.shopId)!.push(item);
  }

  // Create orders for each shop
  const createdOrders = [];
  for (const [shopId, items] of ordersByShop.entries()) {
    const shopTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const product = products.find(p => p.shopId === shopId);

    // Calculate profit
    const productDetails = await prisma.product.findMany({
      where: { id: { in: items.map(i => i.productId) } },
      select: { id: true, cost: true },
    });

    let profit = 0;
    for (const item of items) {
      const prod = productDetails.find(p => p.id === item.productId);
      if (prod?.cost) {
        profit += (item.price - prod.cost) * item.quantity;
      }
    }

    const order = await prisma.sale.create({
      data: {
        shopId,
        platform: Platform.SHOPEE,
        items: items as any,
        total: shopTotal,
        revenue: shopTotal,
        profit,
        customerEmail: data.userId, // Store user ID as email for now
        status: "pending",
      },
    });

    // Update product stock
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });

      // Update inventory
      const inventory = await prisma.inventory.findFirst({
        where: { productId: item.productId },
        orderBy: { updatedAt: "desc" },
      });

      if (inventory) {
        await prisma.inventory.update({
          where: { id: inventory.id },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });

        await prisma.inventoryLog.create({
          data: {
            inventoryId: inventory.id,
            delta: -item.quantity,
            reason: "Order placed",
          },
        });
      }
    }

    createdOrders.push({
      ...order,
      shopName: product?.shop.name,
    });
  }

  return createdOrders;
}

export async function getMyOrders(userId: string) {
  // Get user's shops
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { shops: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // If user is a buyer, get orders where customerEmail matches
  // If user is a seller, get orders from their shops
  if (user.role === "BUYER") {
    const orders = await prisma.sale.findMany({
      where: {
        customerEmail: userId, // Using userId as identifier
      },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return orders.map(order => ({
      id: order.id,
      shopId: order.shopId,
      shopName: order.shop.name,
      items: order.items,
      total: order.total,
      status: order.status,
      createdAt: order.createdAt,
    }));
  } else {
    // Seller: get orders from their shops
    const shopIds = user.shops.map(shop => shop.id);
    const orders = await prisma.sale.findMany({
      where: {
        shopId: { in: shopIds },
      },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return orders.map(order => ({
      id: order.id,
      shopId: order.shopId,
      shopName: order.shop.name,
      items: order.items,
      total: order.total,
      revenue: order.revenue,
      profit: order.profit,
      status: order.status,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      createdAt: order.createdAt,
    }));
  }
}

export async function getSellerOrders(
  shopId: string,
  filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }
) {
  const where: any = { shopId };

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      where.createdAt.lte = new Date(filters.endDate);
    }
  }

  const orders = await prisma.sale.findMany({
    where,
    include: {
      shop: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return orders.map(order => ({
    id: order.id,
    shopId: order.shopId,
    shopName: order.shop.name,
    items: order.items,
    total: order.total,
    revenue: order.revenue,
    profit: order.profit,
    status: order.status,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    createdAt: order.createdAt,
  }));
}

export async function updateOrderStatus(orderId: string, status: string) {
  return prisma.sale.update({
    where: { id: orderId },
    data: { status },
  });
}

export async function getOrderById(orderId: string) {
  const order = await prisma.sale.findUnique({
    where: { id: orderId },
    include: {
      shop: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  return {
    id: order.id,
    shopId: order.shopId,
    shopName: order.shop.name,
    items: order.items,
    total: order.total,
    revenue: order.revenue,
    profit: order.profit,
    status: order.status,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    createdAt: order.createdAt,
  };
}

