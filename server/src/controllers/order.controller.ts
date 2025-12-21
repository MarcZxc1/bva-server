import { Request, Response } from "express";
import * as orderService from "../service/order.service";
import { getShopIdFromRequest } from "../utils/requestHelpers";
import * as socketService from "../services/socket.service";
import prisma from "../lib/prisma";
import { shopAccessService } from "../service/shopAccess.service";

export const createOrder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const orders = await orderService.createOrder({
      ...req.body,
      userId,
    });

    // Notify clients about the new order
    // createOrder might return an array or a single object depending on implementation
    // If it's an array, notify for each
    if (Array.isArray(orders)) {
      orders.forEach((order: any) => socketService.notifyNewOrder(order));
    } else {
      socketService.notifyNewOrder(orders);
    }

    res.status(201).json({
      success: true,
      data: orders,
    });
  } catch (error: any) {
    console.error("Error in createOrder:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};

export const getMyOrders = async (req: Request, res: Response) => {
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
    console.error("Error in getMyOrders:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};

// Get all orders for current user (returns array directly for Lazada-Clone compatibility)
export const getAllOrders = async (req: Request, res: Response) => {
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
    // Return orders array directly (for Lazada-Clone compatibility)
    res.json(orders);
  } catch (error: any) {
    console.error("Error in getAllOrders:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};

export const getSellerOrders = async (req: Request, res: Response) => {
  try {
    const { shopId } = req.params;
    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: "Shop ID is required",
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

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;
    
    console.log(`🚢 [updateOrderStatus] Request received - Order ID: ${id}, User ID: ${userId}`);
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Order ID is required",
      });
    }

    if (!userId) {
      console.error('❌ [updateOrderStatus] No userId in request');
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
      console.error(`❌ [updateOrderStatus] Invalid status: ${upperStatus}`);
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    // Check if user has permission to update this order
    // Get the order first to check shop ownership
    console.log(`🔍 [updateOrderStatus] Fetching order ${id}...`);
    const existingOrder = await orderService.getOrderById(id);
    
    if (!existingOrder) {
      console.error(`❌ [updateOrderStatus] Order ${id} not found`);
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    console.log(`🔍 [updateOrderStatus] Order found - Shop ID: ${existingOrder.shopId}`);

    // Check if user is the owner of the shop or has access to it
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { Shop: { select: { id: true } } },
    });

    if (!user) {
      console.error(`❌ [updateOrderStatus] User ${userId} not found`);
      return res.status(401).json({
        success: false,
        error: "User not found",
      });
    }

    // Check if user owns the shop for this order
    const userShopIds = user.Shop.map((shop: any) => shop.id);
    console.log(`🔍 [updateOrderStatus] User ${userId} owns shops: ${userShopIds.join(', ')}, Order shop: ${existingOrder.shopId}`);
    
    if (!userShopIds.includes(existingOrder.shopId)) {
      // Also check if user has access via shop access
      console.log(`⚠️ [updateOrderStatus] User doesn't own shop, checking access...`);
      const hasAccess = await shopAccessService.hasAccess(userId, existingOrder.shopId);
      
      if (!hasAccess) {
        console.error(`❌ [updateOrderStatus] User ${userId} doesn't have access to shop ${existingOrder.shopId}`);
        return res.status(403).json({
          success: false,
          error: "You don't have permission to update this order. You must own the shop that this order belongs to.",
        });
      }
      console.log(`✅ [updateOrderStatus] User has access via shop access`);
    } else {
      console.log(`✅ [updateOrderStatus] User owns the shop`);
    }

    console.log(`✅ [updateOrderStatus] Permission verified, updating status to ${upperStatus}...`);
    const order = await orderService.updateOrderStatus(id, upperStatus as any);

    // Notify clients about the status update
    socketService.notifyOrderStatusUpdate(order);

    console.log(`✅ [updateOrderStatus] Order ${id} status updated successfully to ${upperStatus}`);
    res.json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    console.error("❌ [updateOrderStatus] Error:", error);
    console.error("❌ [updateOrderStatus] Error stack:", error.stack);
    
    // Handle specific error cases
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

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Order ID is required",
      });
    }

    const order = await orderService.getOrderById(id);
    res.json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    console.error("Error in getOrderById:", error);
    res.status(404).json({
      success: false,
      error: error.message || "Order not found",
    });
  }
};

// Public endpoint for BVA integration (no auth required)
export const getOrdersByShopPublic = async (req: Request, res: Response) => {
  try {
    const { shopId } = req.params;
    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: "Shop ID is required",
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
    console.error("Error in getOrdersByShopPublic:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};

