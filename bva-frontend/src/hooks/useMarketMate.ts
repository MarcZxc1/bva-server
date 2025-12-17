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
    onSuccess: (response) => {
      // Check if there's a warning (e.g., placeholder used due to quota)
      if (response.warning) {
        toast({
          title: "Warning",
          description: response.warning,
          variant: "default",
        });
      } else {
        toast({
          title: "Success",
          description: "Ad image generated successfully!",
        });
      }
    },
    onError: (error: any) => {
      const errorMessage = 
        error?.response?.data?.message || 
        error?.response?.data?.detail ||
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

/**
 * Get all generated ad campaigns
 * Usage: const { data, isLoading } = useCampaigns(shopId);
 */
export function useCampaigns(shopId: string, enabled: boolean = true) {
  return useQuery<any[]>({
    queryKey: ["campaigns", shopId],
    queryFn: async () => {
      return adsService.getCampaigns();
    },
    enabled: enabled && !!shopId,
  });
}

/**
 * Create a new campaign
 * Usage: const { mutate, isPending } = useCreateCampaign();
 */
export function useCreateCampaign() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: any) => {
      return adsService.createCampaign(data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Campaign created successfully!",
      });
    },
    onError: (error: any) => {
      const errorMessage = 
        error?.response?.data?.error || 
        error?.message || 
        "Failed to create campaign";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
}

/**
 * Update a campaign
 * Usage: const { mutate, isPending } = useUpdateCampaign();
 */
export function useUpdateCampaign() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return adsService.updateCampaign(id, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Campaign updated successfully!",
      });
    },
    onError: (error: any) => {
      const errorMessage = 
        error?.response?.data?.error || 
        error?.message || 
        "Failed to update campaign";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
}

/**
 * Schedule a campaign
 * Usage: const { mutate, isPending } = useScheduleCampaign();
 */
export function useScheduleCampaign() {
  const { toast } = useToast();

  return useMutation<{ success: boolean; data: any; warning?: string }, any, { id: string; scheduledAt: string }>({
    mutationFn: async ({ id, scheduledAt }: { id: string; scheduledAt: string }) => {
      return adsService.scheduleCampaign(id, scheduledAt);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Campaign scheduled successfully!",
      });
    },
    onError: (error: any) => {
      const errorMessage = 
        error?.response?.data?.error || 
        error?.message || 
        "Failed to schedule campaign";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
}

/**
 * Publish a campaign
 * Usage: const { mutate, isPending } = usePublishCampaign();
 */
export function usePublishCampaign() {
  const { toast } = useToast();

  return useMutation<{ success: boolean; data: any; warning?: string }, any, string>({
    mutationFn: async (id: string) => {
      return adsService.publishCampaign(id);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Campaign published successfully!",
      });
    },
    onError: (error: any) => {
      const errorMessage = 
        error?.response?.data?.error || 
        error?.message || 
        "Failed to publish campaign";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
}

/**
 * Unschedule a campaign (change to DRAFT)
 * Usage: const { mutate, isPending } = useUnscheduleCampaign();
 */
export function useUnscheduleCampaign() {
  const { toast } = useToast();

  return useMutation<any, any, string>({
    mutationFn: async (id: string) => {
      return adsService.unscheduleCampaign(id);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Campaign scheduling cancelled. Campaign moved to drafts.",
      });
    },
    onError: (error: any) => {
      const errorMessage = 
        error?.response?.data?.error || 
        error?.message || 
        "Failed to unschedule campaign";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
}

/**
 * Delete a campaign
 * Usage: const { mutate, isPending } = useDeleteCampaign();
 */
export function useDeleteCampaign() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      return adsService.deleteCampaign(id);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Campaign deleted successfully!",
      });
    },
    onError: (error: any) => {
      const errorMessage = 
        error?.response?.data?.error || 
        error?.message || 
        "Failed to delete campaign";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
}
