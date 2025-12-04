import { apiClient } from "@/lib/api-client";

export interface GenerateAdRequest {
  product_name: string;
  playbook: string;
  discount?: string;
}

export interface GenerateAdResponse {
  ad_copy: string;
  hashtags: string[];
}

export interface GenerateAdImageRequest {
  product_name: string;
  playbook: string;
  style?: string;
}

export interface GenerateAdImageResponse {
  image_url: string;
}

export const adsService = {
  generateAdText: async (data: GenerateAdRequest): Promise<GenerateAdResponse> => {
    return apiClient.post<GenerateAdResponse>("/api/v1/ads/generate-ad", data);
  },

  generateAdImage: async (data: GenerateAdImageRequest): Promise<GenerateAdImageResponse> => {
    return apiClient.post<GenerateAdImageResponse>("/api/v1/ads/generate-ad-image", data);
  },
};
