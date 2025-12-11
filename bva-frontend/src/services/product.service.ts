import { apiClient } from "@/lib/api-client";

export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  price: number;
  cost: number;
  stock: number;
  quantity: number;
  expiryDate?: string | null;
  category?: string | null;
  imageUrl?: string | null;
  platform?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const productService = {
  fetchProducts: async (shopId: string): Promise<Product[]> => {
    if (!shopId) {
      console.warn("⚠️ productService.fetchProducts: shopId is empty");
      return [];
    }
    
    try {
      console.log(`📦 productService: Fetching products from /api/products/shop/${shopId}`);
      // API client already unwraps the response, so it returns Product[] directly
      const products = await apiClient.get<Product[]>(`/api/products/shop/${shopId}`);
      console.log(`✅ productService: Received ${products?.length || 0} products`);
      return products || [];
    } catch (error: any) {
      console.error(`❌ productService: Error fetching products:`, error);
      console.error(`   Error details:`, error.message, error.response?.data);
      throw error;
    }
  },
};
