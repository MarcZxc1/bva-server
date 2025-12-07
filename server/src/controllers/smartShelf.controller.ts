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
    const inventoryItems: MLInventoryItem[] = products.map(p => {
      // Get quantity from inventory or product stock, ensure it's never negative
      let quantity = p.inventories[0]?.quantity ?? p.stock ?? 0;
      // Clamp negative values to 0 (ML service requires quantity >= 0)
      if (quantity < 0) {
        quantity = 0;
      }
      
      const item: MLInventoryItem = {
        product_id: p.id,
        sku: p.sku || `SKU-${p.id}`,
        name: p.name,
        quantity: quantity,
        price: Math.max(0, p.price), // Ensure price is also non-negative
        categories: p.description ? [p.description] : []
      };
      // Only include expiry_date if it exists
      if (p.expiryDate) {
        item.expiry_date = p.expiryDate.toISOString();
      }
      return item;
    });

    const salesRecords: MLSalesRecord[] = [];
    sales.forEach(sale => {
      const items = typeof sale.items === "string" ? JSON.parse(sale.items) : sale.items;
      if (Array.isArray(items)) {
        items.forEach((item: any) => {
          // Ensure quantities and prices are non-negative
          const qty = Math.max(0, item.quantity || 1);
          const price = Math.max(0, item.price || 0);
          
          salesRecords.push({
            product_id: item.productId,
            date: sale.createdAt.toISOString(),
            qty: qty,
            revenue: price * qty
          });
        });
      }
    });

    // 3. Call ML Service
    try {
      const atRiskResult = await mlClient.post<MLAtRiskResponse>("/api/v1/smart-shelf/at-risk", {
        shop_id: shopId,
        inventory: inventoryItems,
        sales: salesRecords,
        thresholds: {
          low_stock: 5,  // Match seed script critical items (≤5 units)
          expiry_days: 7,  // Match seed script near expiry items (3-7 days)
          slow_moving_window: 30
          // slow_moving_threshold defaults to 0.5 in ML service
        }
      } as MLAtRiskRequest);

      // 4. Convert scores from 0-1 to 0-100 for frontend display
      const atRiskItems = (atRiskResult.at_risk || []).map(item => ({
        ...item,
        score: Math.round(item.score * 100) // Convert 0-1 to 0-100
      }));

      // 5. Return at-risk items with meta
      return res.json({
        success: true,
        data: {
          at_risk: atRiskItems,
          meta: {
            shop_id: shopId,
            total_products: products.length,
            flagged_count: atRiskItems.length,
            analysis_date: new Date().toISOString(),
            thresholds_used: {
              low_stock: 5,
              expiry_days: 7,
              slow_moving_window: 30,
              slow_moving_threshold: 0.5  // Default from ML service
            }
          }
        }
      });
    } catch (error: any) {
      console.error("Error in getAtRiskInventory:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to analyze at-risk inventory",
      });
    }
  } catch (error: any) {
    console.error("Error in getAtRiskInventory:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};
