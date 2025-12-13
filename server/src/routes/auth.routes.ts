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
  "http://localhost:5174", // TikTok Seller Clone (Vite default alternate port)
  "http://localhost:5175", // TikTok Seller Clone (if 5174 is taken)
  "http://localhost:3001", // Lazada Clone (Next.js)
  "http://localhost:8080", // BVA Frontend
  "https://bva-frontend.vercel.app",
  "https://shopee-clone.vercel.app",
  "https://tiktokseller-clone.vercel.app", // TikTok Seller Clone production
  "https://lazada-clone.vercel.app" // Lazada Clone production
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
    const isTikTokSellerClone = redirectUrl.includes('5174') || redirectUrl.includes('5175') || redirectUrl.includes('tiktokseller') || redirectUrl.includes('tiktok');
    const isLazadaClone = redirectUrl.includes('3001') || redirectUrl.includes('lazada') || redirectUrl.includes('localhost:3001');
    const errorPath = (role === 'SELLER' 
      ? (isShopeeClone ? '/login' : isTikTokSellerClone ? '/login' : isLazadaClone ? '/seller-login' : '/login') 
      : (isShopeeClone ? '/buyer-login' : isLazadaClone ? '/login' : '/login'));
    return res.redirect(`${redirectUrl}${errorPath}?error=google_auth_failed&details=${encodeURIComponent('Google OAuth is not configured on the server')}`);
  }
  
  const { state, role } = req.query;
  
  let stateData: { redirectUrl: string; role?: string; platform?: string } = { redirectUrl: FRONTEND_URL };
  
  // Parse state if provided
  if (state && typeof state === "string") {
    try {
      const decoded = JSON.parse(decodeURIComponent(state));
      stateData.redirectUrl = decoded.redirectUrl || FRONTEND_URL;
      stateData.role = decoded.role || role as string || 'BUYER';
      stateData.platform = decoded.platform || 'BVA'; // Extract platform from state
    } catch (e) {
      // If state is not JSON, treat it as redirectUrl
      stateData.redirectUrl = state;
      stateData.role = (role as string) || 'BUYER';
      // Detect platform from redirectUrl
      if (stateData.redirectUrl.includes('5173') || stateData.redirectUrl.includes('shopee')) {
        stateData.platform = 'SHOPEE_CLONE';
      } else if (stateData.redirectUrl.includes('5174') || stateData.redirectUrl.includes('5175') || stateData.redirectUrl.includes('tiktokseller')) {
        stateData.platform = 'TIKTOK_CLONE';
      } else if (stateData.redirectUrl.includes('3001') || stateData.redirectUrl.includes('lazada')) {
        stateData.platform = 'LAZADA_CLONE';
      } else {
        stateData.platform = 'BVA';
      }
    }
  } else {
    // Use role from query if state not provided
    stateData.role = (role as string) || 'BUYER';
    // Detect platform from redirectUrl
    if (stateData.redirectUrl.includes('5173') || stateData.redirectUrl.includes('shopee')) {
      stateData.platform = 'SHOPEE_CLONE';
    } else if (stateData.redirectUrl.includes('5174') || stateData.redirectUrl.includes('5175') || stateData.redirectUrl.includes('tiktokseller')) {
      stateData.platform = 'TIKTOK_CLONE';
    } else if (stateData.redirectUrl.includes('3001') || stateData.redirectUrl.includes('lazada')) {
      stateData.platform = 'LAZADA_CLONE';
    } else {
      stateData.platform = 'BVA';
    }
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
    const isTikTokSellerClone = stateData.redirectUrl.includes('5174') || stateData.redirectUrl.includes('5175') || stateData.redirectUrl.includes('tiktokseller') || stateData.redirectUrl.includes('tiktok');
    const isLazadaClone = stateData.redirectUrl.includes('3001') || stateData.redirectUrl.includes('lazada') || stateData.redirectUrl.includes('localhost:3001');
    const errorPath = stateData.role === 'SELLER' 
      ? (isShopeeClone ? '/login' : isTikTokSellerClone ? '/login' : isLazadaClone ? '/seller-login' : '/login')
      : (isShopeeClone ? '/buyer-login' : isLazadaClone ? '/login' : '/login');
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
  // Default to TikTok seller clone (port 5174) for TikTok clone requests
  // Check referer first to detect TikTok clone or Lazada clone
  const referer = req.get('referer') || '';
  const isTikTokReferer = referer.includes('5174') || referer.includes('5175') || referer.includes('tiktokseller') || referer.includes('tiktok');
  const isLazadaReferer = referer.includes('3001') || referer.includes('lazada');
  let redirectUrl = isTikTokReferer ? 'http://localhost:5174' : isLazadaReferer ? 'http://localhost:3001' : FRONTEND_URL;
  let role: string = 'BUYER';
  let platform: string = 'BVA'; // Initialize platform variable
  let decodedState: { redirectUrl: string; role?: string; platform?: string } | null = null;

  try {
    if (state) {
      decodedState = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
      if (decodedState) {
        if (decodedState.redirectUrl) {
          // Validate redirect URL is in allowed list
          // IMPORTANT: Ensure frontend users stay in their respective frontends, never redirect to wrong frontend
          const requestedUrl = decodedState.redirectUrl;
          const isShopeeCloneRequest = requestedUrl.includes('5173') || requestedUrl.includes('shopee') || requestedUrl.includes('localhost:5173');
          const isTikTokSellerCloneRequest = requestedUrl.includes('5174') || requestedUrl.includes('5175') || requestedUrl.includes('tiktokseller') || requestedUrl.includes('tiktok') && requestedUrl.includes('seller');
          const isLazadaCloneRequest = requestedUrl.includes('3001') || requestedUrl.includes('lazada') || requestedUrl.includes('localhost:3001');
          
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
            } else if (isTikTokSellerCloneRequest) {
              // If request came from tiktokseller-clone, ensure we redirect back to tiktokseller-clone
              // Try to preserve the original port, otherwise default to 5174
              if (baseUrl.includes('5174')) {
                redirectUrl = 'http://localhost:5174';
              } else if (baseUrl.includes('5175')) {
                redirectUrl = 'http://localhost:5175';
              } else if (baseUrl.includes('tiktokseller-clone.vercel.app')) {
                redirectUrl = 'https://tiktokseller-clone.vercel.app';
              } else {
                redirectUrl = 'http://localhost:5174'; // Default to 5174
              }
            } else if (isLazadaCloneRequest) {
              // If request came from lazada-clone, ensure we redirect back to lazada-clone
              redirectUrl = baseUrl.includes('3001') ? baseUrl : 'http://localhost:3001';
            } else {
              redirectUrl = baseUrl;
            }
          } else {
            console.warn(`⚠️  Redirect URL base not in allowed list: ${baseUrl}, requested: ${requestedUrl}, using default: ${redirectUrl}`);
            // If request came from shopee-clone but URL not in allowed list, default to shopee-clone
            if (isShopeeCloneRequest) {
              redirectUrl = 'http://localhost:5173';
            } else if (isTikTokSellerCloneRequest) {
              // ALWAYS default to tiktokseller-clone port 5174
              redirectUrl = 'http://localhost:5174';
              console.log(`🔧 TikTok clone request detected, forcing redirectUrl to port 5174: ${redirectUrl}`);
            } else if (isLazadaCloneRequest) {
              redirectUrl = 'http://localhost:3001';
              console.log(`🔧 Lazada clone request detected, forcing redirectUrl to port 3001: ${redirectUrl}`);
            } else if (platform === 'TIKTOK_CLONE') {
              // If platform is TIKTOK_CLONE, force port 5174
              redirectUrl = 'http://localhost:5174';
              console.log(`🔧 Platform TIKTOK_CLONE detected, forcing redirectUrl to port 5174: ${redirectUrl}`);
            } else if (platform === 'LAZADA_CLONE') {
              redirectUrl = 'http://localhost:3001';
              console.log(`🔧 Platform LAZADA_CLONE detected, forcing redirectUrl to port 3001: ${redirectUrl}`);
            }
          }
        }
        if (decodedState.role) {
          role = decodedState.role;
        }
        if (decodedState.platform) {
          platform = decodedState.platform;
          // If platform is TIKTOK_CLONE, ensure redirectUrl is port 5174
          if (platform === 'TIKTOK_CLONE' && !redirectUrl.includes('5174') && !redirectUrl.includes('5175') && !redirectUrl.includes('tiktokseller-clone.vercel.app')) {
            redirectUrl = 'http://localhost:5174';
            console.log(`🔧 Platform TIKTOK_CLONE detected, setting redirectUrl to port 5174: ${redirectUrl}`);
          }
          // If platform is LAZADA_CLONE, ensure redirectUrl is port 3001
          if (platform === 'LAZADA_CLONE' && !redirectUrl.includes('3001') && !redirectUrl.includes('lazada-clone.vercel.app')) {
            redirectUrl = 'http://localhost:3001';
            console.log(`🔧 Platform LAZADA_CLONE detected, setting redirectUrl to port 3001: ${redirectUrl}`);
          }
        }
      }
    }
  } catch (e) {
    console.error("Invalid state parameter:", e);
    // On error, check if the request might be from a specific frontend by checking referer
    const referer = req.get('referer') || '';
    if (referer.includes('5173') || referer.includes('shopee')) {
      redirectUrl = 'http://localhost:5173';
    } else if (referer.includes('5174') || referer.includes('5175') || referer.includes('tiktokseller') || referer.includes('tiktok')) {
      redirectUrl = referer.includes('5175') ? 'http://localhost:5175' : 'http://localhost:5174';
    } else if (referer.includes('3001') || referer.includes('lazada')) {
      redirectUrl = 'http://localhost:3001';
    } else if (platform === 'TIKTOK_CLONE') {
      // If platform is explicitly TIKTOK_CLONE, always use port 5174
      redirectUrl = 'http://localhost:5174';
    } else if (platform === 'LAZADA_CLONE') {
      redirectUrl = 'http://localhost:3001';
    } else {
      // Default to shopee-clone (port 5173) instead of bva-frontend
      redirectUrl = FRONTEND_URL.includes('5173') ? FRONTEND_URL : 'http://localhost:5173';
    }
  }
  
  // Determine failure redirect based on role and frontend
  // IMPORTANT: Frontend users should NEVER redirect to wrong frontend
  const isShopeeClone = redirectUrl.includes('5173') || redirectUrl.includes('shopee') || redirectUrl.includes('localhost:5173');
  const isTikTokSellerClone = redirectUrl.includes('5174') || redirectUrl.includes('5175') || redirectUrl.includes('tiktokseller') || redirectUrl.includes('tiktok');
  const isLazadaClone = redirectUrl.includes('3001') || redirectUrl.includes('lazada') || redirectUrl.includes('localhost:3001');
  const failurePath = role === 'SELLER' 
    ? (isShopeeClone ? '/login' : isTikTokSellerClone ? '/login' : isLazadaClone ? '/seller-login' : '/login?error=google_auth_failed')
    : (isShopeeClone ? '/buyer-login' : isLazadaClone ? '/login' : '/login?error=google_auth_failed');
  const failureRedirect = `${redirectUrl}${failurePath}`;

  passport.authenticate("google", {
    session: false,
    failureRedirect: failureRedirect,
  }) (req, res, async (err: any) => {
    if (err) {
      console.error("❌ Google OAuth authentication error:", err);
      console.error("Error details:", {
        message: err.message,
        stack: err.stack,
        name: err.name,
        code: err.code
      });
      // IMPORTANT: Frontend users should NEVER redirect to wrong frontend
      const isShopeeClone = redirectUrl.includes('5173') || redirectUrl.includes('shopee') || redirectUrl.includes('localhost:5173');
      const isTikTokSellerClone = redirectUrl.includes('5174') || redirectUrl.includes('5175') || redirectUrl.includes('tiktokseller') || redirectUrl.includes('tiktok');
      const isLazadaClone = redirectUrl.includes('3001') || redirectUrl.includes('lazada') || redirectUrl.includes('localhost:3001');
      const errorPath = role === 'SELLER' 
        ? (isShopeeClone ? '/login' : isTikTokSellerClone ? '/login' : isLazadaClone ? '/seller-login' : '/login')
        : (isShopeeClone ? '/buyer-login' : isLazadaClone ? '/login' : '/login');
      const errorMessage = err.message || err.toString() || 'Authentication failed';
      console.error(`Redirecting to error page: ${redirectUrl}${errorPath}?error=google_auth_failed&details=${encodeURIComponent(errorMessage)}`);
      return res.redirect(`${redirectUrl}${errorPath}?error=google_auth_failed&details=${encodeURIComponent(errorMessage)}`);
    }
    
    // Check if authentication failed (no user in request)
    if (!req.user) {
      console.error("❌ Google OAuth: No user in request after authentication");
      const isShopeeClone = redirectUrl.includes('5173') || redirectUrl.includes('shopee') || redirectUrl.includes('localhost:5173');
      const isTikTokSellerClone = redirectUrl.includes('5174') || redirectUrl.includes('5175') || redirectUrl.includes('tiktokseller') || redirectUrl.includes('tiktok');
      const isLazadaClone = redirectUrl.includes('3001') || redirectUrl.includes('lazada') || redirectUrl.includes('localhost:3001');
      const errorPath = role === 'SELLER' 
        ? (isShopeeClone ? '/login' : isTikTokSellerClone ? '/login' : isLazadaClone ? '/seller-login' : '/login')
        : (isShopeeClone ? '/buyer-login' : isLazadaClone ? '/login' : '/login');
      return res.redirect(`${redirectUrl}${errorPath}?error=google_auth_failed&details=${encodeURIComponent('No user returned from Google OAuth')}`);
    }
    
    try {
      let user = req.user as any;

      if (!user) {
        console.error("No user returned from Google OAuth");
        // IMPORTANT: Frontend users should NEVER redirect to wrong frontend
        const isShopeeClone = redirectUrl.includes('5173') || redirectUrl.includes('shopee') || redirectUrl.includes('localhost:5173');
        const isTikTokSellerClone = redirectUrl.includes('5174') || redirectUrl.includes('5175') || redirectUrl.includes('tiktokseller') || redirectUrl.includes('tiktok');
        const errorPath = role === 'SELLER' 
          ? (isShopeeClone ? '/login' : isTikTokSellerClone ? '/login' : '/login')
          : (isShopeeClone ? '/buyer-login' : '/login');
        return res.redirect(`${redirectUrl}${errorPath}?error=no_user`);
      }

      // CRITICAL: Platform isolation - Check if user exists for THIS platform
      // If user from passport strategy exists but for different platform, create new user for this platform
      const userPlatform = (platform as "SHOPEE_CLONE" | "TIKTOK_CLONE" | "BVA") || "BVA";
      
      // Find user for this specific platform
      let platformUser = await prisma.user.findUnique({
        where: {
          email_platform: {
            email: user.email,
            platform: userPlatform,
          }
        },
      });

      // If user doesn't exist for this platform, create new user for this platform
      if (!platformUser) {
        console.log(`🔄 Creating new user for platform ${userPlatform} with email ${user.email}`);
        
        // Create new user with platform isolation
        platformUser = await prisma.user.create({
          data: {
            email: user.email,
            password: null,
            googleId: user.googleId || null,
            name: user.name || user.firstName || null,
            firstName: user.firstName || null,
            lastName: user.lastName || null,
            role: role === 'SELLER' ? 'SELLER' : 'BUYER',
            platform: userPlatform,
          },
        });

        // Create shop if seller - MUST be created in transaction
        if (platformUser.role === 'SELLER') {
          console.log(`🛍️ Creating shop for new SELLER user ${platformUser.id} on platform ${userPlatform}`);
          try {
            await prisma.shop.create({
              data: {
                name: `${platformUser.name || platformUser.firstName || platformUser.email?.split("@")[0] || "My"}'s Shop`,
                ownerId: platformUser.id,
              },
            });
            console.log(`✅ Shop created successfully for user ${platformUser.id}`);
          } catch (shopError: any) {
            console.error(`❌ Failed to create shop for user ${platformUser.id}:`, shopError);
            // Re-throw to prevent user creation without shop
            throw new Error(`Failed to create shop: ${shopError.message}`);
          }
        }
      } else {
        // User exists for this platform - update role based on WHERE they logged in
        // Role is determined by the login page (seller page = SELLER, buyer page = BUYER)
        const requestedRole = role === 'SELLER' ? 'SELLER' : 'BUYER';
        
        if (platformUser.role !== requestedRole) {
          console.log(`🔄 Updating user ${platformUser.id} role from ${platformUser.role} to ${requestedRole} (based on login page)`);
          platformUser = await prisma.user.update({
            where: { id: platformUser.id },
            data: { role: requestedRole },
          });
        }
        
        // Create shop if seller and doesn't have one
        // Note: We don't delete shops when user logs in as BUYER - shop remains for when they log in as SELLER again
        const existingShops = await prisma.shop.findMany({
          where: { ownerId: platformUser.id },
          select: { id: true, name: true },
        });
        
        if (platformUser.role === 'SELLER' && existingShops.length === 0) {
          console.log(`🛍️ Creating shop for SELLER user ${platformUser.id} who doesn't have one`);
          try {
            await prisma.shop.create({
              data: {
                name: `${platformUser.name || platformUser.firstName || platformUser.email?.split("@")[0] || "My"}'s Shop`,
                ownerId: platformUser.id,
              },
            });
            console.log(`✅ Shop created successfully for user ${platformUser.id}`);
          } catch (shopError: any) {
            console.error(`❌ Failed to create shop for user ${platformUser.id}:`, shopError);
            throw new Error(`Failed to create shop: ${shopError.message}`);
          }
        }
      }

      // Ensure shop exists for SELLER (final safety check)
      if (platformUser.role === 'SELLER') {
        const existingShops = await prisma.shop.findMany({
          where: { ownerId: platformUser.id },
          select: { id: true, name: true },
        });
        
        if (existingShops.length === 0) {
          console.log(`⚠️ Final safety check: No shop found for SELLER ${platformUser.id}, creating one...`);
          try {
            await prisma.shop.create({
              data: {
                name: `${platformUser.name || platformUser.firstName || platformUser.email?.split("@")[0] || "My"}'s Shop`,
                ownerId: platformUser.id,
              },
            });
            console.log(`✅ Shop created in final safety check for user ${platformUser.id}`);
          } catch (shopError: any) {
            console.error(`❌ CRITICAL: Failed to create shop in final safety check for user ${platformUser.id}:`, shopError);
            // This is critical - user cannot proceed without shop
            throw new Error(`Critical error: Failed to create shop for seller account. Please contact support.`);
          }
        }
      }

      // Get shops for the platform user (should always have at least one if SELLER)
      const shops = await prisma.shop.findMany({
        where: { ownerId: platformUser.id },
        select: { id: true, name: true },
      });

      // Final verification - if SELLER and no shops, this is a critical error
      if (platformUser.role === 'SELLER' && shops.length === 0) {
        console.error(`❌ CRITICAL ERROR: SELLER user ${platformUser.id} has no shops after all checks!`);
        throw new Error(`Critical error: Seller account has no shop. Please contact support.`);
      }

      // Generate token with shops and shopId
      const shopId = shops.length > 0 && shops[0] ? shops[0].id : null;
      const token = jwt.sign(
        { 
          userId: platformUser.id, 
          role: platformUser.role,
          email: platformUser.email,
          name: platformUser.name || platformUser.firstName || 'User',
          shopId: shopId, // Include shopId for compatibility
          Shop: shops.map((s: { id: string; name: string }) => ({ id: s.id, name: s.name }))
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRATION } as jwt.SignOptions
      );
      
      console.log(`🔑 Generated OAuth token for user ${platformUser.id} with ${shops.length} shop(s), shopId: ${shopId}`);
      
      // Determine destination based on role and frontend
      // IMPORTANT: Frontend users should NEVER redirect to wrong frontend
      const isShopeeClone = redirectUrl.includes('5173') || redirectUrl.includes('shopee') || redirectUrl.includes('localhost:5173');
      const isTikTokSellerClone = redirectUrl.includes('5174') || redirectUrl.includes('5175') || redirectUrl.includes('tiktokseller') || redirectUrl.includes('tiktok');
      let destination = '/';
      
      if (isShopeeClone) {
        // Shopee clone: redirect based on role - ALWAYS stay in shopee-clone
        if (platformUser.role === 'SELLER') {
          destination = '/login?token=' + token;
        } else {
          // For buyers, redirect to landing page with token - frontend will handle it
          destination = '/?token=' + token;
        }
        console.log(`✅ Google OAuth success (Shopee-Clone) - Redirecting ${platformUser.role} to: ${redirectUrl}${destination}`);
      } else if (isLazadaClone) {
        // Lazada clone: redirect based on role
        if (platformUser.role === 'SELLER') {
          destination = '/seller-login?token=' + token;
        } else {
          destination = '/?token=' + token;
        }
        console.log(`✅ Google OAuth success (Lazada-Clone) - Redirecting ${platformUser.role} to: ${redirectUrl}${destination}`);
      } else if (isTikTokSellerClone || platform === 'TIKTOK_CLONE') {
        // TikTok Seller Clone: ALWAYS use port 5174, ALWAYS redirect to seller dashboard
        // Force redirectUrl to port 5174 to prevent redirecting to wrong port
        redirectUrl = 'http://localhost:5174'; // ALWAYS force port 5174
        console.log(`🔧 Forcing redirectUrl to port 5174 for TikTok Seller Clone: ${redirectUrl}`);
        
        // For tiktokseller-clone, ALL users should go to seller dashboard
        // User requirement: "login or register account in tiktokseller-clone should only redirected on sellers page"
        destination = '/login?token=' + token; // Always redirect to /login, frontend will show dashboard
        console.log(`✅ Google OAuth success (TikTok-Seller-Clone) - Redirecting ${platformUser.role} to seller dashboard: ${redirectUrl}${destination}`);
      } else {
        // BVA frontend: always use /login
        destination = '/login?token=' + token;
        console.log(`✅ Google OAuth success (BVA Frontend) - Redirecting to: ${redirectUrl}${destination}`);
      }
      
      res.redirect(`${redirectUrl}${destination}`);

    } catch (error: any) {
      console.error("Google callback error:", error);
      const errorMessage = error?.message || 'Token generation failed';
      // IMPORTANT: Frontend users should NEVER redirect to wrong frontend
      const isShopeeClone = redirectUrl.includes('5173') || redirectUrl.includes('shopee') || redirectUrl.includes('localhost:5173');
      const isTikTokSellerClone = redirectUrl.includes('5174') || redirectUrl.includes('5175') || redirectUrl.includes('tiktokseller') || redirectUrl.includes('tiktok');
      const isLazadaClone = redirectUrl.includes('3001') || redirectUrl.includes('lazada') || redirectUrl.includes('localhost:3001');
      const errorPath = role === 'SELLER' 
        ? (isShopeeClone ? '/login' : isTikTokSellerClone ? '/login' : isLazadaClone ? '/seller-login' : '/login')
        : (isShopeeClone ? '/buyer-login' : isLazadaClone ? '/login' : '/login');
      res.redirect(`${redirectUrl}${errorPath}?error=token_generation_failed&details=${encodeURIComponent(errorMessage)}`);
    }
  });
});

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
 * @route   GET /api/auth/profile
 * @desc    Get current user profile (returns user object directly for Lazada-Clone compatibility)
 * @access  Private
 */
router.get("/profile", authMiddleware, (req: Request, res: Response) =>
  authController.getProfile(req, res)
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
// Called by external webhook services
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

    // Find user by Facebook ID (try all platforms)
    const user = await prisma.user.findFirst({
      where: { facebookId: facebookUserId },
      include: {
        Shop: true,
        SocialMediaAccount: true,
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
    if (user.Shop && user.Shop.length > 0) {
      for (const shop of user.Shop) {
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
