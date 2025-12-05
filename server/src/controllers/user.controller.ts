import { Request, Response } from "express";
import { UserService } from "../service/user.service";
import { generateToken } from "../utils/jwt";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";

const userService = new UserService();

export class UserController {
  // Register a new user
  async register(req: Request, res: Response) {
    try {
      const { email, password, name } = req.body;
      
      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: "Email already exists. Please use a different email or login instead.",
        });
      }
      
      // Use transaction to ensure shop creation happens with user
      const result = await prisma.$transaction(async (tx) => {
        // Create user
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            name: name ?? null,
            role: "SELLER" // Default role
          }
        });

        // Create shop for SELLER
        const shop = await tx.shop.create({
          data: {
            name: `${name || email.split("@")[0]}'s Shop`,
            ownerId: user.id,
          }
        });

        return { user, shop };
      });

      const { password: _, ...userWithoutPassword } = result.user;
      const token = generateToken(
        result.user.id, 
        result.user.email, 
        result.user.name || undefined, 
        result.user.role, 
        result.shop.id
      );

      res.status(201).json({
        success: true,
        data: {
          ...userWithoutPassword,
          shops: [{ id: result.shop.id, name: result.shop.name }]
        },
        token,
        message: "User registered successfully",
      });
    } catch (error: any) {
      // Handle Prisma unique constraint errors
      if (error.code === 'P2002') {
        return res.status(400).json({
          success: false,
          error: "Email already exists. Please use a different email or login instead.",
        });
      }
      
      res.status(400).json({
        success: false,
        error: error.message || "Registration failed. Please try again.",
      });
    }
  }

  // Login
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const user = await userService.login(email, password);

      // Fetch user's shop if they're a seller
      const userShops = await prisma.shop.findMany({
        where: { ownerId: user.id },
        select: { id: true, name: true }
      });
      const shopId = userShops[0]?.id;

      const { password: _, ...userWithoutPassword } = user;
      const token = generateToken(user.id, user.email, user.name || undefined, user.role, shopId);

      res.json({
        success: true,
        data: {
          ...userWithoutPassword,
          shops: userShops
        },
        token,
        message: "Login successful",
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        error: error.message,
      });
    }
  }

  async list(req: Request, res: Response) {
    try {
      const users = await userService.list();
      // Remove passwords from list
      const safeUsers = users.map((u) => {
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
      const userId = (req as any).user.id;
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
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Update password
  async updatePassword(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
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
