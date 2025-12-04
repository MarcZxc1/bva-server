import { Request, Response } from "express";
import { UserService } from "../service/user.service";
import { generateToken } from "../utils/jwt";
import bcrypt from "bcrypt";

const userService = new UserService();

export class UserController {
  // Register a new user
  async register(req: Request, res: Response) {
    try {
      const { email, password, name } = req.body;
      const user = await userService.register(email, password, name);

      // We don't want to return the password hash
      const { password: _, ...userWithoutPassword } = user;
      const token = generateToken(user.id);

      res.status(201).json({
        success: true,
        data: userWithoutPassword,
        token,
        message: "User registered successfully",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Login
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const user = await userService.login(email, password);

      const { password: _, ...userWithoutPassword } = user;
      const token = generateToken(user.id);

      res.json({
        success: true,
        data: userWithoutPassword,
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
}
