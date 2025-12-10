// src/controllers/webhook.controller.ts
// Webhook controller to receive and process data from Shopee-Clone

import { Request, Response } from "express";
import { webhookService } from "../service/webhook.service";
import { CacheService } from "../lib/redis";
import { getSocketIO } from "../services/socket.service";
import prisma from "../lib/prisma";

export class WebhookController {
  /**
   * Handle product created webhook
   * POST /api/webhooks/products/created
   */
  async handleProductCreated(req: Request, res: Response) {
    try {
      const shopId = (req as any).shopId;
      if (!shopId) {
        return res.status(400).json({
          success: false,
          error: "Shop ID is required",
        });
      }

      const product = await webhookService.handleProductCreated(shopId, req.body);
      
      // Invalidate cache
      await CacheService.invalidateShop(shopId);
      
      // Emit real-time update
      const io = getSocketIO();
      if (io) {
        io.to(`shop_${shopId}`).emit("product_update", {
          type: "created",
          product,
        });
      }

      res.status(200).json({
        success: true,
        message: "Product created and synced",
        data: product,
      });
    } catch (error: any) {
      console.error("Error handling product created webhook:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }

  /**
   * Handle product updated webhook
   * POST /api/webhooks/products/updated
   */
  async handleProductUpdated(req: Request, res: Response) {
    try {
      const shopId = (req as any).shopId;
      if (!shopId) {
        return res.status(400).json({
          success: false,
          error: "Shop ID is required",
        });
      }

      const product = await webhookService.handleProductUpdated(shopId, req.body);
      
      // Invalidate cache
      await CacheService.invalidateShop(shopId);
      
      // Emit real-time update
      const io = getSocketIO();
      if (io) {
        io.to(`shop_${shopId}`).emit("product_update", {
          type: "updated",
          product,
        });
      }

      res.status(200).json({
        success: true,
        message: "Product updated and synced",
        data: product,
      });
    } catch (error: any) {
      console.error("Error handling product updated webhook:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }

  /**
   * Handle product deleted webhook
   * POST /api/webhooks/products/deleted
   */
  async handleProductDeleted(req: Request, res: Response) {
    try {
      const shopId = (req as any).shopId;
      if (!shopId) {
        return res.status(400).json({
          success: false,
          error: "Shop ID is required",
        });
      }

      await webhookService.handleProductDeleted(shopId, req.body);
      
      // Invalidate cache
      await CacheService.invalidateShop(shopId);
      
      // Emit real-time update
      const io = getSocketIO();
      if (io) {
        io.to(`shop_${shopId}`).emit("product_update", {
          type: "deleted",
          productId: req.body.productId || req.body.id,
        });
      }

      res.status(200).json({
        success: true,
        message: "Product deleted and synced",
      });
    } catch (error: any) {
      console.error("Error handling product deleted webhook:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }

  /**
   * Handle order created webhook
   * POST /api/webhooks/orders/created
   */
  async handleOrderCreated(req: Request, res: Response) {
    try {
      // Try to get shopId from token first (for sellers)
      let shopId = (req as any).shopId;
      
      // If not in token, try to extract from order data (for buyers)
      if (!shopId && req.body) {
        shopId = req.body.shopId;
      }
      
      // If still not found, try to get it from the first product in items
      if (!shopId && req.body?.items && Array.isArray(req.body.items) && req.body.items.length > 0) {
        // We need to look up the product to get its shopId
        // This is a fallback - ideally shopId should be in the payload
        const firstItem = req.body.items[0];
        if (firstItem.productId) {
          try {
            const product = await prisma.product.findFirst({
              where: {
                OR: [
                  { id: firstItem.productId },
                  { externalId: firstItem.productId },
                ],
              },
              select: { shopId: true },
            });
            if (product) {
              shopId = product.shopId;
            }
          } catch (err) {
            console.error('Error looking up product for shopId:', err);
          }
        }
      }
      
      if (!shopId) {
        return res.status(400).json({
          success: false,
          error: "Shop ID is required. Please include shopId in the request body or ensure the user has a shop.",
        });
      }

      const sale = await webhookService.handleOrderCreated(shopId, req.body);
      
      // Invalidate cache
      await CacheService.invalidateShop(shopId);
      
      // Emit real-time update
      const io = getSocketIO();
      if (io) {
        io.to(`shop_${shopId}`).emit("dashboard_update", {
          type: "new_order",
          sale,
        });
      }

      res.status(200).json({
        success: true,
        message: "Order created and synced",
        data: sale,
      });
    } catch (error: any) {
      console.error("Error handling order created webhook:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }

  /**
   * Handle order updated webhook
   * POST /api/webhooks/orders/updated
   */
  async handleOrderUpdated(req: Request, res: Response) {
    try {
      const shopId = (req as any).shopId;
      if (!shopId) {
        return res.status(400).json({
          success: false,
          error: "Shop ID is required",
        });
      }

      const sale = await webhookService.handleOrderUpdated(shopId, req.body);
      
      // Invalidate cache
      await CacheService.invalidateShop(shopId);
      
      // Emit real-time update
      const io = getSocketIO();
      if (io) {
        io.to(`shop_${shopId}`).emit("dashboard_update", {
          type: "order_updated",
          sale,
        });
      }

      res.status(200).json({
        success: true,
        message: "Order updated and synced",
        data: sale,
      });
    } catch (error: any) {
      console.error("Error handling order updated webhook:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }

  /**
   * Handle order status changed webhook
   * POST /api/webhooks/orders/status-changed
   */
  async handleOrderStatusChanged(req: Request, res: Response) {
    try {
      let shopId = (req as any).shopId;
      
      // If shopId is not in token, try to get it from the order
      if (!shopId) {
        const orderId = req.body.orderId || req.body.id;
        if (orderId) {
          const sale = await prisma.sale.findFirst({
            where: {
              OR: [
                { id: orderId },
                { externalId: orderId },
                { platformOrderId: orderId },
              ],
            },
            select: { shopId: true },
          });
          if (sale) {
            shopId = sale.shopId;
          }
        }
      }
      
      if (!shopId) {
        return res.status(400).json({
          success: false,
          error: "Shop ID is required",
        });
      }

      const sale = await webhookService.handleOrderStatusChanged(shopId, req.body);
      
      // Invalidate cache
      await CacheService.invalidateShop(shopId);
      
      // Emit real-time update
      const io = getSocketIO();
      if (io) {
        // Emit to shop room (for sellers)
        io.to(`shop_${shopId}`).emit("dashboard_update", {
          type: "order_status_changed",
          sale,
        });
        // Also emit globally (for buyers to receive updates)
        io.emit("order_status_changed", {
          type: "order_status_changed",
          orderId: sale.id,
          status: sale.status,
          sale,
        });
      }

      res.status(200).json({
        success: true,
        message: "Order status updated and synced",
        data: sale,
      });
    } catch (error: any) {
      console.error("Error handling order status changed webhook:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }

  /**
   * Handle inventory updated webhook
   * POST /api/webhooks/inventory/updated
   */
  async handleInventoryUpdated(req: Request, res: Response) {
    try {
      const shopId = (req as any).shopId;
      if (!shopId) {
        return res.status(400).json({
          success: false,
          error: "Shop ID is required",
        });
      }

      const inventory = await webhookService.handleInventoryUpdated(shopId, req.body);
      
      // Invalidate cache
      await CacheService.invalidateShop(shopId);
      
      // Emit real-time update
      const io = getSocketIO();
      if (io) {
        io.to(`shop_${shopId}`).emit("inventory_update", {
          type: "updated",
          inventory,
        });
      }

      res.status(200).json({
        success: true,
        message: "Inventory updated and synced",
        data: inventory,
      });
    } catch (error: any) {
      console.error("Error handling inventory updated webhook:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }

  /**
   * Handle batch sync webhook
   * POST /api/webhooks/sync/batch
   */
  async handleBatchSync(req: Request, res: Response) {
    try {
      const shopId = (req as any).shopId;
      if (!shopId) {
        return res.status(400).json({
          success: false,
          error: "Shop ID is required",
        });
      }

      const result = await webhookService.handleBatchSync(shopId, req.body);
      
      // Invalidate all cache for this shop
      await CacheService.invalidateShop(shopId);
      
      // Emit real-time update
      const io = getSocketIO();
      if (io) {
        io.to(`shop_${shopId}`).emit("dashboard_update", {
          type: "batch_sync",
          result,
        });
      }

      res.status(200).json({
        success: true,
        message: "Batch sync completed",
        data: result,
      });
    } catch (error: any) {
      console.error("Error handling batch sync webhook:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }
}

export const webhookController = new WebhookController();

