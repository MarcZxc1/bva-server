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
      });

      // Transform campaigns to match frontend format
      const transformedCampaigns = campaigns.map((campaign) => {
        const content = typeof campaign.content === "string" 
          ? JSON.parse(campaign.content) 
          : campaign.content;

        return {
          id: campaign.id,
          title: campaign.name,
          type: content?.playbook || "Flash Sale",
          platform: content?.platform || "SHOPEE",
          status: campaign.status.toLowerCase(),
          caption: content?.ad_copy || content?.promo_copy || "",
          scheduledDate: campaign.scheduledAt 
            ? new Date(campaign.scheduledAt).toLocaleDateString()
            : null,
          engagement: content?.engagement || null,
          content: content,
        };
      });

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

      // Prepare campaign content
      const campaignContent = {
        ...content,
        platform: platform || "SHOPEE",
        createdAt: new Date().toISOString(),
      };

      const campaign = await prisma.campaign.create({
        data: {
          shopId,
          name,
          content: campaignContent,
          status: (status?.toUpperCase() as CampaignStatus) || CampaignStatus.DRAFT,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        },
      });

      res.status(201).json({
        success: true,
        data: campaign,
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

      const campaign = await prisma.campaign.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(content && { content }),
          ...(status && { status: status.toUpperCase() as CampaignStatus }),
          ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
        },
      });

      res.json({
        success: true,
        data: campaign,
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
      });

      res.json({
        success: true,
        data: campaign,
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
      });

      res.json({
        success: true,
        data: campaign,
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

