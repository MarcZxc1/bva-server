/**
 * ML Service Client
 * 
 * Centralized client for communicating with the Python ML Service.
 * Implements the API Gateway pattern - all ML operations go through this client.
 * 
 * Features:
 * - Ads Generation (MarketMate)
 * - Restock Optimization (Smart Restock Planner)
 * - Analytics & Forecasting (SmartShelf)
 */

import axios, { AxiosInstance } from "axios";
import {
  RestockStrategyRequest,
  RestockStrategyResponse,
} from "../types/restock.types";
import {
  AtRiskRequest,
  AtRiskResponse,
} from "../types/smartShelf.types";
import {
  PromotionRequest,
  PromotionResponse,
} from "../types/promotion.types";

export class MLServiceClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.ML_SERVICE_URL || "http://localhost:8001";
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 60000, // 60 seconds for ML operations
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  // ============================================
  // Generic HTTP Methods
  // ============================================

  async post<T>(endpoint: string, data: any): Promise<T> {
    try {
      const response = await this.client.post<T>(endpoint, data);
      return response.data;
    } catch (error: any) {
      this.handleError(error);
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    try {
      const response = await this.client.get<T>(endpoint);
      return response.data;
    } catch (error: any) {
      this.handleError(error);
    }
  }

  // ============================================
  // Feature-Specific Methods
  // ============================================

  /**
   * MarketMate: Generate complete AI-powered ad (copy + image)
   * Endpoint: POST /api/v1/ads/generate
   */
  async generateCompleteAd(request: {
    product_name: string;
    playbook: string;
    discount?: string | undefined;
  }): Promise<{ ad_copy: string; hashtags: string[]; image_url: string }> {
    return this.post("/api/v1/ads/generate", request);
  }

  /**
   * MarketMate: Generate AI-powered ad copy only
   * Endpoint: POST /api/v1/ads/generate-copy
   */
  async generateAdCopy(request: {
    product_name: string;
    playbook: string;
    discount?: string | undefined;
  }): Promise<{ ad_copy: string; hashtags: string[] }> {
    return this.post("/api/v1/ads/generate-copy", request);
  }

  /**
   * MarketMate: Generate AI-powered ad image
   * Endpoint: POST /api/v1/ads/generate-image
   * Uses product image as context if provided
   */
  async generateAdImage(request: {
    product_name: string;
    playbook: string;
    style?: string | undefined;
    product_image_url?: string | undefined; // Optional: Product image URL to use as context
  }): Promise<{ image_url: string }> {
    return this.post("/api/v1/ads/generate-image", request);
  }

  /**
   * Smart Restock Planner: Calculate optimal restocking strategy
   * Endpoint: POST /api/v1/restock/strategy
   */
  async calculateRestockStrategy(
    request: RestockStrategyRequest
  ): Promise<RestockStrategyResponse> {
    return this.post<RestockStrategyResponse>(
      "/api/v1/restock/strategy",
      request
    );
  }

  /**
   * SmartShelf: Detect at-risk inventory
   * Endpoint: POST /api/v1/smart-shelf/at-risk
   */
  async detectAtRiskInventory(
    request: AtRiskRequest
  ): Promise<AtRiskResponse> {
    return this.post<AtRiskResponse>("/api/v1/smart-shelf/at-risk", request);
  }

  /**
   * SmartShelf: Generate promotions for near-expiry items
   * Endpoint: POST /api/v1/smart-shelf/promotions
   */
  async generatePromotions(
    request: PromotionRequest
  ): Promise<PromotionResponse> {
    return this.post<PromotionResponse>(
      "/api/v1/smart-shelf/promotions",
      request
    );
  }

  /**
   * SmartShelf: Get sales forecast and analytics for dashboard
   * Endpoint: POST /api/v1/smart-shelf/forecast
   */
  async getDashboardForecast(request: {
    shop_id: string;
    product_list: string[];
    sales: any[];
    periods: number;
  }): Promise<any> {
    return this.post("/api/v1/smart-shelf/forecast", request);
  }

  /**
   * SmartShelf: Get sales insights for analytics
   * Endpoint: POST /api/v1/smart-shelf/insights
   */
  async getSalesInsights(request: {
    shop_id: string;
    sales: any[];
    range: { start: string; end: string };
    granularity?: string;
  }): Promise<any> {
    return this.post("/api/v1/smart-shelf/insights", request);
  }

  // ============================================
  // Health & Utilities
  // ============================================

  /**
   * Check if ML Service is healthy and reachable
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get("/health");
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get ML Service status and version info
   */
  async getServiceInfo(): Promise<{
    status: string;
    version?: string;
    uptime?: number;
  }> {
    try {
      const response = await this.client.get("/health");
      return response.data;
    } catch {
      return { status: "unavailable" };
    }
  }

  // ============================================
  // Error Handling
  // ============================================

  private handleError(error: any): never {
    if (error.response) {
      // ML-service returned an error response
      const data = error.response.data;
      let detail: string = 'Unknown error';
      
      try {
        if (typeof data?.detail === 'string') {
          detail = data.detail;
        } else if (data?.detail && typeof data.detail === 'object') {
          detail = JSON.stringify(data.detail);
        } else if (typeof data?.message === 'string') {
          detail = data.message;
        } else if (data?.error && typeof data.error === 'string') {
          detail = data.error;
        } else if (typeof error.message === 'string' && error.message) {
          detail = `ML Service error: ${error.message}`;
        } else if (data && typeof data === 'string') {
          detail = data;
        } else if (data && typeof data === 'object') {
          detail = JSON.stringify(data);
        }
      } catch (parseError) {
        // If JSON.stringify fails, use a fallback
        detail = `ML Service error (${error.response.status}): Unable to parse error response`;
      }
      
      const status = error.response.status;
      
      if (status === 503) {
        throw new Error(
          "AI Service Unavailable: The ML service is temporarily unavailable. Please try again later."
        );
      }
      
      // Ensure detail is never empty
      if (!detail || detail.trim() === '') {
        detail = `ML Service error (${status}): Unknown error occurred`;
      }
      
      throw new Error(detail);
    } else if (error.request) {
      // No response received - service is down
      throw new Error(
        `AI Service Unavailable: Cannot reach ML service at ${this.baseURL}. Please ensure the service is running.`
      );
    } else {
      // Request setup error
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      throw new Error(`Request failed: ${errorMessage}`);
    }
  }
}

// Singleton instance
export const mlClient = new MLServiceClient();
