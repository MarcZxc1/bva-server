import { useQuery } from "@tanstack/react-query";
import { inventoryService, AtRiskResponse } from "@/api/inventory.service";

export function useAtRiskInventory(shopId: string, enabled: boolean = true) {
  return useQuery<AtRiskResponse>({
    queryKey: ["at-risk-inventory", shopId],
    queryFn: () => inventoryService.getAtRiskInventory(shopId),
    enabled: enabled && !!shopId,
    refetchInterval: 60000, // Refetch every minute
  });
}
