import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";

let io: SocketIOServer | null = null;

export interface OrderNotificationData {
  shopId: string;
  orderId: string;
  total: number;
  revenue: number;
  profit: number;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  customerEmail?: string;
  createdAt: Date;
}

export interface LowStockAlertData {
  shopId: string;
  productId: string;
  productName: string;
  currentStock: number;
  threshold: number;
}

/**
 * Initialize Socket.IO server
 */
export function initializeSocketIO(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: [
        "http://localhost:5173", // Shopee Clone
        "http://localhost:8080", // BVA Frontend
        "https://bva-frontend.vercel.app",
        "https://shopee-clone.vercel.app"
      ],
      credentials: true,
      methods: ["GET", "POST"]
    },
    transports: ["websocket", "polling"]
  });

  // Handle connection
  io.on("connection", (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Handle shop room joining
    socket.on("join_shop", (shopId: string) => {
      const room = `shop_${shopId}`;
      socket.join(room);
      console.log(`📦 Socket ${socket.id} joined shop room: ${room}`);
    });

    // Handle shop room leaving
    socket.on("leave_shop", (shopId: string) => {
      const room = `shop_${shopId}`;
      socket.leave(room);
      console.log(`📦 Socket ${socket.id} left shop room: ${room}`);
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  console.log("✅ Socket.IO server initialized");
  return io;
}

/**
 * Get the Socket.IO instance
 */
export function getSocketIO(): SocketIOServer {
  if (!io) {
    throw new Error("Socket.IO not initialized. Call initializeSocketIO first.");
  }
  return io;
}

/**
 * Notify shop about a new order
 */
export function notifyNewOrder(data: OrderNotificationData): void {
  if (!io) {
    console.warn("⚠️  Socket.IO not initialized. Skipping order notification.");
    return;
  }

  const room = `shop_${data.shopId}`;
  io.to(room).emit("dashboard_update", {
    type: "new_order",
    data: {
      orderId: data.orderId,
      total: data.total,
      revenue: data.revenue,
      profit: data.profit,
      items: data.items,
      customerEmail: data.customerEmail,
      createdAt: data.createdAt,
    },
  });

  console.log(`📢 Notified shop ${data.shopId} about new order ${data.orderId}`);
}

/**
 * Notify shop about low stock alert
 */
export function notifyLowStock(data: LowStockAlertData): void {
  if (!io) {
    console.warn("⚠️  Socket.IO not initialized. Skipping low stock notification.");
    return;
  }

  const room = `shop_${data.shopId}`;
  io.to(room).emit("dashboard_update", {
    type: "low_stock",
    data: {
      productId: data.productId,
      productName: data.productName,
      currentStock: data.currentStock,
      threshold: data.threshold,
    },
  });

  console.log(`⚠️  Notified shop ${data.shopId} about low stock: ${data.productName}`);
}

/**
 * Notify shop about inventory update
 */
export function notifyInventoryUpdate(shopId: string, updates: Array<{
  productId: string;
  productName: string;
  newStock: number;
}>): void {
  if (!io) {
    console.warn("⚠️  Socket.IO not initialized. Skipping inventory update.");
    return;
  }

  const room = `shop_${shopId}`;
  io.to(room).emit("dashboard_update", {
    type: "inventory_update",
    data: {
      updates,
    },
  });

  console.log(`📦 Notified shop ${shopId} about inventory updates`);
}

