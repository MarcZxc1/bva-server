/**
 * React Query hooks for MarketMate AI Ad Generation
 */

import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

// ============================================
// Types
// ============================================

export interface AdRequest {
  product_name: string;
  playbook: "Flash Sale" | "New Arrival" | "Best Seller Spotlight" | "Bundle Up!";
  discount?: string;
}

export interface AdResponse {
  success: boolean;
  data: {
    playbookUsed: string;
    product_name: string;
    generated_ad_copy: string;
  };
}

export interface AdImageRequest {
  product_name: string;
  playbook: string;
  style?: string;
}

export interface AdImageResponse {
  success: boolean;
  data: {
    image_url: string;
  };
}

export interface PromotionResponse {
  success: boolean;
  data: {
    promotions: Array<{
      event_id: string;
      event_title: string;
      product_id: string;
      product_name: string;
      suggested_discount_pct: number;
      promo_copy: string;
      start_date: string;
      end_date: string;
      expected_clear_days: number;
      projected_sales_lift: number;
      confidence: string;
      reasoning: string;
    }>;
    meta: {
      shop_id: string;
      total_items: number;
      total_events: number;
      promotions_generated: number;
      analysis_date: string;
    };
  };
}

// ============================================
// Hooks
// ============================================

/**
 * Generate AI-powered ad copy
 * Usage: const { mutate, isPending } = useGenerateAdCopy();
 */
export function useGenerateAdCopy() {
  return useMutation({
    mutationFn: async (request: AdRequest): Promise<AdResponse> => {
      return apiClient.post<AdResponse>("/api/v1/ads/generate-ad", request);
    },
    onSuccess: () => {
      toast.success("Ad copy generated successfully!");
    },
    onError: (error: any) => {
      const errorMessage = 
        error?.response?.data?.message || 
        error?.message || 
        "Failed to generate ad copy";
      toast.error(errorMessage);
    },
  });
}

/**
 * Generate AI-powered ad image
 * Usage: const { mutate, isPending } = useGenerateAdImage();
 */
export function useGenerateAdImage() {
  return useMutation({
    mutationFn: async (request: AdImageRequest): Promise<AdImageResponse> => {
      return apiClient.post<AdImageResponse>("/api/v1/ads/generate-ad-image", request);
    },
    onSuccess: () => {
      toast.success("Ad image generated successfully!");
    },
    onError: (error: any) => {
      const errorMessage = 
        error?.response?.data?.message || 
        error?.message || 
        "Failed to generate ad image";
      toast.error(errorMessage);
    },
  });
}

/**
 * Get smart promotions for near-expiry items
 * Usage: const { data, isLoading } = usePromotions(shopId);
 */
export function usePromotions(shopId: string, enabled: boolean = true) {
  return useQuery<PromotionResponse>({
    queryKey: ["promotions", shopId],
    queryFn: async () => {
      return apiClient.get<PromotionResponse>(`/api/v1/ads/${shopId}/promotions`);
    },
    enabled: enabled && !!shopId,
    refetchInterval: 300000, // Refresh every 5 minutes
  });
}
