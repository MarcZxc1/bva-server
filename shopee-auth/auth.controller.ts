// src/controllers/auth.controller.ts
import { Request, Response } from "express";
import { authService, RegisterInput, LoginInput } from "./auth.service";
import { ZodError } from "zod";

export class AuthController {
  /**
   * Register a new user
   * POST /api/auth/register
   */
  async register(req: Request, res: Response) {
    try {
      const data: RegisterInput = req.body;

      const result = await authService.register(data);

      return res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: result,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.errors,
        });
      }

      if (error instanceof Error) {
        // Handle specific errors
        if (
          error.message === "Username already exists" ||
          error.message === "Email already exists"
        ) {
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

      const result = await authService.login(data);

      return res.status(200).json({
        success: true,
        message: "Login successful",
        data: result,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.errors,
        });
      }

      if (error instanceof Error) {
        if (error.message === "Invalid credentials") {
          return res.status(401).json({
            success: false,
            message: "Invalid email/username or password",
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
      // User ID is attached by auth middleware
      const userId = (req as any).userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const user = await authService.getUserById(BigInt(userId));

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
}

export const authController = new AuthController();
