import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { mlClient } from "../utils/mlClient";
import { 
  getDashboardAnalytics as getDashboardAnalyticsService,
  getUserDashboardAnalytics as getUserDashboardAnalyticsService,
  getAtRiskInventory as getAtRiskInventoryService,
  getUserAtRiskInventory as getUserAtRiskInventoryService
} from "../service/smartShelf.service";
import { AdService } from "../service/ad.service";
import { getUserExpiredItems as getUserExpiredItemsService, checkAndNotifyExpiredItems } from "../service/expiredItems.service";

const adService = new AdService();
import { 
  MLAtRiskRequest, 
  MLAtRiskResponse, 
  MLInsightsRequest, 
  MLInsightsResponse,
  MLInventoryItem,
  MLSalesRecord
} from "../types/ml.types";

/**
 * Basic rule-based at-risk detection fallback when ML service is unavailable
 * Returns data in the same format as ML service for frontend compatibility
 */
function detectAtRiskBasic(
  products: any[],
  sales: any[],
  thresholds: { low_stock: number; expiry_days: number }
): any[] {
  const atRiskItems: any[] = [];
  const now = new Date();
  
  // Calculate average daily sales for each product (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const productSalesMap = new Map<string, { totalQty: number; days: Set<string> }>();
  
  sales.forEach((sale: any) => {
    if (new Date(sale.createdAt) >= thirtyDaysAgo) {
      const items = typeof sale.items === "string" ? JSON.parse(sale.items) : sale.items;
      if (Array.isArray(items)) {
        items.forEach((item: any) => {
          if (item.productId) {
            const isoString = new Date(sale.createdAt).toISOString();
            const saleDate = isoString.split('T')[0] || isoString.substring(0, 10);
            if (!productSalesMap.has(item.productId)) {
              productSalesMap.set(item.productId, { totalQty: 0, days: new Set() });
            }
            const salesData = productSalesMap.get(item.productId)!;
            salesData.totalQty += item.quantity || 0;
            salesData.days.add(saleDate);
          }
        });
      }
    }
  });
  
  products.forEach((product: any) => {
    const quantity = Math.max(0, product.Inventory[0]?.quantity ?? product.stock ?? 0);
    const reasons: string[] = [];
    let score = 0;
    let daysToExpiry: number | undefined;
    let avgDailySales: number | undefined;
    
    // Calculate days to expiry
    if (product.expiryDate) {
      const expiryDate = new Date(product.expiryDate);
      daysToExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysToExpiry > 0 && daysToExpiry <= thresholds.expiry_days) {
        reasons.push("near_expiry");
        score += 30;
        // More urgent if very close to expiry
        if (daysToExpiry <= 3) {
          score += 20;
        }
      } else if (daysToExpiry <= 0) {
        reasons.push("expired");
        score += 100; // Critical: expired items
        daysToExpiry = 0;
      }
    }
    
    // Check low stock
    if (quantity <= thresholds.low_stock) {
      reasons.push("low_stock");
      score += 50; // Base score for low stock
    }
    
    // Calculate average daily sales
    const salesData = productSalesMap.get(product.id);
    if (salesData && salesData.days.size > 0) {
      avgDailySales = salesData.totalQty / salesData.days.size;
    } else if (quantity > 0) {
      // No sales in last 30 days but has stock = slow moving
      reasons.push("slow_moving");
      score += 20;
      avgDailySales = 0;
    }
    
    // Only include items with at least one issue
    if (reasons.length > 0) {
      // Determine recommended action based on issues
      let actionType = "review";
      let reasoning = "";
      let restockQty: number | undefined;
      let discountRange: [number, number] | undefined;
      
      if (reasons.includes("expired")) {
        actionType = "clearance";
        reasoning = "Item has expired and should be removed immediately to maintain inventory quality.";
        discountRange = [50, 70]; // High discount for expired items
      } else if (reasons.includes("near_expiry") && daysToExpiry !== undefined) {
        actionType = "promotion";
        reasoning = `Item expires in ${daysToExpiry} days. Create a promotion to sell before expiry.`;
        discountRange = daysToExpiry <= 3 ? [30, 50] : [15, 30];
      } else if (reasons.includes("low_stock") && !reasons.includes("slow_moving")) {
        actionType = "restock";
        // Suggest restocking to 3x the low_stock threshold
        restockQty = Math.max(thresholds.low_stock * 3, 20);
        reasoning = `Stock is critically low (${quantity} units). Restock to avoid stockouts.`;
      } else if (reasons.includes("slow_moving")) {
        actionType = "promotion";
        reasoning = "Item has no sales in the last 30 days. Consider discounting or bundling to increase sales.";
        discountRange = [20, 40];
      } else {
        reasoning = "Item requires attention. Review inventory status and sales patterns.";
      }
      
      atRiskItems.push({
        product_id: product.id,
        sku: product.sku || `SKU-${product.id}`,
        name: product.name,
        current_quantity: quantity,
        price: Math.max(0, product.price),
        reasons, // Frontend expects 'reasons' not 'issues'
        score: Math.min(100, score), // Cap at 100, convert to 0-100 scale
        days_to_expiry: daysToExpiry,
        avg_daily_sales: avgDailySales,
        recommended_action: {
          action_type: actionType,
          reasoning,
          restock_qty: restockQty,
          discount_range: discountRange
        }
      });
    }
  });
  
  // Sort by score (highest first)
  return atRiskItems.sort((a: any, b: any) => b.score - a.score);
}

/**
 * GET /api/smart-shelf/dashboard/user?platform=SHOPEE
 * Get aggregated dashboard analytics from all accessible shops
 * Optional platform query parameter to filter by specific platform
 */
export const getUserDashboardAnalytics = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const platform = req.query.platform as string | undefined;

    // Use service layer for aggregated dashboard analytics
    const dashboardData = await getUserDashboardAnalyticsService(user.userId, platform);

    console.log(`📊 getUserDashboardAnalytics controller: Returning aggregated data for user ${user.userId}`, {
      platform: platform || 'ALL',
      hasMetrics: !!dashboardData.metrics,
      hasForecast: !!dashboardData.forecast,
      metrics: dashboardData.metrics,
    });

    res.json({
      success: true,
      data: dashboardData,
    });

  } catch (error: any) {
    console.error("Error in getUserDashboardAnalytics:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};

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

    console.log(`📊 getDashboardAnalytics controller: Returning data for shop ${shopId}`, {
      hasMetrics: !!dashboardData.metrics,
      hasForecast: !!dashboardData.forecast,
      metrics: dashboardData.metrics,
      forecastCount: dashboardData.forecast?.forecasts?.length || 0,
    });

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
 * GET /api/smart-shelf/at-risk/user?platform=SHOPEE
 * Get aggregated at-risk inventory from all accessible shops
 * Optional platform query parameter to filter by specific platform
 */
export const getUserAtRiskInventory = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const platform = req.query.platform as string | undefined;

    // Use service layer for aggregated at-risk detection
    const atRiskData = await getUserAtRiskInventoryService(user.userId, platform);

    return res.json({
      success: true,
      data: atRiskData,
    });
  } catch (error: any) {
    console.error("Error in getUserAtRiskInventory:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};

/**
 * GET /api/smart-shelf/at-risk/:shopId
 * Get only at-risk inventory items
 * Uses the service layer for consistency and reliability
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

    // Use service layer for at-risk detection (ensures consistency, error handling, and platform filtering)
    const atRiskData = await getAtRiskInventoryService(shopId);

    return res.json({
      success: true,
      data: atRiskData,
    });
  } catch (error: any) {
    console.error("Error in getAtRiskInventory:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};

/**
 * @deprecated This function is kept for backward compatibility but should use service layer
 * Legacy endpoint handler - now redirects to service layer
 */
export const getAtRiskInventoryLegacy = async (req: Request, res: Response) => {
  try {
    const { shopId } = req.params;

    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: "Shop ID is required",
      });
    }

    // 1. Fetch products and inventory (only synced products)
    const products = await prisma.product.findMany({
      where: { 
        shopId,
        externalId: { not: null }, // Only products synced from integrations
      },
      include: { Inventory: { take: 1 } },
    });

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const sales = await prisma.sale.findMany({
      where: {
        shopId,
        platform: 'SHOPEE', // Only get sales from Shopee-Clone platform
        createdAt: { gte: ninetyDaysAgo },
      },
      select: {
        items: true,
        createdAt: true,
        total: true,
        platform: true,
      },
    });

    // 2. Prepare Data for ML Service
    const inventoryItems: MLInventoryItem[] = products.map((p: any) => {
      // Get quantity from inventory or product stock, ensure it's never negative
      let quantity = p.Inventory[0]?.quantity ?? p.stock ?? 0;
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
    sales.forEach((sale: any) => {
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

    // 3. Try ML Service first, fallback to basic detection if unavailable
    const thresholds = {
      low_stock: 5,  // Match seed script critical items (≤5 units)
      expiry_days: 7,  // Match seed script near expiry items (3-7 days)
      slow_moving_window: 30
    };
    
    let atRiskItems: any[] = [];
    let mlAnalysisAvailable = false;
    
    // Check if ML service is available
    const mlServiceAvailable = await mlClient.healthCheck();
    
    if (mlServiceAvailable) {
    try {
      const atRiskResult = await mlClient.post<MLAtRiskResponse>("/api/v1/smart-shelf/at-risk", {
        shop_id: shopId,
        inventory: inventoryItems,
        sales: salesRecords,
        thresholds: {
            ...thresholds,
            slow_moving_threshold: 0.5  // Default from ML service
        }
      } as MLAtRiskRequest);

        // Convert scores from 0-1 to 0-100 for frontend display
        // Also ensure reasons is always an array of strings
        atRiskItems = (atRiskResult.at_risk || []).map((item: any) => ({
        ...item,
          score: Math.round(item.score * 100), // Convert 0-1 to 0-100
          reasons: Array.isArray(item.reasons) 
            ? item.reasons.map((r: any) => typeof r === 'string' ? r : String(r))
            : item.reasons ? [String(item.reasons)] : []
        }));
        
        mlAnalysisAvailable = true;
      } catch (error: any) {
        console.warn("ML service call failed, falling back to basic detection:", error.message);
        // Fall through to basic detection
      }
    } else {
      console.warn("ML service unavailable, using basic rule-based detection");
    }
    
    // Fallback to basic detection if ML service unavailable or failed
    if (!mlAnalysisAvailable) {
      atRiskItems = detectAtRiskBasic(products, sales, {
        low_stock: thresholds.low_stock,
        expiry_days: thresholds.expiry_days
      });
    }

    // 4. Return at-risk items with meta
      return res.json({
        success: true,
        data: {
          at_risk: atRiskItems,
          meta: {
            shop_id: shopId,
            total_Product: products.length,
            flagged_count: atRiskItems.length,
            analysis_date: new Date().toISOString(),
          ml_analysis_available: mlAnalysisAvailable,
            thresholds_used: {
            low_stock: thresholds.low_stock,
            expiry_days: thresholds.expiry_days,
            slow_moving_window: thresholds.slow_moving_window,
            ...(mlAnalysisAvailable ? { slow_moving_threshold: 0.5 } : {})
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

/**
 * POST /api/smart-shelf/:shopId/generate-promotions
 * Generate promotions for a specific at-risk item
 */
export const generatePromotionsForItem = async (req: Request, res: Response) => {
  try {
    const { shopId } = req.params;
    const item = req.body;

    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: "Shop ID is required",
      });
    }

    if (!item || !item.product_id) {
      return res.status(400).json({
        success: false,
        error: "Item data is required",
      });
    }

    // Generate promotions for the item
    const promotions = await adService.generatePromotionsForItem(shopId, item);

    return res.json({
      success: true,
      data: promotions,
    });
  } catch (error: any) {
    console.error("Error in generatePromotionsForItem:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};

/**
 * GET /api/smart-shelf/expired/user
 * Get expired items for the current user
 * Also checks and creates notifications for expired items
 */
export const getUserExpiredItems = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    // Check and create notifications for expired items (non-blocking)
    checkAndNotifyExpiredItems().catch(err => {
      console.error("Error checking expired items:", err);
    });

    const expiredItems = await getUserExpiredItemsService(userId);

    return res.json({
      success: true,
      data: expiredItems,
    });
  } catch (error: any) {
    console.error("Error in getUserExpiredItems:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};
