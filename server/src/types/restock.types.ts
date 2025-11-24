// File: src/types/restock.types.ts
/**
 * TypeScript types for AI-powered restocking strategy feature.
 * Defines request/response interfaces for communication with ML-service.
 */

/**
 * Restocking optimization goals
 */
export type RestockGoal = "profit" | "volume" | "balanced";

/**
 * Product input for ML-service restocking algorithm
 */
export interface ProductInput {
  product_id: string | number;
  name: string;
  price: number;
  cost: number;
  stock: number;
  category?: string;
  avg_daily_sales: number;
  profit_margin: number;
  min_order_qty?: number;
  max_order_qty?: number;
}

/**
 * Request payload for restocking strategy calculation
 */
export interface RestockStrategyRequest {
  shop_id: string;
  budget: number;
  goal: RestockGoal;
  products: ProductInput[];
  restock_days?: number; // Default: 14
}

/**
 * Individual product recommendation from ML-service
 */
export interface RestockItem {
  product_id: string | number;
  name: string;
  qty: number;
  unit_cost: number;
  total_cost: number;
  expected_profit: number;
  expected_revenue: number;
  days_of_stock: number;
  priority_score: number;
  reasoning?: string;
}

/**
 * Aggregate totals for restocking strategy
 */
export interface RestockTotals {
  total_items: number;
  total_qty: number;
  total_cost: number;
  budget_used_pct: number;
  expected_revenue: number;
  expected_profit: number;
  expected_roi: number;
  avg_days_of_stock: number;
}

/**
 * Complete restocking strategy response from ML-service
 */
export interface RestockStrategyResponse {
  strategy: RestockGoal;
  shop_id: string;
  budget: number;
  items: RestockItem[];
  totals: RestockTotals;
  reasoning: string[];
  warnings?: string[];
  meta: {
    products_analyzed: number;
    products_selected: number;
    restock_days: number;
  };
}

/**
 * Request DTO for Express endpoint
 */
export interface RestockRequestDTO {
  shopId: string;
  budget: number;
  goal: RestockGoal;
  restockDays?: number;
}

/**
 * Response DTO for Express endpoint (frontend-facing)
 */
export interface RestockResponseDTO {
  strategy: RestockGoal;
  shopId: string;
  budget: number;
  recommendations: {
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
  }[];
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
}
