import "dotenv/config";
import dotenv from "dotenv";
import path from "path";
import { createServer } from "http";

dotenv.config({ path: path.join(__dirname, "../.env") });

import app from "./app";
import { initializeSocketIO } from "./services/socket.service";
import { redis } from "./lib/redis";
import { campaignSchedulerService } from "./service/campaignScheduler.service";

const PORT: number | string = process.env.PORT || 3000;

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO
initializeSocketIO(httpServer);

// Start campaign scheduler
campaignSchedulerService.start();

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO server ready for real-time connections`);
});

// Graceful shutdown handler
async function gracefulShutdown(signal: string) {
  console.log(`${signal} signal received: starting graceful shutdown...`);
  
  // Stop campaign scheduler
  campaignSchedulerService.stop();
  console.log("🛑 Campaign scheduler stopped");

  // Close Socket.IO server
  try {
    const { closeSocketIO } = require("./services/socket.service");
    await closeSocketIO();
    console.log("🔌 Socket.IO server closed");
  } catch (error: any) {
    // Socket.IO might not be initialized, ignore
    console.log("⚠️ Socket.IO not initialized or already closed");
  }

  // Close HTTP server
  httpServer.close(async () => {
    console.log("🛑 HTTP server closed");
    
    // Close Prisma and database connections
    try {
      const prisma = require("./lib/prisma").default;
      await prisma.$disconnect();
      console.log("🔌 Prisma disconnected");
      
      // Close database pool
      const { pool } = require("./lib/prisma");
      if (pool) {
        await pool.end();
        console.log("🔌 Database pool closed");
      }
    } catch (error: any) {
      console.error("❌ Error closing Prisma:", error.message);
    }

    // Close Redis connection
    try {
      const { redis } = require("./lib/redis");
      if (redis) {
        redis.quit();
        console.log("🔌 Redis connection closed");
      }
    } catch (error: any) {
      console.error("❌ Error closing Redis:", error.message);
    }

    console.log("✅ Graceful shutdown complete");
    process.exit(0);
  });

  // Force exit after 10 seconds if graceful shutdown takes too long
  setTimeout(() => {
    console.error("⚠️ Forcing exit after timeout");
    process.exit(1);
  }, 10000);
}

// Handle shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
