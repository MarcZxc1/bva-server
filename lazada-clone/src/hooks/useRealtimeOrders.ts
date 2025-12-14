'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

// Get Socket.IO URL from environment or default
const getSocketURL = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  try {
    const url = new URL(apiUrl);
    return `${url.protocol === 'https:' ? 'https' : 'http'}://${url.hostname}:${url.port || (url.protocol === 'https:' ? '443' : '3000')}`;
  } catch {
    return 'http://localhost:3000';
  }
};

const SOCKET_URL = getSocketURL();

interface UseRealtimeOrdersOptions {
  shopId?: string;
  userId?: string;
  enabled?: boolean;
  onOrderUpdate?: (data: any) => void;
}

/**
 * Hook for real-time order updates via WebSocket
 * Listens for new orders and status updates
 */
export function useRealtimeOrders({ 
  shopId, 
  userId,
  enabled = true,
  onOrderUpdate
}: UseRealtimeOrdersOptions) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Initialize socket connection
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Join shop room if shopId is provided (Seller)
    if (shopId) {
      socket.emit('join_shop', shopId);
    }

    // Join user room if userId is provided (Buyer)
    if (userId) {
      socket.emit('join_user', userId);
    }

    // Listen for new orders (Seller)
    socket.on('order_created', (data: any) => {
      console.log('📦 New order received:', data);
      if (onOrderUpdate) {
        onOrderUpdate(data);
      }
    });

    // Listen for order status updates (Buyer)
    socket.on('order_status_updated', (data: any) => {
      console.log('📦 Order status updated:', data);
      if (onOrderUpdate) {
        onOrderUpdate(data);
      }
    });

    // Handle connection events
    socket.on('connect', () => {
      console.log('🔌 Connected to real-time orders');
      if (shopId) {
        socket.emit('join_shop', shopId);
      }
      if (userId) {
        socket.emit('join_user', userId);
      }
    });

    socket.on('disconnect', () => {
      console.log('🔌 Disconnected from real-time orders');
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        if (shopId) {
          socketRef.current.emit('leave_shop', shopId);
        }
        if (userId) {
          socketRef.current.emit('leave_user', userId);
        }
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [shopId, userId, enabled, onOrderUpdate]);

  return {
    isConnected: socketRef.current?.connected || false,
  };
}
