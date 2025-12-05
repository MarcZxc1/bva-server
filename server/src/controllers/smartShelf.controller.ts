import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { mlClient } from "../utils/mlClient";
import { getDashboardAnalytics as getDashboardAnalyticsService } from "../service/smartShelf.service";
import { 
  MLAtRiskRequest, 
  MLAtRiskResponse, 
  MLInsightsRequest, 
  MLInsightsResponse,
  MLInventoryItem,
  MLSalesRecord
} from "../types/ml.types";

/**
 * GET /api/smart-shelf/dashboard/:shopId
 * Get comprehensive dashboard analytics merging local stats and AI metrics
 */
export const getDashboardAnalytics = async (req: Request, res: Response) => {
  try {
    const { shopId } = req.params;

    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: "Shop ID is required",
      });
    }

    // Use service layer for dashboard analytics
    const dashboardData = await getDashboardAnalyticsService(shopId);

    res.json({
      success: true,
      data: dashboardData,
    });

  } catch (error: any) {
    console.error("Error in getDashboardAnalytics:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};

/**
 * GET /api/smart-shelf/at-risk/:shopId
 * Get only at-risk inventory items
 */
export const getAtRiskInventory = async (req: Request, res: Response) => {
  try {
    const { shopId } = req.params;

    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: "Shop ID is required",
      });
    }

    // 1. Fetch products and inventory
    const products = await prisma.product.findMany({
      where: { shopId },
      include: { inventories: { take: 1 } },
    });

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const sales = await prisma.sale.findMany({
      where: {
        shopId,
        createdAt: { gte: ninetyDaysAgo },
      },
      select: {
        items: true,
        createdAt: true,
        total: true,
      },
    });

    // 2. Prepare Data for ML Service
    const inventoryItems: MLInventoryItem[] = products.map(p => ({
      product_id: p.id,
      sku: p.sku || `SKU-${p.id}`,
      name: p.name,
      quantity: p.inventories[0]?.quantity || 0,
      price: p.price,
      categories: p.description ? [p.description] : []
    }));

    const salesRecords: MLSalesRecord[] = [];
    sales.forEach(sale => {
      const items = typeof sale.items === "string" ? JSON.parse(sale.items) : sale.items;
      if (Array.isArray(items)) {
        items.forEach((item: any) => {
          salesRecords.push({
            product_id: item.productId,
            date: sale.createdAt.toISOString(),
            qty: item.quantity || 1,
            revenue: (item.price || 0) * (item.quantity || 1)
          });
        });
      }
    });

    // 3. Call ML Service
    const atRiskResult = await mlClient.post<MLAtRiskResponse>("/api/v1/smart-shelf/at-risk", {
      shop_id: shopId,
      inventory: inventoryItems,
      sales: salesRecords,
      thresholds: {
        low_stock: 10,
        expiry_days: 7,  // Changed from 30 to 7 to match default
        slow_moving_window: 30
        // Removed slow_moving_threshold to use default
      }
    } as MLAtRiskRequest);

    // 4. Return at-risk items with meta
    res.json({
      success: true,
      data: {
        at_risk: atRiskResult.at_risk || [],
        meta: {
          shop_id: shopId,
          total_products: products.length,
          flagged_count: atRiskResult.at_risk?.length || 0,
          analysis_date: new Date().toISOString(),
          thresholds_used: {
            low_stock: 10,
            expiry_days: 7,
            slow_moving_window: 30,
            slow_moving_threshold: 0.5  // Default from ML service
          }
        }
      }
    });

  } catch (error: any) {
    console.error("Error in getAtRiskInventory:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};
