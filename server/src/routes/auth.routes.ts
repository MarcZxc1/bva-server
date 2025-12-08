// src/routes/auth.routes.ts
import { Router, Request, Response } from "express";
import passport from "../config/passport";
import { authController } from "../controllers/auth.controller";
import { authService } from "../service/auth.service";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";

const router = Router();

// Allowed frontend URLs for redirection
const ALLOWED_FRONTENDS = [
  "http://localhost:5173", // Shopee Clone
  "http://localhost:8080", // BVA Frontend
  "https://bva-frontend.vercel.app",
  "https://shopee-clone.vercel.app"
];

// Get frontend URL from environment or default
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.VITE_API_URL?.replace('/api', '') || "http://localhost:5173";

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
// Supabase Auth Routes (Facebook OAuth handled by Supabase)
// ==========================================

/**
 * @route   POST /api/auth/supabase/verify
 * @desc    Verify Supabase access token and sync user to local database
 * @access  Public
 * 
 * This endpoint is called by the frontend after Supabase OAuth completes.
 * It verifies the Supabase token, syncs the user to the local database,
 * and returns a JWT token for the local API.
 */
router.post("/supabase/verify", async (req: Request, res: Response) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: "Access token is required",
      });
    }

    // Import here to avoid circular dependencies
    const { supabaseAuthService } = await import("../service/supabaseAuth.service");
    const { supabase } = await import("../lib/supabase");

    if (!supabase) {
      return res.status(500).json({
        success: false,
        message: "Supabase not configured",
      });
    }

    // Verify token with Supabase
    console.log('🔐 Verifying Supabase token...');
    const supabaseUser = await supabaseAuthService.verifyToken(accessToken);

    if (!supabaseUser) {
      console.error('❌ Token verification failed');
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    console.log('✅ Token verified, syncing user to database...');
    // Sync user to local database (this will create shop if needed for SELLERs)
    const { user: localUser, created } = await supabaseAuthService.syncUser(supabaseUser);
    console.log(`✅ User ${created ? 'created' : 'updated'}:`, localUser.email);

    // Get user's shops (should exist for SELLERs after sync)
    const shops = await prisma.shop.findMany({
      where: { ownerId: localUser.id },
      select: { id: true, name: true },
    });

    // Generate JWT token for local API
    const token = jwt.sign(
      {
        userId: localUser.id,
        role: localUser.role,
        email: localUser.email,
        name: localUser.name || localUser.firstName || 'User',
        shops: shops.map(s => ({ id: s.id, name: s.name })),
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION } as jwt.SignOptions
    );

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: localUser.id,
        email: localUser.email,
        name: localUser.name || localUser.firstName || 'User',
        role: localUser.role,
        shops: shops.map(s => ({ id: s.id, name: s.name })),
      },
      created,
    });
  } catch (error: any) {
    console.error("Supabase verify error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify token",
      error: error.message,
    });
  }
});

// ==========================================
// Google OAuth Routes
// ==========================================

/**
 * @route   GET /api/auth/google
 * @desc    Initiate Google OAuth authentication
 * @access  Public
 * @query   state - JSON string with redirectUrl and role
 * @query   role - Optional role (BUYER or SELLER), defaults to BUYER
 */
router.get("/google", (req: Request, res: Response, next) => {
  // Check if Google OAuth is configured
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error("❌ Google OAuth not configured: Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
    const { state, role } = req.query;
    let redirectUrl = FRONTEND_URL;
    
    // Try to extract redirect URL from state
    try {
      if (state && typeof state === "string") {
        const decoded = JSON.parse(decodeURIComponent(state));
        if (decoded.redirectUrl) {
          redirectUrl = decoded.redirectUrl;
        }
      }
    } catch (e) {
      // Use default
    }
    
    const isShopeeClone = redirectUrl.includes('5173') || redirectUrl.includes('shopee') || redirectUrl.includes('localhost:5173');
    const errorPath = (role === 'SELLER' ? (isShopeeClone ? '/login' : '/login') : (isShopeeClone ? '/buyer-login' : '/login'));
    return res.redirect(`${redirectUrl}${errorPath}?error=google_auth_failed&details=${encodeURIComponent('Google OAuth is not configured on the server')}`);
  }
  
  const { state, role } = req.query;
  
  let stateData: { redirectUrl: string; role?: string } = { redirectUrl: FRONTEND_URL };
  
  // Parse state if provided
  if (state && typeof state === "string") {
    try {
      const decoded = JSON.parse(decodeURIComponent(state));
      stateData.redirectUrl = decoded.redirectUrl || FRONTEND_URL;
      stateData.role = decoded.role || role as string || 'BUYER';
    } catch (e) {
      // If state is not JSON, treat it as redirectUrl
      stateData.redirectUrl = state;
      stateData.role = (role as string) || 'BUYER';
    }
  } else {
    // Use role from query if state not provided
    stateData.role = (role as string) || 'BUYER';
  }
  
  // Validate role
  if (stateData.role && !['BUYER', 'SELLER'].includes(stateData.role)) {
    stateData.role = 'BUYER';
  }
  
  // Encode the state to ensure it's safely passed through the OAuth flow
  const encodedState = Buffer.from(JSON.stringify(stateData)).toString('base64');

  console.log(`🔵 Google OAuth initiated - Role: ${stateData.role}, Redirect: ${stateData.redirectUrl}`);

  // Check if Google strategy is registered
  const googleStrategy = (passport as any)._strategies?.google;
  if (!googleStrategy) {
    console.error("❌ Google OAuth strategy not found. Make sure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set.");
    const isShopeeClone = stateData.redirectUrl.includes('5173') || stateData.redirectUrl.includes('shopee') || stateData.redirectUrl.includes('localhost:5173');
    const errorPath = stateData.role === 'SELLER' 
      ? (isShopeeClone ? '/login' : '/login')
      : (isShopeeClone ? '/buyer-login' : '/login');
    return res.redirect(`${stateData.redirectUrl}${errorPath}?error=google_auth_failed&details=${encodeURIComponent('Google OAuth strategy not configured')}`);
  }

  // Clear any existing session/cookie state to prevent token reuse issues
  // This ensures a fresh OAuth flow each time
  // Note: session is not used in this app, but we check for compatibility
  if ((req as any).session) {
    (req as any).session = undefined;
  }
  
  const authenticator = passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    state: encodedState,
    accessType: 'offline', // Request refresh token if possible
    prompt: 'select_account', // Force account selection to get fresh token
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
  let redirectUrl = FRONTEND_URL;
  let role: string = 'BUYER';
  let decodedState: { redirectUrl: string; role?: string } | null = null;

  try {
    if (state) {
      decodedState = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
      if (decodedState) {
        if (decodedState.redirectUrl) {
          // Validate redirect URL is in allowed list
          // IMPORTANT: Ensure shopee-clone users stay in shopee-clone, never redirect to bva-frontend
          const requestedUrl = decodedState.redirectUrl;
          const isShopeeCloneRequest = requestedUrl.includes('5173') || requestedUrl.includes('shopee') || requestedUrl.includes('localhost:5173');
          
          // Extract base URL (without path) for validation
          let baseUrl: string;
          try {
            const urlObj = new URL(requestedUrl);
            baseUrl = `${urlObj.protocol}//${urlObj.host}`;
          } catch (e) {
            baseUrl = requestedUrl.split('/').slice(0, 3).join('/');
          }
          
          // Check if base URL is in allowed list
          if (ALLOWED_FRONTENDS.includes(baseUrl) || ALLOWED_FRONTENDS.some(allowed => baseUrl.startsWith(allowed))) {
            // If request came from shopee-clone, ensure we redirect back to shopee-clone
            if (isShopeeCloneRequest) {
              // Use the base URL from allowed list, but preserve the path if it's a shopee-clone path
              redirectUrl = baseUrl.includes('5173') ? baseUrl : 'http://localhost:5173';
            } else {
              redirectUrl = baseUrl;
            }
          } else {
            console.warn(`⚠️  Redirect URL base not in allowed list: ${baseUrl}, requested: ${requestedUrl}, using default: ${redirectUrl}`);
            // If request came from shopee-clone but URL not in allowed list, default to shopee-clone
            if (isShopeeCloneRequest) {
              redirectUrl = 'http://localhost:5173';
            }
          }
        }
        if (decodedState.role) {
          role = decodedState.role;
        }
      }
    }
  } catch (e) {
    console.error("Invalid state parameter:", e);
    // On error, check if the request might be from shopee-clone by checking referer or default to shopee-clone
    // IMPORTANT: Default to shopee-clone to prevent accidental redirects to bva-frontend
    const referer = req.get('referer') || '';
    if (referer.includes('5173') || referer.includes('shopee')) {
      redirectUrl = 'http://localhost:5173';
    } else {
      // Default to shopee-clone (port 5173) instead of bva-frontend
      redirectUrl = FRONTEND_URL.includes('5173') ? FRONTEND_URL : 'http://localhost:5173';
    }
  }
  
  // Determine failure redirect based on role and frontend
  // IMPORTANT: Shopee-clone users should NEVER redirect to bva-frontend
  const isShopeeClone = redirectUrl.includes('5173') || redirectUrl.includes('shopee') || redirectUrl.includes('localhost:5173');
  const failurePath = role === 'SELLER' 
    ? (isShopeeClone ? '/login' : '/login?error=google_auth_failed')
    : (isShopeeClone ? '/buyer-login' : '/login?error=google_auth_failed');
  const failureRedirect = `${redirectUrl}${failurePath}`;

  passport.authenticate("google", {
    session: false,
    failureRedirect: failureRedirect,
  }) (req, res, (err: any) => {
    if (err) {
      console.error("❌ Google OAuth authentication error:", err);
      console.error("Error details:", {
        message: err.message,
        stack: err.stack,
        name: err.name,
        code: err.code
      });
      // IMPORTANT: Shopee-clone users should NEVER redirect to bva-frontend
      const isShopeeClone = redirectUrl.includes('5173') || redirectUrl.includes('shopee') || redirectUrl.includes('localhost:5173');
      const errorPath = role === 'SELLER' 
        ? (isShopeeClone ? '/login' : '/login')
        : (isShopeeClone ? '/buyer-login' : '/login');
      const errorMessage = err.message || err.toString() || 'Authentication failed';
      console.error(`Redirecting to error page: ${redirectUrl}${errorPath}?error=google_auth_failed&details=${encodeURIComponent(errorMessage)}`);
      return res.redirect(`${redirectUrl}${errorPath}?error=google_auth_failed&details=${encodeURIComponent(errorMessage)}`);
    }
    
    // Check if authentication failed (no user in request)
    if (!req.user) {
      console.error("❌ Google OAuth: No user in request after authentication");
      const isShopeeClone = redirectUrl.includes('5173') || redirectUrl.includes('shopee') || redirectUrl.includes('localhost:5173');
      const errorPath = role === 'SELLER' 
        ? (isShopeeClone ? '/login' : '/login')
        : (isShopeeClone ? '/buyer-login' : '/login');
      return res.redirect(`${redirectUrl}${errorPath}?error=google_auth_failed&details=${encodeURIComponent('No user returned from Google OAuth')}`);
    }
    
    try {
      let user = req.user as any;

      if (!user) {
        console.error("No user returned from Google OAuth");
        // IMPORTANT: Shopee-clone users should NEVER redirect to bva-frontend
        const isShopeeClone = redirectUrl.includes('5173') || redirectUrl.includes('shopee') || redirectUrl.includes('localhost:5173');
        const errorPath = role === 'SELLER' 
          ? (isShopeeClone ? '/login' : '/login')
          : (isShopeeClone ? '/buyer-login' : '/login');
        return res.redirect(`${redirectUrl}${errorPath}?error=no_user`);
      }

      // Update user role if state indicates different role and create shop if needed
      // This handles the case where a new user signs up as SELLER via Google OAuth
      // Also handles existing users who are SELLERs but don't have a shop
      const updateUserRoleAndCreateShop = async () => {
        // Check if user has shops
        const existingShops = await prisma.shop.findMany({
          where: { ownerId: user.id },
          select: { id: true, name: true },
        });
        
        // If role should be SELLER but user is BUYER, update role
        if (role === 'SELLER' && user.role === 'BUYER') {
          try {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { role: 'SELLER' },
            });
            console.log(`✅ Updated user role to SELLER for Google OAuth user: ${user.email}`);
          } catch (updateError) {
            console.error("Error updating user role:", updateError);
            // Continue with original role if update fails
          }
        }
        
        // If user is SELLER (either was already or just updated) and has no shop, create one
        // This handles both new users and existing users who are SELLERs but don't have a shop
        if (user.role === 'SELLER' && existingShops.length === 0) {
          try {
            const newShop = await prisma.shop.create({
              data: {
                name: `${user.name || user.firstName || user.email?.split("@")[0] || "My"}'s Shop`,
                ownerId: user.id,
              },
            });
            console.log(`✅ Created shop for SELLER user: ${user.email}, Shop ID: ${newShop.id}`);
            return [{ id: newShop.id, name: newShop.name }];
          } catch (shopError) {
            console.error("Error creating shop for SELLER:", shopError);
            // Continue even if shop creation fails
            return [];
          }
        }
        
        return existingShops;
      };

      // Update role and create shop if needed, then get shops
      updateUserRoleAndCreateShop().then(shops => {
        const token = jwt.sign(
          { 
            userId: user.id, 
            role: user.role,
            email: user.email,
            name: user.name || user.firstName || 'User',
            shops: shops.map(s => ({ id: s.id, name: s.name }))
          },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRATION } as jwt.SignOptions
        );
        
        // Determine destination based on role and frontend
        // IMPORTANT: Shopee-clone users should NEVER redirect to bva-frontend
        const isShopeeClone = redirectUrl.includes('5173') || redirectUrl.includes('shopee') || redirectUrl.includes('localhost:5173');
        let destination = '/';
        
        if (isShopeeClone) {
          // Shopee clone: redirect based on role - ALWAYS stay in shopee-clone
          if (user.role === 'SELLER') {
            destination = '/login?token=' + token;
          } else {
            // For buyers, redirect to landing page with token - frontend will handle it
            destination = '/?token=' + token;
          }
          console.log(`✅ Google OAuth success (Shopee-Clone) - Redirecting ${user.role} to: ${redirectUrl}${destination}`);
        } else {
          // BVA frontend: always use /login
          destination = '/login?token=' + token;
          console.log(`✅ Google OAuth success (BVA Frontend) - Redirecting to: ${redirectUrl}${destination}`);
        }
        
        res.redirect(`${redirectUrl}${destination}`);
      }).catch(shopError => {
        console.error("Error fetching user shops:", shopError);
        // Still generate token even if shops fetch fails
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
        
        // IMPORTANT: Shopee-clone users should NEVER redirect to bva-frontend
        const isShopeeClone = redirectUrl.includes('5173') || redirectUrl.includes('shopee') || redirectUrl.includes('localhost:5173');
        let destination = '/';
        
        if (isShopeeClone) {
          // Shopee clone: redirect based on role - ALWAYS stay in shopee-clone
          if (user.role === 'SELLER') {
            destination = '/login?token=' + token;
          } else {
            // For buyers, redirect to landing page with token - frontend will handle it
            destination = '/?token=' + token;
          }
        } else {
          // BVA frontend: always use /login
          destination = '/login?token=' + token;
        }
        
        res.redirect(`${redirectUrl}${destination}`);
      });

    } catch (error: any) {
      console.error("Google callback error:", error);
      const errorMessage = error?.message || 'Token generation failed';
      // IMPORTANT: Shopee-clone users should NEVER redirect to bva-frontend
      const isShopeeClone = redirectUrl.includes('5173') || redirectUrl.includes('shopee') || redirectUrl.includes('localhost:5173');
      const errorPath = role === 'SELLER' 
        ? (isShopeeClone ? '/login' : '/login')
        : (isShopeeClone ? '/buyer-login' : '/login');
      res.redirect(`${redirectUrl}${errorPath}?error=token_generation_failed&details=${encodeURIComponent(errorMessage)}`);
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

// ==========================================
// Social Media Account Management Routes
// ==========================================

/**
 * @route   POST /api/auth/social-media/facebook
 * @desc    Store Facebook OAuth tokens for ad publishing
 * @access  Private
 * 
 * Request body:
 * {
 *   "accessToken": "string (required)",
 *   "pageId": "string (optional)",
 *   "accountId": "string (optional - for Instagram)",
 *   "expiresAt": "string (optional - ISO date)"
 * }
 */
router.post("/social-media/facebook", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { accessToken, pageId, accountId, expiresAt } = req.body;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: "Access token is required",
      });
    }

    // Upsert Facebook account
    const socialAccount = await prisma.socialMediaAccount.upsert({
      where: {
        userId_platform: {
          userId,
          platform: "facebook",
        },
      },
      update: {
        accessToken,
        pageId: pageId || null,
        accountId: accountId || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        updatedAt: new Date(),
      },
      create: {
        userId,
        platform: "facebook",
        accessToken,
        pageId: pageId || null,
        accountId: accountId || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        id: socialAccount.id,
        platform: socialAccount.platform,
        pageId: socialAccount.pageId,
        accountId: socialAccount.accountId,
        expiresAt: socialAccount.expiresAt,
      },
    });
  } catch (error: any) {
    console.error("Error storing Facebook tokens:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to store Facebook tokens",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/auth/social-media/facebook
 * @desc    Get Facebook OAuth tokens for the authenticated user
 * @access  Private
 */
router.get("/social-media/facebook", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const socialAccount = await prisma.socialMediaAccount.findUnique({
      where: {
        userId_platform: {
          userId,
          platform: "facebook",
        },
      },
    });

    if (!socialAccount) {
      return res.status(404).json({
        success: false,
        message: "Facebook account not connected",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: socialAccount.id,
        platform: socialAccount.platform,
        pageId: socialAccount.pageId,
        accountId: socialAccount.accountId,
        expiresAt: socialAccount.expiresAt,
        isConnected: true,
      },
    });
  } catch (error: any) {
    console.error("Error fetching Facebook tokens:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch Facebook tokens",
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/auth/social-media/facebook
 * @desc    Disconnect Facebook account
 * @access  Private
 */
// ==========================================
// Meta (Facebook) Data Deletion Endpoint
// Called by Supabase Edge Function
// ==========================================
router.delete("/facebook/delete-user", async (req: Request, res: Response) => {
  try {
    const { facebookUserId } = req.body;

    if (!facebookUserId) {
      return res.status(400).json({
        success: false,
        message: "Facebook user ID is required",
      });
    }

    console.log(`🗑️  Processing deletion request for Facebook user: ${facebookUserId}`);

    // Find user by Facebook ID
    const user = await prisma.user.findUnique({
      where: { facebookId: facebookUserId },
      include: {
        shops: true,
        socialMediaAccounts: true,
      },
    });

    if (!user) {
      console.log(`No user found for Facebook ID: ${facebookUserId}`);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Delete related data (cascade deletes should handle most, but we'll be explicit)
    // Delete social media accounts
    await prisma.socialMediaAccount.deleteMany({
      where: { userId: user.id },
    });

    // Delete all shops and related data (if exists)
    // A user can have multiple shops, so we delete all of them
    if (user.shops && user.shops.length > 0) {
      for (const shop of user.shops) {
        // Delete shop products, orders, etc. (cascade should handle this)
        await prisma.shop.delete({
          where: { id: shop.id },
        });
      }
    }

    // Delete user (this should cascade to other related data)
    await prisma.user.delete({
      where: { id: user.id },
    });

    console.log(`✅ Successfully deleted user data for Facebook ID: ${facebookUserId}`);

    return res.status(200).json({
      success: true,
      message: "User data deleted successfully",
      deletedUserId: user.id,
    });
  } catch (error: any) {
    console.error("Error deleting user data:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete user data",
      error: error.message,
    });
  }
});

router.delete("/social-media/facebook", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    await prisma.socialMediaAccount.deleteMany({
      where: {
        userId,
        platform: "facebook",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Facebook account disconnected successfully",
    });
  } catch (error: any) {
    console.error("Error disconnecting Facebook account:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to disconnect Facebook account",
      error: error.message,
    });
  }
});

export default router;
