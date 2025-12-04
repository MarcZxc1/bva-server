"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdService = void 0;
const generative_ai_1 = require("@google/generative-ai");
const mlClient_1 = require("../utils/mlClient");
const prisma_1 = __importDefault(require("../lib/prisma"));
// Don't load dotenv here - it's already loaded in server.ts
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const textModel = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp", // Use text model, not image model
});
class AdService {
    async generateAdCopy(request) {
        const { product_name, playbook, discount } = request;
        try {
            // Call ML Service for complete ad generation
            const result = await mlClient_1.mlClient.generateCompleteAd({
                product_name,
                playbook,
                discount,
            });
            // Return just the ad copy text
            return result.ad_copy;
        }
        catch (error) {
            console.error("Error generating ad via ML service:", error);
            // Fallback to legacy Gemini if ML service fails
            return this.generateAdCopyFallback(request);
        }
    }
    /**
     * Fallback method using legacy Gemini integration
     */
    async generateAdCopyFallback(request) {
        const { product_name, playbook, discount } = request;
        console.log(`Generating ad for: ${product_name}, Playbook: ${playbook}`);
        let prompt = `
      You are 'MarketMate', a creative and helpful AI marketing assistant for
      small business owners in the Philippines. Your tone is energetic, friendly,
      and persuasive.

      Your task is to generate a short, catchy social media post.

      **Playbook:** ${playbook}
      **Product Name:** ${product_name}
    `;
        if (playbook === "Flash Sale") {
            const promo = discount || "Big Discount";
            prompt += `**Details:** This is an urgent Flash Sale. The product is ${promo} for a very limited time. Create a sense of urgency.`;
        }
        else if (playbook === "New Arrival") {
            prompt += `**Details:** This is a NEW ARRIVAL. Highlight that it's brand new and exciting.`;
        }
        else if (playbook === "Best Seller Spotlight") {
            prompt += `**Details:** This is a BESTSELLER. Highlight its popularity and why customers love it.`;
        }
        else if (playbook === "Bundle Up!") {
            prompt += `**Details:** This product is part of a new bundle. (e.g., ${product_name} + another item). Mention the great value.`;
        }
        prompt += "\n\n**Generated Post**";
        try {
            const result = await textModel.generateContent(prompt);
            const response = await result.response;
            const adText = response.text().trim();
            console.log(`Generated ad copy: ${adText.substring(0, 50)}...`);
            return adText;
        }
        catch (error) {
            console.error("Error calling Gemini API:", error);
            throw new Error("Sorry, I couldn't generate an ad right now.");
        }
    }
    /**
     * Generate AI-powered ad image using ML Service
     */
    async generateAdImage(request) {
        try {
            return await mlClient_1.mlClient.generateAdImage(request);
        }
        catch (error) {
            console.error("Error generating ad image:", error);
            throw error;
        }
    }
    async getPromotions(shopId) {
        // 1. Fetch near expiry items (e.g. expiring in next 60 days)
        const now = new Date();
        const sixtyDaysFromNow = new Date();
        sixtyDaysFromNow.setDate(now.getDate() + 60);
        const products = await prisma_1.default.product.findMany({
            where: {
                shopId,
                expiryDate: {
                    gte: now,
                    lte: sixtyDaysFromNow,
                },
            },
            include: {
                inventories: { take: 1 },
            },
        });
        const items = products.map((p) => ({
            product_id: p.id,
            name: p.name,
            expiry_date: p.expiryDate.toISOString(),
            quantity: p.inventories[0]?.quantity || 0,
            price: p.price,
            categories: p.description ? [p.description] : [],
        }));
        if (items.length === 0) {
            return {
                promotions: [],
                meta: {
                    shop_id: shopId,
                    total_items: 0,
                    total_events: 0,
                    promotions_generated: 0,
                    analysis_date: new Date().toISOString(),
                },
            };
        }
        // 2. Generate dummy calendar events
        const events = [
            {
                id: "evt_weekend",
                date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
                title: "Weekend Sale",
                event_type: "sale",
            },
            {
                id: "evt_payday",
                date: new Date(now.getFullYear(), now.getMonth() + 1, 15).toISOString(), // Next 15th (approx)
                title: "Payday Sale",
                event_type: "sale",
            },
        ];
        // 3. Call ML Service
        const request = {
            shop_id: shopId,
            items,
            calendar_events: events,
        };
        return await mlClient_1.mlClient.post("/api/v1/smart-shelf/promotions", request);
    }
}
exports.AdService = AdService;
//# sourceMappingURL=ad.service.js.map