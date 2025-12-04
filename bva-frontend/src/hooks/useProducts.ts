import { useQuery } from "@tanstack/react-query";
import { productService, Product } from "@/services/product.service";

export function useProducts(shopId: string) {
  return useQuery<Product[]>({
    queryKey: ["products", shopId],
    queryFn: () => productService.fetchProducts(shopId),
    enabled: !!shopId,
  });
}
