// Buyer-specific order operations (for shopee-clone and lazada-clone buyers)
import { Request, Response } from "express";
import * as orderService from "../service/order.service";
import * as socketService from "../services/socket.service";
import prisma from "../lib/prisma";

/**
 * Create order (buyer only)
 * POST /api/orders/buyer
 */
export const createOrder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    console.log(`🛒 [Buyer createOrder] User ID: ${userId}`);

    const orders = await orderService.createOrder({
      ...req.body,
      userId,
    });

    // Notify sellers via WebSocket
    if (Array.isArray(orders)) {
      orders.forEach(order => {
        socketService.notifyNewOrder(order);
        console.log(`📢 Notified shop ${order.shopId} about new order ${order.id}`);
      });
    } else if (orders && typeof orders === 'object') {
      const singleOrder = orders as any;
      if (singleOrder.id && singleOrder.shopId) {
        socketService.notifyNewOrder(singleOrder);
        console.log(`📢 Notified shop ${singleOrder.shopId} about new order ${singleOrder.id}`);
      }
    }

    // Notify buyer via WebSocket
    const io = socketService.getSocketIO();
    io.to(`user_${userId}`).emit("order_created", {
      type: "new_order",
      data: orders,
    });
    console.log(`📢 Notified buyer ${userId} about order creation`);

    res.status(201).json({
      success: true,
      data: orders,
    });
  } catch (error: any) {
    console.error("❌ [Buyer createOrder] Error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};

/**
 * Get buyer's orders
 * GET /api/orders/buyer
 */
export const getBuyerOrders = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    // Get platform filter from query parameter
    const platform = req.query.platform as string | undefined;

    const orders = await orderService.getMyOrders(userId, platform);
    res.json({
      success: true,
      data: orders,
    });
  } catch (error: any) {
    console.error("Error in getBuyerOrders:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};

/**
 * Get buyer order by ID
 * GET /api/orders/buyer/:orderId
 */
export const getBuyerOrderById = async (req: Request, res: Response) => {
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

    // Verify order belongs to this buyer
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user || order.customerEmail !== user.email) {
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
    console.error("Error in getBuyerOrderById:", error);
    res.status(404).json({
      success: false,
      error: error.message || "Order not found",
    });
  }
};

/**
 * Update buyer order status (buyer only)
 * PATCH /api/orders/buyer/:orderId/status
 * Buyers can: pay (TO_SHIP), cancel (CANCELLED), confirm receipt (COMPLETED)
 */
export const updateBuyerOrderStatus = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    if (!orderId || !status) {
      return res.status(400).json({
        success: false,
        error: "Order ID and status are required",
      });
    }

    // Validate allowed buyer status transitions
    const allowedBuyerStatuses = ['TO_SHIP', 'CANCELLED', 'COMPLETED', 'TO_RECEIVE'];
    if (!allowedBuyerStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Buyers can only update to: ${allowedBuyerStatuses.join(', ')}`,
      });
    }

    // Get order and verify ownership
    const order = await prisma.sale.findUnique({
      where: { id: orderId },
      include: {
        Shop: {
          select: {
            name: true,
            ownerId: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    // Verify order belongs to this buyer
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user || order.customerEmail !== user.email) {
      return res.status(403).json({
        success: false,
        error: "You don't have permission to update this order",
      });
    }

    // Validate status transitions for buyers
    const currentStatus = order.status;
    const newStatus = status.toUpperCase();

    // Define valid buyer transitions
    const validTransitions: Record<string, string[]> = {
      'PENDING': ['TO_SHIP', 'CANCELLED'], // Buyer pays or cancels
      'TO_SHIP': ['CANCELLED'], // Buyer can cancel before shipping
      'TO_RECEIVE': ['COMPLETED', 'CANCELLED'], // Buyer confirms receipt or cancels
    };

    if (validTransitions[currentStatus] && !validTransitions[currentStatus].includes(newStatus)) {
      return res.status(400).json({
        success: false,
        error: `Cannot change order from ${currentStatus} to ${newStatus}. Allowed transitions: ${validTransitions[currentStatus]?.join(', ') || 'none'}`,
      });
    }

    // Update order status
    const updatedOrder = await prisma.sale.update({
      where: { id: orderId },
      data: { status: newStatus as any },
    });

    console.log(`✅ [Buyer updateOrderStatus] Order ${orderId} status updated: ${currentStatus} → ${newStatus} by buyer ${userId}`);

    // Notify seller via WebSocket
    const io = socketService.getSocketIO();
    io.to(`shop_${order.shopId}`).emit("order_status_updated", {
      type: "order_update",
      orderId: order.id,
      status: newStatus,
      updatedBy: 'buyer',
    });

    // Notify buyer via WebSocket
    io.to(`user_${userId}`).emit("order_status_updated", {
      type: "order_update",
      orderId: order.id,
      status: newStatus,
    });

    res.json({
      success: true,
      data: {
        id: updatedOrder.id,
        status: updatedOrder.status,
        message: `Order status updated to ${newStatus}`,
      },
    });
  } catch (error: any) {
    console.error("❌ [Buyer updateOrderStatus] Error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};

