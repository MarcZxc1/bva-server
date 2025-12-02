/**
 * Inventory Service
 * 
 * Handles inventory and product-related API calls
 */

import { apiClient } from "@/lib/api-client";

// Types
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
    restock_qty?: number;
    discount_range?: number[];
    promotion_timing?: string;
    reasoning: string;
  };
}

export interface AtRiskResponse {
  success: boolean;
  data: {
    at_risk: AtRiskItem[];
    meta: {
      shop_id: string;
      total_products: number;
      flagged_count: number;
      analysis_date: string;
      thresholds_used: Record<string, unknown>;
    };
  };
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  cost: number;
  quantity: number;
  category?: string;
}

export interface ProductsResponse {
  success: boolean;
  data: {
    products: Product[];
    total: number;
  };
}

// Inventory Service
class InventoryService {
  /**
   * Get at-risk inventory items
   */
  async getAtRiskInventory(shopId: string): Promise<AtRiskResponse> {
    return apiClient.get<AtRiskResponse>(`/api/smart-shelf/${shopId}/at-risk`);
  }

  /**
   * Get all products for a shop
   */
  async getAllProducts(shopId: string): Promise<ProductsResponse> {
    return apiClient.get<ProductsResponse>(`/api/products?shopId=${shopId}`);
  }
}

export const inventoryService = new InventoryService();
