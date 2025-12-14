import { useQuery } from '@tanstack/react-query';
import { sellerAPI } from '@/lib/api';

export const useOrders = (shopId: string) => {
  return useQuery({
    queryKey: ['orders', shopId],
    queryFn: async () => {
      if (!shopId) {
        throw new Error('Shop ID is required');
      }
      
      console.log('📡 Fetching orders for shop:', shopId.slice(0, 8) + '...');
      const response = await sellerAPI.getOrders(shopId);
      const orders = response.data?.data || response.data || [];
      console.log('📡 Received', orders.length, 'orders');
      return response.data;
    },
    enabled: !!shopId,
    retry: 3,
    retryDelay: 1000,
  });
};
