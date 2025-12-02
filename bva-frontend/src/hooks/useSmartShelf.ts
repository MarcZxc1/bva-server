/**
 * React Query hooks for SmartShelf Analytics Dashboard
 */

import { useQuery } from "@tanstack/react-query";
import {
  inventoryService,
  AtRiskResponse,
  ProductsResponse,
} from "@/api/inventory.service";
import { mainApi } from "@/api/client";

export function useAtRiskInventory(shopId: string, enabled: boolean = true) {
  return useQuery<AtRiskResponse>({
    queryKey: ["at-risk-inventory", shopId],
    queryFn: () => inventoryService.getAtRiskInventory(shopId),
    enabled: enabled && !!shopId,
    refetchInterval: 60000, // Refetch every minute
  });
}

export function useAllProducts(shopId: string, enabled: boolean = true) {
  return useQuery<ProductsResponse>({
    queryKey: ["all-products", shopId],
    queryFn: () => inventoryService.getAllProducts(shopId),
    enabled: enabled && !!shopId,
  });
}

/**
 * Hook for fetching dashboard analytics
 * Usage: const { data, isLoading, error } = useDashboardAnalytics(shopId);
 */
export function useDashboardAnalytics(shopId: string | undefined) {
  return useQuery({
    queryKey: ["dashboard-analytics", shopId],
    queryFn: async () => {
      if (!shopId) throw new Error("Shop ID is required");
      
      const response = await mainApi.get(`/api/smart-shelf/${shopId}/dashboard`);
      return response.data;
    },
    enabled: !!shopId,
    refetchInterval: 60000, // Refresh every minute
  });
}
