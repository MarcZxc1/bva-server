/**
 * Ad Controller - MarketMate Feature
 * 
 * Handles AI-powered ad generation requests.
 * Acts as API Gateway - forwards requests to ML Service.
 */

import { Request, Response } from "express";
import { AdService } from "../service/ad.service";
import { AdRequest, AdResponse } from "../api/ads/ad.types";
import prisma from "../lib/prisma";

const adService = new AdService();

export class AdController {
  /**
   * POST /api/v1/ads/generate-ad
   * Generate AI-powered ad copy using Gemini
   * 
   * Request body can include:
   * - product_name: string (required) - Product name as text
   * - productId: string (optional) - If provided, fetches product details from DB
   * - playbook: string (required) - Marketing playbook type
   * - discount: string (optional) - Discount information
   */
  public async generatedAd(req: Request, res: Response): Promise<void> {
    try {
      const requestData: AdRequest & { productId?: string } = req.body;
      
      // Validate required fields
      if (!requestData.product_name || !requestData.playbook) {
        res.status(400).json({ 
          success: false,
          error: "Missing required fields: product_name and playbook" 
        });
        return;
      }

      // If productId is provided, fetch real product details from database
      let enrichedRequestData = { ...requestData };
      
      if (requestData.productId) {
        try {
          const user = (req as any).user;
          if (!user || !user.userId) {
            res.status(401).json({
              success: false,
              error: "Authentication required to fetch product details"
            });
            return;
          }

          // Get user's shop
          const shop = await prisma.shop.findFirst({
            where: { ownerId: user.userId },
            select: { id: true },
          });

          if (shop) {
            const product = await prisma.product.findFirst({
              where: {
                id: requestData.productId,
                shopId: shop.id,
              },
              select: {
                name: true,
                description: true,
                price: true,
                cost: true,
                category: true,
                imageUrl: true,
              },
            });

            if (product) {
              // Enrich request with real product data (only product_name is used by service)
              enrichedRequestData = {
                ...requestData,
                product_name: product.name || requestData.product_name,
                // Note: Additional product details (description, price, category) are available
                // but not passed to AdRequest type. The ML service can fetch these if needed.
              };
              console.log(`✅ Fetched product details from DB: ${product.name} (${product.category || 'no category'})`);
            } else {
              console.warn(`⚠️ Product ${requestData.productId} not found, using provided product_name`);
            }
          }
        } catch (dbError) {
          console.error("Error fetching product from DB:", dbError);
          // Continue with provided product_name if DB fetch fails
        }
      }
      
      // Generate ad copy via service (with enriched data if available)
      const adCopy = await adService.generateAdCopy(enrichedRequestData);
      
      const response: AdResponse = {
        playbookUsed: enrichedRequestData.playbook,
        product_name: enrichedRequestData.product_name,
        generated_ad_copy: adCopy,
      };
      
      res.status(200).json({
        success: true,
        data: response,
      });
    } catch (error) {
      console.error("Error in AdController.generatedAd:", error);
      
      // Check if it's an ML service error
      if ((error as Error).message?.includes("AI Service Unavailable")) {
        res.status(503).json({ 
          success: false,
          error: "AI Service Unavailable",
          message: "The AI service is currently unavailable. Please try again later."
        });
        return;
      }
      
      res.status(500).json({ 
        success: false,
        error: (error as Error).message || "Failed to generate ad" 
      });
    }
  }

  /**
   * POST /api/v1/ads/generate-ad-image
   * Generate AI-powered ad image
   * 
   * Request body can include:
   * - product_name: string (required) - Product name as text
   * - productId: string (optional) - If provided, fetches product details from DB
   * - playbook: string (required) - Marketing playbook type
   * - style: string (optional) - Image style preference
   */
  public async generateAdImage(req: Request, res: Response): Promise<void> {
    try {
      const { product_name, productId, playbook, style } = req.body;
      
      if (!product_name || !playbook) {
        res.status(400).json({ 
          success: false,
          error: "Missing required fields: product_name and playbook" 
        });
        return;
      }

      // If productId is provided, fetch real product details from database
      let productName = product_name;
      
      if (productId) {
        try {
          const user = (req as any).user;
          if (user && user.userId) {
            const shop = await prisma.shop.findFirst({
              where: { ownerId: user.userId },
              select: { id: true },
            });

            if (shop) {
              const product = await prisma.product.findFirst({
                where: {
                  id: productId,
                  shopId: shop.id,
                },
                select: {
                  name: true,
                  description: true,
                  category: true,
                },
              });

              if (product) {
                productName = product.name || product_name;
                console.log(`✅ Fetched product details for image generation: ${product.name}`);
              }
            }
          }
        } catch (dbError) {
          console.error("Error fetching product from DB:", dbError);
          // Continue with provided product_name if DB fetch fails
        }
      }
      
      // Generate image via service (forwarded to ML service)
      const result = await adService.generateAdImage({ 
        product_name: productName, 
        playbook, 
        style 
      });
      
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error in AdController.generateAdImage:", error);
      
      if ((error as Error).message?.includes("AI Service Unavailable")) {
        res.status(503).json({ 
          success: false,
          error: "AI Service Unavailable",
          message: "The AI service is currently unavailable. Please try again later."
        });
        return;
      }
      
      res.status(500).json({ 
        success: false,
        error: (error as Error).message || "Failed to generate image" 
      });
    }
  }

  /**
   * GET /api/v1/ads/:shopId/promotions
   * Get smart promotion suggestions for near-expiry items
   */
  public async getPromotions(req: Request, res: Response): Promise<void> {
    try {
      const { shopId } = req.params;
      
      if (!shopId) {
        res.status(400).json({ 
          success: false,
          error: "Shop ID is required" 
        });
        return;
      }

      const promotions = await adService.getPromotions(shopId);
      
      res.status(200).json({
        success: true,
        data: promotions,
      });
    } catch (error) {
      console.error("Error in AdController.getPromotions:", error);
      
      if ((error as Error).message?.includes("AI Service Unavailable")) {
        res.status(503).json({ 
          success: false,
          error: "AI Service Unavailable",
          message: "The AI service is currently unavailable. Please try again later."
        });
        return;
      }
      
      res.status(500).json({ 
        success: false,
        error: (error as Error).message || "Failed to get promotions" 
      });
    }
  }
}
