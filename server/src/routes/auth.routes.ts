// src/routes/auth.routes.ts
import { Router, Request, Response } from "express";
import passport from "../config/passport";
import { authController } from "../controllers/auth.controller";
import { authService } from "../service/auth.service";
import jwt from "jsonwebtoken";

const router = Router();

// Allowed frontend URLs for redirection
const ALLOWED_FRONTENDS = [
  "http://localhost:5173", // Shopee Clone
  "http://localhost:8080", // BVA Frontend
  "https://bva-frontend.vercel.app",
  "https://shopee-clone.vercel.app"
];

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
router.get("/google", (req: Request, res: Response, next) => {
  const { state } = req.query;

  if (!state || typeof state !== "string") {
    return res.status(400).send("A 'state' query parameter is required for login.");
  }
  
  // Encode the state to ensure it's safely passed through the OAuth flow
  const encodedState = Buffer.from(JSON.stringify({ redirectUrl: state })).toString('base64');

  const authenticator = passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    state: encodedState,
  });

  authenticator(req, res, next);
});


/**
 * @route   GET /api/auth/google/callback
 * @desc    Google OAuth callback handler
 * @access  Public
 */
router.get("/google/callback", (req, res, next) => {
  // Extract state and validate it
  const state = req.query.state as string;
  let redirectUrl = ALLOWED_FRONTENDS[0]; // Default redirect
  let decodedState: { redirectUrl: string } | null = null;

  try {
    if (state) {
      decodedState = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
      if (decodedState && decodedState.redirectUrl && ALLOWED_FRONTENDS.includes(decodedState.redirectUrl)) {
        redirectUrl = decodedState.redirectUrl;
      }
    }
  } catch (e) {
    console.error("Invalid state parameter:", e);
    // Handle error, maybe redirect to a default error page
    return res.redirect(`${ALLOWED_FRONTENDS[0]}/buyer-login?error=invalid_state`);
  }
  
  const failureRedirect = `${redirectUrl}/buyer-login?error=google_auth_failed`;

  passport.authenticate("google", {
    session: false,
    failureRedirect: failureRedirect,
    state: state,
  }) (req, res, (err: any) => {
    if (err) {
      return next(err);
    }
    
    try {
      const user = req.user as any;

      if (!user) {
        return res.redirect(`${redirectUrl}/buyer-login?error=no_user`);
      }

      const token = jwt.sign(
        { 
          userId: user.id, 
          role: user.role,
          email: user.email,
          name: user.name || user.firstName || 'User'
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRATION } as jwt.SignOptions
      );
      
      if(redirectUrl){
        // BVA frontend is on port 8080, Shopee-Clone is on port 5173
        // BVA handles token in /login page, Shopee handles it in root page
        const destination = redirectUrl.includes('8080') ? '/login' : '/';
        res.redirect(`${redirectUrl}${destination}?token=${token}`);
      }

    } catch (error) {
      console.error("Google callback error:", error);
      res.redirect(`${redirectUrl}/buyer-login?error=token_generation_failed`);
    }
  });
});

// ==========================================
// Standard Auth Routes
// ==========================================

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info
 * @access  Private
 */
router.get("/me", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const user = await authService.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get user's shops
    const shops = await authService.getUserShops(userId);

    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name || user.firstName || 'User',
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        shops: shops.map(shop => ({
          id: shop.id,
          name: shop.name,
        })),
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get user information",
    });
  }
});

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
