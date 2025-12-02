import { useQuery } from "@tanstack/react-query";
import { smartShelfApi, AtRiskResponse } from "@/lib/api";

export function useAtRiskInventory(shopId: string, enabled: boolean = true) {
  return useQuery<AtRiskResponse>({
    queryKey: ["at-risk-inventory", shopId],
    queryFn: () => smartShelfApi.getAtRiskInventory(shopId),
    enabled: enabled && !!shopId,
    refetchInterval: 60000, // Refetch every minute
  });
}

export function useDashboardAnalytics(shopId: string) {
  return useQuery({
    queryKey: ["dashboard-analytics", shopId],
    queryFn: () => smartShelfApi.getDashboardAnalytics(shopId),
    enabled: !!shopId,
    refetchInterval: 300000, // Refetch every 5 minutes
  });
}


