/**
 * AI Service API Client
 * 
 * Handles all AI-powered feature API calls:
 * - MarketMate (Ad Generation)
 * - Smart Restock Planner
 * - SmartShelf Analytics
 * 
 * All requests go through the Node.js API Gateway (never direct to Python service)
 */

import { apiClient } from "./api-client";

// ============================================
// MarketMate Types
// ============================================

export interface GenerateAdRequest {
  product_name: string;
  playbook: "Flash Sale" | "New Arrival" | "Best Seller" | "Bundle";
  discount?: string;
}

export interface GenerateAdResponse {
  success: boolean;
  data: {
    ad_copy: string;
    hashtags: string[];
    image_url: string;
  };
}

export interface GenerateAdCopyRequest {
  product_name: string;
  playbook: string;
  discount?: string;
}

export interface GenerateAdCopyResponse {
  success: boolean;
  data: {
    ad_copy: string;
    hashtags: string[];
  };
}

// ============================================
// Restock Planner Types
// ============================================

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

// ============================================
// Dashboard Analytics Types
// ============================================

export interface DashboardAnalyticsResponse {
  success: boolean;
  data: {
    metrics: {
      totalRevenue: number;
      totalProfit: number;
      profitMargin: number;
      totalItems: number;
      totalProducts: number;
      totalSales: number;
    };
    forecast: any;
    period: {
      start: string;
      end: string;
      days: number;
    };
  };
}

// ============================================
// AI Service Class
// ============================================

class AIService {
  /**
   * MarketMate: Generate complete ad (copy + image)
   */
  async generateCompleteAd(request: GenerateAdRequest): Promise<GenerateAdResponse> {
    return apiClient.post<GenerateAdResponse>("/api/v1/ads/generate-ad", request);
  }

  /**
   * MarketMate: Generate ad copy only (faster)
   */
  async generateAdCopy(request: GenerateAdCopyRequest): Promise<GenerateAdCopyResponse> {
    return apiClient.post<GenerateAdCopyResponse>("/api/v1/ads/generate-ad", request);
  }

  /**
   * Smart Restock Planner: Calculate optimal restocking strategy
   */
  async getRestockStrategy(request: RestockRequest): Promise<RestockResponse> {
    return apiClient.post<RestockResponse>("/api/ai/restock-strategy", request);
  }

  /**
   * Smart Restock Planner: Check ML service health
   */
  async checkHealth(): Promise<{ mlService: { status: string; url: string } }> {
    return apiClient.get("/api/ai/restock-strategy/health");
  }

  /**
   * SmartShelf: Get dashboard analytics
   */
  async getDashboardAnalytics(shopId: string): Promise<DashboardAnalyticsResponse> {
    return apiClient.get<DashboardAnalyticsResponse>(`/api/smart-shelf/${shopId}/dashboard`);
  }

  /**
   * SmartShelf: Get at-risk inventory items
   */
  async getAtRiskInventory(shopId: string) {
    return apiClient.get(`/api/smart-shelf/${shopId}/at-risk`);
  }
}

export const aiService = new AIService();
