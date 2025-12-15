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

