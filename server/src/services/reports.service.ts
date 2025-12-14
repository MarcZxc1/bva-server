/**
 * Reports Service
 * 
 * Handles complex database aggregations for analytics and reporting.
 * Uses Prisma's aggregation features to calculate metrics from sales data.
 * Implements Redis caching for optimized performance.
 */

import prisma from "../lib/prisma";
import { CacheService } from "../lib/redis";
import type { Prisma } from "../generated/prisma";
import { shopAccessService } from "../service/shopAccess.service";
// Removed hasActiveIntegration import - reports now work with all shops (no integration requirement)

export interface SalesOverTimeData {
  date: string;
  revenue: number;
  orders: number;
  profit: number;
}

export interface ProfitAnalysisData {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  period: {
    start: Date;
    end: Date;
  };
}

export interface PlatformComparisonData {
  platform: string;
  revenue: number;
  orders: number;
  profit: number;
  profitMargin: number;
}

export class ReportsService {
  /**
   * Get sales data aggregated over time (by day or month)
   * Fills in missing dates with 0 revenue to ensure continuous chart data
   * Returns real database data filtered by shopId (no mock data)
   */
  async getSalesOverTime(
    shopId: string,
    startDate: Date,
    endDate: Date,
    interval: "day" | "month" = "day"
  ): Promise<SalesOverTimeData[]> {
    const cacheKey = `sales:${shopId}:${startDate.toISOString()}:${endDate.toISOString()}:${interval}`;
    
    // Try cache first (15 min TTL for sales data)
    return CacheService.getOrSet(
      cacheKey,
      async () => {
        // Fetch sales in the date range - ALL sales for the shop (synced and local)
        const sales = await prisma.sale.findMany({
      where: {
        shopId, // Critical: ensures user-specific data only
        // Removed platform filter - show all sales for the shop
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: "COMPLETED", // Only count completed sales
      },
      select: {
        id: true,
        total: true,
        revenue: true,
        profit: true,
        createdAt: true,
        items: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Calculate profit from items if profit field is null
    const salesWithProfit = await Promise.all(
      sales.map(async (sale) => {
        let calculatedProfit = sale.profit;

        // If profit is not stored, calculate it from items
        if (calculatedProfit === null || calculatedProfit === undefined) {
          calculatedProfit = await this.calculateSaleProfit(sale.items, shopId);
        }

        return {
          ...sale,
          profit: calculatedProfit || 0,
          revenue: sale.revenue || sale.total,
        };
      })
    );

    // Group sales by date interval
    const groupedSales = new Map<string, SalesOverTimeData>();

    salesWithProfit.forEach((sale) => {
      const saleDate = new Date(sale.createdAt);
      let dateKey: string;

      if (interval === "month") {
        dateKey = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, "0")}`;
      } else {
        // Day interval
        dateKey = saleDate.toISOString().split("T")[0]!;
      }

      const existing = groupedSales.get(dateKey) || {
        date: dateKey,
        revenue: 0,
        orders: 0,
        profit: 0,
      };

      groupedSales.set(dateKey, {
        date: dateKey,
        revenue: existing.revenue + (sale.revenue || sale.total),
        orders: existing.orders + 1,
        profit: existing.profit + (sale.profit || 0),
      });
    });

    // Fill in missing dates with 0 revenue
    const filledData = this.fillMissingDates(
      Array.from(groupedSales.values()),
      startDate,
      endDate,
      interval
    );

    // Sort by date
    return filledData.sort((a, b) => a.date.localeCompare(b.date));
      },
      900 // 15 minutes cache TTL
    );
  }

  /**
   * Calculate profit for a sale from its items
   * Profit = (Sale Price - Product Cost) * Quantity for each item
   */
  private async calculateSaleProfit(
    items: any,
    shopId: string
  ): Promise<number> {
    if (!items || typeof items !== "object") {
      return 0;
    }

    const itemsArray = Array.isArray(items) ? items : [items];
    let totalProfit = 0;

    // Fetch all products in one query for efficiency
    const productIds = itemsArray
      .map((item: any) => item.productId)
      .filter((id: any) => id);

    if (productIds.length === 0) {
      return 0;
    }

    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        shopId,
      },
      select: {
        id: true,
        cost: true,
      },
    });

    const productCostMap = new Map(products.map((p) => [p.id, p.cost || 0]));

    itemsArray.forEach((item: any) => {
      if (item.productId && item.price && item.quantity) {
        const productCost = productCostMap.get(item.productId) || 0;
        const itemProfit = (item.price - productCost) * item.quantity;
        totalProfit += itemProfit;
      }
    });

    return totalProfit;
  }

  /**
   * Fill missing dates in the data array with 0 revenue
   * Ensures charts display continuous data without gaps
   */
  private fillMissingDates(
    data: SalesOverTimeData[],
    startDate: Date,
    endDate: Date,
    interval: "day" | "month"
  ): SalesOverTimeData[] {
    const filled: SalesOverTimeData[] = [];
    const dataMap = new Map(data.map((d) => [d.date, d]));

    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      let dateKey: string;

      if (interval === "month") {
        dateKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`;
        // Move to next month
        current.setMonth(current.getMonth() + 1);
      } else {
        // Day interval
        dateKey = current.toISOString().split("T")[0]!;
        // Move to next day
        current.setDate(current.getDate() + 1);
      }

      const existing = dataMap.get(dateKey);
      filled.push(
        existing || {
          date: dateKey,
          revenue: 0,
          orders: 0,
          profit: 0,
        }
      );
    }

    return filled;
  }

  /**
   * Get comprehensive profit analysis
   * Calculates revenue, COGS (Cost of Goods Sold), profit, and profit margin
   * Returns zeros if no sales data exists (no mock data)
   * If no date range specified, returns ALL TIME data (lifetime metrics)
   */
  async getProfitAnalysis(
    shopId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ProfitAnalysisData> {
    const cacheKey = `profit:${shopId}:${startDate?.toISOString() || 'all'}:${endDate?.toISOString() || 'all'}`;
    
    // Try cache first (15 min TTL)
    return CacheService.getOrSet(
      cacheKey,
      async () => {
        const whereClause: Prisma.SaleWhereInput = {
      shopId, // Always filter by shopId - ensures user-specific data
      // Removed platform filter - show all sales for the shop
      status: "COMPLETED",
    };

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = startDate;
      if (endDate) whereClause.createdAt.lte = endDate;
    }

    // Fetch all sales with items
    const sales = await prisma.sale.findMany({
      where: whereClause,
      select: {
        id: true,
        total: true,
        revenue: true,
        profit: true,
        items: true,
        createdAt: true,
      },
    });

    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;

    // Fetch all products for cost calculation
    const productIds = new Set<string>();
    sales.forEach((sale) => {
      const items = Array.isArray(sale.items) ? sale.items : [sale.items];
      items.forEach((item: any) => {
        if (item.productId) {
          productIds.add(item.productId);
        }
      });
    });

    const products = await prisma.product.findMany({
      where: {
        id: { in: Array.from(productIds) },
        shopId,
      },
      select: {
        id: true,
        cost: true,
      },
    });

    const productCostMap = new Map(products.map((p) => [p.id, p.cost || 0]));

    // Calculate totals
    sales.forEach((sale) => {
      const revenue = sale.revenue || sale.total;
      totalRevenue += revenue;

      // Calculate profit
      let saleProfit: number = sale.profit ?? 0;
      if (sale.profit === null || sale.profit === undefined) {
        // Calculate from items
        const items = Array.isArray(sale.items) ? sale.items : [sale.items];
        saleProfit = 0;
        let saleCost = 0;

        items.forEach((item: any) => {
          if (item.productId && item.quantity && item.price) {
            const productCost = productCostMap.get(item.productId) || 0;
            saleCost += productCost * item.quantity;
            saleProfit += (item.price - productCost) * item.quantity;
          }
        });

        totalCost += saleCost;
        totalProfit += saleProfit;
      } else {
        // Profit is already calculated
        totalProfit += saleProfit;
        // Estimate cost from revenue and profit
        totalCost += revenue - saleProfit;
      }
    });

    const profitMargin =
      totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

        return {
          totalRevenue,
          totalCost,
          totalProfit,
          profitMargin,
          period: {
            start: startDate || new Date(0),
            end: endDate || new Date(),
          },
        };
      },
      900 // 15 minutes cache TTL
    );
  }

  /**
   * Get platform comparison data
   * Groups sales by platform (Shopee, Lazada, TikTok, etc.)
   * Returns real database data filtered by shopId (no mock data)
   */
  async getPlatformComparison(
    shopId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<PlatformComparisonData[]> {
    const cacheKey = `platform:${shopId}:${startDate?.toISOString() || 'all'}:${endDate?.toISOString() || 'all'}`;
    
    // Try cache first (15 min TTL)
    return CacheService.getOrSet(
      cacheKey,
      async () => {
        const whereClause: any = {
      shopId, // Critical: ensures user-specific data only
      status: "COMPLETED",
    };

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = startDate;
      if (endDate) whereClause.createdAt.lte = endDate;
    }

    // Group sales by platform
    const sales = await prisma.sale.findMany({
      where: whereClause,
      select: {
        id: true,
        platform: true,
        total: true,
        revenue: true,
        profit: true,
        items: true,
      },
    });

    // Fetch products for profit calculation
    const productIds = new Set<string>();
    sales.forEach((sale) => {
      const items = Array.isArray(sale.items) ? sale.items : [sale.items];
      items.forEach((item: any) => {
        if (item.productId) {
          productIds.add(item.productId);
        }
      });
    });

    const products = await prisma.product.findMany({
      where: {
        id: { in: Array.from(productIds) },
        shopId,
      },
      select: {
        id: true,
        cost: true,
      },
    });

    const productCostMap = new Map(products.map((p) => [p.id, p.cost || 0]));

    // Group by platform
    const platformMap = new Map<string, PlatformComparisonData>();

    sales.forEach((sale) => {
      // Handle null/undefined platform - default to "OTHER" if not set
      const platform = sale.platform || "OTHER";
      const existing = platformMap.get(platform) || {
        platform,
        revenue: 0,
        orders: 0,
        profit: 0,
        profitMargin: 0,
      };

      const revenue = sale.revenue || sale.total;
      let profit = sale.profit || 0;

      // Calculate profit if not stored
      if (profit === 0 || profit === null) {
        const items = Array.isArray(sale.items) ? sale.items : [sale.items];
        items.forEach((item: any) => {
          if (item.productId && item.quantity && item.price) {
            const productCost = productCostMap.get(item.productId) || 0;
            profit += (item.price - productCost) * item.quantity;
          }
        });
      }

      platformMap.set(platform, {
        platform,
        revenue: existing.revenue + revenue,
        orders: existing.orders + 1,
        profit: existing.profit + profit,
        profitMargin: 0, // Will calculate after aggregation
      });
    });

    // Calculate profit margins
    const result = Array.from(platformMap.values()).map((data) => ({
      ...data,
      profitMargin:
        data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0,
    }));

        // Sort by revenue descending
        return result.sort((a, b) => b.revenue - a.revenue);
      },
      900 // 15 minutes cache TTL
    );
  }

  /**
   * Get dashboard metrics (revenue, profit margin, stock turnover)
   * Optimized version that calculates all metrics in one pass
   */
  async getDashboardMetrics(shopId: string): Promise<{
    totalRevenue: number;
    profitMargin: number;
    stockTurnover: number;
    currency: string;
  }> {
    const cacheKey = `dashboard:${shopId}`;
    
    // Try cache first (10 min TTL for dashboard)
    return CacheService.getOrSet(
      cacheKey,
      async () => {
        // Get profit analysis for all time
        const profitAnalysis = await this.getProfitAnalysis(shopId);

    // Calculate stock turnover
    // Stock Turnover = COGS / Average Inventory Value
    // Include ALL products for the shop (synced and local)
    const inventory = await prisma.inventory.findMany({
      where: {
        Product: {
          shopId,
          // Removed externalId filter - show all products for the shop
        },
      },
      include: {
        Product: {
          select: {
            cost: true,
          },
        },
      },
    });

    const currentInventoryValue = inventory.reduce((acc, inv) => {
      return acc + ((inv.Product?.cost || 0) * inv.quantity);
    }, 0);

    // Use total cost from profit analysis as COGS
    const stockTurnover =
      currentInventoryValue > 0
        ? profitAnalysis.totalCost / currentInventoryValue
        : 0;

        return {
          totalRevenue: profitAnalysis.totalRevenue,
          profitMargin: profitAnalysis.profitMargin,
          stockTurnover: Math.round(stockTurnover * 100) / 100, // Round to 2 decimal places
          currency: "PHP",
        };
      },
      600 // 10 minutes cache TTL
    );
  }

  /**
   * Get stock turnover report with detailed inventory movement
   */
  async getStockTurnoverReport(
    shopId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    stockTurnover: number;
    inventoryValue: number;
    cogs: number;
    products: Array<{
      productId: string;
      productName: string;
      sku: string;
      currentStock: number;
      inventoryValue: number;
      turnoverRate: number;
    }>;
    period: {
      start: string;
      end: string;
    };
  }> {

    const end = endDate || new Date();
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to 30 days

    // Get profit analysis for the period to get COGS
    const profitAnalysis = await this.getProfitAnalysis(shopId, start, end);

    // Get all products with inventory (ALL products for the shop)
    const products = await prisma.product.findMany({
      where: { 
        shopId,
        // Removed externalId filter - show all products for the shop
      },
      include: {
        Inventory: {
          take: 1,
          orderBy: { updatedAt: "desc" },
        },
      },
    });

    // Calculate inventory value and turnover per product
    const productReports = products.map((product) => {
      const quantity = product.Inventory[0]?.quantity || product.stock || 0;
      const cost = product.cost || 0;
      const inventoryValue = cost * quantity;
      
      // Calculate turnover rate for this product (simplified: based on sales)
      const turnoverRate = inventoryValue > 0 
        ? (profitAnalysis.totalCost / products.length) / inventoryValue 
        : 0;

      return {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        currentStock: quantity,
        inventoryValue,
        turnoverRate: Math.round(turnoverRate * 100) / 100,
      };
    });

    const totalInventoryValue = productReports.reduce(
      (sum, p) => sum + p.inventoryValue,
      0
    );

    const overallTurnover = totalInventoryValue > 0
      ? profitAnalysis.totalCost / totalInventoryValue
      : 0;

    return {
      stockTurnover: Math.round(overallTurnover * 100) / 100,
      inventoryValue: totalInventoryValue,
      cogs: profitAnalysis.totalCost,
      products: productReports.sort((a, b) => b.turnoverRate - a.turnoverRate),
      period: {
        start: start.toISOString().split("T")[0]!,
        end: end.toISOString().split("T")[0]!,
      },
    };
  }

  /**
   * Get dashboard metrics for all accessible shops (owned + linked) with optional platform filter
   * Aggregates metrics across all shops accessible to the user
   */
  async getDashboardMetricsForUser(
    userId: string,
    platform?: string
  ): Promise<{
    totalRevenue: number;
    profitMargin: number;
    stockTurnover: number;
    currency: string;
  }> {
    // Get all accessible shops (owned + linked)
    const accessibleShopIds = await shopAccessService.getAccessibleShops(userId);

    if (accessibleShopIds.length === 0) {
      return {
        totalRevenue: 0,
        profitMargin: 0,
        stockTurnover: 0,
        currency: "PHP",
      };
    }

    // Filter shops by platform if specified
    let shopIds = accessibleShopIds;
    if (platform) {
      const shops = await prisma.shop.findMany({
        where: {
          id: { in: accessibleShopIds },
          platform: platform as any,
        },
        select: { id: true },
      });
      shopIds = shops.map(s => s.id);
    }

    if (shopIds.length === 0) {
      return {
        totalRevenue: 0,
        profitMargin: 0,
        stockTurnover: 0,
        currency: "PHP",
      };
    }

    // Aggregate metrics across all shops
    const metricsPromises = shopIds.map(shopId => this.getDashboardMetrics(shopId));
    const allMetrics = await Promise.all(metricsPromises);

    // Sum up revenues and calculate weighted average for profit margin
    const totalRevenue = allMetrics.reduce((sum, m) => sum + m.totalRevenue, 0);
    const weightedProfitMargin = allMetrics.reduce((sum, m) => 
      sum + (m.profitMargin * m.totalRevenue), 0
    ) / (totalRevenue || 1);
    const avgStockTurnover = allMetrics.reduce((sum, m) => sum + m.stockTurnover, 0) / allMetrics.length;

    return {
      totalRevenue,
      profitMargin: Math.round(weightedProfitMargin * 100) / 100,
      stockTurnover: Math.round(avgStockTurnover * 100) / 100,
      currency: "PHP",
    };
  }

  /**
   * Get sales over time for all accessible shops with optional platform filter
   * Aggregates sales data across all shops accessible to the user
   */
  async getSalesOverTimeForUser(
    userId: string,
    startDate: Date,
    endDate: Date,
    interval: "day" | "month" = "day",
    platform?: string
  ): Promise<SalesOverTimeData[]> {
    // Get all accessible shops (owned + linked)
    const accessibleShopIds = await shopAccessService.getAccessibleShops(userId);

    if (accessibleShopIds.length === 0) {
      return [];
    }

    // Filter shops by platform if specified
    let shopIds = accessibleShopIds;
    if (platform) {
      const shops = await prisma.shop.findMany({
        where: {
          id: { in: accessibleShopIds },
          platform: platform as any,
        },
        select: { id: true },
      });
      shopIds = shops.map(s => s.id);
    }

    if (shopIds.length === 0) {
      return [];
    }

    // Get sales data from all shops
    const salesPromises = shopIds.map(shopId =>
      this.getSalesOverTime(shopId, startDate, endDate, interval)
    );
    const allSalesData = await Promise.all(salesPromises);

    // Aggregate sales data by date
    const aggregatedData = new Map<string, { revenue: number; orders: number; profit: number }>();
    
    for (const salesData of allSalesData) {
      for (const item of salesData) {
        const existing = aggregatedData.get(item.date) || { revenue: 0, orders: 0, profit: 0 };
        aggregatedData.set(item.date, {
          revenue: existing.revenue + item.revenue,
          orders: existing.orders + item.orders,
          profit: existing.profit + item.profit,
        });
      }
    }

    // Convert map to array and sort by date
    return Array.from(aggregatedData.entries())
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        orders: data.orders,
        profit: data.profit,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get profit analysis for all accessible shops with optional platform filter
   */
  async getProfitAnalysisForUser(
    userId: string,
    startDate?: Date,
    endDate?: Date,
    platform?: string
  ): Promise<ProfitAnalysisData> {
    // Get all accessible shops (owned + linked)
    const accessibleShopIds = await shopAccessService.getAccessibleShops(userId);

    if (accessibleShopIds.length === 0) {
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate || new Date();
      return {
        totalRevenue: 0,
        totalCost: 0,
        totalProfit: 0,
        profitMargin: 0,
        period: { start, end },
      };
    }

    // Filter shops by platform if specified
    let shopIds = accessibleShopIds;
    if (platform) {
      const shops = await prisma.shop.findMany({
        where: {
          id: { in: accessibleShopIds },
          platform: platform as any,
        },
        select: { id: true },
      });
      shopIds = shops.map(s => s.id);
    }

    if (shopIds.length === 0) {
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate || new Date();
      return {
        totalRevenue: 0,
        totalCost: 0,
        totalProfit: 0,
        profitMargin: 0,
        period: { start, end },
      };
    }

    // Aggregate profit analysis across all shops
    const profitPromises = shopIds.map(shopId => this.getProfitAnalysis(shopId, startDate, endDate));
    const allProfitData = await Promise.all(profitPromises);

    const totalRevenue = allProfitData.reduce((sum, p) => sum + p.totalRevenue, 0);
    const totalCost = allProfitData.reduce((sum, p) => sum + p.totalCost, 0);
    const totalProfit = allProfitData.reduce((sum, p) => sum + p.totalProfit, 0);
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    return {
      totalRevenue,
      totalCost,
      totalProfit,
      profitMargin: Math.round(profitMargin * 100) / 100,
      period: { start, end },
    };
  }

  /**
   * Get stock turnover report for all accessible shops with optional platform filter
   */
  async getStockTurnoverReportForUser(
    userId: string,
    startDate?: Date,
    endDate?: Date,
    platform?: string
  ): Promise<{
    stockTurnover: number;
    inventoryValue: number;
    cogs: number;
    products: Array<{
      productId: string;
      productName: string;
      sku: string;
      currentStock: number;
      inventoryValue: number;
      turnoverRate: number;
    }>;
    period: {
      start: string;
      end: string;
    };
  }> {
    // Get all accessible shops (owned + linked)
    const accessibleShopIds = await shopAccessService.getAccessibleShops(userId);

    if (accessibleShopIds.length === 0) {
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate || new Date();
      return {
        stockTurnover: 0,
        inventoryValue: 0,
        cogs: 0,
        products: [],
        period: {
          start: start.toISOString().split("T")[0]!,
          end: end.toISOString().split("T")[0]!,
        },
      };
    }

    // Filter shops by platform if specified
    let shopIds = accessibleShopIds;
    if (platform) {
      const shops = await prisma.shop.findMany({
        where: {
          id: { in: accessibleShopIds },
          platform: platform as any,
        },
        select: { id: true },
      });
      shopIds = shops.map(s => s.id);
    }

    if (shopIds.length === 0) {
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate || new Date();
      return {
        stockTurnover: 0,
        inventoryValue: 0,
        cogs: 0,
        products: [],
        period: {
          start: start.toISOString().split("T")[0]!,
          end: end.toISOString().split("T")[0]!,
        },
      };
    }

    // Aggregate stock turnover reports across all shops
    const reportPromises = shopIds.map(shopId => 
      this.getStockTurnoverReport(shopId, startDate, endDate)
    );
    const allReports = await Promise.all(reportPromises);

    // Aggregate metrics
    const totalInventoryValue = allReports.reduce((sum, r) => sum + r.inventoryValue, 0);
    const totalCogs = allReports.reduce((sum, r) => sum + r.cogs, 0);
    const avgStockTurnover = totalInventoryValue > 0 ? totalCogs / totalInventoryValue : 0;

    // Combine all products
    const allProducts = allReports.flatMap(r => r.products);

    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    return {
      stockTurnover: Math.round(avgStockTurnover * 100) / 100,
      inventoryValue: totalInventoryValue,
      cogs: totalCogs,
      products: allProducts.sort((a, b) => b.turnoverRate - a.turnoverRate),
      period: {
        start: start.toISOString().split("T")[0]!,
        end: end.toISOString().split("T")[0]!,
      },
    };
  }

  /**
   * Get platform comparison for all accessible shops
   * Aggregates sales data across all shops and groups by platform
   */
  async getPlatformComparisonForUser(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<PlatformComparisonData[]> {
    // Get all accessible shops (owned + linked)
    const accessibleShopIds = await shopAccessService.getAccessibleShops(userId);

    if (accessibleShopIds.length === 0) {
      return [];
    }

    // Get platform comparison for all shops
    const comparisonPromises = accessibleShopIds.map(shopId => 
      this.getPlatformComparison(shopId, startDate, endDate)
    );
    const allComparisons = await Promise.all(comparisonPromises);

    // Aggregate by platform across all shops
    const platformMap = new Map<string, PlatformComparisonData>();

    for (const comparison of allComparisons) {
      for (const platformData of comparison) {
        const existing = platformMap.get(platformData.platform) || {
          platform: platformData.platform,
          revenue: 0,
          orders: 0,
          profit: 0,
          profitMargin: 0,
        };

        platformMap.set(platformData.platform, {
          platform: platformData.platform,
          revenue: existing.revenue + platformData.revenue,
          orders: existing.orders + platformData.orders,
          profit: existing.profit + platformData.profit,
          profitMargin: 0, // Will calculate after aggregation
        });
      }
    }

    // Calculate profit margins and convert to array
    const result = Array.from(platformMap.values()).map((data) => ({
      ...data,
      profitMargin: data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0,
    }));

    // Sort by revenue descending
    return result.sort((a, b) => b.revenue - a.revenue);
  }
}

export const reportsService = new ReportsService();

