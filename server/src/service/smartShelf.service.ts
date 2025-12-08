import prisma from "../lib/prisma";
import { mlClient } from "../utils/mlClient";
import { CacheService } from "../lib/redis";
import {
  AtRiskRequest,
  AtRiskResponse,
  InventoryItem,
  SalesRecord,
} from "../types/smartShelf.types";

/**
 * Fetch inventory and sales data, then call ML service to detect at-risk items.
 * Uses Redis cache for optimization (5 min TTL for real-time inventory data)
 */
import { hasActiveIntegration } from "../utils/integrationCheck";

export async function getAtRiskInventory(
  shopId: string
): Promise<AtRiskResponse> {
  // Check if shop has active integration with terms accepted
  const isActive = await hasActiveIntegration(shopId);

  // If no active integration, return empty at-risk data
  if (!isActive) {
    console.log(`⚠️  No active Shopee integration for shop ${shopId}, returning empty at-risk data`);
    return {
      at_risk: [],
      meta: {
        shop_id: shopId,
        total_products: 0,
        flagged_count: 0,
        analysis_date: new Date().toISOString(),
        thresholds_used: {},
      },
    };
  }

  const cacheKey = `at-risk:${shopId}`;
  
  // Try cache first (5 min TTL for inventory data)
  return CacheService.getOrSet(
    cacheKey,
    async () => {
      // 1. Fetch products with inventory (only synced products from integrations)
      const products = await prisma.product.findMany({
    where: { 
      shopId,
      externalId: { not: null }, // Only products synced from integrations
    },
    include: {
      inventories: {
        take: 1,
      },
    },
  });

  if (products.length === 0) {
    // Return empty response instead of throwing error
    return {
      at_risk: [],
      meta: {
        shop_id: shopId,
        total_products: 0,
        flagged_count: 0,
        analysis_date: new Date().toISOString(),
        thresholds_used: {},
      },
    };
  }

  // Map to InventoryItem
  const inventoryItems: InventoryItem[] = products.map((p) => ({
    product_id: p.id,
    sku: p.sku,
    name: p.name,
    quantity: p.inventories[0]?.quantity || 0,
    expiry_date: p.expiryDate ? p.expiryDate.toISOString() : undefined,
    price: p.price,
    categories: p.description ? [p.description] : [], // Using description as category for now
  }));

  // 2. Fetch sales history (last 60 days)
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const sales = await prisma.sale.findMany({
    where: {
      shopId,
      createdAt: {
        gte: sixtyDaysAgo,
      },
    },
    select: {
      items: true,
      createdAt: true,
    },
  });

  // Map to SalesRecord
  const salesRecords: SalesRecord[] = [];
  sales.forEach((sale) => {
    const items =
      typeof sale.items === "string" ? JSON.parse(sale.items) : sale.items;

    if (Array.isArray(items)) {
      items.forEach((item: any) => {
        if (item.productId) {
          salesRecords.push({
            product_id: item.productId,
            date: sale.createdAt.toISOString(),
            qty: item.quantity || 0,
            revenue: (item.quantity || 0) * (item.price || 0),
          });
        }
      });
    }
  });

  // 3. Construct Request
  const request: AtRiskRequest = {
    shop_id: shopId,
    inventory: inventoryItems,
    sales: salesRecords,
  };

      // 4. Call ML Service
      const response = await mlClient.post<AtRiskResponse>(
        "/api/v1/smart-shelf/at-risk",
        request
      );

      return response;
    },
    300 // 5 minutes cache TTL for inventory data
  );
}

/**
 * Get comprehensive dashboard analytics
 * Combines database metrics with ML forecasts
 * Uses Redis cache for optimization (10 min TTL)
 * Returns empty data if no Shopee integration is active
 */
export async function getDashboardAnalytics(shopId: string) {
  // Check if user has an active Shopee integration
  const integration = await prisma.integration.findFirst({
    where: {
      shopId,
      platform: 'SHOPEE',
    },
  });

  // Check if integration is active via settings JSON
  const settings = integration?.settings as any;
  const isActive = integration && (settings?.isActive !== false && (settings?.termsAccepted === true || settings?.connectedAt));

  // If no active integration, return empty/default data
  if (!isActive) {
    console.log(`⚠️  No active Shopee integration for shop ${shopId}, returning empty dashboard data`);
    return {
      totalRevenue: 0,
      totalProfit: 0,
      totalSales: 0,
      totalProducts: 0,
      recentSales: [],
      topProducts: [],
      salesForecast: [],
      insights: ["Please integrate with Shopee-Clone to see your analytics data."],
      hasIntegration: false,
    };
  }

  const cacheKey = `dashboard-analytics:${shopId}`;
  
  // Try cache first (10 min TTL)
  return CacheService.getOrSet(
    cacheKey,
    async () => {
      // 1. Calculate basic metrics from database
      const products = await prisma.product.findMany({
        where: { shopId },
        include: {
          inventories: { take: 1 },
        },
      });

      // 2. Get ALL sales for lifetime metrics (total revenue, total orders)
      const allSales = await prisma.sale.findMany({
        where: {
          shopId,
        },
        select: {
          items: true,
          total: true,
          revenue: true,
          profit: true,
          createdAt: true,
          status: true,
        },
      });

      // Debug logging
      console.log(`📊 Dashboard Analytics for shop ${shopId}: Found ${allSales.length} total sales`);

      // 3. Get sales data for the last 30 days (for forecast/trends)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentSales = allSales.filter(
        (sale) => sale.createdAt >= thirtyDaysAgo
      );

      // 4. Calculate lifetime totals from ALL sales
      let totalRevenue = 0;
      let totalCost = 0;
      let totalItems = 0;
      let totalOrders = 0;
      const salesRecords: any[] = [];

      allSales.forEach((sale) => {
        // Count all orders (regardless of status for total count)
        totalOrders++;
        
        // Use revenue if available, otherwise use total
        const saleRevenue = sale.revenue || sale.total || 0;
        totalRevenue += saleRevenue;

        const items =
          typeof sale.items === "string" ? JSON.parse(sale.items) : sale.items;

        if (Array.isArray(items)) {
          items.forEach((item: any) => {
            const product = products.find((p) => p.id === item.productId);
            if (product) {
              // Use actual cost from product if available
              totalCost += (product.cost || 0) * (item.quantity || 0);
              totalItems += item.quantity || 0;
            }

            // Only add to salesRecords if it's in the last 30 days (for forecast)
            if (sale.createdAt >= thirtyDaysAgo && item.productId) {
              salesRecords.push({
                product_id: item.productId,
                date: sale.createdAt.toISOString(),
                qty: item.quantity || 0,
              });
            }
          });
        }
      });

      // Calculate profit (use stored profit if available, otherwise calculate)
      let totalProfit = 0;
      allSales.forEach((sale) => {
        if (sale.profit !== null && sale.profit !== undefined) {
          totalProfit += sale.profit;
        } else {
          // Fallback: calculate from revenue - cost
          const saleRevenue = sale.revenue || sale.total || 0;
          const items =
            typeof sale.items === "string" ? JSON.parse(sale.items) : sale.items;
          if (Array.isArray(items)) {
            items.forEach((item: any) => {
              const product = products.find((p) => p.id === item.productId);
              if (product) {
                totalProfit += (item.price || 0) * (item.quantity || 0) - (product.cost || 0) * (item.quantity || 0);
              }
            });
          }
        }
      });

      const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

      // 5. Get forecast from ML Service (optional - only if products exist)
      // Use recent sales (last 30 days) for forecast
      let forecast = null;
      if (products.length > 0 && recentSales.length > 0) {
        try {
          const productIds = products.slice(0, 10).map((p) => p.id); // Top 10 products
          forecast = await mlClient.getDashboardForecast({
            shop_id: shopId,
            product_list: productIds,
            sales: salesRecords,
            periods: 7,
          });
        } catch (error) {
          console.warn("Failed to get forecast from ML service:", error);
          // Continue without forecast data
        }
      }

      return {
        metrics: {
          totalRevenue,
          totalProfit,
          profitMargin,
          totalItems,
          totalProducts: products.length,
          totalSales: totalOrders, // All-time total orders count
        },
        forecast,
        period: {
          start: thirtyDaysAgo.toISOString(),
          end: new Date().toISOString(),
          days: 30,
        },
      };
    },
    600 // 10 minutes cache TTL
  );
}
