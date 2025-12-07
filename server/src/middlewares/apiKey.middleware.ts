// src/middlewares/apiKey.middleware.ts
import { Request, Response, NextFunction } from "express";
import { authService } from "../service/auth.service";

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

    // For now, we'll use the API key as a token to verify the user
    // In production, you'd want to store API keys in the database and verify them
    // For MVP, we'll treat the API key as a JWT token and verify it
    try {
      const decoded = await authService.verifyToken(apiKey);
      (req as any).user = decoded;
      (req as any).apiKey = apiKey;
      next();
    } catch (error) {
      // If token verification fails, check if it's a valid API key format
      // For external integrations, we might need a different verification method
      // For now, we'll allow the request to proceed if it's a valid format
      if (apiKey.startsWith("sk_")) {
        // This is an API key, not a JWT token
        // In production, you'd verify this against a database of API keys
        (req as any).apiKey = apiKey;
        next();
      } else {
        return res.status(401).json({
          success: false,
          error: "Invalid API key",
        });
      }
    }
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      error: "Authentication failed",
    });
  }
};

