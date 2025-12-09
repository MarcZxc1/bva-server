import { apiClient } from "@/lib/api-client";

export interface RestockStrategyRequest {
  shopId: string;
  budget: number;
  goal: "profit" | "volume" | "balanced";
  restockDays?: number;
  weatherCondition?: "sunny" | "rainy" | "storm" | null;
  isPayday?: boolean;
  upcomingHoliday?: string | null;
}

export interface RestockRecommendation {
  product_id: string;
  product_name: string;
  current_stock: number;
  recommended_qty: number;
  cost: number;
  expected_revenue: number;
  priority: number;
  reason: string;
}

export interface RestockStrategyResponse {
  strategy: string;
  shopId: string;
  budget: number;
  recommendations: RestockRecommendation[];
  summary: {
    total_cost: number;
    total_items: number;
    projected_revenue: number;
    roi: number;
  };
  insights: string[];
  warnings: string[];
  salesForecast?: Array<{
    date: string;
    revenue: number;
    quantity: number;
  }>;
}

export const restockService = {
  getRestockPlan: async (data: RestockStrategyRequest): Promise<RestockStrategyResponse> => {
    return apiClient.post<RestockStrategyResponse>("/api/ai/restock-strategy", data);
  },
};
