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

  async findByEmail(email: string, platform: "SHOPEE_CLONE" | "TIKTOK_CLONE" | "BVA" = "BVA") {
    return await prisma.user.findUnique({
      where: {
        email_platform: {
          email: email,
          platform: platform as any,
        },
      },
    });
  }

  async list() {
    return await prisma.user.findMany({
      include: {
        Shop: true,
      },
    });
  }

  async login(email: string, password: string, platform: "SHOPEE_CLONE" | "TIKTOK_CLONE" | "BVA" = "BVA") {
    // Check if account is locked
    const lockKey = `${email}:${platform}`;
    const lockStatus = await LoginAttemptService.isLocked(lockKey);
    if (lockStatus.locked) {
      const minutes = Math.floor((lockStatus.remainingSeconds || 0) / 60);
      const seconds = (lockStatus.remainingSeconds || 0) % 60;
      throw new Error(
        `Account temporarily locked due to too many failed login attempts. Please try again in ${minutes}m ${seconds}s.`
      );
    }

    const user = await prisma.user.findUnique({
      where: { 
        email_platform: {
          email,
          platform: platform as any,
        }
      },
      include: {
        Shop: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Record failed attempt if user doesn't exist (don't reveal if email exists)
    if (!user) {
      await LoginAttemptService.recordFailedAttempt(lockKey);
      throw new Error("Invalid email or password");
    }

    // Check if user has a password (not a Google OAuth user)
    if (!user.password) {
      await LoginAttemptService.recordFailedAttempt(lockKey);
      throw new Error("This account uses Google OAuth. Please sign in with Google.");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // Record failed attempt
      const attemptResult = await LoginAttemptService.recordFailedAttempt(lockKey);
      
      // If account is now locked, throw lockout error
      if (attemptResult.locked) {
        const minutes = Math.floor((attemptResult.remainingSeconds || 0) / 60);
        const seconds = (attemptResult.remainingSeconds || 0) % 60;
        throw new Error(
          `Too many failed login attempts. Account locked for ${minutes}m ${seconds}s. Please try again later.`
        );
      }

      // Get remaining attempts for error message
      const remainingAttempts = await LoginAttemptService.getRemainingAttempts(lockKey);
      throw new Error(
        remainingAttempts > 0
          ? `Invalid email or password. ${remainingAttempts} attempt${remainingAttempts > 1 ? 's' : ''} remaining.`
          : "Invalid email or password"
      );
    }

    // Successful login - clear all attempts
    await LoginAttemptService.clearAttempts(lockKey);

    return user;
  }

  async updateProfile(userId: string, data: { firstName?: string; lastName?: string; email?: string }) {
    // Validate userId
    if (!userId || typeof userId !== 'string') {
      throw new Error("Invalid user ID");
    }

    // If email is being updated, check if it's already taken by another user on the same platform
    if (data.email) {
      // Get current user to check their platform
      const currentUser = await prisma.user.findUnique({ where: { id: userId } });
      if (!currentUser) {
        throw new Error("User not found");
      }
      
      const existingUser = await prisma.user.findUnique({
        where: { 
          email_platform: {
            email: data.email,
            platform: currentUser.platform as any,
          }
        },
      });
      
      if (existingUser && existingUser.id !== userId) {
        throw new Error("Email is already in use");
      }
    }

    // Get current user data to preserve existing values
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error("User not found");
    }

    // Build update object with only provided fields
    const updateData: {
      firstName?: string | null;
      lastName?: string | null;
      email?: string;
      name?: string | null;
    } = {};

    // Handle email update
    if (data.email !== undefined) {
      updateData.email = data.email;
    }

    // Handle firstName and lastName updates
    // If firstName is provided, use it; otherwise keep existing or derive from name
    const finalFirstName = data.firstName !== undefined 
      ? data.firstName 
      : (user.firstName ?? user.name?.split(" ")[0] ?? "");
    
    // If lastName is provided, use it; otherwise keep existing or derive from name
    const finalLastName = data.lastName !== undefined 
      ? data.lastName 
      : (user.lastName ?? user.name?.split(" ").slice(1).join(" ") ?? "");

    // Only update firstName/lastName if they were provided in the request
    if (data.firstName !== undefined) {
      updateData.firstName = finalFirstName || null;
    }
    if (data.lastName !== undefined) {
      updateData.lastName = finalLastName || null;
    }

    // Update the full name field based on firstName and lastName
    if (data.firstName !== undefined || data.lastName !== undefined) {
      updateData.name = `${finalFirstName} ${finalLastName}`.trim() || null;
    }

    // Only update if there are changes
    if (Object.keys(updateData).length === 0) {
      return user;
    }

    return await prisma.user.update({
      where: { id: userId },
      data: updateData,
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
    const platform = "SHOPEE_CLONE" as const; // Shopee users are always SHOPEE_CLONE platform

    // Check if user already exists by email and platform
    let user = await prisma.user.findUnique({
      where: { 
        email_platform: {
          email,
          platform: platform as any,
        }
      },
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
          platform: platform as any,
        },
      });
    } catch (error: any) {
      // If email already exists (race condition), fetch the existing user
      if (error.code === 'P2002' && (error.meta?.target?.includes('email') || error.meta?.target?.includes('email_platform'))) {
        user = await prisma.user.findUnique({
          where: { 
            email_platform: {
              email,
              platform: platform as any,
            }
          },
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
