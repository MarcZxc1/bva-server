// src/services/auth.service.ts
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// Validation Schemas
export const registerSchema = z.object({
  username: z.string().min(3).max(60),
  email: z.string().email().max(255),
  password: z.string().min(6).max(100),
  phoneNumber: z.string().max(30).optional(),
});

export const loginSchema = z.object({
  identifier: z.string(), // can be username or email
  password: z.string(),
});

// Explicit types to avoid ambient namespace issues with z.infer
export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  phoneNumber?: string;
}

export interface LoginInput {
  identifier: string;
  password: string;
}

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
  private readonly JWT_EXPIRATION = process.env.JWT_EXPIRATION || "24h";
  private readonly SALT_ROUNDS = 10;

  /**
   * Register a new user
   */
  async register(data: RegisterInput) {
    // Validate input
    const validated = registerSchema.parse(data) as RegisterInput;

    // Check if username already exists
    const existingUsername = await prisma.appUser.findUnique({
      where: { username: validated.username },
    });

    if (existingUsername) {
      throw new Error("Username already exists");
    }

    // Check if email already exists
    const existingEmail = await prisma.appUser.findUnique({
      where: { email: validated.email },
    });

    if (existingEmail) {
      throw new Error("Email already exists");
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validated.password, this.SALT_ROUNDS);

    // Create user with default role 'buyer'
    const user = await prisma.appUser.create({
      data: {
        username: validated.username,
        email: validated.email,
        passwordHash,
        phoneNumber: validated.phoneNumber || null,
        role: "buyer", // Default role
      },
      select: {
        userId: true,
        username: true,
        email: true,
        phoneNumber: true,
        role: true,
        coinsBalance: true,
        createdAt: true,
      },
    });

    // Generate JWT token
    const token = this.generateToken(user.userId.toString(), user.role);

    return {
      user,
      token,
    };
  }

  /**
   * Login user
   */
  async login(data: LoginInput) {
    // Validate input
    const validated = loginSchema.parse(data) as LoginInput;

    // Find user by email or username
    const user = await prisma.appUser.findFirst({
      where: {
        OR: [
          { email: validated.identifier },
          { username: validated.identifier },
        ],
      },
    });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      validated.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    // Generate JWT token
    const token = this.generateToken(user.userId.toString(), user.role);

    return {
      user: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        coinsBalance: user.coinsBalance,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string) {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as {
        userId: string;
        role: string;
      };
      return decoded;
    } catch (error) {
      throw new Error("Invalid or expired token");
    }
  }

  /**
   * Generate JWT token
   */
  private generateToken(userId: string, role: string): string {
    return jwt.sign(
      { userId, role },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRATION }
    );
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: bigint) {
    const user = await prisma.appUser.findUnique({
      where: { userId },
      select: {
        userId: true,
        username: true,
        email: true,
        phoneNumber: true,
        role: true,
        coinsBalance: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }
}

export const authService = new AuthService();
