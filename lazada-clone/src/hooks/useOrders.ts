import { useQuery } from '@tanstack/react-query';
import { sellerAPI } from '@/lib/api';

export const useOrders = (shopId: string) => {
  return useQuery({
    queryKey: ['orders', shopId],
    queryFn: () => sellerAPI.getOrders(shopId),
    enabled: !!shopId,
  });
};
