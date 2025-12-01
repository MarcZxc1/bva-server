import { apiClient } from "@/lib/api-client";

export interface PlatformStatus {
  shopee: boolean;
  lazada: boolean;
  tiktok: boolean;
}

export interface SyncResponse {
  success: boolean;
  message: string;
}

export interface RestockRequest {
  shopId: string;
  budget: number;
  goal: "profit" | "volume" | "balanced";
  restockDays?: number;
}

export interface RestockResponse {
  success: boolean;
  data: {
    strategy: string;
    shopId: string;
    budget: number;
    recommendations: Array<{
      productId: string | number;
      productName: string;
      currentStock: number;
      recommendedQty: number;
      unitCost: number;
      totalCost: number;
      expectedProfit: number;
      expectedRevenue: number;
      daysOfStock: number;
      priorityScore: number;
      reasoning: string;
    }>;
    summary: {
      totalProducts: number;
      totalQuantity: number;
      totalCost: number;
      budgetUtilization: number;
      expectedRevenue: number;
      expectedProfit: number;
      expectedROI: number;
      avgDaysOfStock: number;
    };
    insights: string[];
    warnings: string[];
  };
}

export interface AtRiskResponse {
  success: boolean;
  data: {
    at_risk: Array<{
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
        restock_qty?: number;
        discount_range?: number[];
        promotion_timing?: string;
        reasoning: string;
      };
    }>;
    meta: {
      shop_id: string;
      total_products: number;
      flagged_count: number;
      analysis_date: string;
      thresholds_used: Record<string, unknown>;
    };
  };
}

export const inventoryService = {
  getPlatformStatus: async (): Promise<PlatformStatus> => {
    // Mocking this for now as I don't see a specific endpoint in the provided server files
    // In a real scenario: return apiClient.get<PlatformStatus>("/api/platforms/status");
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          shopee: true,
          lazada: false,
          tiktok: true,
        });
      }, 1000);
    });
  },

  syncPlatforms: async (): Promise<SyncResponse> => {
    // return apiClient.post<SyncResponse>("/api/inventory/sync");
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, message: "Sync completed successfully" });
      }, 2000);
    });
  },

  getRestockSuggestions: async (
    data: RestockRequest
  ): Promise<RestockResponse> => {
    return apiClient.post<RestockResponse>("/api/restock/plan", data);
  },

  getAtRiskInventory: async (shopId: string): Promise<AtRiskResponse> => {
    return apiClient.get<AtRiskResponse>(`/api/smart-shelf/${shopId}/at-risk`);
  },
};
