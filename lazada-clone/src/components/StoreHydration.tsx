'use client';

import { useEffect } from 'react';
import { useAuthStore, useCartStore } from '@/store';

export function StoreHydration() {
  useEffect(() => {
    console.log('💧 Manually rehydrating stores...');
    useAuthStore.persist.rehydrate();
    useCartStore.persist.rehydrate();
  }, []);

  return null;
}
