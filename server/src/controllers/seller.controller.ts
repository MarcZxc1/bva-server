import { Request, Response } from "express";
import * as sellerService from "../service/seller.service";
import * as productService from "../service/product.service";
import * as orderService from "../service/order.service";
import { getShopIdFromRequest } from "../utils/requestHelpers";

export const getSellerDashboard = async (req: Request, res: Response) => {
  try {
    const { shopId } = req.params;
    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: "Shop ID is required",
      });
    }
    const dashboard = await sellerService.getSellerDashboard(shopId);
    res.json({
      success: true,
      data: dashboard,
    });
  } catch (error: any) {
    console.error("Error in getSellerDashboard:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};

export const getSellerIncome = async (req: Request, res: Response) => {
  try {
    const { shopId } = req.params;
    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: "Shop ID is required",
      });
    }
    const { startDate, endDate, status } = req.query;

    const income = await sellerService.getSellerIncome(shopId, {
      startDate: startDate as string,
      endDate: endDate as string,
      status: status as "pending" | "released",
    });

    res.json({
      success: true,
      data: income,
    });
  } catch (error: any) {
    console.error("Error in getSellerIncome:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};

// Lazada-Clone specific seller endpoints
export const getSellerProducts = async (req: Request, res: Response) => {
  try {
    const shopId = await getShopIdFromRequest(req);
    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: "Shop ID is required. Please ensure you have a shop associated with your account.",
      });
    }

    const products = await productService.getProductsByShop(shopId);
    res.json({
      success: true,
      data: products,
    });
  } catch (error: any) {
    console.error("Error in getSellerProducts:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};

export const createSellerProduct = async (req: Request, res: Response) => {
  try {
    const shopId = await getShopIdFromRequest(req);
    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: "Shop ID is required. Please ensure you have a shop associated with your account.",
      });
    }

    const product = await productService.createProduct({
      ...req.body,
      shopId,
    });
    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    console.error("Error in createSellerProduct:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};

export const getSellerOrders = async (req: Request, res: Response) => {
  try {
    const shopId = await getShopIdFromRequest(req);
    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: "Shop ID is required. Please ensure you have a shop associated with your account.",
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

