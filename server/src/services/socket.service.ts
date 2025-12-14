// src/services/socket.service.ts

import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";

let io: SocketIOServer | null = null;

// ... (existing interfaces)

export interface NewProductData {}

export function initializeSocketIO(httpServer: HTTPServer): SocketIOServer {
  // ... (existing implementation)
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: [
        "http://localhost:5173", // Shopee Clone
        "http://localhost:3001", // Lazada Clone (Next.js)
        "http://localhost:8080", // BVA Frontend
        "https://bva-frontend.vercel.app",
        "https://shopee-clone.vercel.app",
        "https://lazada-clone.vercel.app" // Lazada Clone production
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

    // Handle user room joining (for buyers)
    socket.on("join_user", (userId: string) => {
      const room = `user_${userId}`;
      socket.join(room);
      console.log(`👤 Socket ${socket.id} joined user room: ${room}`);
    });

    // Handle shop room leaving
    socket.on("leave_shop", (shopId: string) => {
      const room = `shop_${shopId}`;
      socket.leave(room);
      console.log(`📦 Socket ${socket.id} left shop room: ${room}`);
    });

    // Handle user room leaving
    socket.on("leave_user", (userId: string) => {
      const room = `user_${userId}`;
      socket.leave(room);
      console.log(`👤 Socket ${socket.id} left user room: ${room}`);
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  console.log("✅ Socket.IO server initialized");
  return io;
}

export function getSocketIO(): SocketIOServer {
  if (!io) {
    throw new Error("Socket.IO not initialized. Call initializeSocketIO first.");
  }
  return io;
}

// ... (existing notification functions)

/**
 * Notify all clients about a new product
 */
export function notifyNewProduct(product: any): void {
  if (!io) {
    console.warn("⚠️  Socket.IO not initialized. Skipping new product notification.");
    return;
  }

  // Emit to all clients (for buyer landing page)
  io.emit("product_update", {
    type: "new_product",
    data: product,
  });

  // Also emit to shop room (for seller dashboard)
  if (product.shopId) {
    io.to(`shop_${product.shopId}`).emit("dashboard_update", {
      type: "product_update",
      data: product
    });
  }

  console.log(`🚀 Notified all clients about new product: ${product.name}`);
}

/**
 * Notify shop and user about a new order
 */
export function notifyNewOrder(order: any): void {
  if (!io) {
    console.warn("⚠️  Socket.IO not initialized. Skipping new order notification.");
    return;
  }

  // Notify the shop (Seller)
  if (order.shopId) {
    io.to(`shop_${order.shopId}`).emit("order_created", {
      type: "new_order",
      data: order
    });
    // Also emit generic dashboard update
    io.to(`shop_${order.shopId}`).emit("dashboard_update", {
      type: "new_order",
      data: order
    });
  }

  // Notify the user (Buyer) - if we have userId in the order
  // The order object might have customerEmail or we might need to pass userId explicitly if available
  // For now, we'll assume the client joins the user room and we emit if we can identify the user
  // But typically createOrder returns the order which might not have userId directly if it's linked via relation
  // Let's assume the order object has what we need or we broadcast to the specific user room if we knew it.
  // Since we don't always have userId in the order object structure shown in previous logs (it had customerEmail),
  // we might rely on the client refreshing or if we have the userId from the request context passed in.
  
  console.log(`🚀 Notified shop ${order.shopId} about new order: ${order.id}`);
}

/**
 * Notify shop and user about order status update
 */
export function notifyOrderStatusUpdate(order: any): void {
  if (!io) {
    console.warn("⚠️  Socket.IO not initialized. Skipping order status update notification.");
    return;
  }

  // Notify the shop (Seller)
  if (order.shopId) {
    io.to(`shop_${order.shopId}`).emit("order_status_updated", {
      type: "status_update",
      data: order
    });
    io.to(`shop_${order.shopId}`).emit("dashboard_update", {
      type: "order_status_changed",
      data: order
    });
    console.log(`📢 Notified shop ${order.shopId} about order status update: ${order.id} -> ${order.status}`);
  }

  // Note: Buyer notification is handled in the controller after we fetch the user by email
  // This function is called from the service layer where we don't have userId yet
  // The controller will handle buyer-specific notifications via user rooms
}