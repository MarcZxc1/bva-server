// Custom hook for optimized auth state management
import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const useAuthState = () => {
  const auth = useAuth();

  // Memoize computed values to prevent unnecessary re-renders
  const isBuyer = useMemo(() => auth.user?.role === 'BUYER', [auth.user?.role]);
  const isSeller = useMemo(() => auth.user?.role === 'SELLER', [auth.user?.role]);
  const isAdmin = useMemo(() => auth.user?.role === 'ADMIN', [auth.user?.role]);
  const shopId = useMemo(() => auth.user?.shops?.[0]?.id, [auth.user?.shops]);
  const shopName = useMemo(() => auth.user?.shops?.[0]?.name, [auth.user?.shops]);
  const userName = useMemo(() => auth.user?.name || auth.user?.username || auth.user?.email, [auth.user]);

  return {
    ...auth,
    isBuyer,
    isSeller,
    isAdmin,
    shopId,
    shopName,
    userName,
  };
};

