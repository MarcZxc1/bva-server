import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

// Use the same base URL as the API client, but extract just the hostname:port
const getSocketURL = () => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
  // Extract hostname and port, default to localhost:3000 if parsing fails
  try {
    const url = new URL(apiUrl);
    return `${url.protocol === 'https:' ? 'https' : 'http'}://${url.hostname}:${url.port || (url.protocol === 'https:' ? '443' : '3000')}`;
  } catch {
    return "http://localhost:3000";
  }
};

const API_URL = getSocketURL();

interface UseRealtimeProductsOptions {
  shopId: string | undefined;
  enabled?: boolean;
  onProductUpdate?: () => void;
}

/**
 * Hook for real-time product updates via WebSocket
 * Listens for inventory updates and product changes
 */
export function useRealtimeProducts({ 
  shopId, 
  enabled = true,
  onProductUpdate
}: UseRealtimeProductsOptions) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!enabled || !shopId) {
      return;
    }

    // Initialize socket connection
    const socket = io(API_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Join shop room
    socket.emit("join_shop", shopId);

    // Listen for inventory updates
    socket.on("dashboard_update", (update: any) => {
      if (update.type === "inventory_update" || update.type === "new_order") {
        console.log("📦 Product inventory updated:", update);
        if (onProductUpdate) {
          onProductUpdate();
        }
      }
    });

    // Handle connection events
    socket.on("connect", () => {
      console.log("🔌 Connected to real-time products");
      socket.emit("join_shop", shopId);
    });

    socket.on("disconnect", () => {
      console.log("🔌 Disconnected from real-time products");
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.emit("leave_shop", shopId);
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [shopId, enabled, onProductUpdate]);

  return {
    isConnected: socketRef.current?.connected || false,
  };
}

