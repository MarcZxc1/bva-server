import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
  id: string;
  productId: string | number; // Support both string and number for compatibility
  name: string;
  fullName: string;
  image: string;
  shopName: string;
  unitPrice: number;
  originalPrice?: number;
  quantity: number;
  isSelected: boolean;
  variations: string;
  selectedColor?: string;
  selectedSize?: string;
  selectedVariation?: string;
  badges?: string[];
  voucherAvailable?: boolean;
  shippingDiscount?: boolean;
  storeInfo?: {
    name: string;
    location: string;
  };
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, 'isSelected' | 'id'>) => void;
  updateCartItem: (id: string, updates: Partial<CartItem>) => void;
  removeFromCart: (id: string) => void;
  removeSelectedItems: () => void;
  toggleItemSelection: (id: string) => void;
  toggleShopSelection: (shopName: string) => void;
  toggleSelectAll: () => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('shopeeCloneCart');
    if (saved) {
      try {
        const items = JSON.parse(saved);
        return items.map((item: CartItem) => ({
          ...item,
          isSelected: item.isSelected !== undefined ? item.isSelected : true,
        }));
      } catch {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('shopeeCloneCart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (item: Omit<CartItem, 'isSelected' | 'id'>) => {
    const newItem: CartItem = {
      ...item,
      id: `${item.productId}-${Date.now()}-${Math.random()}`,
      isSelected: true,
    };
    setCartItems(prev => [...prev, newItem]);
  };

  const updateCartItem = (id: string, updates: Partial<CartItem>) => {
    setCartItems(prev =>
      prev.map(item => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const removeFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const removeSelectedItems = () => {
    setCartItems(prev => prev.filter(item => !item.isSelected));
  };

  const toggleItemSelection = (id: string) => {
    setCartItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, isSelected: !item.isSelected } : item
      )
    );
  };

  const toggleShopSelection = (shopName: string) => {
    setCartItems(prev => {
      const allItemsInShopSelected = prev
        .filter(item => item.shopName === shopName)
        .every(item => item.isSelected);
      
      return prev.map(item =>
        item.shopName === shopName
          ? { ...item, isSelected: !allItemsInShopSelected }
          : item
      );
    });
  };

  const toggleSelectAll = () => {
    setCartItems(prev => {
      const allItemsSelected = prev.every(item => item.isSelected);
      return prev.map(item => ({ ...item, isSelected: !allItemsSelected }));
    });
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getTotalItems = () => {
    return cartItems.filter(item => item.isSelected).reduce((sum, item) => sum + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems
      .filter(item => item.isSelected)
      .reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateCartItem,
        removeFromCart,
        removeSelectedItems,
        toggleItemSelection,
        toggleShopSelection,
        toggleSelectAll,
        clearCart,
        getTotalItems,
        getTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

