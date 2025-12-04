export interface InventoryItem {
    product_id: string;
    sku: string;
    name: string;
    quantity: number;
    expiry_date?: string | undefined;
    price?: number | undefined;
    categories?: string[] | undefined;
}
export interface SalesRecord {
    product_id: string;
    date: string;
    qty: number;
    revenue?: number;
}
export interface AtRiskThresholds {
    low_stock?: number;
    expiry_days?: number;
    slow_moving_window?: number;
    slow_moving_threshold?: number;
}
export interface AtRiskRequest {
    shop_id: string;
    inventory: InventoryItem[];
    sales: SalesRecord[];
    thresholds?: AtRiskThresholds;
}
export declare enum RiskReason {
    LOW_STOCK = "low_stock",
    NEAR_EXPIRY = "near_expiry",
    SLOW_MOVING = "slow_moving"
}
export interface RecommendedAction {
    action_type: string;
    restock_qty?: number;
    discount_range?: number[];
    promotion_timing?: string;
    reasoning: string;
}
export interface AtRiskItem {
    product_id: string;
    sku: string;
    name: string;
    reasons: RiskReason[];
    score: number;
    current_quantity: number;
    days_to_expiry?: number;
    avg_daily_sales?: number;
    recommended_action: RecommendedAction;
}
export interface AtRiskResponse {
    at_risk: AtRiskItem[];
    meta: {
        shop_id: string;
        total_products: number;
        flagged_count: number;
        analysis_date: string;
        thresholds_used: any;
    };
}
//# sourceMappingURL=smartShelf.types.d.ts.map