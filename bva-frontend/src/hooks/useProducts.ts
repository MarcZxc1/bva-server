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

/**
 * Hook to fetch products from all shops the user has access to (owned + linked)
 * Use this when you need to show products across all integrated platforms
 */
export function useAllUserProducts() {
  return useQuery<Product[]>({
    queryKey: ["products", "all-user"],
    queryFn: async () => {
      console.log(`📦 useAllUserProducts: Fetching products from all accessible shops`);
      const products = await productService.fetchAllUserProducts();
      console.log(`✅ useAllUserProducts: Fetched ${products.length} products`);
      return products;
    },
    staleTime: 30 * 1000, // 30 seconds - products can be cached briefly
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });
}
