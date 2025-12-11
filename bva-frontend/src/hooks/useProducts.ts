import { useQuery } from "@tanstack/react-query";
import { productService, Product } from "@/services/product.service";

export function useProducts(shopId: string) {
  return useQuery<Product[]>({
    queryKey: ["products", shopId],
    queryFn: async () => {
      if (!shopId) {
        console.warn("⚠️ useProducts: shopId is empty, returning empty array");
        return [];
      }
      console.log(`📦 useProducts: Fetching products for shop ${shopId}`);
      const products = await productService.fetchProducts(shopId);
      console.log(`✅ useProducts: Fetched ${products.length} products`);
      return products;
    },
    enabled: !!shopId,
    staleTime: 30 * 1000, // 30 seconds - products can be cached briefly
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });
}
