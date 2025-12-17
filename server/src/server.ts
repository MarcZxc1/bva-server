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

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  campaignSchedulerService.stop();
  httpServer.close(() => {
    console.log("HTTP server closed");
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT signal received: closing HTTP server");
  campaignSchedulerService.stop();
  httpServer.close(() => {
    console.log("HTTP server closed");
  });
});
