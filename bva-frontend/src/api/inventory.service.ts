/**
 * Inventory Service API Client
 * 
 * Handles inventory-related API calls for SmartShelf feature
 */

import { apiClient } from "@/lib/api-client";

// ============================================
// Types
// ============================================

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
      thresholds_used: any;
    };
  };
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  category?: string;
}

export interface ProductsResponse {
  success: boolean;
  data: {
    products: Product[];
    total: number;
  };
}

// ============================================
// API Functions
// ============================================

/**
 * Get at-risk inventory items
 */
async function getAtRiskInventory(shopId: string): Promise<AtRiskResponse> {
  return apiClient.get<AtRiskResponse>(`/api/smart-shelf/${shopId}/at-risk`);
}

/**
 * Get all products for a shop
 */
async function getAllProducts(shopId: string): Promise<ProductsResponse> {
  return apiClient.get<ProductsResponse>(`/api/products/${shopId}`);
}

// ============================================
// Export
// ============================================

export const inventoryService = {
  getAtRiskInventory,
  getAllProducts,
};
