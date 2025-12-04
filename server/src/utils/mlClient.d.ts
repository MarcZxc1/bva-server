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
import { RestockStrategyRequest, RestockStrategyResponse } from "../types/restock.types";
import { AtRiskRequest, AtRiskResponse } from "../types/smartShelf.types";
import { PromotionRequest, PromotionResponse } from "../types/promotion.types";
export declare class MLServiceClient {
    private client;
    private baseURL;
    constructor();
    post<T>(endpoint: string, data: any): Promise<T>;
    get<T>(endpoint: string): Promise<T>;
    /**
     * MarketMate: Generate complete AI-powered ad (copy + image)
     * Endpoint: POST /api/v1/ads/generate
     */
    generateCompleteAd(request: {
        product_name: string;
        playbook: string;
        discount?: string | undefined;
    }): Promise<{
        ad_copy: string;
        hashtags: string[];
        image_url: string;
    }>;
    /**
     * MarketMate: Generate AI-powered ad copy only
     * Endpoint: POST /api/v1/ads/generate-copy
     */
    generateAdCopy(request: {
        product_name: string;
        playbook: string;
        discount?: string | undefined;
    }): Promise<{
        ad_copy: string;
        hashtags: string[];
    }>;
    /**
     * MarketMate: Generate AI-powered ad image
     * Endpoint: POST /api/v1/ads/generate-image
     */
    generateAdImage(request: {
        product_name: string;
        playbook: string;
        style?: string | undefined;
    }): Promise<{
        image_url: string;
    }>;
    /**
     * Smart Restock Planner: Calculate optimal restocking strategy
     * Endpoint: POST /api/v1/restock/strategy
     */
    calculateRestockStrategy(request: RestockStrategyRequest): Promise<RestockStrategyResponse>;
    /**
     * SmartShelf: Detect at-risk inventory
     * Endpoint: POST /api/v1/smart-shelf/at-risk
     */
    detectAtRiskInventory(request: AtRiskRequest): Promise<AtRiskResponse>;
    /**
     * SmartShelf: Generate promotions for near-expiry items
     * Endpoint: POST /api/v1/smart-shelf/promotions
     */
    generatePromotions(request: PromotionRequest): Promise<PromotionResponse>;
    /**
     * SmartShelf: Get sales forecast and analytics for dashboard
     * Endpoint: POST /api/v1/smart-shelf/forecast
     */
    getDashboardForecast(request: {
        shop_id: string;
        product_list: string[];
        sales: any[];
        periods: number;
    }): Promise<any>;
    /**
     * SmartShelf: Get sales insights for analytics
     * Endpoint: POST /api/v1/smart-shelf/insights
     */
    getSalesInsights(request: {
        shop_id: string;
        sales: any[];
        range: {
            start: string;
            end: string;
        };
        granularity?: string;
    }): Promise<any>;
    /**
     * Check if ML Service is healthy and reachable
     */
    healthCheck(): Promise<boolean>;
    /**
     * Get ML Service status and version info
     */
    getServiceInfo(): Promise<{
        status: string;
        version?: string;
        uptime?: number;
    }>;
    private handleError;
}
export declare const mlClient: MLServiceClient;
//# sourceMappingURL=mlClient.d.ts.map