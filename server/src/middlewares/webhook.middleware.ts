// src/middlewares/webhook.middleware.ts
// Middleware to authenticate webhook requests from Shopee-Clone

import { Request, Response, NextFunction } from "express";
import { authService } from "../service/auth.service";
import prisma from "../lib/prisma";

/**
 * Webhook middleware to verify JWT token from Shopee-Clone
 * Shopee-Clone sends webhooks with the user's JWT token for authentication
 */
export const webhookMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header or body
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace("Bearer ", "") || req.body?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Authentication token required",
      });
    }

    // Verify token
    try {
      const decoded = authService.verifyToken(token) as any;
      (req as any).user = decoded;
      (req as any).userId = decoded.userId;
      
      // Get shopId from multiple sources (priority order):
      // 1. Request body (sent by shopee-clone webhook)
      // 2. Decoded token
      // 3. Look up from database using userId
      let shopId = req.body?.shopId || decoded.shopId || null;
      
      // If no shopId yet, try to get it from user's shops
      if (!shopId && decoded.userId) {
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          include: { shops: { take: 1, select: { id: true } } },
        });
        
        if (user?.shops?.[0]?.id) {
          shopId = user.shops[0].id;
        }
      }
      
      (req as any).shopId = shopId;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: "Invalid or expired token",
      });
    }
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      error: "Authentication failed",
    });
  }
};

