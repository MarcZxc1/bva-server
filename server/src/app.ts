import express, { Application, Request, Response } from "express";
import cors from "cors";
import passport, { initializeGoogleStrategy } from "./config/passport";

import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

// Initialize Google OAuth after env is loaded
initializeGoogleStrategy();

import adRouter from "./api/ads/ad.router";
import restockRouter from "./routes/restock.routes";
import smartShelfRouter from "./routes/smartShelf.routes";
import userRoutes from "./routes/user.routes";
import productRoutes from "./routes/product.routes";
import notificationRoutes from "./routes/notification.routes";
import reportsRoutes from "./routes/reports.routes";
import authRoutes from "./routes/auth.routes";

const app: Application = express();

app.use(cors());
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// Initialize Passport
app.use(passport.initialize());

// --- 2. Routes ---
// Root route
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({ 
    message: "Business Virtual Assistant API",
    version: "1.0.0",
    status: "running",
    endpoints: {
      health: "/health",
      auth: "/api/auth",
      products: "/api/products",
      users: "/api/users",
      ads: "/api/v1/ads",
      restock: "/api/ai/restock",
      smartShelf: "/api/smart-shelf",
      notifications: "/api/v1/notifications",
      reports: "/api/reports"
    }
  });
});

// Health check route (good for testing if the server is alive)
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "up" });
});

app.use("/test", (req, res) => {
  res.send("WORKING!");
});
// Register your Ad Router
// All routes in adRouter will be prefixed with /api/v1/ads
app.use("/api/v1/ads", adRouter);

// Register AI Restocking Router
// All routes in restockRouter will be prefixed with /api/ai
app.use("/api/ai", restockRouter);

// Register SmartShelf Router
app.use("/api/smart-shelf", smartShelfRouter);

// Register User Router
app.use("/api/users", userRoutes);

// Register Notification Router
app.use("/api/v1/notifications", notificationRoutes);

// Register Product Router
app.use("/api/products", productRoutes);

// Register Reports Router
app.use("/api/reports", reportsRoutes);

// Register Auth Router
app.use("/api/auth", authRoutes);

// --- 3. Export the App ---
// We export the app so server.ts can import it
export default app;
