import { GoogleGenerativeAI } from "@google/generative-ai";
import { AdRequest } from "../api/ads/ad.types";
import { mlClient } from "../utils/mlClient";
import {
  PromotionRequest,
  PromotionResponse,
  NearExpiryItem,
  CalendarEvent,
} from "../types/promotion.types";
import prisma from "../lib/prisma";

// Don't load dotenv here - it's already loaded in server.ts
// Initialize Gemini client only if API key is available (for fallback)
let genAI: GoogleGenerativeAI | null = null;
let textModel: any = null;

if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    textModel = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp", // Use text model, not image model
    });
  } catch (error) {
    console.warn("Failed to initialize Gemini fallback client:", error);
  }
}

export class AdService {
  public async generateAdCopy(request: AdRequest): Promise<{ ad_copy: string; hashtags: string[] }> {
    const { product_name, playbook, discount, product_image_url } = request;

    try {
      // Call ML Service for ad copy generation (with image analysis if product_image_url is provided)
      // ML service returns AdCopyResponse directly: { ad_copy, hashtags }
      const result = await mlClient.generateAdCopy({
        product_name,
        playbook,
        discount,
        product_image_url, // Pass product image URL for vision-based ad copy generation
      });

      // Return ad copy and hashtags
      return {
        ad_copy: result.ad_copy || "",
        hashtags: result.hashtags || []
      };
    } catch (error: any) {
      console.error("Error generating ad via ML service:", error);
      
      // Fallback to legacy Gemini if ML service fails
      const fallbackCopy = await this.generateAdCopyFallback(request);
      return {
        ad_copy: fallbackCopy,
        hashtags: [] // Fallback doesn't provide hashtags
      };
    }
  }

  /**
   * Fallback method using legacy Gemini integration
   */
  private async generateAdCopyFallback(request: AdRequest): Promise<string> {
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
    } else if (playbook === "New Arrival") {
      prompt += `**Details:** This is a NEW ARRIVAL. Highlight that it's brand new and exciting.`;
    } else if (playbook === "Best Seller Spotlight") {
      prompt += `**Details:** This is a BESTSELLER. Highlight its popularity and why customers love it.`;
    } else if (playbook === "Bundle Up!") {
      prompt += `**Details:** This product is part of a new bundle. (e.g., ${product_name} + another item). Mention the great value.`;
    }

    prompt += "\n\n**Generated Post**";

    // Check if Gemini fallback is available
    if (!textModel) {
      throw new Error("Gemini API key not configured. ML service is required for ad generation.");
    }

    try {
      const result = await textModel.generateContent(prompt);
      const response = await result.response;
      const adText = response.text().trim();
      console.log(`Generated ad copy: ${adText.substring(0, 50)}...`);
      return adText;
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      throw new Error("Sorry, I couldn't generate an ad right now.");
    }
  }

  /**
   * Generate AI-powered ad image using ML Service
   */
  public async generateAdImage(request: {
    product_name: string;
    playbook: string;
    style?: string;
    product_image_url?: string; // Optional: Product image URL to use as context for ad generation
    custom_prompt?: string; // Optional: Custom prompt for image editing/regeneration
    template_context?: string; // Optional: Template context for ad generation
  }): Promise<{ image_url: string }> {
    try {
      console.log(`🎨 Generating ad image for product: ${request.product_name}`, {
        hasProductImage: !!request.product_image_url,
        playbook: request.playbook,
        style: request.style,
      });
      
      // ML service returns AdImageResponse directly: { image_url }
      // Pass product_image_url to ML service so it can use the product image as context
      const result = await mlClient.generateAdImage({
        product_name: request.product_name,
        playbook: request.playbook,
        style: request.style,
        product_image_url: request.product_image_url, // Include product image URL
        custom_prompt: request.custom_prompt, // Include custom prompt for image editing
        template_context: request.template_context, // Include template context
      });
      
      return {
        image_url: result.image_url || ""
      };
    } catch (error) {
      console.error("Error generating ad image:", error);
      throw error;
    }
  }

  public async getPromotions(shopId: string): Promise<PromotionResponse> {
    // 1. Fetch near expiry items (e.g. expiring in next 60 days)
    const now = new Date();
    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(now.getDate() + 60);

    const products = await prisma.product.findMany({
      where: {
        shopId,
        expiryDate: {
          gte: now,
          lte: sixtyDaysFromNow,
        },
      },
      include: {
        Inventory: { take: 1 },
      },
    });

    const items: NearExpiryItem[] = products.map((p) => ({
      product_id: p.id,
      name: p.name,
      expiry_date: p.expiryDate!.toISOString(),
      quantity: p.Inventory[0]?.quantity || 0,
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
    const events: CalendarEvent[] = [
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
    const request: PromotionRequest = {
      shop_id: shopId,
      items,
      calendar_events: events,
    };

    return await mlClient.post<PromotionResponse>(
      "/api/v1/smart-shelf/promotions",
      request
    );
  }

  /**
   * Generate promotions for a specific at-risk item
   * Used when user clicks "Take Action" on an at-risk item
   */
  public async generatePromotionsForItem(
    shopId: string,
    item: {
      product_id: string;
      name: string;
      expiry_date?: string | null;
      quantity: number;
      price: number;
      categories?: string[];
      days_to_expiry?: number;
    }
  ): Promise<PromotionResponse> {
    // If no expiry date, create a near-expiry item based on days_to_expiry
    let expiryDate: string;
    if (item.expiry_date) {
      expiryDate = item.expiry_date;
    } else if (item.days_to_expiry !== undefined && item.days_to_expiry > 0) {
      // Calculate expiry date from days_to_expiry
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + item.days_to_expiry);
      expiryDate = expiry.toISOString();
    } else {
      // Default to 7 days from now if no expiry info
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 7);
      expiryDate = expiry.toISOString();
    }

    const nearExpiryItem: NearExpiryItem = {
      product_id: item.product_id,
      name: item.name,
      expiry_date: expiryDate,
      quantity: item.quantity,
      price: item.price,
      categories: item.categories || [],
    };

    // Generate calendar events (upcoming sales events)
    const now = new Date();
    const events: CalendarEvent[] = [
      {
        id: "evt_weekend",
        date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
        title: "Weekend Sale",
        event_type: "sale",
      },
      {
        id: "evt_flash",
        date: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        title: "Flash Sale",
        event_type: "sale",
      },
      {
        id: "evt_payday",
        date: new Date(now.getFullYear(), now.getMonth() + 1, 15).toISOString(), // Next 15th
        title: "Payday Sale",
        event_type: "sale",
      },
    ];

    // Call ML Service
    const request: PromotionRequest = {
      shop_id: shopId,
      items: [nearExpiryItem],
      calendar_events: events,
    };

    return await mlClient.post<PromotionResponse>(
      "/api/v1/smart-shelf/promotions",
      request
    );
  }
}
