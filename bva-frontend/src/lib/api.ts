import { apiClient } from "./api-client";

// Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    id: string;
    email: string;
    name?: string;
    shops?: Array<{ id: string; name: string }>;
  };
  token: string;
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

// Auth API
export const authApi = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>("/api/users/login", credentials);
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>("/api/users/register", data);
  },

  // Get current user info (for OAuth or token refresh)
  getCurrentUser: async (): Promise<AuthResponse> => {
    return apiClient.get<AuthResponse>("/api/auth/me");
  },
};

// Restock API
export const restockApi = {
  getRestockStrategy: async (request: RestockRequest): Promise<RestockResponse> => {
    return apiClient.post<RestockResponse>("/api/ai/restock-strategy", request);
  },

  checkHealth: async () => {
    return apiClient.get("/api/ai/restock-strategy/health");
  },
};

// Smart Shelf API
export const smartShelfApi = {
  getAtRiskInventory: async (shopId: string): Promise<AtRiskResponse> => {
    return apiClient.get<AtRiskResponse>(`/api/smart-shelf/${shopId}/at-risk`);
  },

  getDashboardAnalytics: async (shopId: string): Promise<any> => {
    return apiClient.get(`/api/smart-shelf/${shopId}/dashboard`);
  },
};

// Health check
export const healthApi = {
  check: async () => {
    return apiClient.get("/health");
  },
};

// User API
export const userApi = {
  updateProfile: async (data: { firstName: string; lastName: string; email: string }) => {
    return apiClient.put("/api/users/profile", data);
  },
  updatePassword: async (data: { currentPassword: string; newPassword: string }) => {
    return apiClient.put("/api/users/password", data);
  },
};

export interface NotificationResponse {
  success: boolean;
  data: Array<{
    id: string;
    title: string;
    message: string;
    type: "info" | "warning" | "success";
    isRead: boolean;
    createdAt: string;
  }>;
}

// Notification API
export const notificationApi = {
  getAll: async (): Promise<NotificationResponse> => {
    return apiClient.get<NotificationResponse>("/api/v1/notifications");
  },
  markAsRead: async (id: string) => {
    return apiClient.patch(`/api/v1/notifications/${id}/read`);
  },
  markAllAsRead: async () => {
    return apiClient.patch("/api/v1/notifications/read-all");
  },
};

export interface DashboardMetrics {
  totalRevenue: number;
  profitMargin: number;
  stockTurnover: number;
  currency: string;
}

export interface SalesSummaryItem {
  name: string;
  total: number;
}

export const reportsApi = {
  getMetrics: async (): Promise<DashboardMetrics> => {
    return apiClient.get<DashboardMetrics>("/api/reports/metrics");
  },
  getSalesSummary: async (): Promise<SalesSummaryItem[]> => {
    return apiClient.get<SalesSummaryItem[]>("/api/reports/sales-summary");
  },
};

