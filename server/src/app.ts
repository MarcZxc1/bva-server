import express, { Application, Request, Response } from "express";
import cors from "cors";
import passport, { initializeGoogleStrategy, initializeFacebookStrategy } from "./config/passport";

import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

// Initialize OAuth strategies after env is loaded
initializeGoogleStrategy();
initializeFacebookStrategy();

import adRouter from "./api/ads/ad.router";
import restockRouter from "./routes/restock.routes";
import smartShelfRouter from "./routes/smartShelf.routes";
import userRoutes from "./routes/user.routes";
import productRoutes from "./routes/product.routes";
import notificationRoutes from "./routes/notification.routes";
import reportsRoutes from "./routes/reports.routes";
import authRoutes from "./routes/auth.routes";
import campaignRoutes from "./routes/campaign.routes";
import orderRoutes from "./routes/order.routes";
import sellerRoutes from "./routes/seller.routes";
import integrationRoutes from "./routes/integration.routes";
import externalRoutes from "./routes/external.routes";
import webhookRoutes from "./routes/webhook.routes";

const app: Application = express();

// Configure CORS to allow both frontends
app.use(cors({
  origin: [
    "http://localhost:5173", // Shopee Clone
    "http://localhost:8080", // BVA Frontend
    "https://bva-frontend.vercel.app",
    "https://shopee-clone.vercel.app"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
// Increase body parser limit to handle large base64 images (10MB limit)
app.use(express.json({ limit: '10mb' }));

app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize Passport
app.use(passport.initialize() as unknown as express.RequestHandler);

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
      reports: "/api/reports",
      campaigns: "/api/campaigns",
      orders: "/api/orders",
      seller: "/api/seller"
    }
  });
});

// Health check route (good for testing if the server is alive)
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "up" });
});

// Privacy Policy route (for Facebook OAuth requirements)
app.get("/privacy-policy", (req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Privacy Policy - BVA Server</title>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        h1 { color: #333; }
        p { line-height: 1.6; color: #666; }
      </style>
    </head>
    <body>
      <h1>Privacy Policy</h1>
      <p><strong>Last updated:</strong> ${new Date().toLocaleDateString()}</p>
      <h2>Data Collection</h2>
      <p>We collect the following information when you use Facebook OAuth:</p>
      <ul>
        <li>Email address</li>
        <li>Public profile information (name)</li>
        <li>Facebook Page access (for ad publishing features)</li>
      </ul>
      <h2>Data Usage</h2>
      <p>Your information is used to:</p>
      <ul>
        <li>Authenticate your account</li>
        <li>Enable ad publishing to Facebook Pages</li>
        <li>Provide personalized services</li>
      </ul>
      <h2>Data Storage</h2>
      <p>Your data is stored securely in our database and is not shared with third parties.</p>
      <h2>Contact</h2>
      <p>For questions about this privacy policy, please contact us.</p>
    </body>
    </html>
  `);
});

// Terms of Service route (for Facebook OAuth requirements)
app.get("/terms-of-service", (req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Terms of Service - BVA Server</title>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        h1 { color: #333; }
        h2 { color: #555; margin-top: 30px; }
        p { line-height: 1.6; color: #666; }
        ul { list-style-type: disc; margin-left: 20px; }
      </style>
    </head>
    <body>
      <h1>Terms of Service</h1>
      <p><strong>Last updated:</strong> ${new Date().toLocaleDateString()}</p>
      
      <h2>1. Acceptance of Terms</h2>
      <p>By accessing and using the Business Virtual Assistant (BVA) platform, you accept and agree to be bound by the terms and provision of this agreement.</p>
      
      <h2>2. Use License</h2>
      <p>Permission is granted to temporarily use the BVA platform for personal and commercial purposes. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
      <ul>
        <li>Modify or copy the materials</li>
        <li>Use the materials for any commercial purpose without explicit permission</li>
        <li>Attempt to decompile or reverse engineer any software</li>
        <li>Remove any copyright or other proprietary notations from the materials</li>
      </ul>
      
      <h2>3. User Accounts</h2>
      <p>When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for safeguarding the password and for all activities that occur under your account.</p>
      
      <h2>4. OAuth Authentication</h2>
      <p>By using Facebook OAuth to authenticate, you agree to:</p>
      <ul>
        <li>Allow BVA to access your basic profile information (name, email)</li>
        <li>Allow BVA to access your Facebook Pages (for ad publishing features)</li>
        <li>Understand that BVA will store necessary tokens to provide these services</li>
      </ul>
      
      <h2>5. Service Availability</h2>
      <p>We reserve the right to withdraw or amend our service, and any service or material we provide, in our sole discretion without notice. We will not be liable if, for any reason, all or any part of our service is unavailable at any time or for any period.</p>
      
      <h2>6. Prohibited Uses</h2>
      <p>You may not use our service:</p>
      <ul>
        <li>In any way that violates any applicable law or regulation</li>
        <li>To transmit any malicious code or viruses</li>
        <li>To impersonate or attempt to impersonate the company or any employee</li>
        <li>In any way that infringes upon the rights of others</li>
      </ul>
      
      <h2>7. Limitation of Liability</h2>
      <p>In no event shall BVA, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the service.</p>
      
      <h2>8. Changes to Terms</h2>
      <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.</p>
      
      <h2>9. Contact Information</h2>
      <p>If you have any questions about these Terms of Service, please contact us at <a href="mailto:dagodemarcgerald@gmail.com">dagodemarcgerald@gmail.com</a>.</p>
    </body>
    </html>
  `);
});

// Data Deletion Instructions route (for Facebook OAuth requirements)
app.get("/data-deletion-instructions", (req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Data Deletion Instructions - BVA Server</title>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        h1 { color: #333; }
        p { line-height: 1.6; color: #666; }
        ul { list-style-type: disc; margin-left: 20px; }
        a { color: #1877f2; text-decoration: none; }
        a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <h1>Data Deletion Instructions</h1>
      <p><strong>Last updated:</strong> ${new Date().toLocaleDateString()}</p>
      <p>If you wish to delete your data from BVA Server, please follow these steps:</p>
      <ol>
        <li>Send an email to our support team at <a href="mailto:dagodemarcgerald@gmail.com">dagodemarcgerald@gmail.com</a> with the subject "Data Deletion Request".</li>
        <li>Include your user ID or the email address associated with your account in the email body.</li>
        <li>Our team will process your request and confirm the deletion of your data within 30 days.</li>
      </ol>
      <h2>What Data Will Be Deleted?</h2>
      <p>Deleting your data will remove all associated information from our systems, including:</p>
      <ul>
        <li>Your user account and profile information</li>
        <li>Email address and authentication data</li>
        <li>Linked social media accounts (Facebook, Google)</li>
        <li>Shop information and product data</li>
        <li>Order history and sales records</li>
        <li>Campaign data and marketing materials</li>
      </ul>
      <h2>Important Notes</h2>
      <ul>
        <li>Data deletion is permanent and cannot be undone.</li>
        <li>Some data may be retained for legal or accounting purposes as required by law.</li>
        <li>You will receive a confirmation email once your data has been deleted.</li>
      </ul>
      <p>Thank you for using BVA Server.</p>
    </body>
    </html>
  `);
});

app.use("/test", (req, res) => {
  res.send("WORKING!");
});

// Debug route to test product routes
app.post("/test-products", (req, res) => {
  res.json({ 
    message: "POST route test successful",
    timestamp: new Date().toISOString(),
    body: req.body 
  });
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

// Register Campaign Router
app.use("/api/campaigns", campaignRoutes);

// Register Order Router
app.use("/api/orders", orderRoutes);

// Register Seller Router
app.use("/api/seller", sellerRoutes);

// Register Integration Router
app.use("/api/integrations", integrationRoutes);

// Register External API Router (for Shopee-Clone to expose data to BVA)
app.use("/api/external", externalRoutes);

// Register Webhook Router (for Shopee-Clone to send real-time updates)
app.use("/api/webhooks", webhookRoutes);

// --- 3. Export the App ---
// We export the app so server.ts can import it
export default app;
