// src/middlewares/apiKey.middleware.ts
import { Request, Response, NextFunction } from "express";
import { authService } from "../service/auth.service";
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

    // Verify as JWT token (for authenticated requests)
    try {
      const decoded = authService.verifyToken(apiKey);
      (req as any).user = decoded;
      next();
      return;
    } catch (error) {
      // If token verification fails, reject
      return res.status(401).json({
        success: false,
        error: "Invalid or expired token",
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

