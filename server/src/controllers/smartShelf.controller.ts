import { Request, Response } from "express";
import * as smartShelfService from "../service/smartShelf.service";

export const getAtRiskInventory = async (req: Request, res: Response) => {
  try {
    const { shopId } = req.params;

    if (!shopId) {
      return res.status(400).json({ 
        success: false,
        error: "Shop ID is required" 
      });
    }

    const result = await smartShelfService.getAtRiskInventory(shopId);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Error in getAtRiskInventory:", error);
    
    if (error.message?.includes("AI Service Unavailable")) {
      return res.status(503).json({ 
        success: false,
        error: "AI Service Unavailable",
        message: "The AI service is currently unavailable. Please try again later."
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: error.message || "Internal Server Error" 
    });
  }
};

export const getDashboardAnalytics = async (req: Request, res: Response) => {
  try {
    const { shopId } = req.params;

    if (!shopId) {
      return res.status(400).json({ 
        success: false,
        error: "Shop ID is required" 
      });
    }

    const analytics = await smartShelfService.getDashboardAnalytics(shopId);
    
    res.json({
      success: true,
      data: analytics,
    });
  } catch (error: any) {
    console.error("Error in getDashboardAnalytics:", error);
    
    if (error.message?.includes("AI Service Unavailable")) {
      return res.status(503).json({ 
        success: false,
        error: "AI Service Unavailable",
        message: "The AI service is currently unavailable. Please try again later."
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: error.message || "Internal Server Error" 
    });
  }
};
