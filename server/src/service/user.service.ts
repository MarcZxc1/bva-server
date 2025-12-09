import prisma from "../lib/prisma";
import { User, Prisma, Role } from "../generated/prisma";
import bcrypt from "bcrypt";
import { LoginAttemptService } from "./loginAttempt.service";

export class UserService {
  async register(email: string, password: string, name?: string) {
    return await prisma.user.create({
      data: {
        email: email,
        password: password,
        name: name ?? null,
      },
    });
  }

  async findByEmail(email: string) {
    return await prisma.user.findUnique({
      where: {
        email: email,
      },
    });
  }

  async list() {
    return await prisma.user.findMany({
      include: {
        shops: true,
      },
    });
  }

  async login(email: string, password: string) {
    // Check if account is locked
    const lockStatus = await LoginAttemptService.isLocked(email);
    if (lockStatus.locked) {
      const minutes = Math.floor((lockStatus.remainingSeconds || 0) / 60);
      const seconds = (lockStatus.remainingSeconds || 0) % 60;
      throw new Error(
        `Account temporarily locked due to too many failed login attempts. Please try again in ${minutes}m ${seconds}s.`
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        shops: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Record failed attempt if user doesn't exist (don't reveal if email exists)
    if (!user) {
      await LoginAttemptService.recordFailedAttempt(email);
      throw new Error("Invalid email or password");
    }

    // Check if user has a password (not a Google OAuth user)
    if (!user.password) {
      await LoginAttemptService.recordFailedAttempt(email);
      throw new Error("This account uses Google OAuth. Please sign in with Google.");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // Record failed attempt
      const attemptResult = await LoginAttemptService.recordFailedAttempt(email);
      
      // If account is now locked, throw lockout error
      if (attemptResult.locked) {
        const minutes = Math.floor((attemptResult.remainingSeconds || 0) / 60);
        const seconds = (attemptResult.remainingSeconds || 0) % 60;
        throw new Error(
          `Too many failed login attempts. Account locked for ${minutes}m ${seconds}s. Please try again later.`
        );
      }

      // Get remaining attempts for error message
      const remainingAttempts = await LoginAttemptService.getRemainingAttempts(email);
      throw new Error(
        remainingAttempts > 0
          ? `Invalid email or password. ${remainingAttempts} attempt${remainingAttempts > 1 ? 's' : ''} remaining.`
          : "Invalid email or password"
      );
    }

    // Successful login - clear all attempts
    await LoginAttemptService.clearAttempts(email);

    return user;
  }

  async updateProfile(userId: string, data: { firstName?: string; lastName?: string; email?: string }) {
    // If email is being updated, check if it's already taken by another user
    if (data.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });
      
      if (existingUser && existingUser.id !== userId) {
        throw new Error("Email is already in use");
      }
    }

    // Update name based on first and last name if provided
    let nameUpdate = {};
    if (data.firstName || data.lastName) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const currentName = user?.name || "";
      const firstName = data.firstName || (user?.firstName ?? currentName.split(" ")[0]);
      const lastName = data.lastName || (user?.lastName ?? currentName.split(" ").slice(1).join(" "));
      
      nameUpdate = {
        name: `${firstName} ${lastName}`.trim(),
      };
    }

    return await prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        ...nameUpdate,
      },
    });
  }

  async updatePassword(userId: string, passwordHash: string) {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        password: passwordHash,
      },
    });
  }

  async findById(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
    });
  }

  /**
   * Sync user from Shopee-Clone system
   * Handles both existing and new users, with role-based shop creation
   */
  async syncShopeeUser(payload: {
    email: string;
    name?: string;
    role: "SELLER" | "BUYER";
    shopeeId: string;
    password?: string;
  }) {
    const { email, name, role, shopeeId, password } = payload;

    // Check if user already exists by email
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      // User exists - update shopeeId if missing
      if (!user.shopeeId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { shopeeId },
        });
      }
      return user;
    }

    // Check if user exists by shopeeId (in case email changed)
    user = await prisma.user.findFirst({
      where: { shopeeId },
    });

    if (user) {
      // Update email if it changed
      if (user.email !== email) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { email },
        });
      }
      return user;
    }

    // New user - create account
    // Hash password if provided
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    // Create user with appropriate role
    // Handle race condition where email might be created between check and create
    try {
      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          shopeeId,
          name: name || null,
          role: role === "SELLER" ? Role.SELLER : Role.BUYER,
        },
      });
    } catch (error: any) {
      // If email already exists (race condition), fetch the existing user
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        user = await prisma.user.findUnique({
          where: { email },
        });
        if (!user) {
          throw new Error("Failed to create user: email conflict");
        }
        // Update shopeeId if missing
        if (!user.shopeeId && shopeeId) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { shopeeId },
          });
        }
        return user;
      }
      throw error;
    }

    // If role is SELLER, create shop (no automatic data seeding)
    // Data will come from Shopee-Clone webhooks when user connects their account
    if (role === "SELLER") {
      await prisma.shop.create({
        data: {
          name: `${name || "My"}'s Shop`,
          ownerId: user.id,
        },
      });
    }

    // If role is BUYER, no shop or seeding needed
    // They just get a user account for future features

    return user;
  }
}
