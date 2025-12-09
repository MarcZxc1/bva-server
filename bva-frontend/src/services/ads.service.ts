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

  scheduleCampaign: async (id: string, scheduledAt: string): Promise<Campaign> => {
    return apiClient.post<Campaign>(`/api/campaigns/${id}/schedule`, { scheduledAt });
  },

  publishCampaign: async (id: string): Promise<Campaign> => {
    return apiClient.post<Campaign>(`/api/campaigns/${id}/publish`, {});
  },

  deleteCampaign: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/api/campaigns/${id}`);
  },
};
