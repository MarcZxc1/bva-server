import { apiClient } from "@/lib/api-client";

export interface GenerateAdRequest {
  product_name: string;
  playbook: string;
  discount?: string;
  product_image_url?: string; // Optional: Product image URL for image-based ad copy generation
}

export interface GenerateAdResponse {
  ad_copy: string;
  hashtags: string[];
}

export interface GenerateAdImageRequest {
  product_name: string;
  playbook: string;
  style?: string;
  productId?: string; // Optional: If provided, backend will fetch product image
  product_image_url?: string; // Optional: Direct product image URL to use as context
  custom_prompt?: string; // Optional: Custom prompt for image editing/regeneration
  template_context?: string; // Optional: Template context for ad generation
}

export interface GenerateAdImageResponse {
  image_url: string;
  warning?: string; // Optional warning (e.g., if placeholder was used due to quota limits)
}

export interface Campaign {
  id: string;
  title: string;
  type: string;
  platform: string;
  status: string;
  caption: string;
  imageUrl: string | null; // Generated ad image URL (base64 or external URL)
  scheduledDate: string | null;
  engagement: {
    views: number;
    clicks: number;
  } | null;
  content: any;
}

export interface CreateCampaignRequest {
  name: string;
  content: {
    ad_copy?: string;
    promo_copy?: string;
    playbook: string;
    product_name: string;
    image_url?: string;
    platform?: string;
  };
  status?: "DRAFT" | "SCHEDULED" | "PUBLISHED";
  scheduledAt?: string;
  platform?: string;
}

export const adsService = {
  generateAdText: async (data: GenerateAdRequest): Promise<GenerateAdResponse> => {
    return apiClient.post<GenerateAdResponse>("/api/v1/ads/generate-ad", data);
  },

  generateAdImage: async (data: GenerateAdImageRequest): Promise<GenerateAdImageResponse> => {
    return apiClient.post<GenerateAdImageResponse>("/api/v1/ads/generate-ad-image", data);
  },

  getCampaigns: async (): Promise<Campaign[]> => {
    return apiClient.get<Campaign[]>("/api/campaigns");
  },

  createCampaign: async (data: CreateCampaignRequest): Promise<Campaign> => {
    return apiClient.post<Campaign>("/api/campaigns", data);
  },

  updateCampaign: async (id: string, data: Partial<CreateCampaignRequest>): Promise<Campaign> => {
    return apiClient.put<Campaign>(`/api/campaigns/${id}`, data);
  },

  scheduleCampaign: async (id: string, scheduledAt: string): Promise<{ success: boolean; data: Campaign; warning?: string }> => {
    return apiClient.post<{ success: boolean; data: Campaign; warning?: string }>(`/api/campaigns/${id}/schedule`, { scheduledAt });
  },

  publishCampaign: async (id: string): Promise<{ success: boolean; data: Campaign; warning?: string }> => {
    return apiClient.post<{ success: boolean; data: Campaign; warning?: string }>(`/api/campaigns/${id}/publish`, {});
  },

  unscheduleCampaign: async (id: string): Promise<Campaign> => {
    return apiClient.post<Campaign>(`/api/campaigns/${id}/unschedule`, {});
  },

  deleteCampaign: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/api/campaigns/${id}`);
  },

  getPromptSuggestions: async (data: {
    product_name: string;
    product_image_url?: string;
    playbook?: string;
    current_prompt?: string;
    result_type?: "attention" | "conversion" | "engagement" | "brand" | "urgency";
  }): Promise<{
    image_based_suggestions?: string[];
    result_based_suggestions?: string[];
    general_tips?: string[];
  }> => {
    return apiClient.post<{
      image_based_suggestions?: string[];
      result_based_suggestions?: string[];
      general_tips?: string[];
    }>("/api/v1/ads/prompt-suggestions", data);
  },
};
