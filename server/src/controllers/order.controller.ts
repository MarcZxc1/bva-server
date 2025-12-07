import { Request, Response } from "express";
import * as orderService from "../service/order.service";
import { getShopIdFromRequest } from "../utils/requestHelpers";

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

    const orders = await orderService.getMyOrders(userId);
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
    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Order ID is required",
      });
    }

    const { status } = req.body;
    if (!status) {
      return res.status(400).json({
        success: false,
        error: "Status is required",
      });
    }

    const order = await orderService.updateOrderStatus(id, status);
    res.json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    console.error("Error in updateOrderStatus:", error);
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

