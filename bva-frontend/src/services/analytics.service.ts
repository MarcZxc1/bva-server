import { apiClient } from "@/lib/api-client";

export interface DashboardMetrics {
  totalRevenue: number;
  totalProfit: number;
  profitMargin: number;
  totalItems: number;
  totalProducts: number;
  totalSales: number;
}

export interface ForecastData {
  forecasts: Array<{
    product_id: string;
    predictions: Array<{
      date: string;
      predicted_qty: number;
      lower_ci?: number;
      upper_ci?: number;
    }>;
  }>;
}

export interface DashboardResponse {
  metrics: DashboardMetrics;
  forecast: ForecastData | null;
  period: {
    start: string;
    end: string;
    days: number;
  };
}

export interface AtRiskItem {
  product_id: string;
  sku: string;
  name: string;
  reasons: string[];
  score: number;
  current_quantity: number;
  days_to_expiry?: number;
  avg_daily_sales?: number;
  recommended_action: {
    action_type: string;
    reasoning: string;
    restock_qty?: number;
    discount_range?: number[];
  };
}

export interface AtRiskResponse {
  at_risk: AtRiskItem[];
  meta: any;
}

export const analyticsService = {
  getDashboardStats: async (shopId: string): Promise<DashboardResponse> => {
    return apiClient.get<DashboardResponse>(`/api/smart-shelf/${shopId}/dashboard`);
  },

  getAtRiskInventory: async (shopId: string): Promise<AtRiskResponse> => {
    return apiClient.get<AtRiskResponse>(`/api/smart-shelf/${shopId}/at-risk`);
  },
};
