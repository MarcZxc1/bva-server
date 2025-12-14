import { useQuery } from "@tanstack/react-query";
import { analyticsService, AtRiskResponse, DashboardResponse } from "@/services/analytics.service";

export function useAtRiskInventory(shopId: string, enabled: boolean = true) {
  return useQuery<AtRiskResponse>({
    queryKey: ["at-risk-inventory", shopId],
    queryFn: () => analyticsService.getAtRiskInventory(shopId),
    enabled: enabled && !!shopId,
    refetchInterval: 60000, // Refetch every minute
  });
}

export function useDashboardAnalytics(shopId: string, enabled: boolean = true) {
  return useQuery<DashboardResponse>({
    queryKey: ["dashboard-analytics", shopId],
    queryFn: () => analyticsService.getDashboardStats(shopId),
    enabled: enabled && !!shopId,
    staleTime: 60000, // Consider data stale after 1 minute
    cacheTime: 120000, // Keep in cache for 2 minutes
    refetchInterval: 300000, // Refetch every 5 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });
}


