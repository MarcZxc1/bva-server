/**
 * Reports Service
 * 
 * Standardized API client for reports and analytics endpoints.
 * Replaces direct lib/api.ts usage in Reports component.
 */

import { apiClient } from "@/lib/api-client";

export interface DashboardMetrics {
  totalRevenue: number;
  profitMargin: number;
  stockTurnover: number;
  currency: string;
}

export interface SalesChartData {
  name: string;
  total: number;
  orders: number;
  profit: number;
  date: string;
}

export interface ProfitAnalysis {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  period: {
    start: string;
    end: string;
  };
}

export interface PlatformStats {
  platform: string;
  revenue: number;
  orders: number;
  profit: number;
  profitMargin: number;
}

export type DateRange = "7d" | "30d" | "90d" | "1y" | "custom";

class ReportsService {
  /**
   * Get dashboard metrics (revenue, profit margin, stock turnover)
   */
  async getMetrics(): Promise<DashboardMetrics> {
    return apiClient.get<DashboardMetrics>("/api/reports/metrics");
  }

  /**
   * Get sales chart data for a specific period
   * @param period - Date range preset or custom dates
   * @param startDate - Custom start date (ISO string) - required if period is 'custom'
   * @param endDate - Custom end date (ISO string) - required if period is 'custom'
   * @param interval - 'day' or 'month' aggregation interval
   */
  async getSalesChart(
    period: DateRange = "30d",
    startDate?: string,
    endDate?: string,
    interval: "day" | "month" = "day"
  ): Promise<SalesChartData[]> {
    // Calculate date range based on period
    let start: string;
    let end: string;

    if (period === "custom") {
      if (!startDate || !endDate) {
        throw new Error("Start date and end date are required for custom period");
      }
      start = startDate;
      end = endDate;
    } else {
      const endDateObj = new Date();
      const startDateObj = new Date();

      switch (period) {
        case "7d":
          startDateObj.setDate(endDateObj.getDate() - 7);
          break;
        case "30d":
          startDateObj.setDate(endDateObj.getDate() - 30);
          break;
        case "90d":
          startDateObj.setDate(endDateObj.getDate() - 90);
          break;
        case "1y":
          startDateObj.setFullYear(endDateObj.getFullYear() - 1);
          break;
        default:
          startDateObj.setDate(endDateObj.getDate() - 30);
      }

      start = startDateObj.toISOString().split("T")[0]!;
      end = endDateObj.toISOString().split("T")[0]!;
    }

    const params = new URLSearchParams({
      start,
      end,
      interval,
    });

    return apiClient.get<SalesChartData[]>(
      `/api/reports/sales-summary?${params.toString()}`
    );
  }

  /**
   * Get platform comparison statistics
   * @param startDate - Optional start date (ISO string)
   * @param endDate - Optional end date (ISO string)
   */
  async getPlatformStats(
    startDate?: string,
    endDate?: string
  ): Promise<PlatformStats[]> {
    const params = new URLSearchParams();
    if (startDate) params.append("start", startDate);
    if (endDate) params.append("end", endDate);

    const queryString = params.toString();
    const url = queryString
      ? `/api/reports/platform-comparison?${queryString}`
      : "/api/reports/platform-comparison";

    try {
      // Use apiClient - it handles wrapped responses
      const response = await apiClient.get<{ success: boolean; data: PlatformStats[] } | PlatformStats[]>(url);
      
      // Handle both wrapped and unwrapped responses
      if (Array.isArray(response)) {
        return response;
      } else if (response && typeof response === 'object' && 'data' in response) {
        return (response as { success: boolean; data: PlatformStats[] }).data || [];
      }
      
      return [];
    } catch (error: any) {
      // If 404, endpoint might not be available yet - return empty array gracefully
      if (error.response?.status === 404) {
        console.warn("Platform comparison endpoint not found (404). Returning empty data.");
        return [];
      }
      
      // For other errors, log and return empty array
      console.error("Error fetching platform stats:", error);
      return [];
    }
  }

  /**
   * Get profit analysis
   * @param startDate - Optional start date (ISO string)
   * @param endDate - Optional end date (ISO string)
   */
  async getProfitAnalysis(
    startDate?: string,
    endDate?: string
  ): Promise<ProfitAnalysis> {
    const params = new URLSearchParams();
    if (startDate) params.append("start", startDate);
    if (endDate) params.append("end", endDate);

    const queryString = params.toString();
    const url = queryString
      ? `/api/reports/profit-analysis?${queryString}`
      : "/api/reports/profit-analysis";

    try {
      return await apiClient.get<ProfitAnalysis>(url);
    } catch (error) {
      // Fallback: try direct fetch if apiClient format doesn't match
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}${url}`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
          "Content-Type": "application/json",
        },
      });
      const json = await response.json();
      return json.data || json;
    }
  }

  /**
   * Get stock turnover report
   * @param startDate - Optional start date (ISO string)
   * @param endDate - Optional end date (ISO string)
   */
  async getStockTurnoverReport(
    startDate?: string,
    endDate?: string
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
    const params = new URLSearchParams();
    if (startDate) params.append("start", startDate);
    if (endDate) params.append("end", endDate);

    const queryString = params.toString();
    const url = queryString
      ? `/api/reports/stock-turnover?${queryString}`
      : "/api/reports/stock-turnover";

    return apiClient.get(url);
  }
}

export const reportsService = new ReportsService();

