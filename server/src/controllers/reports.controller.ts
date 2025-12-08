import { Request, Response } from "express";
import { reportsService } from "../services/reports.service";
import prisma from "../lib/prisma";

/**
 * Helper function to get shopId from request (token or user's shops)
 */
async function getShopIdFromRequest(req: Request): Promise<string | null> {
  const user = (req as any).user;
  if (!user || !user.userId) {
    return null;
  }

  // Try to get shopId from token first
  if (user.shopId) {
    return user.shopId;
  }

  // Fallback: fetch user's first shop
  const shops = await prisma.shop.findMany({
    where: { ownerId: user.userId },
    take: 1,
    select: { id: true },
  });

  return shops[0]?.id || null;
}

/**
 * Get dashboard metrics (revenue, profit margin, stock turnover)
 * GET /api/reports/metrics
 */
export const getDashboardMetrics = async (req: Request, res: Response) => {
  try {
    // Get shopId from authenticated user
    const shopId = await getShopIdFromRequest(req);

    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: "Shop ID not found. Please ensure you have a shop associated with your account.",
      });
    }

    const metrics = await reportsService.getDashboardMetrics(shopId);

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch dashboard metrics",
    });
  }
};

/**
 * Get sales summary data for charts
 * GET /api/reports/sales-summary?start=2023-01-01&end=2023-12-31&interval=day
 * 
 * Query parameters:
 * - start: Start date (ISO string, optional, defaults to 30 days ago)
 * - end: End date (ISO string, optional, defaults to today)
 * - interval: 'day' or 'month' (optional, defaults to 'day')
 */
export const getSalesSummary = async (req: Request, res: Response) => {
  try {
    const shopId = await getShopIdFromRequest(req);

    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: "Shop ID not found. Please ensure you have a shop associated with your account.",
      });
    }

    // Parse query parameters
    const { start, end, interval } = req.query;

    // Default to last 30 days if no dates provided
    const endDate = end ? new Date(end as string) : new Date();
    const startDate = start
      ? new Date(start as string)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: "Invalid date format. Use ISO date strings (YYYY-MM-DD).",
      });
    }

    if (startDate > endDate) {
      return res.status(400).json({
        success: false,
        error: "Start date must be before end date.",
      });
    }

    // Validate interval
    const validInterval = interval === "month" ? "month" : "day";

    // Get sales data from service
    const salesData = await reportsService.getSalesOverTime(
      shopId,
      startDate,
      endDate,
      validInterval
    );

    // Transform data for frontend chart format
    // Frontend expects: [{ name: "Jan", total: 5000 }] or [{ name: "2023-01-01", total: 5000 }]
    const chartData = salesData.map((item) => {
      let name: string;

      if (validInterval === "month") {
        // Format: "2023-01" -> "Jan 2023"
        const [year, month] = item.date.split("-");
        const monthNames = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        name = `${monthNames[parseInt(month!) - 1]} ${year}`;
      } else {
        // Format: "2023-01-01" -> "Jan 1" or keep as date
        const date = new Date(item.date);
        const monthNames = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        name = `${monthNames[date.getMonth()]} ${date.getDate()}`;
      }

      return {
        name,
        total: item.revenue,
        orders: item.orders,
        profit: item.profit,
        date: item.date, // Keep original date for reference
      };
    });

    res.json({
      success: true,
      data: chartData,
    });
  } catch (error) {
    console.error("Error fetching sales summary:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch sales summary",
    });
  }
};

/**
 * Get profit analysis
 * GET /api/reports/profit-analysis?start=2023-01-01&end=2023-12-31
 */
export const getProfitAnalysis = async (req: Request, res: Response) => {
  try {
    const shopId = await getShopIdFromRequest(req);

    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: "Shop ID not found.",
      });
    }

    const { start, end } = req.query;
    const startDate = start ? new Date(start as string) : undefined;
    const endDate = end ? new Date(end as string) : undefined;

    const analysis = await reportsService.getProfitAnalysis(
      shopId,
      startDate,
      endDate
    );

    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error("Error fetching profit analysis:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch profit analysis",
    });
  }
};

/**
 * Get platform comparison
 * GET /api/reports/platform-comparison?start=2023-01-01&end=2023-12-31
 */
export const getPlatformComparison = async (req: Request, res: Response) => {
  try {
    const shopId = await getShopIdFromRequest(req);

    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: "Shop ID not found.",
      });
    }

    const { start, end } = req.query;
    const startDate = start ? new Date(start as string) : undefined;
    const endDate = end ? new Date(end as string) : undefined;

    const comparison = await reportsService.getPlatformComparison(
      shopId,
      startDate,
      endDate
    );

    res.json({
      success: true,
      data: comparison,
    });
  } catch (error) {
    console.error("Error fetching platform comparison:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch platform comparison",
    });
  }
};

/**
 * Get stock turnover report
 * GET /api/reports/stock-turnover?start=2023-01-01&end=2023-12-31
 */
export const getStockTurnoverReport = async (req: Request, res: Response) => {
  try {
    const shopId = await getShopIdFromRequest(req);

    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: "Shop ID not found.",
      });
    }

    const { start, end } = req.query;
    const startDate = start ? new Date(start as string) : undefined;
    const endDate = end ? new Date(end as string) : undefined;

    const report = await reportsService.getStockTurnoverReport(
      shopId,
      startDate,
      endDate
    );

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("Error fetching stock turnover report:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch stock turnover report",
    });
  }
};
