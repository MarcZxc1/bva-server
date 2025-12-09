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

export interface PromotionRequest {
  product_id: string;
  name: string;
  expiry_date?: string | null;
  quantity: number;
  price: number;
  categories?: string[];
  days_to_expiry?: number;
}

export interface GeneratedPromotion {
  event_id: string;
  event_title: string;
  product_id: string;
  product_name: string;
  suggested_discount_pct: number;
  promo_copy: string;
  start_date: string;
  end_date: string;
  expected_clear_days: number;
  projected_sales_lift: number;
  confidence: string;
  reasoning: string;
}

export interface PromotionResponse {
  promotions: GeneratedPromotion[];
  meta: {
    shop_id: string;
    total_items: number;
    total_events: number;
    promotions_generated: number;
    analysis_date: string;
  };
}

export const analyticsService = {
  getDashboardStats: async (shopId: string): Promise<DashboardResponse> => {
    const response = await apiClient.get<DashboardResponse>(`/api/smart-shelf/${shopId}/dashboard`);
    console.log("📊 Raw dashboard response from API:", {
      hasResponse: !!response,
      hasForecast: !!response?.forecast,
      forecastType: typeof response?.forecast,
      forecastValue: response?.forecast,
      forecastKeys: response?.forecast ? Object.keys(response.forecast) : [],
      forecastsArray: response?.forecast?.forecasts,
      forecastsLength: response?.forecast?.forecasts?.length || 0
    });
    return response;
  },

  getAtRiskInventory: async (shopId: string): Promise<AtRiskResponse> => {
    return apiClient.get<AtRiskResponse>(`/api/smart-shelf/${shopId}/at-risk`);
  },

  generatePromotionsForItem: async (shopId: string, item: PromotionRequest): Promise<PromotionResponse> => {
    console.log("📡 Calling promotion generation API:", {
      url: `/api/smart-shelf/${shopId}/generate-promotions`,
      item: {
        product_id: item.product_id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        days_to_expiry: item.days_to_expiry
      }
    });
    
    try {
      const response = await apiClient.post<PromotionResponse>(`/api/smart-shelf/${shopId}/generate-promotions`, item);
      console.log("📡 Promotion API response received:", {
        hasResponse: !!response,
        promotionsCount: response?.promotions?.length || 0
      });
      return response;
    } catch (error: any) {
      console.error("📡 Promotion API error:", {
        error,
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status
      });
      throw error;
    }
  },
};
