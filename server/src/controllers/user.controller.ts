import { Request, Response } from "express";
import { UserService } from "../service/user.service";
import { generateToken } from "../utils/jwt";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import { shopSeedService } from "../service/shopSeed.service";

const userService = new UserService();

export class UserController {
  // Register a new user
  async register(req: Request, res: Response) {
    try {
      const { email, password, name } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: "Email and password are required",
        });
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: "Please provide a valid email address",
        });
      }

      // Password length validation
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: "Password must be at least 6 characters long",
        });
      }
      
      // Extract platform from request body, default to BVA
      const userPlatform = (req.body.platform || "BVA") as "SHOPEE_CLONE" | "TIKTOK_CLONE" | "BVA";
      
      // Check if email already exists for this platform
      const existingUser = await prisma.user.findUnique({
        where: { 
          email_platform: {
            email,
            platform: userPlatform as any,
          }
        }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: "Email already exists. Please use a different email or login instead.",
        });
      }
      
      // Validate password is hashed (should be from middleware)
      if (!password || typeof password !== 'string') {
        return res.status(400).json({
          success: false,
          error: "Password is required",
        });
      }

      // Use transaction to ensure shop creation happens with user
      const result = await prisma.$transaction(async (tx: any) => {
        // Double-check email doesn't exist for this platform (race condition protection)
        const existingUserInTx = await tx.user.findUnique({
          where: { 
            email_platform: {
              email,
              platform: userPlatform as any,
            }
          }
        });

        if (existingUserInTx) {
          throw new Error("EMAIL_EXISTS");
        }

        // Get role from request body, default to SELLER for seller registration
        const role = (req.body.role === "BUYER" || req.body.role === "SELLER") 
          ? req.body.role 
          : "SELLER"; // Default to SELLER for this endpoint
        
        // Create user
        // Password is already hashed by hashPasswordMiddleware, so use it directly
        let user;
        try {
          user = await tx.user.create({
            data: {
              email,
              password: password, // Already hashed by middleware
              name: name ?? null,
              role: role,
              platform: userPlatform as any, // Platform isolation
            }
          });
        } catch (error: any) {
          // Handle Prisma unique constraint error (race condition)
          if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
            throw new Error("EMAIL_EXISTS");
          }
          throw error;
        }

        // Shop creation will be handled by shopSeedService after transaction
        // to ensure platform-specific shop creation

        return { user };
      });

      const { password: _, ...userWithoutPassword } = result.user;
      
      // Create platform-specific shop if SELLER
      let shopId: string | undefined;
      let shops: Array<{ id: string; name: string }> = [];
      if (result.user.role === "SELLER") {
        try {
          const shop = await shopSeedService.getOrCreateShopForUser(result.user.id, userPlatform);
          if (shop) {
            shops = [{ id: shop.id, name: shop.name }];
            shopId = shop.id;
            console.log(`✅ Platform-specific shop created for user ${result.user.id} on ${userPlatform}: ${shop.id}`);
          }
        } catch (shopError: any) {
          console.error(`❌ Failed to create platform-specific shop:`, shopError);
          // Don't fail registration, but log the error
        }
      }
      const token = generateToken(
        result.user.id, 
        result.user.email, 
        result.user.name || undefined, 
        result.user.role, 
        shopId || undefined
      );

      res.status(201).json({
        success: true,
        data: {
          ...userWithoutPassword,
          shops, // Return as 'shops' array for frontend compatibility
          Shop: shops, // Also include 'Shop' for backward compatibility
        },
        token,
        message: "User registered successfully",
      });
    } catch (error: any) {
      // Handle Prisma unique constraint errors and race conditions
      if (error.code === 'P2002' || error.message === "EMAIL_EXISTS") {
        return res.status(400).json({
          success: false,
          error: "Email already exists. Please use a different email or login instead.",
        });
      }
      
      console.error("Registration error:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Registration failed. Please try again.",
      });
    }
  }

  // Login
  async login(req: Request, res: Response) {
    try {
      const { email, password, platform } = req.body;
      const userPlatform = (platform || "BVA") as "SHOPEE_CLONE" | "TIKTOK_CLONE" | "BVA";

      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: "Email and password are required",
        });
      }

      const user = await userService.login(email, password, userPlatform);

      // Fetch user's platform-specific shop if they're a seller
      let userShops: Array<{ id: string; name: string }> = [];
      let shopId: string | undefined;
      
      if (user.role === "SELLER") {
        try {
          const shop = await shopSeedService.getOrCreateShopForUser(user.id, userPlatform);
          if (shop) {
            userShops = [{ id: shop.id, name: shop.name }];
            shopId = shop.id;
          }
        } catch (shopError: any) {
          console.error(`❌ Failed to get/create platform-specific shop during login:`, shopError);
          // Fallback: query existing shops
          const fallbackShops = await prisma.shop.findMany({
        where: { ownerId: user.id },
        select: { id: true, name: true }
      });
          userShops = fallbackShops;
          shopId = fallbackShops[0]?.id;
        }
      }

      const { password: _, ...userWithoutPassword } = user;
      const token = generateToken(user.id, user.email, user.name || undefined, user.role, shopId);

      res.status(200).json({
        success: true,
        data: {
          ...userWithoutPassword,
          Shop: userShops
        },
        token,
        message: "Login successful",
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(401).json({
        success: false,
        error: error.message || "Invalid email or password",
      });
    }
  }

  async list(req: Request, res: Response) {
    try {
      const users = await userService.list();
      // Remove passwords from list
      const safeUsers = users.map((u: any) => {
        const { password, ...rest } = u;
        return rest;
      });

      res.json({
        success: true,
        data: safeUsers,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Update user profile
  async updateProfile(req: Request, res: Response) {
    try {
      // JWT token contains userId (not id), and authMiddleware sets req.user = decoded token
      const decoded = (req as any).user;
      const userId = decoded?.userId || decoded?.id;
      
      if (!userId) {
        console.error("User ID not found in request:", { 
          user: decoded,
          hasUser: !!(req as any).user,
          keys: decoded ? Object.keys(decoded) : []
        });
        return res.status(401).json({
          success: false,
          error: "User ID not found in request. Please ensure you are authenticated.",
        });
      }

      const { firstName, lastName, email } = req.body;

      const updatedUser = await userService.updateProfile(userId, {
        firstName,
        lastName,
        email,
      });

      const { password: _, ...userWithoutPassword } = updatedUser;

      res.json({
        success: true,
        data: userWithoutPassword,
        message: "Profile updated successfully",
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Update password
  async updatePassword(req: Request, res: Response) {
    try {
      const decoded = (req as any).user;
      const userId = decoded?.userId || decoded?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "User ID not found in request. Please ensure you are authenticated.",
        });
      }
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          error: "Current and new password are required",
        });
      }

      // Verify current password
      const user = await userService.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      // Check if user has a password (not a Google OAuth user)
      if (!user.password) {
        return res.status(400).json({
          success: false,
          error: "This account uses Google OAuth. Password cannot be changed.",
        });
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          error: "Invalid current password",
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await userService.updatePassword(userId, hashedPassword);

      res.json({
        success: true,
        message: "Password updated successfully",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Sync user from Shopee-Clone system
  async syncShopeeUser(req: Request, res: Response) {
    try {
      const { email, name, role, shopeeId, password } = req.body;

      // Validate required fields
      if (!email || !role || !shopeeId) {
        return res.status(400).json({
          success: false,
          error: "Email, role, and shopeeId are required",
        });
      }

      // Validate role
      if (role !== "SELLER" && role !== "BUYER") {
        return res.status(400).json({
          success: false,
          error: "Role must be either 'SELLER' or 'BUYER'",
        });
      }

      // Sync user (creates or updates)
      const user = await userService.syncShopeeUser({
        email,
        name,
        role,
        shopeeId,
        password,
      });

      // Generate JWT token with userId and role
      const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
      const JWT_EXPIRATION = process.env.JWT_EXPIRATION || "24h";
      
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRATION } as jwt.SignOptions
      );

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      res.status(200).json({
        success: true,
        data: userWithoutPassword,
        token,
        message: role === "SELLER" 
          ? "Seller account synced successfully. Shop created and being populated with sample data."
          : "Buyer account synced successfully.",
      });
    } catch (error: any) {
      console.error("Shopee sync error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to sync user from Shopee-Clone",
      });
    }
  }
}
