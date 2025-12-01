import { useQuery } from "@tanstack/react-query";
import {
  inventoryService,
  AtRiskResponse,
  ProductsResponse,
} from "@/api/inventory.service";

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
