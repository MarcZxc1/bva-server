/**
 * Facebook Publishing Service
 * Handles posting campaigns to Facebook Pages via Graph API
 */

import axios from "axios";
import prisma from "../lib/prisma";

const GRAPH_API_URL = "https://graph.facebook.com/v18.0";

interface FacebookPostParams {
  pageId: string;
  accessToken: string;
  message: string;
  imageUrl?: string;
  scheduledTime?: Date;
}

interface FacebookPostResponse {
  postId?: string;
  success: boolean;
  error?: string;
}

export class FacebookService {
  /**
   * Post to Facebook Page
   */
  async postToFacebook(params: FacebookPostParams): Promise<FacebookPostResponse> {
    try {
      const { pageId, accessToken, message, imageUrl, scheduledTime } = params;

      if (!pageId || !accessToken) {
        return {
          success: false,
          error: "Page ID and access token are required",
        };
      }

      // If image is provided, post as photo
      if (imageUrl) {
        const photoParams: {
          pageId: string;
          accessToken: string;
          message: string;
          imageUrl: string;
          scheduledTime?: Date;
        } = {
          pageId,
          accessToken,
          message,
          imageUrl,
        };
        if (scheduledTime) {
          photoParams.scheduledTime = scheduledTime;
        }
        return await this.postPhoto(photoParams);
      } else {
        // Text-only post
        const textParams: {
          pageId: string;
          accessToken: string;
          message: string;
          scheduledTime?: Date;
        } = {
          pageId,
          accessToken,
          message,
        };
        if (scheduledTime) {
          textParams.scheduledTime = scheduledTime;
        }
        return await this.postText(textParams);
      }
    } catch (error: any) {
      console.error("Error posting to Facebook:", error);
      return {
        success: false,
        error: error?.response?.data?.error?.message || error?.message || "Failed to post to Facebook",
      };
    }
  }

  /**
   * Post photo to Facebook Page
   */
  private async postPhoto(params: {
    pageId: string;
    accessToken: string;
    message: string;
    imageUrl: string;
    scheduledTime?: Date;
  }): Promise<FacebookPostResponse> {
    try {
      const { pageId, accessToken, message, imageUrl, scheduledTime } = params;

      let endpoint = `${GRAPH_API_URL}/${pageId}/photos`;
      const postParams: any = {
        access_token: accessToken,
        message: message,
      };

      // Handle base64 images
      if (imageUrl.startsWith("data:image")) {
        // Extract base64 data
        const base64Data = imageUrl.split(",")[1];
        if (!base64Data) {
          return {
            success: false,
            error: "Invalid base64 image data",
          };
        }
        const imageBuffer = Buffer.from(base64Data, "base64");
        
        // Upload as multipart form data
        const FormData = require("form-data");
        const form = new FormData();
        form.append("access_token", accessToken);
        form.append("message", message);
        form.append("source", imageBuffer, {
          filename: "ad-image.jpg",
          contentType: "image/jpeg",
        });

        if (scheduledTime) {
          form.append("scheduled_publish_time", Math.floor(scheduledTime.getTime() / 1000));
          form.append("published", "false");
        } else {
          form.append("published", "true");
        }

        const response = await axios.post(endpoint, form, {
          headers: {
            ...form.getHeaders(),
          },
        });

        return {
          success: true,
          postId: response.data.id,
        };
      } else {
        // URL image
        postParams.url = imageUrl;
        postParams.published = scheduledTime ? "false" : "true";

        if (scheduledTime) {
          postParams.scheduled_publish_time = Math.floor(scheduledTime.getTime() / 1000);
        }

        const response = await axios.post(endpoint, null, { params: postParams });

        return {
          success: true,
          postId: response.data.id,
        };
      }
    } catch (error: any) {
      console.error("Error posting photo to Facebook:", error);
      return {
        success: false,
        error: error?.response?.data?.error?.message || error?.message || "Failed to post photo to Facebook",
      };
    }
  }

  /**
   * Post text-only to Facebook Page
   */
  private async postText(params: {
    pageId: string;
    accessToken: string;
    message: string;
    scheduledTime?: Date;
  }): Promise<FacebookPostResponse> {
    try {
      const { pageId, accessToken, message, scheduledTime } = params;

      const endpoint = `${GRAPH_API_URL}/${pageId}/feed`;
      const postParams: any = {
        access_token: accessToken,
        message: message,
      };

      if (scheduledTime) {
        postParams.scheduled_publish_time = Math.floor(scheduledTime.getTime() / 1000);
        postParams.published = "false";
      }

      const response = await axios.post(endpoint, null, { params: postParams });

      return {
        success: true,
        postId: response.data.id,
      };
    } catch (error: any) {
      console.error("Error posting text to Facebook:", error);
      return {
        success: false,
        error: error?.response?.data?.error?.message || error?.message || "Failed to post to Facebook",
      };
    }
  }

  /**
   * Get user's Facebook account info
   */
  async getFacebookAccount(userId: string) {
    return await prisma.socialMediaAccount.findUnique({
      where: {
        userId_platform: {
          userId,
          platform: "facebook",
        },
      },
    });
  }

  /**
   * Verify access token is valid (for page tokens, use the page endpoint)
   */
  async verifyAccessToken(accessToken: string, pageId?: string): Promise<boolean> {
    try {
      // For page tokens, verify using the page endpoint
      if (pageId) {
        const response = await axios.get(`${GRAPH_API_URL}/${pageId}`, {
          params: {
            access_token: accessToken,
            fields: "id,name",
          },
        });
        return !!response.data.id;
      }
      // For user tokens, verify using /me
      const response = await axios.get(`${GRAPH_API_URL}/me`, {
        params: {
          access_token: accessToken,
          fields: "id",
        },
      });
      return !!response.data.id;
    } catch (error: any) {
      console.error("Token verification failed:", error?.response?.data || error?.message);
      return false;
    }
  }

  /**
   * Get user's Facebook pages
   */
  async getUserPages(accessToken: string) {
    try {
      const response = await axios.get(`${GRAPH_API_URL}/me/accounts`, {
        params: {
          access_token: accessToken,
          fields: "id,name,access_token",
        },
      });
      return response.data.data || [];
    } catch (error: any) {
      console.error("Error fetching Facebook pages:", error);
      throw new Error(error?.response?.data?.error?.message || "Failed to fetch Facebook pages");
    }
  }
}

export const facebookService = new FacebookService();

