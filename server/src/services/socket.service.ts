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

  // Emit to all clients
  io.emit("product_update", {
    type: "new_product",
    data: product,
  });

  console.log(`🚀 Notified all clients about new product: ${product.name}`);
}