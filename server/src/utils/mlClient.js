"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mlClient = exports.MLServiceClient = void 0;
const axios_1 = __importDefault(require("axios"));
class MLServiceClient {
    client;
    baseURL;
    constructor() {
        this.baseURL = process.env.ML_SERVICE_URL || "http://localhost:8001";
        this.client = axios_1.default.create({
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
    async post(endpoint, data) {
        try {
            const response = await this.client.post(endpoint, data);
            return response.data;
        }
        catch (error) {
            this.handleError(error);
        }
    }
    async get(endpoint) {
        try {
            const response = await this.client.get(endpoint);
            return response.data;
        }
        catch (error) {
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
    async generateCompleteAd(request) {
        return this.post("/api/v1/ads/generate", request);
    }
    /**
     * MarketMate: Generate AI-powered ad copy only
     * Endpoint: POST /api/v1/ads/generate-copy
     */
    async generateAdCopy(request) {
        return this.post("/api/v1/ads/generate-copy", request);
    }
    /**
     * MarketMate: Generate AI-powered ad image
     * Endpoint: POST /api/v1/ads/generate-image
     */
    async generateAdImage(request) {
        return this.post("/api/v1/ads/generate-image", request);
    }
    /**
     * Smart Restock Planner: Calculate optimal restocking strategy
     * Endpoint: POST /api/v1/restock/strategy
     */
    async calculateRestockStrategy(request) {
        return this.post("/api/v1/restock/strategy", request);
    }
    /**
     * SmartShelf: Detect at-risk inventory
     * Endpoint: POST /api/v1/smart-shelf/at-risk
     */
    async detectAtRiskInventory(request) {
        return this.post("/api/v1/smart-shelf/at-risk", request);
    }
    /**
     * SmartShelf: Generate promotions for near-expiry items
     * Endpoint: POST /api/v1/smart-shelf/promotions
     */
    async generatePromotions(request) {
        return this.post("/api/v1/smart-shelf/promotions", request);
    }
    /**
     * SmartShelf: Get sales forecast and analytics for dashboard
     * Endpoint: POST /api/v1/smart-shelf/forecast
     */
    async getDashboardForecast(request) {
        return this.post("/api/v1/smart-shelf/forecast", request);
    }
    /**
     * SmartShelf: Get sales insights for analytics
     * Endpoint: POST /api/v1/smart-shelf/insights
     */
    async getSalesInsights(request) {
        return this.post("/api/v1/smart-shelf/insights", request);
    }
    // ============================================
    // Health & Utilities
    // ============================================
    /**
     * Check if ML Service is healthy and reachable
     */
    async healthCheck() {
        try {
            await this.client.get("/health");
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Get ML Service status and version info
     */
    async getServiceInfo() {
        try {
            const response = await this.client.get("/health");
            return response.data;
        }
        catch {
            return { status: "unavailable" };
        }
    }
    // ============================================
    // Error Handling
    // ============================================
    handleError(error) {
        if (error.response) {
            // ML-service returned an error response
            const detail = error.response.data?.detail || error.response.data?.message;
            const status = error.response.status;
            if (status === 503) {
                throw new Error("AI Service Unavailable: The ML service is temporarily unavailable. Please try again later.");
            }
            throw new Error(detail || `ML Service error (${status}): ${error.message}`);
        }
        else if (error.request) {
            // No response received - service is down
            throw new Error(`AI Service Unavailable: Cannot reach ML service at ${this.baseURL}. Please ensure the service is running.`);
        }
        else {
            // Request setup error
            throw new Error(`Request failed: ${error.message}`);
        }
    }
}
exports.MLServiceClient = MLServiceClient;
// Singleton instance
exports.mlClient = new MLServiceClient();
//# sourceMappingURL=mlClient.js.map