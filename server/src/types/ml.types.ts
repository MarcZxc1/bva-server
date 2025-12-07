export interface MLProductInput {
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

export interface MLRestockRequest {
  shop_id: string;
  budget: number;
  goal: 'profit' | 'volume' | 'balanced';
  products: MLProductInput[];
  restock_days: number;
}

export interface MLRestockItem {
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

export interface MLRestockTotals {
  total_items: number;
  total_qty: number;
  total_cost: number;
  budget_used_pct: number;
  expected_revenue: number;
  expected_profit: number;
  expected_roi: number;
  avg_days_of_stock: number;
}

export interface MLRestockResponse {
  strategy: 'profit' | 'volume' | 'balanced';
  shop_id: string;
  budget: number;
  items: MLRestockItem[];
  totals: MLRestockTotals;
  reasoning: string[];
  warnings?: string[];
  meta?: Record<string, any>;
}

export interface MLSmartShelfDashboardResponse {
  forecast_chart: Array<{
    date: string;
    predicted_sales: number;
    confidence_interval: [number, number];
  }>;
  at_risk_items: Array<{
    product_id: string;
    risk_score: number;
    risk_factors: string[];
    days_until_stockout: number;
  }>;
  insights: string[];
}

export interface MLInventoryItem {
  product_id: string;
  sku: string;
  name: string;
  quantity: number;
  expiry_date?: string; // ISO date string for products with expiration dates
  price: number;
  categories: string[];
}

export interface MLSalesRecord {
  product_id: string;
  date: string;
  qty: number;
  revenue: number;
}

export interface MLAtRiskRequest {
  shop_id: string;
  inventory: MLInventoryItem[];
  sales: MLSalesRecord[];
  thresholds?: {
    low_stock?: number;
    expiry_days?: number;
    slow_moving_window?: number;
  };
}

export interface MLAtRiskItem {
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

export interface MLAtRiskResponse {
  at_risk: MLAtRiskItem[];
  meta: any;
}

export interface MLInsightsRequest {
  shop_id: string;
  sales: MLSalesRecord[];
  range: {
    start: string;
    end: string;
  };
  granularity?: string;
  top_k?: number;
}

export interface MLInsightsResponse {
  series: Array<{
    date: string;
    sales: number;
    revenue: number;
  }>;
  top_items: Array<{
    product_id: string;
    total_sales: number;
    total_revenue: number;
  }>;
  recommendations: string[];
  meta: any;
}

