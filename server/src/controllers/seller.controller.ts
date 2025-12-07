import { Request, Response } from "express";
import * as sellerService from "../service/seller.service";

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

