// src/controllers/auth.controller.ts
import { Request, Response } from "express";
import { authService, RegisterInput, LoginInput, ShopeeSSOInput } from "../service/auth.service";
import prisma from "../lib/prisma";
import { shopSeedService } from "../service/shopSeed.service";
import { shopAccessService } from "../service/shopAccess.service";

export class AuthController {
  /**
   * Register a new user
   * POST /api/auth/register
   */
  async register(req: Request, res: Response) {
    try {
      const data: RegisterInput = req.body;

      if (!data.email || !data.password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required",
        });
      }

      if (data.password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters",
        });
      }

      // Validate role if provided
      if (data.role && !["ADMIN", "SELLER", "BUYER", "ANALYST"].includes(data.role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role. Must be one of: ADMIN, SELLER, BUYER, ANALYST",
        });
      }

      const result = await authService.register(data);

      // Ensure shops are always included in response
      const responseData = {
        user: result.user,
        shops: result.shops,// Always include shops array
        token: result.token,
      };

      console.log(`📤 Register response for user ${result.user?.id}:`, {
        role: result.user?.role,
        shopsCount: responseData.shops.length,
        shopIds: responseData.shops.map((s: any) => s.id),
      });

      return res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: responseData,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Email already exists") {
          return res.status(409).json({
            success: false,
            message: error.message,
          });
        }
      }

      console.error("Register error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  async login(req: Request, res: Response) {
    try {
      const data: LoginInput = req.body;

      if (!data.email || !data.password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required",
        });
      }

      const result = await authService.login(data);

      // Ensure shops are always included in response
      const responseData = {
        user: result.user,
        shops: result.shops || [], // Always include shops array
        token: result.token,
      };

      console.log(`📤 Login response for user ${result.user?.id}:`, {
        role: result.user?.role,
        shopsCount: responseData.shops.length,
        shopIds: responseData.shops.map((s: any) => s.id),
      });

      return res.status(200).json({
        success: true,
        message: "Login successful",
        data: responseData,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Invalid credentials") {
          return res.status(401).json({
            success: false,
            message: "Invalid email or password",
          });
        }
        if (error.message.includes("Google OAuth")) {
          return res.status(400).json({
            success: false,
            message: error.message,
          });
        }
      }

      console.error("Login error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Get current user profile (for /api/auth/profile - returns user object directly)
   * GET /api/auth/profile
   */
  async getProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const user = await authService.getUserById(userId);
      console.log(`🔍 getProfile: Retrieved user ${userId}, role: ${user.role}, platform: ${(user as any).platform}`);
      
      let shops: Array<{ id: string; name: string; platform: string }> = [];
      try {
        const userPlatform = (user as any).platform || "BVA";
        shops = await authService.getUserShops(userId, userPlatform);
        console.log(`🔍 getProfile: getUserShops returned ${shops.length} shops for user ${userId} on platform ${userPlatform}`);
      } catch (shopError: any) {
        console.error(`❌ getProfile: Error in getUserShops for user ${userId}:`, shopError);
        
        if (user.role === "SELLER") {
          try {
            const userPlatform = (user as any).platform || "BVA";
            const shop = await shopSeedService.getOrCreateShopForUser(userId, userPlatform);
            if (shop && shop.id && shop.name && shop.platform) {
              shops = [{ id: shop.id, name: shop.name, platform: shop.platform }];
            } else {
              shops = [];
            }
          } catch (directShopError: any) {
            console.error(`❌ Direct shop creation also failed:`, directShopError);
            shops = [];
          }
        } else {
          shops = [];
        }
      }

      // Include linked shops
      try {
        const linkedShops = await shopAccessService.getLinkedShops(userId);
        const shopMap = new Map<string, { id: string; name: string; platform: string }>();
        shops.forEach((shop: any) => shopMap.set(shop.id, shop));
        linkedShops.forEach((shop: any) => shopMap.set(shop.id, { id: shop.id, name: shop.name, platform: shop.platform }));
        shops = Array.from(shopMap.values());
      } catch (linkError: any) {
        console.error(`❌ getProfile: Error fetching linked shops:`, linkError);
      }

      // Return user object directly (for Lazada-Clone compatibility)
      const userData = {
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        shopeeId: (user as any).shopeeId,
        googleId: (user as any).googleId,
        platform: (user as any).platform,
        createdAt: user.createdAt,
        shops: shops,
      };

      return res.status(200).json(userData);
    } catch (error) {
      console.error("GetProfile error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return res.status(500).json({
        success: false,
        message: errorMessage.includes("shop") ? errorMessage : "Internal server error",
      });
    }
  }

  /**
   * Get current user profile
   * GET /api/auth/me
   */
  async getMe(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const user = await authService.getUserById(userId);
      console.log(`🔍 getMe: Retrieved user ${userId}, role: ${user.role}, platform: ${(user as any).platform}`);
      
      let shops: Array<{ id: string; name: string; platform: string }> = [];
      try {
        // Pass user's platform to getUserShops to get platform-specific shop
        const userPlatform = (user as any).platform || "BVA";
        shops = await authService.getUserShops(userId, userPlatform);
        console.log(`🔍 getMe: getUserShops returned ${shops.length} shops for user ${userId} on platform ${userPlatform}`);
      console.log(`🔍 getMe: Raw shops array:`, JSON.stringify(shops, null, 2));
      } catch (shopError: any) {
        console.error(`❌ getMe: Error in getUserShops for user ${userId}:`, shopError);
        console.error(`   Error details:`, shopError.message, shopError.stack);
        
        // If shop creation failed, try to create it directly as a fallback
        if (user.role === "SELLER") {
          try {
            const userPlatform = (user as any).platform || "BVA";
            console.log(`🔄 Attempting direct shop creation for user ${userId} on platform ${userPlatform}...`);
            const shop = await shopSeedService.getOrCreateShopForUser(userId, userPlatform);
            if (shop && shop.id && shop.name && shop.platform) {
              shops = [{ id: shop.id, name: shop.name, platform: shop.platform }];
              console.log(`✅ Direct shop creation succeeded: ${shop.id}`);
            } else {
              console.error(`❌ Direct shop creation returned invalid shop object`);
              shops = [];
            }
          } catch (directShopError: any) {
            console.error(`❌ Direct shop creation also failed:`, directShopError);
            console.error(`   Direct shop error details:`, directShopError.message, directShopError.stack);
            shops = [];
          }
        } else {
          shops = [];
        }
      }

      // Also include linked shops (for BVA users who linked Shopee-Clone shops)
      try {
        const linkedShops = await shopAccessService.getLinkedShops(userId);
        console.log(`🔍 getMe: Found ${linkedShops.length} linked shops for user ${userId}`);
        
        // Merge owned and linked shops, avoiding duplicates
        const shopMap = new Map<string, { id: string; name: string; platform: string }>();
        shops.forEach((shop: any) => shopMap.set(shop.id, shop));
        linkedShops.forEach((shop: any) => shopMap.set(shop.id, { id: shop.id, name: shop.name, platform: shop.platform }));
        shops = Array.from(shopMap.values());
        
        console.log(`🔍 getMe: Total shops (owned + linked): ${shops.length}`);
      } catch (linkError: any) {
        console.error(`❌ getMe: Error fetching linked shops:`, linkError);
        // Don't fail the request if linked shops can't be fetched
      }

      console.log(`📋 GET /api/auth/me for user ${userId} (role: ${user.role}), shops count: ${shops.length}`);
      if (shops.length > 0) {
        console.log(`   Shop IDs: ${shops.map((s: any) => s.id).join(', ')}`);
        console.log(`   Shop names: ${shops.map((s: any) => s.name).join(', ')}`);
      } else if (user.role === "SELLER") {
        console.warn(`⚠️ WARNING: SELLER user ${userId} has no shops after getUserShops call!`);
        // Double-check by querying database directly with platform filter
        const userPlatform = (user as any).platform || "BVA";
        let shopPlatform: "SHOPEE" | "TIKTOK" | "LAZADA" | "OTHER" = "SHOPEE";
        if (userPlatform === "SHOPEE_CLONE" || userPlatform === "SHOPEE" || userPlatform === "BVA") {
          shopPlatform = "SHOPEE";
        } else if (userPlatform === "TIKTOK_CLONE" || userPlatform === "TIKTOK") {
          shopPlatform = "TIKTOK";
        } else if (userPlatform === "LAZADA") {
          shopPlatform = "LAZADA";
        }
        const directShops = await prisma.shop.findMany({
          where: { 
            ownerId: userId,
            platform: shopPlatform,
          },
          select: { id: true, name: true, platform: true },
        });
        if (directShops.length > 0) {
          console.log(`   ⚠️ Found ${directShops.length} ${shopPlatform} shop(s) via direct query! Using these instead.`);
          shops = directShops;
        } else {
          console.warn(`   ⚠️ Direct query also found no ${shopPlatform} shops for SELLER ${userId}`);
        }
      }

      // Ensure shops is always an array in the response
      // Create responseData without spreading user first to avoid any property conflicts
      const shopsArray = Array.isArray(shops) ? shops : [];
      const responseData = {
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        shopeeId: (user as any).shopeeId,
        googleId: (user as any).googleId,
        platform: (user as any).platform,
        createdAt: user.createdAt,
        shops: shopsArray, // Explicitly set shops last to ensure it's not overridden
      };

      console.log(`📤 Sending /api/auth/me response:`, JSON.stringify(responseData, null, 2));

      return res.status(200).json({
        success: true,
        data: responseData,
      });
    } catch (error) {
      console.error("GetMe error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const errorStack = error instanceof Error ? error.stack : undefined;
      console.error("GetMe error details:", { message: errorMessage, stack: errorStack });
      return res.status(500).json({
        success: false,
        message: errorMessage.includes("shop") ? errorMessage : "Internal server error",
      });
    }
  }

  /**
   * Logout (client-side token removal)
   * POST /api/auth/logout
   */
  async logout(req: Request, res: Response) {
    return res.status(200).json({
      success: true,
      message: "Logout successful. Please remove the token from client.",
    });
  }

  /**
   * Shopee-Clone SSO Login
   * POST /api/auth/shopee-sso
   * 
   * This endpoint is called from the Shopee-Clone frontend when a seller
   * wants to use BVA features. It:
   * 1. Finds or creates the user in BVA based on their Shopee-Clone account
   * 2. Links their shopeeId to the BVA user
   * 3. Triggers a sync of their products and sales from Shopee-Clone
   * 4. Returns a JWT so they're instantly logged in
   */
  async shopeeSSOLogin(req: Request, res: Response) {
    try {
      const { shopeeUserId, email, name, role, apiKey }: ShopeeSSOInput = req.body;

      // Validate required fields
      if (!shopeeUserId || !email || !apiKey) {
        return res.status(400).json({
          success: false,
          message: "shopeeUserId, email, and apiKey are required",
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format",
        });
      }

      // Validate role if provided
      if (role && !["ADMIN", "SELLER", "BUYER", "ANALYST"].includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role. Must be one of: ADMIN, SELLER, BUYER, ANALYST",
        });
      }

      const result = await authService.shopeeSSOLogin({
        shopeeUserId,
        email,
        name,
        role,
        apiKey,
      });

      return res.status(200).json({
        success: true,
        message: result.isNewUser 
          ? "New account created and logged in successfully. Data sync started."
          : "Logged in successfully. Data sync started.",
        data: result,
      });
    } catch (error) {
      console.error("Shopee SSO error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Manually trigger Shopee-Clone data sync
   * POST /api/auth/shopee-sync
   */
  async triggerShopeeSync(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { apiKey } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      if (!apiKey) {
        return res.status(400).json({
          success: false,
          message: "apiKey is required",
        });
      }

      const result = await authService.triggerShopeeSync(userId, apiKey);

      return res.status(200).json({
        success: true,
        message: "Shopee-Clone data sync completed",
        data: result,
      });
    } catch (error) {
      console.error("Shopee sync error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}

export const authController = new AuthController();
