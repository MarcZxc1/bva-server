/**
 * Campaign Controller - MarketMate Feature
 * 
 * Handles campaign CRUD operations for ad campaigns
 */

import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { CampaignStatus } from "../generated/prisma";
import { getShopIdFromRequest } from "../utils/requestHelpers";
import { facebookService } from "../service/facebook.service";

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
      const transformedCampaigns = await Promise.all(campaigns.map(async (campaign: any) => {
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
            ? new Date(campaign.scheduledAt).toLocaleString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })
            : null,
          engagement: content?.engagement || null,
          content: content,
          createdAt: campaign.createdAt.toISOString(), // Include createdAt for display
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
      const userId = (req as any).userId;
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

      // Get campaign content for Facebook publishing
      const content = typeof existingCampaign.content === "string" 
        ? JSON.parse(existingCampaign.content) 
        : existingCampaign.content;
      
      const caption = content?.ad_copy || content?.promo_copy || "";
      const imageUrl = existingCampaign.imageUrl || content?.image_url || content?.imageUrl || null;
      const scheduledDate = new Date(scheduledAt);
      
      // Validate scheduled time is in the future
      const now = new Date();
      if (scheduledDate <= now) {
        res.status(400).json({
          success: false,
          error: "Scheduled time must be in the future",
        });
        return;
      }
      
      // Facebook requires scheduled posts to be at least 10 minutes in the future
      const minScheduledTime = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes from now
      const canUseFacebookNativeScheduling = scheduledDate >= minScheduledTime;
      
      // Log the scheduled time for debugging
      console.log(`📅 Scheduling campaign ${id} for: ${scheduledDate.toISOString()} (${scheduledDate.toLocaleString()})`);
      if (!canUseFacebookNativeScheduling) {
        console.log(`⚠️  Scheduled time is less than 10 minutes away. Facebook native scheduling will be skipped. Campaign will be published by scheduler.`);
      }

      // Try to schedule to Facebook if connected
      // Note: We'll use our scheduler as a backup, so even if Facebook native scheduling fails,
      // the campaign will be marked as SCHEDULED and our scheduler will publish it at the right time
      let facebookPostId: string | undefined;
      let facebookError: string | undefined;
      
      try {
        const facebookAccount = await facebookService.getFacebookAccount(userId);
        
        if (!facebookAccount) {
          facebookError = "Facebook account not connected. Please reconnect your Facebook Page.";
          console.warn("⚠️  No Facebook account found for user:", userId);
        } else if (!facebookAccount.pageId) {
          facebookError = "Facebook Page not selected. Please reconnect and select a Page.";
          console.warn("⚠️  Facebook account exists but no pageId:", facebookAccount);
        } else if (!facebookAccount.accessToken) {
          facebookError = "Facebook access token missing. Please reconnect your Facebook Page.";
          console.warn("⚠️  Facebook account exists but no accessToken:", facebookAccount);
        } else if (!canUseFacebookNativeScheduling) {
          // Scheduled time is too soon for Facebook native scheduling
          facebookError = "Scheduled time must be at least 10 minutes in the future for Facebook native scheduling. Campaign will be published by scheduler.";
          console.log("ℹ️  Scheduled time is less than 10 minutes away. Using scheduler instead of Facebook native scheduling.");
        } else {
          // Verify token is still valid (use pageId for page token verification)
          const isTokenValid = await facebookService.verifyAccessToken(facebookAccount.accessToken, facebookAccount.pageId || undefined);
          if (!isTokenValid) {
            facebookError = "Facebook access token expired or invalid. Please reconnect your Facebook Page.";
            console.warn("⚠️  Facebook access token is invalid or expired");
          } else {
            // Try Facebook's native scheduling first
            const facebookResult = await facebookService.postToFacebook({
              pageId: facebookAccount.pageId,
              accessToken: facebookAccount.accessToken,
              message: caption,
              imageUrl: imageUrl || undefined,
              scheduledTime: scheduledDate,
            });

            if (facebookResult.success) {
              facebookPostId = facebookResult.postId;
              console.log(`✅ Campaign scheduled to Facebook (native): ${facebookPostId}`);
            } else {
              facebookError = facebookResult.error;
              console.warn(`⚠️  Facebook native scheduling failed: ${facebookError}. Campaign will be published by scheduler at scheduled time.`);
              // Don't fail - our scheduler will handle it
            }
          }
        }
      } catch (fbError: any) {
        facebookError = fbError?.message || "Failed to schedule to Facebook";
        console.error("Error scheduling to Facebook:", fbError);
        console.log("ℹ️  Campaign will be published by scheduler at scheduled time");
        // Continue with campaign scheduling even if Facebook fails
        // Our scheduler will pick it up and publish it at the scheduled time
      }

      // Always mark as SCHEDULED when scheduling
      // The scheduler will change status to PUBLISHED when it actually publishes the campaign
      const campaign = await prisma.campaign.update({
        where: { id },
        data: {
          status: CampaignStatus.SCHEDULED,
          scheduledAt: scheduledDate,
          // Update content to include Facebook post ID if native scheduling succeeded
          content: {
            ...content,
            facebookPostId: facebookPostId,
            facebookError: facebookError,
            scheduledAt: scheduledDate.toISOString(),
            scheduledVia: facebookPostId ? "facebook_native" : "scheduler",
          },
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
      const transformedCampaign = {
        id: campaign.id,
        title: campaign.name,
        type: content?.playbook || "Flash Sale",
        platform: content?.platform || "SHOPEE",
        status: campaign.status.toLowerCase(),
        caption: caption,
        imageUrl: campaign.imageUrl || imageUrl || null,
        scheduledDate: campaign.scheduledAt 
          ? new Date(campaign.scheduledAt).toLocaleString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })
          : null,
        engagement: content?.engagement || null,
        content: content,
        facebookPostId: facebookPostId,
        facebookError: facebookError,
      };

      res.json({
        success: true,
        data: transformedCampaign,
        ...(facebookError && { warning: `Campaign scheduled but Facebook publishing failed: ${facebookError}` }),
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
      const userId = (req as any).userId;
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

      // Get campaign content for Facebook publishing
      const content = typeof existingCampaign.content === "string" 
        ? JSON.parse(existingCampaign.content) 
        : existingCampaign.content;
      
      const caption = content?.ad_copy || content?.promo_copy || "";
      const imageUrl = existingCampaign.imageUrl || content?.image_url || content?.imageUrl || null;

      // Try to publish to Facebook if connected
      let facebookPostId: string | undefined;
      let facebookError: string | undefined;
      
      try {
        const facebookAccount = await facebookService.getFacebookAccount(userId);
        console.log("🔍 Facebook Account Check:", {
          hasAccount: !!facebookAccount,
          hasPageId: !!facebookAccount?.pageId,
          hasAccessToken: !!facebookAccount?.accessToken,
          pageId: facebookAccount?.pageId,
        });
        
        if (!facebookAccount) {
          facebookError = "Facebook account not connected. Please reconnect your Facebook Page.";
          console.warn("⚠️  No Facebook account found for user:", userId);
        } else if (!facebookAccount.pageId) {
          facebookError = "Facebook Page not selected. Please reconnect and select a Page.";
          console.warn("⚠️  Facebook account exists but no pageId:", facebookAccount);
        } else if (!facebookAccount.accessToken) {
          facebookError = "Facebook access token missing. Please reconnect your Facebook Page.";
          console.warn("⚠️  Facebook account exists but no accessToken:", facebookAccount);
        } else {
          // Verify token is still valid (use pageId for page token verification)
          const isTokenValid = await facebookService.verifyAccessToken(facebookAccount.accessToken, facebookAccount.pageId || undefined);
          if (!isTokenValid) {
            facebookError = "Facebook access token expired or invalid. Please reconnect your Facebook Page.";
            console.warn("⚠️  Facebook access token is invalid or expired");
          } else {
            const facebookResult = await facebookService.postToFacebook({
              pageId: facebookAccount.pageId,
              accessToken: facebookAccount.accessToken,
              message: caption,
              imageUrl: imageUrl || undefined,
            });

            if (facebookResult.success) {
              facebookPostId = facebookResult.postId;
              console.log(`✅ Campaign published to Facebook: ${facebookPostId}`);
            } else {
              facebookError = facebookResult.error || "Failed to publish to Facebook";
              console.warn(`⚠️  Failed to publish to Facebook: ${facebookError}`);
            }
          }
        }
      } catch (fbError: any) {
        facebookError = fbError?.response?.data?.error?.message || fbError?.message || "Failed to publish to Facebook";
        console.error("❌ Error publishing to Facebook:", {
          error: fbError?.message,
          response: fbError?.response?.data,
          stack: fbError?.stack,
        });
        // Continue with campaign publishing even if Facebook fails
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

      // Create notification for the user when campaign is published
      try {
        await prisma.notification.create({
          data: {
            userId: userId,
            title: "Campaign Published",
            message: `Your campaign "${campaign.name}" has been successfully published${facebookPostId ? " to Facebook" : ""}!`,
            type: "success",
            isRead: false,
          },
        });
        console.log(`📬 Notification created for user ${userId} about campaign ${campaign.id}`);
      } catch (notifError) {
        console.error(`⚠️  Failed to create notification for campaign ${campaign.id}:`, notifError);
        // Don't fail the whole operation if notification creation fails
      }

      // Transform campaign to match frontend format
      const transformedCampaign = {
        id: campaign.id,
        title: campaign.name,
        type: content?.playbook || "Flash Sale",
        platform: content?.platform || "SHOPEE",
        status: campaign.status.toLowerCase(),
        caption: caption,
        imageUrl: campaign.imageUrl || imageUrl || null, // Prioritize database imageUrl
        scheduledDate: campaign.scheduledAt 
          ? new Date(campaign.scheduledAt).toLocaleDateString()
          : null,
        engagement: content?.engagement || null,
        content: content,
        facebookPostId: facebookPostId,
        facebookError: facebookError,
      };

      res.json({
        success: true,
        data: transformedCampaign,
        ...(facebookError && { warning: `Campaign published but Facebook publishing failed: ${facebookError}` }),
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
   * POST /api/campaigns/:id/unschedule
   * Unschedule a campaign (change status to DRAFT and clear scheduledAt)
   */
  async unscheduleCampaign(req: Request, res: Response): Promise<void> {
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

      // Only unschedule if campaign is currently scheduled
      if (existingCampaign.status !== CampaignStatus.SCHEDULED) {
        res.status(400).json({
          success: false,
          error: "Campaign is not scheduled",
        });
        return;
      }

      const content = typeof existingCampaign.content === "string" 
        ? JSON.parse(existingCampaign.content) 
        : existingCampaign.content;

      // Update campaign to DRAFT and clear scheduledAt
      const campaign = await prisma.campaign.update({
        where: { id },
        data: {
          status: CampaignStatus.DRAFT,
          scheduledAt: null,
          content: {
            ...content,
            unscheduledAt: new Date().toISOString(),
          },
        },
        select: {
          id: true,
          name: true,
          content: true,
          imageUrl: true,
          status: true,
          scheduledAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const transformedContent = typeof campaign.content === "string" 
        ? JSON.parse(campaign.content) 
        : campaign.content;

      res.json({
        success: true,
        data: {
          id: campaign.id,
          title: campaign.name,
          type: transformedContent?.playbook || "Flash Sale",
          platform: transformedContent?.platform || "SHOPEE",
          status: campaign.status.toLowerCase(),
          caption: transformedContent?.ad_copy || transformedContent?.promo_copy || "",
          imageUrl: campaign.imageUrl || transformedContent?.image_url || transformedContent?.imageUrl || null,
          scheduledDate: null,
          engagement: transformedContent?.engagement || null,
          content: transformedContent,
          createdAt: campaign.createdAt.toISOString(),
        },
      });
    } catch (error: any) {
      console.error("Error unscheduling campaign:", error);
      res.status(500).json({
        success: false,
        error: error?.message || "Failed to unschedule campaign",
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

