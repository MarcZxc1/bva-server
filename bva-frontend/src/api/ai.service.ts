/**
 * AI Service API Client
 * 
 * Centralized API client for all AI-powered features:
 * - MarketMate (Ad Generation)
 * - SmartShelf (Analytics & Forecasting)
 * - Restock Planner
 */

import { apiClient } from "@/lib/api-client";

// ============================================
// Dashboard Analytics
// ============================================

export interface DashboardAnalytics {
  totalSales: number;
  totalOrders: number;
  activeProducts: number;
  stockAlerts: number;
  salesTrend: Array<{
    month: string;
    shopee: number;
    lazada: number;
    tiktok: number;
  }>;
  topProducts: Array<{
    name: string;
    sales: number;
    platform: string;
    trend: "up" | "down";
  }>;
  forecast?: {
    nextMonth: number;
    confidence: number;
  };
}

/**
 * Get dashboard analytics with AI insights
 */
async function getDashboardAnalytics(shopId: string): Promise<DashboardAnalytics> {
  // For MVP, we'll aggregate from existing data
  // In production, this would call the ML service for forecasts
  
  try {
    // This is a placeholder - you would call your actual endpoint
    const response = await apiClient.get<DashboardAnalytics>(
      `/api/analytics/dashboard/${shopId}`
    );
    return response;
  } catch (error) {
    // Fallback to mock data for MVP
    console.warn("Analytics endpoint not ready, using fallback data");
    return {
      totalSales: 2345678,
      totalOrders: 4892,
      activeProducts: 347,
      stockAlerts: 23,
      salesTrend: [
        { month: "Jan", shopee: 4500, lazada: 3200, tiktok: 2100 },
        { month: "Feb", shopee: 5200, lazada: 3800, tiktok: 2800 },
        { month: "Mar", shopee: 4800, lazada: 4100, tiktok: 3200 },
        { month: "Apr", shopee: 6100, lazada: 4500, tiktok: 3800 },
        { month: "May", shopee: 7200, lazada: 5200, tiktok: 4500 },
        { month: "Jun", shopee: 8100, lazada: 5800, tiktok: 5200 },
      ],
      topProducts: [
        { name: "Wireless Earbuds Pro", sales: 1234, platform: "Shopee", trend: "up" },
        { name: "Smart Watch Series 5", sales: 987, platform: "Lazada", trend: "up" },
        { name: "USB-C Cable 3-Pack", sales: 856, platform: "TikTok", trend: "down" },
      ],
      forecast: {
        nextMonth: 8500,
        confidence: 0.85,
      },
    };
  }
}

// ============================================
// Sales Forecast
// ============================================

export interface ForecastRequest {
  shop_id: string;
  product_ids: string[];
  forecast_days: number;
}

export interface ForecastResponse {
  predictions: Array<{
    product_id: string;
    date: string;
    predicted_sales: number;
    confidence_lower: number;
    confidence_upper: number;
  }>;
  insights: string[];
}

/**
 * Get sales forecast from ML service
 */
async function getSalesForecast(request: ForecastRequest): Promise<ForecastResponse> {
  return apiClient.post<ForecastResponse>(
    "/api/v1/smart-shelf/forecast",
    request
  );
}

// ============================================
// Export
// ============================================

export const aiService = {
  getDashboardAnalytics,
  getSalesForecast,
};
