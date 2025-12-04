/**
 * Ad Controller - MarketMate Feature
 *
 * Handles AI-powered ad generation requests.
 * Acts as API Gateway - forwards requests to ML Service.
 */
import { Request, Response } from "express";
export declare class AdController {
    /**
     * POST /api/v1/ads/generate-ad
     * Generate AI-powered ad copy using Gemini
     */
    generatedAd(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/v1/ads/generate-ad-image
     * Generate AI-powered ad image
     */
    generateAdImage(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/v1/ads/:shopId/promotions
     * Get smart promotion suggestions for near-expiry items
     */
    getPromotions(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=ad.controller.d.ts.map