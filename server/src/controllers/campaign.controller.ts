/**
 * Campaign Controller - MarketMate Feature
 * 
 * Handles campaign CRUD operations for ad campaigns
 */

import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { CampaignStatus } from "../generated/prisma";

/**
 * Helper function to get shopId from request (token or user's shops)
 */
async function getShopIdFromRequest(req: Request): Promise<string | null> {
  const user = (req as any).user;
  if (!user || !user.userId) {
    return null;
  }

  // Try to get shopId from token first
  if (user.shopId) {
    return user.shopId;
  }

  // Fallback: fetch user's first shop
  const shops = await prisma.shop.findMany({
    where: { ownerId: user.userId },
    take: 1,
    select: { id: true },
  });

  return shops[0]?.id || null;
}

export class CampaignController {
  /**
   * GET /api/campaigns
   * Get all campaigns for the authenticated user's shop
   */
  async getCampaigns(req: Request, res: Response): Promise<void> {
    try {
      const shopId = await getShopIdFromRequest(req);

      if (!shopId) {
        res.status(400).json({
          success: false,
          error: "Shop ID not found. Please ensure you have a shop associated with your account.",
        });
        return;
      }

      const campaigns = await prisma.campaign.findMany({
        where: { shopId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          content: true,
          imageUrl: true, // Explicitly select imageUrl
          status: true,
          scheduledAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Transform campaigns to match frontend format
      const transformedCampaigns = await Promise.all(campaigns.map(async (campaign) => {
        const content = typeof campaign.content === "string" 
          ? JSON.parse(campaign.content) 
          : campaign.content;

        // Prioritize imageUrl from database, fallback to content
        let imageUrl = campaign.imageUrl || content?.image_url || content?.imageUrl || null;

        // Backfill: If imageUrl is missing from database but exists in content, update the database
        if (!campaign.imageUrl && (content?.image_url || content?.imageUrl)) {
          const imageUrlFromContent = content?.image_url || content?.imageUrl;
          try {
            // Update the campaign in database to store imageUrl separately
            await prisma.campaign.update({
              where: { id: campaign.id },
              data: { imageUrl: imageUrlFromContent },
            });
            imageUrl = imageUrlFromContent;
            console.log(`Backfilled imageUrl for campaign ${campaign.id}`);
          } catch (updateError) {
            console.error(`Failed to backfill imageUrl for campaign ${campaign.id}:`, updateError);
            // Continue with imageUrl from content anyway
          }
        }

        return {
          id: campaign.id,
          title: campaign.name,
          type: content?.playbook || "Flash Sale",
          platform: content?.platform || "SHOPEE",
          status: campaign.status.toLowerCase(),
          caption: content?.ad_copy || content?.promo_copy || "",
          imageUrl: imageUrl, // Use extracted/backfilled imageUrl
          scheduledDate: campaign.scheduledAt 
            ? new Date(campaign.scheduledAt).toLocaleDateString()
            : null,
          engagement: content?.engagement || null,
          content: content,
        };
      }));

      res.json({
        success: true,
        data: transformedCampaigns,
      });
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch campaigns",
      });
    }
  }

  /**
   * POST /api/campaigns
   * Create a new campaign
   */
  async createCampaign(req: Request, res: Response): Promise<void> {
    try {
      const shopId = await getShopIdFromRequest(req);

      if (!shopId) {
        res.status(400).json({
          success: false,
          error: "Shop ID not found.",
        });
        return;
      }

      const { name, content, status, scheduledAt, platform } = req.body;

      if (!name || !content) {
        res.status(400).json({
          success: false,
          error: "Name and content are required",
        });
        return;
      }

      // Extract imageUrl from content if present
      const imageUrl = content?.image_url || content?.imageUrl || null;

      // Log for debugging
      console.log("Creating campaign with imageUrl:", imageUrl ? "Present" : "Missing", {
        hasImageUrl: !!imageUrl,
        imageUrlLength: imageUrl ? imageUrl.length : 0,
        imageUrlPreview: imageUrl ? imageUrl.substring(0, 50) + "..." : null
      });

      // Prepare campaign content (remove image_url from content as it's stored separately)
      const { image_url, imageUrl: _, ...contentWithoutImage } = content;
      const campaignContent = {
        ...contentWithoutImage,
        platform: platform || "SHOPEE",
        createdAt: new Date().toISOString(),
      };

      const campaign = await prisma.campaign.create({
        data: {
          shopId,
          name,
          content: campaignContent,
          imageUrl: imageUrl, // Store image URL separately in database
          status: (status?.toUpperCase() as CampaignStatus) || CampaignStatus.DRAFT,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        },
        select: {
          id: true,
          name: true,
          content: true,
          imageUrl: true, // Ensure imageUrl is returned
          status: true,
          scheduledAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      console.log("Campaign created successfully:", {
        id: campaign.id,
        hasImageUrl: !!campaign.imageUrl,
        imageUrlLength: campaign.imageUrl ? campaign.imageUrl.length : 0
      });

      // Transform campaign to match frontend format
      const transformedCampaign = {
        id: campaign.id,
        title: campaign.name,
        type: campaignContent?.playbook || "Flash Sale",
        platform: campaignContent?.platform || "SHOPEE",
        status: campaign.status.toLowerCase(),
        caption: campaignContent?.ad_copy || campaignContent?.promo_copy || "",
        imageUrl: campaign.imageUrl || campaignContent?.image_url || campaignContent?.imageUrl || null,
        scheduledDate: campaign.scheduledAt 
          ? new Date(campaign.scheduledAt).toLocaleDateString()
          : null,
        engagement: campaignContent?.engagement || null,
        content: campaignContent,
      };

      res.status(201).json({
        success: true,
        data: transformedCampaign,
      });
    } catch (error) {
      console.error("Error creating campaign:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create campaign",
      });
    }
  }

  /**
   * PUT /api/campaigns/:id
   * Update an existing campaign
   */
  async updateCampaign(req: Request, res: Response): Promise<void> {
    try {
      const shopId = await getShopIdFromRequest(req);
      const { id } = req.params;

      if (!shopId) {
        res.status(400).json({
          success: false,
          error: "Shop ID not found.",
        });
        return;
      }

      if (!id) {
        res.status(400).json({
          success: false,
          error: "Campaign ID is required",
        });
        return;
      }

      const { name, content, status, scheduledAt } = req.body;

      // Verify campaign belongs to user's shop
      const existingCampaign = await prisma.campaign.findFirst({
        where: { id, shopId },
      });

      if (!existingCampaign) {
        res.status(404).json({
          success: false,
          error: "Campaign not found",
        });
        return;
      }

      // Extract imageUrl from content if present
      let imageUrl = existingCampaign.imageUrl;
      let updatedContent = content;
      
      if (content) {
        const extractedImageUrl = content?.image_url || content?.imageUrl;
        if (extractedImageUrl) {
          imageUrl = extractedImageUrl;
          // Remove image_url from content as it's stored separately
          const { image_url, imageUrl: _, ...contentWithoutImage } = content;
          updatedContent = contentWithoutImage;
        }
      }

      const campaign = await prisma.campaign.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(updatedContent && { content: updatedContent }),
          ...(imageUrl !== undefined && { imageUrl }),
          ...(status && { status: status.toUpperCase() as CampaignStatus }),
          ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
        },
        select: {
          id: true,
          name: true,
          content: true,
          imageUrl: true, // Ensure imageUrl is returned
          status: true,
          scheduledAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Transform campaign to match frontend format
      const finalContent = updatedContent || (typeof campaign.content === "string" 
        ? JSON.parse(campaign.content) 
        : campaign.content);
      
      const finalImageUrl = imageUrl !== undefined 
        ? imageUrl 
        : (campaign.imageUrl || finalContent?.image_url || finalContent?.imageUrl || null);

      const transformedCampaign = {
        id: campaign.id,
        title: campaign.name,
        type: finalContent?.playbook || "Flash Sale",
        platform: finalContent?.platform || "SHOPEE",
        status: campaign.status.toLowerCase(),
        caption: finalContent?.ad_copy || finalContent?.promo_copy || "",
        imageUrl: finalImageUrl,
        scheduledDate: campaign.scheduledAt 
          ? new Date(campaign.scheduledAt).toLocaleDateString()
          : null,
        engagement: finalContent?.engagement || null,
        content: finalContent,
      };

      res.json({
        success: true,
        data: transformedCampaign,
      });
    } catch (error) {
      console.error("Error updating campaign:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update campaign",
      });
    }
  }

  /**
   * POST /api/campaigns/:id/schedule
   * Schedule a campaign
   */
  async scheduleCampaign(req: Request, res: Response): Promise<void> {
    try {
      const shopId = await getShopIdFromRequest(req);
      const { id } = req.params;
      const { scheduledAt } = req.body;

      if (!shopId) {
        res.status(400).json({
          success: false,
          error: "Shop ID not found.",
        });
        return;
      }

      if (!id) {
        res.status(400).json({
          success: false,
          error: "Campaign ID is required",
        });
        return;
      }

      if (!scheduledAt) {
        res.status(400).json({
          success: false,
          error: "scheduledAt is required",
        });
        return;
      }

      // Verify campaign belongs to user's shop
      const existingCampaign = await prisma.campaign.findFirst({
        where: { id, shopId },
      });

      if (!existingCampaign) {
        res.status(404).json({
          success: false,
          error: "Campaign not found",
        });
        return;
      }

      const campaign = await prisma.campaign.update({
        where: { id },
        data: {
          status: CampaignStatus.SCHEDULED,
          scheduledAt: new Date(scheduledAt),
        },
        select: {
          id: true,
          name: true,
          content: true,
          imageUrl: true, // Ensure imageUrl is returned
          status: true,
          scheduledAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Transform campaign to match frontend format
      const content = typeof campaign.content === "string" 
        ? JSON.parse(campaign.content) 
        : campaign.content;

      const transformedCampaign = {
        id: campaign.id,
        title: campaign.name,
        type: content?.playbook || "Flash Sale",
        platform: content?.platform || "SHOPEE",
        status: campaign.status.toLowerCase(),
        caption: content?.ad_copy || content?.promo_copy || "",
        imageUrl: campaign.imageUrl || content?.image_url || content?.imageUrl || null,
        scheduledDate: campaign.scheduledAt 
          ? new Date(campaign.scheduledAt).toLocaleDateString()
          : null,
        engagement: content?.engagement || null,
        content: content,
      };

      res.json({
        success: true,
        data: transformedCampaign,
      });
    } catch (error) {
      console.error("Error scheduling campaign:", error);
      res.status(500).json({
        success: false,
        error: "Failed to schedule campaign",
      });
    }
  }

  /**
   * POST /api/campaigns/:id/publish
   * Publish a campaign (change status to PUBLISHED)
   */
  async publishCampaign(req: Request, res: Response): Promise<void> {
    try {
      const shopId = await getShopIdFromRequest(req);
      const { id } = req.params;

      if (!shopId) {
        res.status(400).json({
          success: false,
          error: "Shop ID not found.",
        });
        return;
      }

      if (!id) {
        res.status(400).json({
          success: false,
          error: "Campaign ID is required",
        });
        return;
      }

      // Verify campaign belongs to user's shop
      const existingCampaign = await prisma.campaign.findFirst({
        where: { id, shopId },
        select: {
          id: true,
          name: true,
          content: true,
          imageUrl: true, // Ensure imageUrl is selected
          status: true,
          scheduledAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!existingCampaign) {
        res.status(404).json({
          success: false,
          error: "Campaign not found",
        });
        return;
      }

      const campaign = await prisma.campaign.update({
        where: { id },
        data: {
          status: CampaignStatus.PUBLISHED,
        },
        select: {
          id: true,
          name: true,
          content: true,
          imageUrl: true, // Ensure imageUrl is returned
          status: true,
          scheduledAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Transform campaign to match frontend format
      const content = typeof campaign.content === "string" 
        ? JSON.parse(campaign.content) 
        : campaign.content;

      const transformedCampaign = {
        id: campaign.id,
        title: campaign.name,
        type: content?.playbook || "Flash Sale",
        platform: content?.platform || "SHOPEE",
        status: campaign.status.toLowerCase(),
        caption: content?.ad_copy || content?.promo_copy || "",
        imageUrl: campaign.imageUrl || content?.image_url || content?.imageUrl || null, // Prioritize database imageUrl
        scheduledDate: campaign.scheduledAt 
          ? new Date(campaign.scheduledAt).toLocaleDateString()
          : null,
        engagement: content?.engagement || null,
        content: content,
      };

      res.json({
        success: true,
        data: transformedCampaign,
      });
    } catch (error) {
      console.error("Error publishing campaign:", error);
      res.status(500).json({
        success: false,
        error: "Failed to publish campaign",
      });
    }
  }

  /**
   * DELETE /api/campaigns/:id
   * Delete a campaign (or cancel if scheduled)
   */
  async deleteCampaign(req: Request, res: Response): Promise<void> {
    try {
      const shopId = await getShopIdFromRequest(req);
      const { id } = req.params;

      if (!shopId) {
        res.status(400).json({
          success: false,
          error: "Shop ID not found.",
        });
        return;
      }

      if (!id) {
        res.status(400).json({
          success: false,
          error: "Campaign ID is required",
        });
        return;
      }

      // Verify campaign belongs to user's shop
      const existingCampaign = await prisma.campaign.findFirst({
        where: { id, shopId },
      });

      if (!existingCampaign) {
        res.status(404).json({
          success: false,
          error: "Campaign not found",
        });
        return;
      }

      await prisma.campaign.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: "Campaign deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting campaign:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete campaign",
      });
    }
  }
}

export const campaignController = new CampaignController();

