import { AdRequest } from "../api/ads/ad.types";
import { PromotionResponse } from "../types/promotion.types";
export declare class AdService {
    generateAdCopy(request: AdRequest): Promise<string>;
    /**
     * Fallback method using legacy Gemini integration
     */
    private generateAdCopyFallback;
    /**
     * Generate AI-powered ad image using ML Service
     */
    generateAdImage(request: {
        product_name: string;
        playbook: string;
        style?: string;
    }): Promise<{
        image_url: string;
    }>;
    getPromotions(shopId: string): Promise<PromotionResponse>;
}
//# sourceMappingURL=ad.service.d.ts.map