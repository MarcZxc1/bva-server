// src/routes/auth.routes.ts
import { Router, Request, Response } from "express";
import passport from "../config/passport";
import { authController } from "../controllers/auth.controller";
import { authService } from "../service/auth.service";
import jwt from "jsonwebtoken";

const router = Router();

// Frontend URL for redirects
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || "24h";

// Auth middleware for protected routes
const authMiddleware = async (req: Request, res: Response, next: Function) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const token = authHeader.substring(7);
    const decoded = authService.verifyToken(token);

    (req as any).userId = decoded.userId;
    (req as any).userRole = decoded.role;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

// ==========================================
// Google OAuth Routes
// ==========================================

/**
 * @route   GET /api/auth/google
 * @desc    Initiate Google OAuth authentication
 * @access  Public
 */
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

/**
 * @route   GET /api/auth/google/callback
 * @desc    Google OAuth callback handler
 * @access  Public
 */
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${FRONTEND_URL}/buyer-login?error=google_auth_failed`,
  }),
  (req: Request, res: Response) => {
    try {
      // User is attached to req.user by passport
      const user = req.user as any;

      if (!user) {
        return res.redirect(`${FRONTEND_URL}/buyer-login?error=no_user`);
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRATION } as jwt.SignOptions
      );

      // Redirect to frontend with token
      // For Shopee Clone, redirect to /buyer-login which handles the token
      res.redirect(`${FRONTEND_URL}/buyer-login?token=${token}`);
    } catch (error) {
      console.error("Google callback error:", error);
      res.redirect(`${FRONTEND_URL}/buyer-login?error=token_generation_failed`);
    }
  }
);

// ==========================================
// Standard Auth Routes
// ==========================================

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post("/register", (req: Request, res: Response) =>
  authController.register(req, res)
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post("/login", (req: Request, res: Response) =>
  authController.login(req, res)
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/me", authMiddleware, (req: Request, res: Response) =>
  authController.getMe(req, res)
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side)
 * @access  Private
 */
router.post("/logout", authMiddleware, (req: Request, res: Response) =>
  authController.logout(req, res)
);

// ==========================================
// Shopee-Clone SSO Routes
// ==========================================

/**
 * @route   POST /api/auth/shopee-sso
 * @desc    Shopee-Clone Single Sign-On
 * @access  Public
 * 
 * This endpoint allows sellers from Shopee-Clone to instantly log into BVA.
 * It will:
 * 1. Find or create a BVA user based on the Shopee-Clone account
 * 2. Link their shopeeId to the BVA user
 * 3. Create a shop for them if they're a new SELLER
 * 4. Trigger a sync of their products and sales from Shopee-Clone
 * 5. Return a JWT for immediate authentication
 * 
 * Request body:
 * {
 *   "shopeeUserId": "string (required)",
 *   "email": "string (required)",
 *   "name": "string (optional)",
 *   "role": "SELLER | BUYER | ADMIN | ANALYST (optional, default: SELLER)",
 *   "apiKey": "string (required) - API key for fetching data from Shopee-Clone"
 * }
 */
router.post("/shopee-sso", (req: Request, res: Response) =>
  authController.shopeeSSOLogin(req, res)
);

/**
 * @route   POST /api/auth/shopee-sync
 * @desc    Manually trigger Shopee-Clone data sync
 * @access  Private
 * 
 * Request body:
 * {
 *   "apiKey": "string (required) - API key for fetching data from Shopee-Clone"
 * }
 */
router.post("/shopee-sync", authMiddleware, (req: Request, res: Response) =>
  authController.triggerShopeeSync(req, res)
);

export default router;
