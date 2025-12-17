/**
 * Campaign Scheduler Service
 * Automatically publishes scheduled campaigns to Facebook when their scheduled time arrives
 */

import prisma from "../lib/prisma";
import { CampaignStatus } from "../generated/prisma";
import { facebookService } from "./facebook.service";

export class CampaignSchedulerService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Start the scheduler - checks every minute for campaigns to publish
   */
  start() {
    if (this.isRunning) {
      console.log("⚠️  Campaign scheduler is already running");
      return;
    }

    console.log("🚀 Starting campaign scheduler...");
    this.isRunning = true;

    // Run immediately on start
    this.checkAndPublishScheduledCampaigns();

    // Then check every 30 seconds for more accurate timing
    this.intervalId = setInterval(() => {
      this.checkAndPublishScheduledCampaigns();
    }, 30000); // 30 seconds for more accurate scheduling

    console.log("✅ Campaign scheduler started (checking every 30 seconds)");
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      console.log("🛑 Campaign scheduler stopped");
    }
  }

  /**
   * Check for scheduled campaigns that need to be published
   */
  private async checkAndPublishScheduledCampaigns() {
    // Wrap in try-catch to prevent scheduler from crashing
    try {
      const now = new Date();
      
      // Find campaigns that are scheduled and their scheduledAt time has passed
      const scheduledCampaigns = await prisma.campaign.findMany({
        where: {
          status: CampaignStatus.SCHEDULED,
          scheduledAt: {
            lte: now, // scheduledAt <= now
          },
        },
        include: {
          Shop: {
            select: {
              id: true,
              ownerId: true,
            },
          },
        },
      });
      
      // Debug: Log shop and owner info
      scheduledCampaigns.forEach((campaign) => {
        console.log(`🔍 Campaign ${campaign.id} - Shop ID: ${campaign.shopId}, Owner ID: ${campaign.Shop?.ownerId}`);
      });

      if (scheduledCampaigns.length === 0) {
        return; // No campaigns to publish
      }

      console.log(`📅 Found ${scheduledCampaigns.length} campaign(s) ready to publish at ${now.toISOString()}`);
      
      // Log each campaign's scheduled time for debugging
      scheduledCampaigns.forEach((campaign) => {
        const scheduledTime = campaign.scheduledAt ? new Date(campaign.scheduledAt).toISOString() : 'N/A';
        const timeDiff = campaign.scheduledAt ? Math.round((now.getTime() - new Date(campaign.scheduledAt).getTime()) / 1000) : 0;
        console.log(`  - Campaign "${campaign.name}" (${campaign.id}): scheduled for ${scheduledTime} (${timeDiff}s ago)`);
      });

      // Process each campaign with individual error handling
      for (const campaign of scheduledCampaigns) {
        try {
          await this.publishScheduledCampaign(campaign);
        } catch (campaignError: any) {
          // Log error but continue with other campaigns
          console.error(`❌ Error publishing campaign ${campaign.id}:`, campaignError);
          // Mark as failed but don't crash the scheduler
          try {
            await this.markCampaignAsFailed(campaign.id, campaignError?.message || "Unknown error during publishing");
          } catch (markError) {
            console.error(`❌ Error marking campaign ${campaign.id} as failed:`, markError);
          }
        }
      }
    } catch (error: any) {
      // Prevent scheduler from crashing - log error and continue
      console.error("❌ Error checking scheduled campaigns:", error);
      console.error("⚠️  Scheduler will continue running and retry on next check");
    }
  }

  /**
   * Publish a scheduled campaign to Facebook
   */
  private async publishScheduledCampaign(campaign: any) {
    try {
      const scheduledTime = campaign.scheduledAt ? new Date(campaign.scheduledAt).toISOString() : 'N/A';
      console.log(`📤 Publishing scheduled campaign: ${campaign.id} - ${campaign.name} (scheduled for: ${scheduledTime})`);

      const content = typeof campaign.content === "string" 
        ? JSON.parse(campaign.content) 
        : campaign.content;
      
      const caption = content?.ad_copy || content?.promo_copy || "";
      const imageUrl = campaign.imageUrl || content?.image_url || content?.imageUrl || null;
      const userId = campaign.Shop?.ownerId;

      if (!userId) {
        console.error(`❌ Campaign ${campaign.id}: No owner found. Shop: ${JSON.stringify(campaign.Shop)}`);
        await this.markCampaignAsFailed(campaign.id, "No shop owner found");
        return;
      }

      console.log(`🔍 Looking up Facebook account for userId: ${userId}`);
      // Get Facebook account
      const facebookAccount = await facebookService.getFacebookAccount(userId);
      console.log(`🔍 Facebook account lookup result:`, {
        found: !!facebookAccount,
        hasPageId: !!facebookAccount?.pageId,
        hasAccessToken: !!facebookAccount?.accessToken,
        pageId: facebookAccount?.pageId,
      });
      
      if (!facebookAccount || !facebookAccount.pageId || !facebookAccount.accessToken) {
        console.error(`❌ Campaign ${campaign.id}: Facebook not connected`);
        // Check if this campaign has already failed multiple times (content is already parsed above)
        const retryCount = content?.publishRetryCount || 0;
        const maxRetries = 3; // Only retry 3 times
        
        if (retryCount >= maxRetries) {
          // Mark as DRAFT and notify user instead of keeping it SCHEDULED
          await prisma.campaign.update({
            where: { id: campaign.id },
            data: {
              status: CampaignStatus.DRAFT,
              content: {
                ...content,
                publishError: "Facebook account not connected. Please connect Facebook and manually publish this campaign.",
                lastPublishAttempt: new Date().toISOString(),
                publishRetryCount: retryCount + 1,
              },
            },
          });
          
          // Create notification for the user
          try {
            await prisma.notification.create({
              data: {
                userId: userId,
                title: "Campaign Scheduling Failed",
                message: `Your campaign "${campaign.name}" could not be published because Facebook is not connected. Please connect Facebook and publish manually.`,
                type: "campaign_failed",
                isRead: false,
              },
            });
          } catch (notifError) {
            console.error(`⚠️  Failed to create notification:`, notifError);
          }
          
          console.log(`⚠️  Campaign ${campaign.id} moved to DRAFT after ${retryCount} failed attempts`);
        } else {
          // Increment retry count and keep as SCHEDULED for retry
          await this.markCampaignAsFailed(campaign.id, "Facebook account not connected", retryCount + 1);
        }
        return;
      }

      // Publish to Facebook (without scheduledTime, so it publishes immediately)
      const facebookResult = await facebookService.postToFacebook({
        pageId: facebookAccount.pageId,
        accessToken: facebookAccount.accessToken,
        message: caption,
        imageUrl: imageUrl || undefined,
        // No scheduledTime - publish immediately
      });

      if (facebookResult.success && facebookResult.postId) {
        // Update campaign status to PUBLISHED
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: {
            status: CampaignStatus.PUBLISHED,
            // Update content to include Facebook post ID
            content: {
              ...content,
              facebookPostId: facebookResult.postId,
              publishedAt: new Date().toISOString(),
            },
          },
        });

        // Create notification for the user
        try {
          await prisma.notification.create({
            data: {
              userId: userId,
              title: "Campaign Published",
              message: `Your campaign "${campaign.name}" has been successfully published to Facebook!`,
              type: "campaign_published",
              isRead: false,
            },
          });
          console.log(`📬 Notification created for user ${userId} about campaign ${campaign.id}`);
        } catch (notifError) {
          console.error(`⚠️  Failed to create notification for campaign ${campaign.id}:`, notifError);
          // Don't fail the whole operation if notification creation fails
        }

        console.log(`✅ Campaign ${campaign.id} published successfully to Facebook: ${facebookResult.postId}`);
      } else {
        // Facebook publishing failed
        const errorMessage = facebookResult.error || "Unknown error";
        console.error(`❌ Campaign ${campaign.id} failed to publish: ${errorMessage}`);
        await this.markCampaignAsFailed(campaign.id, errorMessage);
      }
    } catch (error: any) {
      console.error(`❌ Error publishing campaign ${campaign.id}:`, error);
      await this.markCampaignAsFailed(campaign.id, error?.message || "Unknown error");
    }
  }

  /**
   * Mark campaign as failed (keep it as SCHEDULED but log the error)
   * This allows retry on next check
   */
  private async markCampaignAsFailed(campaignId: string, errorMessage: string, retryCount?: number) {
    try {
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
      });

      if (!campaign) return;

      const content = typeof campaign.content === "string" 
        ? JSON.parse(campaign.content) 
        : campaign.content;

      // Update content with error info but keep status as SCHEDULED for retry
      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          content: {
            ...content,
            publishError: errorMessage,
            lastPublishAttempt: new Date().toISOString(),
            publishRetryCount: retryCount !== undefined ? retryCount : (content?.publishRetryCount || 0) + 1,
          },
        },
      });

      const currentRetryCount = retryCount !== undefined ? retryCount : (content?.publishRetryCount || 0) + 1;
      console.log(`⚠️  Campaign ${campaignId} marked with error (retry ${currentRetryCount}/3): ${errorMessage}`);
    } catch (error) {
      console.error(`❌ Error marking campaign ${campaignId} as failed:`, error);
    }
  }
}

export const campaignSchedulerService = new CampaignSchedulerService();

