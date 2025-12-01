import { aiApi } from "@/api/client";

// --- Types ---

export interface AdGenerationRequest {
  product_name: string;
  playbook:
    | "Flash Sale"
    | "New Arrival"
    | "Best Seller Spotlight"
    | "Bundle Up!";
  discount?: string;
}

export interface AdGenerationResponse {
  playbookUsed: string;
  product_name: string;
  generated_ad_copy: string;
}

export interface ForecastRequest {
  shop_id: string;
  days?: number;
}

export interface ForecastResponse {
  shop_id: string;
  forecast: Array<{
    date: string;
    predicted_sales: number;
  }>;
}

// --- Service ---

export const adsService = {
  /**
   * Generate creative ad copy using the AI Service
   */
  generateAd: async (
    data: AdGenerationRequest
  ): Promise<AdGenerationResponse> => {
    const response = await aiApi.post<AdGenerationResponse>(
      "/generate-ad",
      data
    );
    return response.data;
  },

  /**
   * Get sales forecast for a shop
   */
  getForecast: async (
    shopId: string,
    days: number = 7
  ): Promise<ForecastResponse> => {
    const response = await aiApi.post<ForecastResponse>("/forecast", {
      shop_id: shopId,
      days,
    });
    return response.data;
  },
};
