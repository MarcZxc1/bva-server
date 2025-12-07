// src/middlewares/apiKey.middleware.ts
import { Request, Response, NextFunction } from "express";
import { authService } from "../service/auth.service";
import prisma from "../lib/prisma";
import prisma from "../lib/prisma";

/**
 * Middleware to authenticate requests using API key
 * Checks for API key in Authorization header or X-API-Key header
 */
export const apiKeyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get API key from headers
    const authHeader = req.headers.authorization;
    const apiKeyHeader = req.headers["x-api-key"] as string;
    
    const apiKey = authHeader?.replace("Bearer ", "") || apiKeyHeader;

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: "API key is required",
      });
    }

    // Try to verify as JWT token first (for regular authenticated requests)
    try {
      const decoded = authService.verifyToken(apiKey);
      (req as any).user = decoded;
      (req as any).apiKey = apiKey;
      next();
      return;
    } catch (error) {
      // If token verification fails, check if it's an API key
      // For API keys starting with "sk_", we need to find the integration
      if (apiKey.startsWith("sk_")) {
        // Find integration by API key stored in settings
        const integration = await prisma.integration.findFirst({
          where: {
            settings: {
              path: ["apiKey"],
              equals: apiKey,
            },
          },
          include: {
            shop: {
              include: {
                owner: true,
              },
            },
          },
        });

        if (!integration) {
          return res.status(401).json({
            success: false,
            error: "Invalid API key",
          });
        }

        // Attach user info from the integration's shop owner
        (req as any).user = {
          userId: integration.shop.owner.id,
          shopId: integration.shop.id,
          role: integration.shop.owner.role,
        };
        (req as any).apiKey = apiKey;
        next();
        return;
      }

      // If it's not a JWT and not an API key, reject
      return res.status(401).json({
        success: false,
        error: "Invalid API key or token",
      });
    }
  } catch (error: any) {
    console.error("API key middleware error:", error);
    return res.status(401).json({
      success: false,
      error: "Authentication failed",
    });
  }
};

