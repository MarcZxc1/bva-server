import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthStore {
  user: any;
  token: string | null;
  isLoggedIn: boolean;
  shops: any[];
  isHydrated: boolean;
  setUser: (user: any, token: string, shops: any[]) => void;
  logout: () => void;
  setToken: (token: string) => void;
}

interface CartStore {
  items: any[];
  total: number;
  addItem: (item: any) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

// FIXED: Added 'persist' middleware to automatically save/load user from localStorage
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoggedIn: false,
      shops: [],
      isHydrated: false,
      setUser: (user, token, shops) => {
        console.log('🔐 Setting user in store:', { user, token: !!token, shops });
        set({ user, token, isLoggedIn: !!token, shops, isHydrated: true });
      },
      logout: () => {
        // Clear manual storage items just in case
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('shops');
        }
        set({ user: null, token: null, isLoggedIn: false, shops: [] });
      },
      setToken: (token) => set({ token }),
    }),
    {
      name: 'auth-storage', // unique name for localStorage key
      storage: createJSONStorage(() => localStorage),
      skipHydration: true, // IMPORTANT: Skip auto-hydration to avoid SSR mismatch
      // Only persist these fields
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token, 
        isLoggedIn: state.isLoggedIn, 
        shops: state.shops 
      }),
      onRehydrateStorage: () => (state) => {
        console.log('💧 Zustand auth store rehydrated:', state);
        if (state) {
          state.isHydrated = true;
        }
      },
    }
  )
);

// FIXED: Added 'persist' middleware to keep cart items after refresh
export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      total: 0,
      addItem: (item) => set((state) => {
        const existingItem = state.items.find(i => i._id === item._id || i.id === item.id);
        const itemId = item._id || item.id;
        
        if (existingItem) {
          return {
            items: state.items.map(i => 
              (i._id === itemId || i.id === itemId) ? { ...i, quantity: i.quantity + (item.quantity || 1) } : i
            ),
          };
        }
        return { items: [...state.items, { ...item, quantity: item.quantity || 1 }] };
      }),
      removeItem: (id) => set((state) => ({
        items: state.items.filter(i => (i._id !== id && i.id !== id)),
      })),
      updateQuantity: (id, quantity) => set((state) => ({
        items: state.items.map(i => (i._id === id || i.id === id) ? { ...i, quantity } : i),
      })),
      clearCart: () => set({ items: [], total: 0 }),
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true, // IMPORTANT: Skip auto-hydration to avoid SSR mismatch
    }
  )
);