"use strict";
/**
 * Ad Controller - MarketMate Feature
 *
 * Handles AI-powered ad generation requests.
 * Acts as API Gateway - forwards requests to ML Service.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdController = void 0;
const ad_service_1 = require("../service/ad.service");
const adService = new ad_service_1.AdService();
class AdController {
    /**
     * POST /api/v1/ads/generate-ad
     * Generate AI-powered ad copy using Gemini
     */
    async generatedAd(req, res) {
        try {
            const requestData = req.body;
            // Validate required fields
            if (!requestData.product_name || !requestData.playbook) {
                res.status(400).json({
                    success: false,
                    error: "Missing required fields: product_name and playbook"
                });
                return;
            }
            // Generate ad copy via service
            const adCopy = await adService.generateAdCopy(requestData);
            const response = {
                playbookUsed: requestData.playbook,
                product_name: requestData.product_name,
                generated_ad_copy: adCopy,
            };
            res.status(200).json({
                success: true,
                data: response,
            });
        }
        catch (error) {
            console.error("Error in AdController.generatedAd:", error);
            // Check if it's an ML service error
            if (error.message?.includes("AI Service Unavailable")) {
                res.status(503).json({
                    success: false,
                    error: "AI Service Unavailable",
                    message: "The AI service is currently unavailable. Please try again later."
                });
                return;
            }
            res.status(500).json({
                success: false,
                error: error.message || "Failed to generate ad"
            });
        }
    }
    /**
     * POST /api/v1/ads/generate-ad-image
     * Generate AI-powered ad image
     */
    async generateAdImage(req, res) {
        try {
            const { product_name, playbook, style } = req.body;
            if (!product_name || !playbook) {
                res.status(400).json({
                    success: false,
                    error: "Missing required fields: product_name and playbook"
                });
                return;
            }
            // Generate image via service (forwarded to ML service)
            const result = await adService.generateAdImage({
                product_name,
                playbook,
                style
            });
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            console.error("Error in AdController.generateAdImage:", error);
            if (error.message?.includes("AI Service Unavailable")) {
                res.status(503).json({
                    success: false,
                    error: "AI Service Unavailable",
                    message: "The AI service is currently unavailable. Please try again later."
                });
                return;
            }
            res.status(500).json({
                success: false,
                error: error.message || "Failed to generate image"
            });
        }
    }
    /**
     * GET /api/v1/ads/:shopId/promotions
     * Get smart promotion suggestions for near-expiry items
     */
    async getPromotions(req, res) {
        try {
            const { shopId } = req.params;
            if (!shopId) {
                res.status(400).json({
                    success: false,
                    error: "Shop ID is required"
                });
                return;
            }
            const promotions = await adService.getPromotions(shopId);
            res.status(200).json({
                success: true,
                data: promotions,
            });
        }
        catch (error) {
            console.error("Error in AdController.getPromotions:", error);
            if (error.message?.includes("AI Service Unavailable")) {
                res.status(503).json({
                    success: false,
                    error: "AI Service Unavailable",
                    message: "The AI service is currently unavailable. Please try again later."
                });
                return;
            }
            res.status(500).json({
                success: false,
                error: error.message || "Failed to get promotions"
            });
        }
    }
}
exports.AdController = AdController;
//# sourceMappingURL=ad.controller.js.map