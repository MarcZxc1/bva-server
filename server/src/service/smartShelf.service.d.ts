import { AtRiskResponse } from "../types/smartShelf.types";
/**
 * Fetch inventory and sales data, then call ML service to detect at-risk items.
 */
export declare function getAtRiskInventory(shopId: string): Promise<AtRiskResponse>;
/**
 * Get comprehensive dashboard analytics
 * Combines database metrics with ML forecasts
 */
export declare function getDashboardAnalytics(shopId: string): Promise<{
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
}>;
//# sourceMappingURL=smartShelf.service.d.ts.map