// src/controllers/auth.controller.ts
import { Request, Response } from "express";
import { authService, RegisterInput, LoginInput, ShopeeSSOInput } from "../service/auth.service";

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

      return res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: result,
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

      return res.status(200).json({
        success: true,
        message: "Login successful",
        data: result,
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

      return res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      console.error("GetMe error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
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
