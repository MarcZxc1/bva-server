import { apiClient } from "@/lib/api-client";

export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  price: number;
  cost: number;
  inventories: Array<{
    quantity: number;
    location?: string;
  }>;
}

export const productService = {
  fetchProducts: async (shopId: string): Promise<Product[]> => {
    return apiClient.get<Product[]>(`/api/products/shop/${shopId}`);
  },
};
