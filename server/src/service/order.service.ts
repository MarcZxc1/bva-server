import prisma from "../lib/prisma";
import { Platform } from "../generated/prisma";
import { notifyNewOrder, notifyLowStock, notifyInventoryUpdate, OrderNotificationData } from "../services/socket.service";

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
    select: { 
      id: true, 
      name: true,
      shopId: true, 
      stock: true,
      cost: true,
      shop: { select: { name: true } } 
    },
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

  // Create orders for each shop using transactions
  const createdOrders = [];
  const LOW_STOCK_THRESHOLD = 5; // Alert if stock goes below this

  for (const [shopId, items] of ordersByShop.entries()) {
    const shopTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const product = products.find(p => p.shopId === shopId);

    // Calculate profit
    const productDetails = products.filter(p => 
      items.some(i => i.productId === p.id)
    );

    let profit = 0;
    for (const item of items) {
      const prod = productDetails.find(p => p.id === item.productId);
      if (prod?.cost) {
        profit += (item.price - prod.cost) * item.quantity;
      }
    }

    // Use transaction to ensure atomicity
    const order = await prisma.$transaction(async (tx) => {
      // Create sale record
      const sale = await tx.sale.create({
        data: {
          shopId,
          platform: Platform.SHOPEE,
          items: items as any,
          total: shopTotal,
          revenue: shopTotal,
          profit,
          customerEmail: data.userId,
          status: "to-pay", // Initial status: buyer needs to confirm payment
        },
      });

      // Update product stock and inventory atomically
      const inventoryUpdates: Array<{
        productId: string;
        productName: string;
        newStock: number;
      }> = [];

      for (const item of items) {
        const product = productDetails.find(p => p.id === item.productId);
        if (!product) continue;

        // Update product stock
        const updatedProduct = await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
          select: {
            id: true,
            name: true,
            stock: true,
          },
        });

        inventoryUpdates.push({
          productId: updatedProduct.id,
          productName: updatedProduct.name,
          newStock: updatedProduct.stock,
        });

        // Check for low stock alert
        if (updatedProduct.stock <= LOW_STOCK_THRESHOLD && updatedProduct.stock > 0) {
          // Emit low stock alert (non-blocking)
          setImmediate(() => {
            notifyLowStock({
              shopId,
              productId: updatedProduct.id,
              productName: updatedProduct.name,
              currentStock: updatedProduct.stock,
              threshold: LOW_STOCK_THRESHOLD,
            });
          });
        }

        // Update inventory
        const inventory = await tx.inventory.findFirst({
          where: { productId: item.productId },
          orderBy: { updatedAt: "desc" },
        });

        if (inventory) {
          await tx.inventory.update({
            where: { id: inventory.id },
            data: {
              quantity: {
                decrement: item.quantity,
              },
            },
          });

          await tx.inventoryLog.create({
            data: {
              inventoryId: inventory.id,
              delta: -item.quantity,
              reason: "Order placed",
            },
          });
        }
      }

      // Emit inventory updates
      if (inventoryUpdates.length > 0) {
        setImmediate(() => {
          notifyInventoryUpdate(shopId, inventoryUpdates);
        });
      }

      return sale;
    });

    // Prepare order notification data
    const orderNotificationData: OrderNotificationData = {
      shopId,
      orderId: order.id,
      total: order.total,
      revenue: order.revenue || order.total,
      profit: order.profit || 0,
      items: items.map(item => {
        const product = productDetails.find(p => p.id === item.productId);
        return {
          productId: item.productId,
          productName: product?.name || "Unknown Product",
          quantity: item.quantity,
          price: item.price,
        };
      }),
      customerEmail: data.userId,
      createdAt: order.createdAt,
    };

    // Emit new order notification (non-blocking)
    setImmediate(() => {
      notifyNewOrder(orderNotificationData);
    });

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

  // Helper function to enrich items with product images
  const enrichItemsWithImages = async (items: any[]) => {
    if (!Array.isArray(items) || items.length === 0) return items;

    // Extract all product IDs
    const productIds = items
      .map(item => item.productId)
      .filter(Boolean);

    if (productIds.length === 0) return items;

    // Fetch products with images
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, imageUrl: true },
    });

    // Create a map of productId -> imageUrl
    const productImageMap = new Map<string, string | null>();
    products.forEach(p => {
      if (p.id) productImageMap.set(p.id, p.imageUrl);
    });

    // Enrich items with imageUrl
    return items.map(item => ({
      ...item,
      imageUrl: item.productId ? productImageMap.get(item.productId) || null : null,
    }));
  };

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

    // Enrich all orders with product images
    const enrichedOrders = await Promise.all(
      orders.map(async order => {
        let items: any[] = [];
        const rawItems = order.items;
        if (Array.isArray(rawItems)) {
          items = rawItems;
        } else if (typeof rawItems === 'string') {
          try {
            const parsed = JSON.parse(rawItems);
            items = Array.isArray(parsed) ? parsed : [];
          } catch {
            items = [];
          }
        } else if (rawItems && typeof rawItems === 'object') {
          items = [rawItems];
        }

        const enrichedItems = await enrichItemsWithImages(items);

        return {
          id: order.id,
          shopId: order.shopId,
          shopName: order.shop.name,
          items: enrichedItems,
          total: order.total,
          status: order.status,
          createdAt: order.createdAt,
        };
      })
    );

    return enrichedOrders;
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

    // Enrich all orders with product images
    const enrichedOrders = await Promise.all(
      orders.map(async order => {
        // Ensure items is always an array
        let items: any[] = [];
        const rawItems = order.items;
        if (Array.isArray(rawItems)) {
          items = rawItems;
        } else if (typeof rawItems === 'string') {
          try {
            const parsed = JSON.parse(rawItems);
            items = Array.isArray(parsed) ? parsed : [];
          } catch {
            items = [];
          }
        } else if (rawItems && typeof rawItems === 'object') {
          // If it's an object but not an array, wrap it
          items = [rawItems];
        }

        const enrichedItems = await enrichItemsWithImages(items);

        return {
          id: order.id,
          shopId: order.shopId,
          shopName: order.shop.name,
          items: enrichedItems,
          total: order.total,
          revenue: order.revenue,
          profit: order.profit,
          status: order.status,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          createdAt: order.createdAt,
          platform: order.platform,
        };
      })
    );

    return enrichedOrders;
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

  // Helper function to enrich items with product images
  const enrichItemsWithImages = async (items: any[]) => {
    if (!Array.isArray(items) || items.length === 0) return items;

    // Extract all product IDs
    const productIds = items
      .map(item => item.productId)
      .filter(Boolean);

    if (productIds.length === 0) return items;

    // Fetch products with images
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, imageUrl: true },
    });

    // Create a map of productId -> imageUrl
    const productImageMap = new Map<string, string | null>();
    products.forEach(p => {
      if (p.id) productImageMap.set(p.id, p.imageUrl);
    });

    // Enrich items with imageUrl
    return items.map(item => ({
      ...item,
      imageUrl: item.productId ? productImageMap.get(item.productId) || null : null,
    }));
  };

  // Enrich all orders with product images
  const enrichedOrders = await Promise.all(
    orders.map(async order => {
      // Ensure items is always an array
      let items: any[] = [];
      const rawItems = order.items;
      if (Array.isArray(rawItems)) {
        items = rawItems;
      } else if (typeof rawItems === 'string') {
        try {
          const parsed = JSON.parse(rawItems);
          items = Array.isArray(parsed) ? parsed : [];
        } catch {
          items = [];
        }
      } else if (rawItems && typeof rawItems === 'object') {
        items = [rawItems];
      }

      const enrichedItems = await enrichItemsWithImages(items);

      return {
        id: order.id,
        shopId: order.shopId,
        shopName: order.shop.name,
        items: enrichedItems,
        total: order.total,
        revenue: order.revenue,
        profit: order.profit,
        status: order.status,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        createdAt: order.createdAt,
      };
    })
  );

  return enrichedOrders;
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

