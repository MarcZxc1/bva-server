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

/**
 * Generate a simple fallback forecast based on historical average daily sales
 * Used when ML service is unavailable or insufficient data
 */
function generateFallbackForecast(avgDailySales: number, historicalDays: number) {
  const today = new Date();
  const forecasts = [];
  
  // Generate 14 days of predictions
  for (let i = 1; i <= 14; i++) {
    const forecastDate = new Date(today);
    forecastDate.setDate(today.getDate() + i);
    
    // Use average with slight variation (±10%) for realism
    const variation = 1 + (Math.random() * 0.2 - 0.1); // ±10% variation
    const predictedQty = Math.max(0, Math.round(avgDailySales * variation));
    
    forecasts.push({
      date: forecastDate.toISOString().split('T')[0],
      predicted_qty: predictedQty,
      lower_ci: Math.max(0, Math.round(predictedQty * 0.8)),
      upper_ci: Math.round(predictedQty * 1.2),
    });
  }
  
  return {
    forecasts: [{
      product_id: "aggregated",
      predictions: forecasts,
      method: "moving_average",
      model_version: "fallback-v1",
    }],
    meta: {
      shop_id: "fallback",
      forecast_date: today.toISOString(),
      total_products: 1,
      cache_hit: false,
      method: "fallback_average",
      historical_days: historicalDays,
    }
  };
}

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
      // Only get products that have externalId (synced from Shopee-Clone)
      const products = await prisma.product.findMany({
        where: { 
          shopId,
          externalId: { not: null }, // Only products synced from integrations
        },
        include: {
          inventories: { take: 1 },
        },
      });

      // 2. Get ALL sales for lifetime metrics (total revenue, total orders)
      // Filter by SHOPEE platform since we're using Shopee-Clone integration
      const allSales = await prisma.sale.findMany({
        where: {
          shopId,
          platform: 'SHOPEE', // Only get sales from Shopee-Clone platform
        },
        select: {
          items: true,
          total: true,
          revenue: true,
          profit: true,
          createdAt: true,
          status: true,
          platform: true,
        },
      });

      // Debug logging
      console.log(`📊 Dashboard Analytics for shop ${shopId}: Found ${allSales.length} total sales`);

      // 3. Get sales data for the last 60 days (for forecast/trends)
      // We need at least 14 days of history for accurate forecasting
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const recentSales = allSales.filter(
        (sale) => sale.createdAt >= sixtyDaysAgo
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

            // Only add to salesRecords if it's in the last 60 days (for forecast)
            if (sale.createdAt >= sixtyDaysAgo && item.productId) {
              // Format date as YYYY-MM-DD (ML service expects date string, not ISO with time)
              const saleDate = new Date(sale.createdAt);
              const dateStr = saleDate.toISOString().split('T')[0];
              
              salesRecords.push({
                product_id: item.productId,
                date: dateStr,
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
      // Use recent sales (last 60 days) for forecast
      // Need at least 14 days of historical data for accurate forecasting
      let forecast = null;
      if (products.length > 0 && salesRecords.length > 0) {
        try {
          // Group sales by date to check if we have enough data points
          const uniqueDates = new Set(salesRecords.map((r: any) => r.date));
          
          console.log(`📊 Forecast preparation for shop ${shopId}:`, {
            products: products.length,
            salesRecords: salesRecords.length,
            uniqueDates: uniqueDates.size,
            dateRange: uniqueDates.size > 0 ? {
              first: Array.from(uniqueDates).sort()[0],
              last: Array.from(uniqueDates).sort().reverse()[0]
            } : null
          });
          
          // Calculate average daily sales for fallback forecast
          const totalQty = salesRecords.reduce((sum: number, r: any) => sum + (r.qty || 0), 0);
          const avgDailySales = uniqueDates.size > 0 ? totalQty / uniqueDates.size : 0;
          
          // Only call ML service if we have at least 14 days of data
          if (uniqueDates.size >= 14) {
            const productIds = products.slice(0, 10).map((p) => p.id); // Top 10 products
            
            console.log(`📊 Requesting forecast for shop ${shopId}: ${productIds.length} products, ${salesRecords.length} sales records, ${uniqueDates.size} unique days`);
            console.log(`📊 Sample sales data:`, salesRecords.slice(0, 3));
            
            try {
              const forecastResponse = await mlClient.getDashboardForecast({
                shop_id: shopId,
                product_list: productIds,
                sales: salesRecords,
                periods: 14, // 14-day forecast as per documentation
              });
              
              console.log(`✅ Forecast received from ML service:`, {
                hasForecast: !!forecastResponse,
                forecastsCount: forecastResponse?.forecasts?.length || 0,
                firstForecast: forecastResponse?.forecasts?.[0] ? {
                  productId: forecastResponse.forecasts[0].product_id,
                  predictionsCount: forecastResponse.forecasts[0].predictions?.length || 0,
                  firstPrediction: forecastResponse.forecasts[0].predictions?.[0]
                } : null
              });
              
              // Ensure forecast is in the correct format
              if (forecastResponse && forecastResponse.forecasts && Array.isArray(forecastResponse.forecasts)) {
                forecast = forecastResponse;
              } else {
                console.warn("⚠️  Forecast response missing forecasts array, using fallback:", forecastResponse);
                // Use fallback forecast
                forecast = generateFallbackForecast(avgDailySales, uniqueDates.size);
              }
            } catch (mlError: any) {
              console.error("❌ ML service forecast failed, using fallback:", mlError?.message);
              // Use fallback forecast based on historical average
              forecast = generateFallbackForecast(avgDailySales, uniqueDates.size);
            }
          } else if (uniqueDates.size >= 7) {
            // If we have at least 7 days, use fallback forecast
            console.log(`📊 Using fallback forecast (${uniqueDates.size} days of history, need 14 for ML service)`);
            forecast = generateFallbackForecast(avgDailySales, uniqueDates.size);
          } else {
            console.log(`⚠️  Insufficient historical data for forecast: ${uniqueDates.size} days (need at least 7 for fallback, 14 for ML)`);
            console.log(`💡 Tip: Need at least 7 days of sales history for basic forecast. Current: ${uniqueDates.size} days`);
          }
        } catch (error: any) {
          console.error("❌ Failed to get forecast from ML service:", error?.message || error);
          console.error("Error stack:", error?.stack);
          if (error?.response) {
            console.error("ML Service response:", error.response.data);
            console.error("ML Service status:", error.response.status);
          }
          // Continue without forecast data - don't break the dashboard
        }
      } else {
        console.log(`⚠️  Cannot generate forecast: ${products.length} products, ${salesRecords.length} sales records`);
        if (products.length === 0) {
          console.log(`💡 Tip: No products with externalId found. Products need to be synced from Shopee-Clone.`);
        }
        if (salesRecords.length === 0) {
          console.log(`💡 Tip: No sales records found in the last 60 days.`);
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
          start: sixtyDaysAgo.toISOString(),
          end: new Date().toISOString(),
          days: 60,
        },
      };
    },
    600 // 10 minutes cache TTL
  );
}
