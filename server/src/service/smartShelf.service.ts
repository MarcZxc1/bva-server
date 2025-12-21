import prisma from "../lib/prisma";
import { mlClient } from "../utils/mlClient";
import { CacheService } from "../lib/redis";
import {
  AtRiskRequest,
  AtRiskResponse,
  InventoryItem,
  SalesRecord,
} from "../types/smartShelf.types";

import { hasActiveIntegration } from "../utils/integrationCheck";
import { RiskReason } from "../types/smartShelf.types";

/**
 * Fetch inventory and sales data, then call ML service to detect at-risk items.
 * Uses Redis cache for optimization (5 min TTL for real-time inventory data)
 */

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
      total_Product: 1,
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
        total_Product: 0,
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
      // 1. Fetch products with inventory (ALL products for the shop)
      // Products with externalId are synced from Shopee-Clone
      // Products without externalId are created directly in BVA
      const products = await prisma.product.findMany({
    where: { 
      shopId,
      // Removed externalId filter - show all products for the shop
      // This ensures BVA can display data even if sync hasn't completed yet
    },
    include: {
      Inventory: {
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
        total_Product: 0,
        flagged_count: 0,
        analysis_date: new Date().toISOString(),
        thresholds_used: {},
      },
    };
  }

  // Map to InventoryItem
  const inventoryItems: InventoryItem[] = products.map((p: any) => ({
    product_id: p.id,
    sku: p.sku,
    name: p.name,
    quantity: p.Inventory[0]?.quantity || 0,
    expiry_date: p.expiryDate ? p.expiryDate.toISOString() : undefined,
    price: p.price,
    categories: p.description ? [p.description] : [], // Using description as category for now
  }));

  // 2. Fetch sales history (last 60 days) - Only from SHOPEE platform
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const sales = await prisma.sale.findMany({
    where: {
      shopId,
      platform: 'SHOPEE', // Only get sales from Shopee-Clone platform
      createdAt: {
        gte: sixtyDaysAgo,
      },
    },
    select: {
      items: true,
      createdAt: true,
      platform: true,
    },
  });

  console.log(`📊 At-Risk Analysis for shop ${shopId}: ${products.length} products, ${sales.length} sales records from SHOPEE platform`);

  // Map to SalesRecord
  const salesRecords: SalesRecord[] = [];
  sales.forEach((sale: any) => {
    const items =
      typeof sale.items === "string" ? JSON.parse(sale.items) : sale.items;

    if (Array.isArray(items)) {
      items.forEach((item: any) => {
        if (item.productId) {
          // Format date as YYYY-MM-DD (ML service expects date string)
          const saleDate = new Date(sale.createdAt);
          const isoString = saleDate.toISOString();
          const dateStr = isoString.split('T')[0];
          
          if (!dateStr) {
            console.warn(`⚠️  Invalid date format for sale ${sale.createdAt}, skipping`);
            return;
          }
          
          salesRecords.push({
            product_id: item.productId,
            date: dateStr,
            qty: Math.max(0, item.quantity || 0),
            revenue: Math.max(0, (item.quantity || 0) * (item.price || 0)),
          });
        }
      });
    }
  });

  // 3. Define thresholds (matching ML service defaults)
  const thresholds = {
    low_stock: 10,
    expiry_days: 7,
    slow_moving_window: 30,
    slow_moving_threshold: 0.5,
  };

  // 4. Construct Request with thresholds
  const request: AtRiskRequest = {
    shop_id: shopId,
    inventory: inventoryItems,
    sales: salesRecords,
    thresholds: thresholds,
  };

  try {
    // 5. Call ML Service
    console.log(`📊 Calling ML service for at-risk detection: ${inventoryItems.length} items, ${salesRecords.length} sales records`);
    
    const response = await mlClient.post<AtRiskResponse>(
      "/api/v1/smart-shelf/at-risk",
      request
    );

    // Validate response structure
    if (!response || !response.at_risk) {
      console.warn("⚠️  Invalid ML service response structure, returning empty at-risk list");
      return {
        at_risk: [],
        meta: {
          shop_id: shopId,
          total_Product: products.length,
          flagged_count: 0,
          analysis_date: new Date().toISOString(),
          thresholds_used: thresholds,
        },
      };
    }

    // Convert scores from 0-1 to 0-100 for frontend consistency
    // Map reasons to RiskReason enum
    // Also group by product_id to avoid duplicates
    const atRiskMap = new Map<string, any>();
    
    response.at_risk.forEach((item: any) => {
      const productId = String(item.product_id);
      const score = Math.round((item.score || 0) * 100); // Convert 0-1 to 0-100
      const reasons = Array.isArray(item.reasons) 
        ? item.reasons.map((r: any): RiskReason => {
            const reasonStr = typeof r === 'string' ? r : String(r);
            // Map to RiskReason enum
            if (reasonStr === 'low_stock' || reasonStr === 'LOW_STOCK') return RiskReason.LOW_STOCK;
            if (reasonStr === 'near_expiry' || reasonStr === 'NEAR_EXPIRY') return RiskReason.NEAR_EXPIRY;
            if (reasonStr === 'slow_moving' || reasonStr === 'SLOW_MOVING') return RiskReason.SLOW_MOVING;
            return RiskReason.LOW_STOCK; // Default fallback
          })
        : [];
      
      if (atRiskMap.has(productId)) {
        // Product already exists, keep the highest score and merge reasons
        const existing = atRiskMap.get(productId)!;
        existing.score = Math.max(existing.score, score);
        // Merge unique reasons
        reasons.forEach((r: any) => {
          if (!existing.reasons.includes(r)) {
            existing.reasons.push(r);
          }
        });
      } else {
        // New product, add to map
        atRiskMap.set(productId, {
          ...item,
          score,
          reasons,
        });
      }
    });

    const processedAtRisk = Array.from(atRiskMap.values())
      .sort((a: any, b: any) => b.score - a.score); // Sort by score descending

    console.log(`✅ ML service returned ${processedAtRisk.length} unique at-risk items (${processedAtRisk.filter((i: any) => i.score >= 80).length} critical)`);

    return {
      at_risk: processedAtRisk,
      meta: {
        ...response.meta,
        shop_id: shopId,
        total_Product: products.length,
        flagged_count: processedAtRisk.length,
        analysis_date: response.meta?.analysis_date || new Date().toISOString(),
        thresholds_used: thresholds,
      },
    };
  } catch (error: any) {
    console.error("❌ ML service error for at-risk detection:", error?.message || error);
    console.error("Error details:", {
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status,
    });
    
    // Return empty response instead of throwing - don't break the page
    return {
      at_risk: [],
      meta: {
        shop_id: shopId,
        total_Product: products.length,
        flagged_count: 0,
        analysis_date: new Date().toISOString(),
        thresholds_used: thresholds,
        error: "ML service unavailable",
      },
    };
  }
    },
    300 // 5 minutes cache TTL for inventory data
  );
}

/**
 * Get aggregated at-risk inventory for all shops accessible to a user
 * Combines data from owned and linked shops
 * @param platform - Optional platform filter (SHOPEE, LAZADA, etc.)
 */
export async function getUserAtRiskInventory(userId: string, platform?: string): Promise<AtRiskResponse> {
  // Generate cache key
  const cacheKey = `at-risk:user:${userId}${platform ? `:${platform}` : ''}`;
  
  // Try cache first (5 min TTL for inventory data)
  return CacheService.getOrSet(
    cacheKey,
    async () => {
      // Get all shops the user owns
      const ownedShops = await prisma.shop.findMany({
    where: { 
      ownerId: userId,
      ...(platform && { platform: platform as any }),
    },
    select: { id: true, platform: true },
  });

  // Get all shops the user has access to via ShopAccess
  const linkedShops = await prisma.shopAccess.findMany({
    where: { userId: userId },
    include: {
      Shop: {
        select: { id: true, platform: true },
      },
    },
  });

  // Filter linked shops by platform if specified
  const filteredLinkedShops = platform
    ? linkedShops.filter((ls: any) => ls.Shop.platform === platform)
    : linkedShops;

  // Combine all shop IDs
  const allShopIds = [
    ...ownedShops.map((s: any) => s.id),
    ...filteredLinkedShops.map((sa: any) => sa.Shop.id),
  ];

  if (allShopIds.length === 0) {
    return {
      at_risk: [],
      meta: {
        shop_id: 'aggregated',
        total_Product: 0,
        flagged_count: 0,
        analysis_date: new Date().toISOString(),
        thresholds_used: {},
      },
    };
  }

  console.log(`📊 Getting aggregated at-risk inventory for user ${userId} across ${allShopIds.length} shops`);

  // Fetch all products from all shops
  const products = await prisma.product.findMany({
    where: { shopId: { in: allShopIds } },
    include: {
      Inventory: { take: 1 },
      Shop: {
        select: { platform: true },
      },
    },
  });

  // Fetch all sales from last 60 days
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const sales = await prisma.sale.findMany({
    where: {
      shopId: { in: allShopIds },
      createdAt: { gte: sixtyDaysAgo },
    },
    select: {
      items: true,
      createdAt: true,
      platform: true,
    },
  });

  // Map to inventory items
  const inventoryItems: InventoryItem[] = products.map((p: any) => ({
    product_id: p.id,
    sku: p.sku,
    name: p.name,
    quantity: p.Inventory[0]?.quantity || 0,
    expiry_date: p.expiryDate ? p.expiryDate.toISOString() : undefined,
    price: p.price,
    categories: p.description ? [p.description] : [],
  }));

  // Map to sales records
  const salesRecords: SalesRecord[] = [];
  sales.forEach((sale: any) => {
    if (!sale.createdAt) return;
    const dateStr = sale.createdAt.toISOString().split("T")[0] as string;
    const items = typeof sale.items === "string" ? JSON.parse(sale.items) : sale.items;
    if (Array.isArray(items)) {
      items.forEach((item: any) => {
        if (item.productId) {
          salesRecords.push({
            product_id: item.productId,
            date: dateStr,
            qty: item.quantity || 0,
          });
        }
      });
    }
  });

  console.log(`📊 Aggregated at-risk analysis: ${products.length} products, ${sales.length} sales records`);

  // Call ML service for at-risk detection
  const thresholds = {
    low_stock: 10,
    expiry_days: 30,
    slow_moving_days: 14,
  };

  try {
    const request: AtRiskRequest = {
      shop_id: 'aggregated',
      inventory: inventoryItems,
      sales: salesRecords,
      thresholds,
    };

    const response = await mlClient.post<AtRiskResponse>(
      "/api/v1/smart-shelf/at-risk",
      request
    );

    if (!response || !response.at_risk) {
      return {
        at_risk: [],
        meta: {
          shop_id: 'aggregated',
          total_Product: products.length,
          flagged_count: 0,
          analysis_date: new Date().toISOString(),
          thresholds_used: thresholds,
        },
      };
    }

    // Process and normalize scores
    const atRiskMap = new Map<string, any>();
    
    response.at_risk.forEach((item: any) => {
      const productId = String(item.product_id);
      const score = Math.round((item.score || 0) * 100);
      const reasons = Array.isArray(item.reasons) 
        ? item.reasons.map((r: any): RiskReason => {
            const reasonStr = typeof r === 'string' ? r : String(r);
            if (reasonStr === 'low_stock' || reasonStr === 'LOW_STOCK') return RiskReason.LOW_STOCK;
            if (reasonStr === 'near_expiry' || reasonStr === 'NEAR_EXPIRY') return RiskReason.NEAR_EXPIRY;
            if (reasonStr === 'slow_moving' || reasonStr === 'SLOW_MOVING') return RiskReason.SLOW_MOVING;
            return RiskReason.LOW_STOCK;
          })
        : [];
      
      if (atRiskMap.has(productId)) {
        const existing = atRiskMap.get(productId)!;
        existing.score = Math.max(existing.score, score);
        reasons.forEach((r: any) => {
          if (!existing.reasons.includes(r)) {
            existing.reasons.push(r);
          }
        });
      } else {
        atRiskMap.set(productId, {
          ...item,
          score,
          reasons,
        });
      }
    });

    const processedAtRisk = Array.from(atRiskMap.values())
      .sort((a: any, b: any) => b.score - a.score);

    console.log(`✅ Aggregated at-risk: ${processedAtRisk.length} unique items across all platforms`);

    return {
      at_risk: processedAtRisk,
      meta: {
        shop_id: 'aggregated',
        total_Product: products.length,
        flagged_count: processedAtRisk.length,
        analysis_date: new Date().toISOString(),
        thresholds_used: thresholds,
      },
    };
    } catch (error: any) {
      console.error("❌ ML service error for aggregated at-risk detection:", error?.message || error);
      
      // Return empty response instead of throwing
      console.error("⚠️ ML service unavailable, returning empty at-risk data");
      return {
        at_risk: [],
        meta: {
          shop_id: 'aggregated',
          total_Product: products.length,
          flagged_count: 0,
          analysis_date: new Date().toISOString(),
          thresholds_used: thresholds,
        },
      };
    }
    },
    300 // 5 minutes cache TTL
  );
}

/**
 * Get aggregated dashboard analytics for all shops accessible to a user
 * Combines data from owned and linked shops
 * @param platform - Optional platform filter (SHOPEE, LAZADA, etc.)
 */
export async function getUserDashboardAnalytics(userId: string, platform?: string) {
  // Generate cache key
  const cacheKey = `dashboard-analytics:user:${userId}${platform ? `:${platform}` : ''}`;
  
  // Try cache first (10 min TTL for dashboard data)
  return CacheService.getOrSet(
    cacheKey,
    async () => {
      // Get all shops the user owns
      const ownedShops = await prisma.shop.findMany({
    where: { 
      ownerId: userId,
      ...(platform && { platform: platform as any }),
    },
    select: { id: true, platform: true },
  });

  // Get all shops the user has access to via ShopAccess
  const linkedShops = await prisma.shopAccess.findMany({
    where: { userId: userId },
    include: {
      Shop: {
        select: { id: true, platform: true },
      },
    },
  });

  // Filter linked shops by platform if specified
  const filteredLinkedShops = platform
    ? linkedShops.filter((ls: any) => ls.Shop.platform === platform)
    : linkedShops;

  // Combine all shop IDs
  const allShopIds = [
    ...ownedShops.map((s: any) => s.id),
    ...filteredLinkedShops.map((sa: any) => sa.Shop.id),
  ];

  if (allShopIds.length === 0) {
    return {
      metrics: {
        totalRevenue: 0,
        totalProfit: 0,
        profitMargin: 0,
        totalItems: 0,
        totalProducts: 0,
        totalSales: 0,
      },
      forecast: null,
      period: {
        start: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
        days: 60,
      },
    };
  }

  console.log(`📊 Getting aggregated dashboard for user ${userId} across ${allShopIds.length} shops`);

  // Aggregate data from all shops
  let totalRevenue = 0;
  let totalProfit = 0;
  let totalItems = 0;
  let totalProducts = 0;
  let totalSales = 0;
  const allSalesRecords: any[] = [];

  // Get products from all shops
  const products = await prisma.product.findMany({
    where: { shopId: { in: allShopIds } },
    include: { Inventory: { take: 1 } },
  });
  totalProducts = products.length;

  // Get sales from all shops (only completed)
  const sales = await prisma.sale.findMany({
    where: {
      shopId: { in: allShopIds },
      status: 'COMPLETED',
    },
    select: {
      items: true,
      total: true,
      revenue: true,
      profit: true,
      createdAt: true,
      platform: true,
    },
  });

  totalSales = sales.length;

  // Calculate aggregated metrics
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  sales.forEach((sale: any) => {
    const saleRevenue = sale.revenue || sale.total || 0;
    totalRevenue += saleRevenue;

    if (sale.profit !== null && sale.profit !== undefined) {
      totalProfit += sale.profit;
    }

    const items = typeof sale.items === "string" ? JSON.parse(sale.items) : sale.items;
    if (Array.isArray(items)) {
      items.forEach((item: any) => {
        totalItems += item.quantity || 0;

        // Add to sales records for forecast if in last 60 days
        if (sale.createdAt >= sixtyDaysAgo && item.productId) {
          const dateStr = new Date(sale.createdAt).toISOString().split('T')[0];
          allSalesRecords.push({
            product_id: item.productId,
            date: dateStr,
            qty: item.quantity || 0,
          });
        }
      });
    }
  });

  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // Simple fallback forecast (ML service integration would require more complex aggregation)
  let forecast: any = null;
  if (allSalesRecords.length > 0) {
    const uniqueDates = new Set(allSalesRecords.map((r: any) => r.date));
    const totalQty = allSalesRecords.reduce((sum: number, r: any) => sum + (r.qty || 0), 0);
    const avgDailySales = uniqueDates.size > 0 ? totalQty / uniqueDates.size : 0;

    forecast = generateFallbackForecast(avgDailySales, uniqueDates.size);
  }

  console.log(`📊 Aggregated metrics: ${totalProducts} products, ${totalSales} sales, ₱${totalRevenue.toFixed(2)} revenue across ${allShopIds.length} shops`);

  return {
    metrics: {
      totalRevenue,
      totalProfit,
      profitMargin,
      totalItems,
      totalProducts,
      totalSales,
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

  // If no active integration, return empty/default data in the same format as active integration
  if (!isActive) {
    console.log(`⚠️  No active Shopee integration for shop ${shopId}, returning empty dashboard data`);
    return {
      metrics: {
        totalRevenue: 0,
        totalProfit: 0,
        profitMargin: 0,
        totalItems: 0,
        totalProducts: 0,
        totalSales: 0,
      },
      forecast: null,
      period: {
        start: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
        end: new Date().toISOString(),
        days: 60,
      },
    };
  }

  const cacheKey = `dashboard-analytics:${shopId}`;
  
  // Try cache first (10 min TTL)
  return CacheService.getOrSet(
    cacheKey,
    async () => {
      // 1. Calculate basic metrics from database
      // Get ALL products for the shop (synced from Shopee-Clone + locally created)
      // Products with externalId are synced from Shopee-Clone
      const products = await prisma.product.findMany({
        where: { 
          shopId,
          // Removed externalId filter - show all products for the shop
          // This ensures BVA can display data even if sync hasn't completed yet
        },
        include: {
          Inventory: { take: 1 },
        },
      });

      console.log(`📊 Dashboard Analytics: Found ${products.length} total products for shop ${shopId}`);
      const syncedProducts = products.filter((p: any) => p.externalId !== null);
      console.log(`   ${syncedProducts.length} synced from Shopee-Clone, ${products.length - syncedProducts.length} locally created`);

      // 2. Get ALL COMPLETED sales for lifetime metrics (total revenue, total orders)
      // Get sales from all platforms (SHOPEE, LAZADA, TIKTOK, etc.)
      // Only count completed sales for revenue metrics (consistent with Reports page)
      const allSales = await prisma.sale.findMany({
        where: {
          shopId,
          status: 'COMPLETED', // Only completed sales count toward revenue
          // Removed platform filter - show all sales for the shop
          // This ensures BVA can display data from all sources
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
      const shopeeSales = allSales.filter((s: any) => s.platform === 'SHOPEE');
      console.log(`   ${shopeeSales.length} from SHOPEE platform, ${allSales.length - shopeeSales.length} from other platforms`);

      // 3. Get sales data for the last 60 days (for forecast/trends)
      // We need at least 14 days of history for accurate forecasting
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const recentSales = allSales.filter(
        (sale: any) => sale.createdAt >= sixtyDaysAgo
      );

      // 4. Calculate lifetime totals from ALL sales
      let totalRevenue = 0;
      let totalCost = 0;
      let totalItems = 0;
      let totalOrders = 0;
      const salesRecords: any[] = [];

      allSales.forEach((sale: any) => {
        // Count only completed orders (already filtered by status='completed')
        totalOrders++;
        
        // Use revenue if available, otherwise use total
        const saleRevenue = sale.revenue || sale.total || 0;
        totalRevenue += saleRevenue;

        const items =
          typeof sale.items === "string" ? JSON.parse(sale.items) : sale.items;

        if (Array.isArray(items)) {
          items.forEach((item: any) => {
            const product = products.find((p: any) => p.id === item.productId);
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
      allSales.forEach((sale: any) => {
        if (sale.profit !== null && sale.profit !== undefined) {
          totalProfit += sale.profit;
        } else {
          // Fallback: calculate from revenue - cost
          const saleRevenue = sale.revenue || sale.total || 0;
          const items =
            typeof sale.items === "string" ? JSON.parse(sale.items) : sale.items;
          if (Array.isArray(items)) {
            items.forEach((item: any) => {
              const product = products.find((p: any) => p.id === item.productId);
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
      let forecast: any = null;
      
      // Always try to generate a forecast if we have any sales data
      if (products.length > 0 && salesRecords.length > 0) {
        try {
          // Group sales by date to check if we have enough data points
          const uniqueDates = new Set(salesRecords.map((r: any) => r.date));
          
          console.log(`📊 Forecast preparation for shop ${shopId}:`, {
            Product: products.length,
            salesRecords: salesRecords.length,
            uniqueDates: uniqueDates.size,
            dateRange: uniqueDates.size > 0 ? {
              first: Array.from(uniqueDates).sort()[0],
              last: Array.from(uniqueDates).sort().reverse()[0]
            } : null
          });
          
          // Calculate average daily sales for fallback forecast
          const totalQty = salesRecords.reduce((sum: number, r: any) => sum + (r.qty || 0), 0);
          const avgDailySales = uniqueDates.size > 0 ? totalQty / uniqueDates.size : (totalQty / Math.max(1, salesRecords.length));
          
          // Only call ML service if we have at least 14 days of data
          if (uniqueDates.size >= 14) {
            const productIds = products.slice(0, 10).map((p: any) => p.id); // Top 10 products
            
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
                } : null,
                fullResponse: JSON.stringify(forecastResponse).substring(0, 200)
              });
              
              // Ensure forecast is in the correct format
              if (forecastResponse && forecastResponse.forecasts && Array.isArray(forecastResponse.forecasts) && forecastResponse.forecasts.length > 0) {
                forecast = forecastResponse;
                console.log(`✅ Using ML service forecast with ${forecastResponse.forecasts.length} product forecasts`);
              } else {
                console.warn("⚠️  Forecast response missing forecasts array, using fallback:", forecastResponse);
                // Use fallback forecast
                forecast = generateFallbackForecast(avgDailySales, uniqueDates.size || 1);
                console.log(`✅ Generated fallback forecast`);
              }
            } catch (mlError: any) {
              console.error("❌ ML service forecast failed, using fallback:", mlError?.message);
              console.error("ML Error details:", {
                message: mlError?.message,
                response: mlError?.response?.data,
                status: mlError?.response?.status
              });
              // Use fallback forecast based on historical average
              forecast = generateFallbackForecast(avgDailySales, uniqueDates.size || 1);
              console.log(`✅ Generated fallback forecast after ML error`);
            }
          } else if (uniqueDates.size >= 1 || salesRecords.length > 0) {
            // If we have ANY sales data, use fallback forecast (even with just 1 day)
            console.log(`📊 Using fallback forecast (${uniqueDates.size} unique days, ${salesRecords.length} sales records)`);
            forecast = generateFallbackForecast(avgDailySales, uniqueDates.size || 1);
            console.log(`✅ Generated fallback forecast with avgDailySales: ${avgDailySales.toFixed(2)}`);
          } else {
            console.log(`⚠️  No sales data available for forecast generation`);
            forecast = null; // Explicitly set to null
          }
        } catch (error: any) {
          console.error("❌ Error in forecast generation:", error?.message || error);
          console.error("Error stack:", error?.stack);
          // Try to generate fallback even on error if we have sales data
          if (salesRecords.length > 0) {
            const totalQty = salesRecords.reduce((sum: number, r: any) => sum + (r.qty || 0), 0);
            const avgDailySales = totalQty / Math.max(1, salesRecords.length);
            forecast = generateFallbackForecast(avgDailySales, 1);
            console.log(`✅ Generated fallback forecast after error`);
          } else {
            forecast = null; // Explicitly set to null
          }
        }
      } else {
        console.log(`⚠️  Cannot generate forecast: ${products.length} products, ${salesRecords.length} sales records`);
        if (products.length === 0) {
          console.log(`💡 Tip: No products with externalId found. Products need to be synced from Shopee-Clone.`);
        }
        if (salesRecords.length === 0) {
          console.log(`💡 Tip: No sales records found in the last 60 days from Shopee-Clone platform.`);
        }
        forecast = null; // Explicitly set to null
      }
      
      // Ensure forecast is either null or a valid structure
      if (forecast && (!forecast.forecasts || !Array.isArray(forecast.forecasts) || forecast.forecasts.length === 0)) {
        console.warn("⚠️  Invalid forecast structure, setting to null:", forecast);
        forecast = null;
      }

      // Final validation: ensure forecast is either null or has valid structure
      let finalForecast: any = null;
      if (forecast) {
        if (forecast.forecasts && Array.isArray(forecast.forecasts) && forecast.forecasts.length > 0) {
          finalForecast = forecast;
          console.log(`✅ Final forecast validated: ${forecast.forecasts.length} product forecasts`);
        } else {
          console.warn("⚠️  Invalid forecast structure, setting to null:", {
            hasForecasts: !!forecast.forecasts,
            isArray: Array.isArray(forecast.forecasts),
            length: forecast.forecasts?.length || 0
          });
          finalForecast = null;
        }
      }

      const response = {
        metrics: {
          totalRevenue,
          totalProfit,
          profitMargin,
          totalItems,
          totalProducts: products.length,
          totalSales: totalItems, // Total quantity of items sold (not number of transactions)
        },
        forecast: finalForecast, // Explicitly null or valid structure
        period: {
          start: sixtyDaysAgo.toISOString(),
          end: new Date().toISOString(),
          days: 60,
        },
      };

      console.log(`📊 Dashboard response for shop ${shopId}:`, {
        metrics: response.metrics,
        hasForecast: !!response.forecast,
        forecastType: response.forecast ? typeof response.forecast : 'null',
        forecastsCount: response.forecast?.forecasts?.length || 0,
        productsCount: products.length,
        salesCount: allSales.length
      });

      return response;
    },
    600 // 10 minutes cache TTL
  );
}
