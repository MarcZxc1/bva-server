import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Product {
  id: string;
  _id?: string;
  name: string;
  price: number;
  stock: number;
  imageUrl?: string;
  description?: string;
  category?: string;
  originalPrice?: number;
  discount?: number;
  reviews?: any[];
  sold?: number;
}

interface ProductStore {
  products: Product[];
  addProduct: (product: Product) => void;
}

export const useProductStore = create<ProductStore>()(
  persist(
    (set) => ({
      products: [],
      addProduct: (product) => set((state) => ({ products: [...state.products, product] })),
    }),
    {
      name: 'product-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => sessionStorage), // (optional) by default, 'localStorage' is used
    }
  )
);
