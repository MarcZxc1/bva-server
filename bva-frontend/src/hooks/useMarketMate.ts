/**
 * React Query hooks for MarketMate AI Ad Generation
 */

import { useMutation, useQuery } from "@tanstack/react-query";
import { adsService, GenerateAdRequest, GenerateAdResponse, GenerateAdImageRequest, GenerateAdImageResponse } from "@/services/ads.service";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api-client";

// ============================================
// Types
// ============================================

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
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (request: GenerateAdRequest): Promise<GenerateAdResponse> => {
      return adsService.generateAdText(request);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Ad copy generated successfully!",
      });
    },
    onError: (error: any) => {
      const errorMessage = 
        error?.response?.data?.message || 
        error?.message || 
        "Failed to generate ad copy";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
}

/**
 * Generate AI-powered ad image
 * Usage: const { mutate, isPending } = useGenerateAdImage();
 */
export function useGenerateAdImage() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (request: GenerateAdImageRequest): Promise<GenerateAdImageResponse> => {
      return adsService.generateAdImage(request);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Ad image generated successfully!",
      });
    },
    onError: (error: any) => {
      const errorMessage = 
        error?.response?.data?.message || 
        error?.message || 
        "Failed to generate ad image";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
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
