import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

export type OrderStatus = 'all' | 'to-pay' | 'to-ship' | 'to-receive' | 'completed' | 'cancelled' | 'return-refund';

export interface Order {
  id: string;
  product: {
    name: string;
    fullName?: string;
    image: string;
  };
  status: OrderStatus;
  price: number;
  quantity: number;
  totalPrice: number;
  date: string;
  shopName: string;
  variations?: string;
  unitPrice: number;
  paymentMethod?: 'cash' | 'online';
}

interface OrderContextType {
  orders: Order[];
  addOrder: (order: Omit<Order, 'id' | 'date' | 'status'>) => void;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  clearOrders: () => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>(() => {
    const savedOrders = localStorage.getItem('shopeeCloneOrders');
    return savedOrders ? JSON.parse(savedOrders) : [];
  });

  useEffect(() => {
    localStorage.setItem('shopeeCloneOrders', JSON.stringify(orders));
  }, [orders]);

  const addOrder = (orderData: Omit<Order, 'id' | 'date' | 'status'>) => {
    const newOrder: Order = {
      ...orderData,
      id: `ORD${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
      date: new Date().toISOString().split('T')[0],
      status: 'to-pay',
    };
    setOrders(prevOrders => [newOrder, ...prevOrders]);
  };

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
  };

  const clearOrders = () => {
    setOrders([]);
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        addOrder,
        updateOrderStatus,
        clearOrders,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};

