import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface DashboardUpdate {
  type: "new_order" | "low_stock" | "inventory_update";
  data: any;
}

interface UseRealtimeDashboardOptions {
  shopId: string | undefined;
  enabled?: boolean;
}

/**
 * Hook for real-time dashboard updates via WebSocket
 * Listens for order updates, low stock alerts, and inventory changes
 */
export function useRealtimeDashboard({ 
  shopId, 
  enabled = true 
}: UseRealtimeDashboardOptions) {
  const queryClient = useQueryClient();
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

    // Listen for dashboard updates
    socket.on("dashboard_update", (update: DashboardUpdate) => {
      console.log("📊 Dashboard update received:", update);

      switch (update.type) {
        case "new_order":
          handleNewOrder(update.data);
          break;
        case "low_stock":
          handleLowStock(update.data);
          break;
        case "inventory_update":
          handleInventoryUpdate(update.data);
          break;
      }
    });

    // Handle connection events
    socket.on("connect", () => {
      console.log("🔌 Connected to real-time dashboard");
      socket.emit("join_shop", shopId);
    });

    socket.on("disconnect", () => {
      console.log("🔌 Disconnected from real-time dashboard");
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
  }, [shopId, enabled, queryClient]);

  const handleNewOrder = (orderData: {
    orderId: string;
    total: number;
    revenue: number;
    profit: number;
    items: Array<{ productName: string; quantity: number }>;
    createdAt: Date;
  }) => {
    // Show toast notification
    toast.success("New Order Received! 💰", {
      description: `Order #${orderData.orderId.slice(-8)} - ₱${orderData.total.toLocaleString()}`,
      duration: 5000,
    });

    // Invalidate and refetch dashboard analytics
    queryClient.invalidateQueries({ queryKey: ["dashboard-analytics"] });
    queryClient.invalidateQueries({ queryKey: ["at-risk-inventory"] });
    queryClient.invalidateQueries({ queryKey: ["reports"] });

    // Optimistically update the cache if we have existing data
    queryClient.setQueryData(["dashboard-analytics"], (oldData: any) => {
      if (!oldData) return oldData;

      return {
        ...oldData,
        totalRevenue: (oldData.totalRevenue || 0) + orderData.revenue,
        totalProfit: (oldData.totalProfit || 0) + orderData.profit,
        totalSales: (oldData.totalSales || 0) + 1,
      };
    });
  };

  const handleLowStock = (alertData: {
    productId: string;
    productName: string;
    currentStock: number;
    threshold: number;
  }) => {
    // Show warning toast
    toast.warning("Low Stock Alert ⚠️", {
      description: `${alertData.productName} is running low (${alertData.currentStock} remaining)`,
      duration: 7000,
    });

    // Invalidate at-risk inventory to refresh SmartShelf
    queryClient.invalidateQueries({ queryKey: ["at-risk-inventory"] });
  };

  const handleInventoryUpdate = (updateData: {
    updates: Array<{
      productId: string;
      productName: string;
      newStock: number;
    }>;
  }) => {
    // Silently update inventory cache
    queryClient.invalidateQueries({ queryKey: ["at-risk-inventory"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  return {
    isConnected: socketRef.current?.connected || false,
  };
}

