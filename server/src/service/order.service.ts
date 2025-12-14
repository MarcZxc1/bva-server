import prisma from "../lib/prisma";
import { Platform } from "../generated/prisma";
import { getSocketIO } from "../services/socket.service";
import { CacheService } from "../lib/redis";

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
  // Get user email for customerEmail field
  const user = await prisma.user.findUnique({
    where: { id: data.userId },
    select: { email: true, name: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Get shop IDs from products
  // Product IDs from shopee-clone might be external IDs, so we need to search by both id and externalId
  const productIds = data.items.map(item => item.productId);
  
  // First, try to find products by internal ID
  let products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { 
      id: true,
      externalId: true,
      name: true,
      shopId: true, 
      stock: true,
      cost: true,
      Shop: { select: { name: true } } 
    },
  });

  // Find which product IDs weren't found by internal ID
  const foundIds = new Set(products.map(p => p.id));
  const missingIds = productIds.filter(id => !foundIds.has(id));

  // If some products weren't found, try to find them by externalId
  if (missingIds.length > 0) {
    const productsByExternalId = await prisma.product.findMany({
      where: { externalId: { in: missingIds } },
      select: { 
        id: true,
        externalId: true,
        name: true,
        shopId: true, 
        stock: true,
        cost: true,
        Shop: { select: { name: true } } 
      },
    });
    
    // Add products found by externalId to the products array
    products = [...products, ...productsByExternalId];
  }

  // Create a map to quickly look up products by either id or externalId
  const productMap = new Map<string, typeof products[0]>();
  for (const product of products) {
    productMap.set(product.id, product);
    if (product.externalId) {
      productMap.set(product.externalId, product);
    }
  }

  // Verify all products were found
  const notFoundIds = productIds.filter(id => !productMap.has(id));
  if (notFoundIds.length > 0) {
    console.error('Products not found:', notFoundIds);
    throw new Error(`Some products not found: ${notFoundIds.join(', ')}`);
  }

  // Group items by shop, using the correct internal product ID
  const ordersByShop = new Map<string, Array<{
    productId: string; // Use internal ID
    quantity: number;
    price: number;
  }>>();
  
  for (const item of data.items) {
    const product = productMap.get(item.productId);
    if (!product) {
      console.error(`Product not found for ID: ${item.productId}`);
      continue;
    }

    if (!ordersByShop.has(product.shopId)) {
      ordersByShop.set(product.shopId, []);
    }
    
    // Use the internal product ID for the order
    ordersByShop.get(product.shopId)!.push({
      productId: product.id, // Use internal ID, not external ID
      quantity: item.quantity,
      price: item.price,
    });
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
          customerEmail: user.email, // Use actual user email, not userId
          customerName: user.name || null,
          status: "to-pay", // Initial status: buyer needs to confirm payment
        },
      });

      console.log(`✅ Order created: ID=${sale.id}, shopId=${shopId}, total=${shopTotal}, revenue=${shopTotal}`);

      // Update product stock and inventory atomically
      const inventoryUpdates: Array<{
        productId: string;
        productName: string;
        newStock: number;
      }> = [];

      for (const item of items) {
        const product = productDetails.find(p => p.id === item.productId);
        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        // Check stock availability BEFORE updating
        const currentProduct = await tx.product.findUnique({
          where: { id: item.productId },
          select: { id: true, name: true, stock: true },
        });

        if (!currentProduct) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        if (currentProduct.stock < item.quantity) {
          throw new Error(
            `Insufficient stock for ${currentProduct.name}. Available: ${currentProduct.stock}, Requested: ${item.quantity}`
          );
        }

        if (currentProduct.stock === 0) {
          throw new Error(`${currentProduct.name} is out of stock`);
        }

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
            // notifyLowStock({ // This line was removed
            //   shopId,
            //   productId: updatedProduct.id,
            //   productName: updatedProduct.name,
            //   currentStock: updatedProduct.stock,
            //   threshold: LOW_STOCK_THRESHOLD,
            // });
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
          // notifyInventoryUpdate(shopId, inventoryUpdates); // This line was removed
        });
      }

      return sale;
    });

    // Prepare order notification data
    // const orderNotificationData: OrderNotificationData = { // This line was removed
    //   shopId,
    //   orderId: order.id,
    //   total: order.total,
    //   revenue: order.revenue || order.total,
    //   profit: order.profit || 0,
    //   items: items.map(item => {
    //     const product = productDetails.find(p => p.id === item.productId);
    //     return {
    //       productId: item.productId,
    //       productName: product?.name || "Unknown Product",
    //       quantity: item.quantity,
    //       price: item.price,
    //     };
    //   }),
    //   customerEmail: data.userId,
    //   createdAt: order.createdAt,
    // };

    // Emit new order notification (non-blocking)
    setImmediate(() => {
      // notifyNewOrder(orderNotificationData); // This line was removed
      // Also notify about forecast update since sales data has changed
      // notifyForecastUpdate(shopId); // This line was removed
    });

    // Invalidate cache for dashboard analytics immediately
    try {
      await CacheService.invalidateShop(shopId);
      console.log(`✅ Cache invalidated for shop ${shopId} after order creation`);
    } catch (err) {
      console.error("Error invalidating cache after order creation:", err);
    }

    createdOrders.push({
      ...order,
      shopName: product?.Shop.name,
    });
  }

  return createdOrders;
}

export async function getMyOrders(userId: string) {
  // Get user's shops
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { Shop: true },
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
        customerEmail: user.email, // Use user's email to match orders
      },
      include: {
        Shop: {
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
          shopName: order.Shop.name,
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
    const shopIds = user.Shop.map(shop => shop.id);
    const orders = await prisma.sale.findMany({
      where: {
        shopId: { in: shopIds },
      },
      include: {
        Shop: {
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
          shopName: order.Shop.name,
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
      Shop: {
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
        shopName: order.Shop.name,
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
  // Get the order first to restore stock if cancelling/returning
  const order = await prisma.sale.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      items: true,
      status: true,
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  // If order is being cancelled or returned, restore stock
  const shouldRestoreStock = 
    (status === 'cancelled' || status === 'return-refund') &&
    (order.status !== 'cancelled' && order.status !== 'return-refund');

  if (shouldRestoreStock) {
    // Parse items
    let items: Array<{ productId: string; quantity: number }> = [];
    const rawItems = order.items;
    
    if (Array.isArray(rawItems)) {
      // Validate and filter items to ensure they have the correct structure
      items = rawItems
        .filter((item: any): item is { productId: string; quantity: number } => 
          item && 
          typeof item === 'object' && 
          typeof item.productId === 'string' && 
          typeof item.quantity === 'number'
        );
    } else if (typeof rawItems === 'string') {
      try {
        const parsed = JSON.parse(rawItems);
        if (Array.isArray(parsed)) {
          items = parsed
            .filter((item: any): item is { productId: string; quantity: number } => 
              item && 
              typeof item === 'object' && 
              typeof item.productId === 'string' && 
              typeof item.quantity === 'number'
            );
        }
      } catch {
        items = [];
      }
    } else if (rawItems && typeof rawItems === 'object') {
      // Handle case where items is a single object (shouldn't happen, but handle it)
      items = [];
    }

    // Restore stock for each item
    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        if (item.productId && item.quantity) {
          // Restore product stock
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });

          // Restore inventory
          const inventory = await tx.inventory.findFirst({
            where: { productId: item.productId },
            orderBy: { updatedAt: "desc" },
          });

          if (inventory) {
            await tx.inventory.update({
              where: { id: inventory.id },
              data: {
                quantity: {
                  increment: item.quantity,
                },
              },
            });

            await tx.inventoryLog.create({
              data: {
                inventoryId: inventory.id,
                delta: item.quantity,
                reason: `Order ${status === 'cancelled' ? 'cancelled' : 'returned'}`,
              },
            });
          }
        }
      }
    });
  }

  const updatedOrder = await prisma.sale.update({
    where: { id: orderId },
    data: { status },
    include: {
      Shop: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Emit socket notification for order status change
  setImmediate(() => {
    try {
      const io = getSocketIO();
      if (io) {
        // Emit to shop room (for sellers)
        io.to(`shop_${updatedOrder.shopId}`).emit("dashboard_update", {
          type: "order_status_changed",
          data: {
            orderId: updatedOrder.id,
            status: updatedOrder.status,
            shopId: updatedOrder.shopId,
          },
        });
        // Also emit globally (for buyers to receive updates)
        io.emit("order_status_changed", {
          type: "order_status_changed",
          orderId: updatedOrder.id,
          status: updatedOrder.status,
          sale: updatedOrder,
        });
        console.log(`📢 Notified shop ${updatedOrder.shopId} about order status change: ${orderId} -> ${status}`);
      }
    } catch (error) {
      // Socket.IO not initialized, skip notification (non-critical)
      console.warn('⚠️  Socket.IO not available for order status notification:', error);
    }
  });

  return updatedOrder;
}

export async function getOrderById(orderId: string) {
  const order = await prisma.sale.findUnique({
    where: { id: orderId },
    include: {
      Shop: {
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
    shopName: order.Shop.name,
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

