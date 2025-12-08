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
    // API client already unwraps the response, so it returns Product[] directly
    const products = await apiClient.get<Product[]>(`/api/products/shop/${shopId}`);
    return products || [];
  },
};
