import { apiClient } from "@/lib/api-client";
import { mainApi } from "./client";
import { RestockRequest, RestockResponse } from "./inventory.service";

export interface AdGenerationRequest {
  productName: string;
  playbook: string;
  discount?: string;
}

export interface AdGenerationResponse {
  success: boolean;
  data: {
    playbookUsed: string;
    product_name: string;
    generated_ad_copy: string;
  };
}

export interface AdImageRequest {
  productName: string;
  playbook: string;
  style?: string;
}

export interface AdImageResponse {
  success: boolean;
  data: {
    image_url: string;
  };
}

export const aiService = {
  /**
   * Generate AI-powered ad copy
   */
  generateAdCopy: async (
    data: AdGenerationRequest
  ): Promise<AdGenerationResponse> => {
    const response = await mainApi.post<AdGenerationResponse>(
      "/api/v1/ads/generate-ad",
      {
        product_name: data.productName,
        playbook: data.playbook,
        discount: data.discount,
      }
    );
    return response.data;
  },

  /**
   * Generate AI-powered ad image
   */
  generateAdImage: async (data: AdImageRequest): Promise<AdImageResponse> => {
    const response = await mainApi.post<AdImageResponse>(
      "/api/v1/ads/generate-ad-image",
      {
        product_name: data.productName,
        playbook: data.playbook,
        style: data.style,
      }
    );
    return response.data;
  },

  /**
   * Get optimal restocking strategy
   */
  getRestockStrategy: async (
    data: RestockRequest
  ): Promise<RestockResponse> => {
    const response = await mainApi.post<RestockResponse>(
      "/api/ai/restock-strategy",
      data
    );
    return response.data;
  },

  /**
   * Check ML service health
   */
  checkHealth: async () => {
    const response = await mainApi.get("/api/ai/restock-strategy/health");
    return response.data;
  },
};
