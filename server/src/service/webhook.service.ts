// src/service/webhook.service.ts
// Service to handle webhook data from Shopee-Clone

import prisma from "../lib/prisma";
import { shopeeIntegrationService } from "./shopeeIntegration.service";

class WebhookService {
  /**
   * Handle product created webhook
   */
  async handleProductCreated(shopId: string, data: any) {
    const product = await prisma.product.upsert({
      where: {
        shopId_externalId: {
          shopId,
          externalId: data.id || data.productId,
        },
      },
      update: {
        name: data.name,
        description: data.description || null,
        price: data.price,
        cost: data.cost || null,
        category: data.category || null,
        imageUrl: data.image || data.imageUrl || null,
        stock: data.stock || 0,
        updatedAt: new Date(),
      },
      create: {
        shopId,
        externalId: data.id || data.productId,
        sku: data.sku || `SHOPEE-${data.id || data.productId}`,
        name: data.name,
        description: data.description || null,
        price: data.price,
        cost: data.cost || null,
        category: data.category || null,
        imageUrl: data.image || data.imageUrl || null,
        stock: data.stock || 0,
      },
    });

    // Create inventory record if it doesn't exist
    if (product.stock !== undefined) {
      const existingInventory = await prisma.inventory.findFirst({
        where: {
          productId: product.id,
        },
      });

      if (existingInventory) {
        await prisma.inventory.update({
          where: { id: existingInventory.id },
          data: {
            quantity: product.stock,
            updatedAt: new Date(),
          },
        });
      } else {
        await prisma.inventory.create({
          data: {
            productId: product.id,
            quantity: product.stock,
            threshold: 10, // Default threshold
          },
        });
      }
    }

    return product;
  }

  /**
   * Handle product updated webhook
   */
  async handleProductUpdated(shopId: string, data: any) {
    return this.handleProductCreated(shopId, data); // Same logic
  }

  /**
   * Handle product deleted webhook
   */
  async handleProductDeleted(shopId: string, data: any) {
    const productId = data.productId || data.id;
    
    // Find product by externalId
    const product = await prisma.product.findFirst({
      where: {
        shopId,
        externalId: productId,
      },
    });

    if (product) {
      // Delete inventory first (foreign key constraint)
      await prisma.inventory.deleteMany({
        where: { productId: product.id },
      });

      // Delete product
      await prisma.product.delete({
        where: { id: product.id },
      });
    }

    return { deleted: true };
  }

  /**
   * Handle order created webhook
   */
  async handleOrderCreated(shopId: string, data: any) {
    const items = data.items || [];
    const total = data.total || data.totalPrice || data.total_price || 0;

    // Calculate profit from product costs
    let profit = 0;
    if (items.length > 0) {
      const productIds = items.map((item: any) => item.productId).filter(Boolean);
      if (productIds.length > 0) {
        const products = await prisma.product.findMany({
          where: {
            shopId,
            OR: [
              { id: { in: productIds } },
              { externalId: { in: productIds } },
            ],
          },
          select: { id: true, externalId: true, cost: true },
        });

        const productCostMap = new Map<string, number>();
        products.forEach(p => {
          if (p.id) productCostMap.set(p.id, p.cost || 0);
          if (p.externalId) productCostMap.set(p.externalId, p.cost || 0);
        });

        profit = items.reduce((sum: number, item: any) => {
          const cost = productCostMap.get(item.productId) || 0;
          return sum + ((item.price - cost) * item.quantity);
        }, 0);
      }
    }

    // Fallback to 20% margin
    if (profit === 0 && total > 0) {
      profit = total * 0.2;
    }

    // Deduct stock from inventory
    for (const item of items) {
      const product = await prisma.product.findFirst({
        where: {
          shopId,
          OR: [
            { id: item.productId },
            { externalId: item.productId },
          ],
        },
      });

      if (product) {
        const newStock = Math.max(0, (product.stock || 0) - item.quantity);
        await prisma.product.update({
          where: { id: product.id },
          data: { stock: newStock },
        });

        // Update inventory
        await prisma.inventory.updateMany({
          where: { productId: product.id },
          data: { quantity: newStock },
        });
      }
    }

    const sale = await prisma.sale.upsert({
      where: {
        shopId_externalId: {
          shopId,
          externalId: data.id || data.orderId,
        },
      },
      update: {
        items: items.map((item: any) => ({
          productId: item.productId,
          productName: item.productName || item.name,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.quantity * item.price,
        })),
        total,
        revenue: total,
        profit,
        status: data.status || "completed",
        customerName: data.customerName || null,
        customerEmail: data.customerEmail || null,
      },
      create: {
        shopId,
        externalId: data.id || data.orderId,
        platform: "SHOPEE",
        platformOrderId: data.orderId || data.id,
        items: items.map((item: any) => ({
          productId: item.productId,
          productName: item.productName || item.name,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.quantity * item.price,
        })),
        total,
        revenue: total,
        profit,
        status: data.status || "completed",
        customerName: data.customerName || null,
        customerEmail: data.customerEmail || null,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      },
    });

    return sale;
  }

  /**
   * Handle order updated webhook
   */
  async handleOrderUpdated(shopId: string, data: any) {
    return this.handleOrderCreated(shopId, data); // Same logic
  }

  /**
   * Handle order status changed webhook
   */
  async handleOrderStatusChanged(shopId: string, data: any) {
    const sale = await prisma.sale.findFirst({
      where: {
        shopId,
        OR: [
          { externalId: data.orderId || data.id },
          { platformOrderId: data.orderId || data.id },
        ],
      },
    });

    if (sale) {
      return await prisma.sale.update({
        where: { id: sale.id },
        data: {
          status: data.status,
        },
      });
    }

    throw new Error("Sale not found");
  }

  /**
   * Handle inventory updated webhook
   */
  async handleInventoryUpdated(shopId: string, data: any) {
    const product = await prisma.product.findFirst({
      where: {
        shopId,
        OR: [
          { id: data.productId },
          { externalId: data.productId },
        ],
      },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    // Update product stock
    await prisma.product.update({
      where: { id: product.id },
      data: { stock: data.quantity || data.stock || 0 },
    });

    // Update inventory
    const existingInventory = await prisma.inventory.findFirst({
      where: {
        productId: product.id,
      },
    });

    let inventory;
    if (existingInventory) {
      inventory = await prisma.inventory.update({
        where: { id: existingInventory.id },
        data: {
          quantity: data.quantity || data.stock || 0,
          updatedAt: new Date(),
        },
      });
    } else {
      inventory = await prisma.inventory.create({
        data: {
          productId: product.id,
          quantity: data.quantity || data.stock || 0,
          threshold: data.threshold || 10,
        },
      });
    }

    return inventory;
  }

  /**
   * Handle batch sync webhook
   */
  async handleBatchSync(shopId: string, data: any) {
    const { products = [], orders = [] } = data;
    
    let productsCount = 0;
    let ordersCount = 0;

    // Sync products
    for (const productData of products) {
      try {
        await this.handleProductCreated(shopId, productData);
        productsCount++;
      } catch (error) {
        console.error(`Error syncing product ${productData.id}:`, error);
      }
    }

    // Sync orders
    for (const orderData of orders) {
      try {
        await this.handleOrderCreated(shopId, orderData);
        ordersCount++;
      } catch (error) {
        console.error(`Error syncing order ${orderData.id}:`, error);
      }
    }

    return {
      products: productsCount,
      orders: ordersCount,
    };
  }
}

export const webhookService = new WebhookService();

