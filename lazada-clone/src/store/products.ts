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
  setProducts: (products: Product[]) => void;
  clearProducts: () => void;
}

export const useProductStore = create<ProductStore>()(
  persist(
    (set) => ({
      products: [],
      addProduct: (product) => set((state) => {
        const productId = product.id || product._id;
        // Check if product already exists to prevent duplicates
        const exists = state.products.some(p => (p.id || p._id) === productId);
        if (exists) {
          // Update existing product instead of adding duplicate
          return {
            products: state.products.map(p => 
              (p.id || p._id) === productId ? product : p
            )
          };
        }
        return { products: [...state.products, product] };
      }),
      setProducts: (products) => {
        // Deduplicate products by ID
        const uniqueProducts = products.reduce((acc, product) => {
          const productId = product.id || product._id;
          const exists = acc.some(p => (p.id || p._id) === productId);
          if (!exists) {
            acc.push(product);
          }
          return acc;
        }, [] as Product[]);
        set({ products: uniqueProducts });
      },
      clearProducts: () => set({ products: [] }),
    }),
    {
      name: 'product-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => sessionStorage), // (optional) by default, 'localStorage' is used
    }
  )
);
