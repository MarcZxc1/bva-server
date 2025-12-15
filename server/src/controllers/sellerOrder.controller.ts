// Seller-specific order operations (for shopee-clone and lazada-clone sellers)
import { Request, Response } from "express";
import * as orderService from "../service/order.service";
import * as socketService from "../services/socket.service";
import prisma from "../lib/prisma";
import { shopAccessService } from "../service/shopAccess.service";
import { OrderStatus } from "../generated/prisma";

/**
 * Get seller's orders for a specific shop
 * GET /api/orders/seller/:shopId
 */
export const getSellerOrders = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { shopId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: "Shop ID is required",
      });
    }

    // Verify user owns the shop or has access
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { Shop: { select: { id: true } } },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "User not found",
      });
    }

    const userShopIds = user.Shop.map(shop => shop.id);
    const hasAccess = userShopIds.includes(shopId) || await shopAccessService.hasAccess(userId, shopId);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: "You don't have permission to view orders for this shop",
      });
    }

    const { status, startDate, endDate } = req.query;
    const orders = await orderService.getSellerOrders(shopId, {
      status: status as string,
      startDate: startDate as string,
      endDate: endDate as string,
    });

    res.json({
      success: true,
      data: orders,
    });
  } catch (error: any) {
    console.error("Error in getSellerOrders:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};

/**
 * Update order status (seller only - ship orders, confirm delivery, etc.)
 * PATCH /api/orders/seller/:orderId/status
 */
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const userId = (req as any).user?.userId;
    
    console.log(`🚢 [Seller updateOrderStatus] Order ID: ${orderId}, User ID: ${userId}`);
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: "Order ID is required",
      });
    }

    if (!userId) {
      console.error('❌ [Seller updateOrderStatus] No userId in request');
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const { status } = req.body;
    if (!status) {
      return res.status(400).json({
        success: false,
        error: "Status is required",
      });
    }

    // Validate status is a valid OrderStatus enum value
    const validStatuses = ['PENDING', 'TO_SHIP', 'TO_RECEIVE', 'COMPLETED', 'CANCELLED', 'RETURNED', 'REFUNDED', 'FAILED'];
    const upperStatus = status.toUpperCase();
    
    if (!validStatuses.includes(upperStatus)) {
      console.error(`❌ [Seller updateOrderStatus] Invalid status: ${upperStatus}`);
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    // Get the order and verify ownership
    console.log(`🔍 [Seller updateOrderStatus] Fetching order ${orderId}...`);
    const existingOrder = await orderService.getOrderById(orderId);
    
    if (!existingOrder) {
      console.error(`❌ [Seller updateOrderStatus] Order ${orderId} not found`);
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    console.log(`🔍 [Seller updateOrderStatus] Order found - Shop ID: ${existingOrder.shopId}`);

    // Verify user owns the shop or has access
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { Shop: { select: { id: true } } },
    });

    if (!user) {
      console.error(`❌ [Seller updateOrderStatus] User ${userId} not found`);
      return res.status(401).json({
        success: false,
        error: "User not found",
      });
    }

    const userShopIds = user.Shop.map(shop => shop.id);
    console.log(`🔍 [Seller updateOrderStatus] User ${userId} owns shops: ${userShopIds.join(', ')}, Order shop: ${existingOrder.shopId}`);
    
    const hasAccess = userShopIds.includes(existingOrder.shopId) || await shopAccessService.hasAccess(userId, existingOrder.shopId);
    
    if (!hasAccess) {
      console.error(`❌ [Seller updateOrderStatus] User ${userId} doesn't have access to shop ${existingOrder.shopId}`);
      return res.status(403).json({
        success: false,
        error: "You don't have permission to update this order. You must own the shop that this order belongs to.",
      });
    }

    console.log(`✅ [Seller updateOrderStatus] Permission verified, updating status to ${upperStatus}...`);
    const order = await orderService.updateOrderStatus(orderId, upperStatus as OrderStatus);

    // Notify via WebSocket
    socketService.notifyOrderStatusUpdate(order);
    
    // Also notify buyer via user room if we can identify them
    if (order.customerEmail) {
      try {
        const buyer = await prisma.user.findFirst({
          where: { email: order.customerEmail },
          select: { id: true },
        });
        if (buyer) {
          const io = socketService.getSocketIO();
          io.to(`user_${buyer.id}`).emit("order_status_updated", {
            type: "status_update",
            data: order,
          });
          console.log(`📢 Notified buyer ${buyer.id} about order status update`);
        }
      } catch (err) {
        console.warn("Could not notify buyer via WebSocket:", err);
      }
    }

    console.log(`✅ [Seller updateOrderStatus] Order ${orderId} status updated successfully to ${upperStatus}`);
    res.json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    console.error("❌ [Seller updateOrderStatus] Error:", error);
    console.error("❌ [Seller updateOrderStatus] Error stack:", error.stack);
    
    if (error.message?.includes("not found")) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }
    
    if (error.message?.includes("permission") || error.message?.includes("don't have")) {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};

/**
 * Get seller order by ID
 * GET /api/orders/seller/:orderId
 */
export const getSellerOrderById = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: "Order ID is required",
      });
    }

    const order = await orderService.getOrderById(orderId);
    
    // Verify user owns the shop
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { Shop: { select: { id: true } } },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "User not found",
      });
    }

    const userShopIds = user.Shop.map(shop => shop.id);
    const hasAccess = userShopIds.includes(order.shopId) || await shopAccessService.hasAccess(userId, order.shopId);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: "You don't have permission to view this order",
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    console.error("Error in getSellerOrderById:", error);
    res.status(404).json({
      success: false,
      error: error.message || "Order not found",
    });
  }
};

