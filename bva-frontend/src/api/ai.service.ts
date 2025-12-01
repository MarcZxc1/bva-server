import { apiClient } from "@/lib/api-client";
import { RestockRequest, RestockResponse } from "./inventory.service"; // Import types or move them here

export interface AdGenerationRequest {
  productName: string;
  playbook: string;
  discount?: string;
}

export interface AdGenerationResponse {
  success: boolean;
  ad_copy: string;
  hashtags: string[];
}

export interface AdImageRequest {
  productName: string;
  playbook: string;
  style?: string;
}

export interface AdImageResponse {
  success: boolean;
  image_url: string;
}

export const aiService = {
  generateAdCopy: async (
    data: AdGenerationRequest
  ): Promise<AdGenerationResponse> => {
    return apiClient.post<AdGenerationResponse>(
      "/api/v1/ads/generate-ad",
      data
    );
  },

  generateAdImage: async (data: AdImageRequest): Promise<AdImageResponse> => {
    return apiClient.post<AdImageResponse>(
      "/api/v1/ads/generate-ad-image",
      data
    );
  },

  getRestockStrategy: async (
    data: RestockRequest
  ): Promise<RestockResponse> => {
    // Assuming the endpoint is /api/ai/restock-strategy based on previous lib/api.ts
    // But user said "Call the backend to retrieve the suggested stock list"
    // I'll stick to the one in lib/api.ts for now as it seems to be what was intended
    return apiClient.post<RestockResponse>("/api/ai/restock-strategy", data);
  },

  checkHealth: async () => {
    return apiClient.get("/api/ai/restock-strategy/health");
  },
};
