import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { mlClient } from "../utils/mlClient";
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

    // 1. Fetch Local Data from Prisma
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

    // 3. Call ML Service Endpoints (Parallel)
    const atRiskPromise = mlClient.post<MLAtRiskResponse>("/api/v1/smart-shelf/at-risk", {
      shop_id: shopId,
      inventory: inventoryItems,
      sales: salesRecords,
      thresholds: {
        low_stock: 10,
        expiry_days: 30,
        slow_moving_window: 30
      }
    } as MLAtRiskRequest);

    const insightsPromise = mlClient.post<MLInsightsResponse>("/api/v1/smart-shelf/insights", {
      shop_id: shopId,
      sales: salesRecords,
      range: {
        start: ninetyDaysAgo.toISOString(),
        end: new Date().toISOString()
      },
      granularity: "daily",
      top_k: 5
    } as MLInsightsRequest);

    // Execute calls with error handling
    const [atRiskResult, insightsResult] = await Promise.allSettled([
      atRiskPromise,
      insightsPromise
    ]);

    // 4. Process Results
    let atRiskData: MLAtRiskResponse | null = null;
    let insightsData: MLInsightsResponse | null = null;
    let warnings: string[] = [];

    if (atRiskResult.status === "fulfilled") {
      atRiskData = atRiskResult.value;
    } else {
      console.warn("At-Risk detection failed:", atRiskResult.reason);
      warnings.push("At-risk inventory analysis unavailable");
    }

    if (insightsResult.status === "fulfilled") {
      insightsData = insightsResult.value;
    } else {
      console.warn("Insights generation failed:", insightsResult.reason);
      warnings.push("Sales insights unavailable");
    }

    // 5. Construct Dashboard Response
    const localStats = {
      total_products: products.length,
      total_stock: products.reduce((sum, p) => sum + (p.inventories[0]?.quantity || 0), 0),
      low_stock_count: products.filter(p => (p.inventories[0]?.quantity || 0) < 10).length,
    };

    const response = {
      local_stats: localStats,
      at_risk_items: atRiskData?.at_risk || [],
      forecast_chart: insightsData?.series || [],
      top_products: insightsData?.top_items || [],
      insights: insightsData?.recommendations || [],
      warnings: warnings.length > 0 ? warnings : undefined
    };

    res.json({
      success: true,
      data: response,
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
 * (Legacy/Specific endpoint if needed, otherwise covered by dashboard)
 */
export const getAtRiskInventory = async (req: Request, res: Response) => {
    // Re-using the dashboard logic or implementing specific logic if needed.
    // For now, redirecting to dashboard or implementing a simple version.
    return getDashboardAnalytics(req, res);
};
