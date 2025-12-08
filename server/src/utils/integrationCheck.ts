import prisma from "../lib/prisma";
import { Platform } from "../generated/prisma";

/**
 * Check if a shop has an active integration with terms accepted
 * @param shopId - Shop ID to check
 * @param platform - Platform to check (optional, defaults to SHOPEE)
 * @returns true if integration exists, is active, and terms are accepted
 */
export async function hasActiveIntegration(
  shopId: string,
  platform: Platform = Platform.SHOPEE
): Promise<boolean> {
  try {
    const integration = await prisma.integration.findUnique({
      where: {
        shopId_platform: {
          shopId,
          platform,
        },
      },
    });

    if (!integration) {
      return false;
    }

    // Check settings for terms acceptance and active status
    const settings = integration.settings as any;
    const termsAccepted = settings?.termsAccepted === true;
    const isActive = settings?.isActive !== false; // Default to true if not set

    return termsAccepted && isActive;
  } catch (error) {
    console.error("Error checking integration:", error);
    return false;
  }
}

/**
 * Get active integration for a shop
 * @param shopId - Shop ID to check
 * @param platform - Platform to check (optional, defaults to SHOPEE)
 * @returns Integration object if active, null otherwise
 */
export async function getActiveIntegration(
  shopId: string,
  platform: Platform = Platform.SHOPEE
) {
  try {
    const integration = await prisma.integration.findUnique({
      where: {
        shopId_platform: {
          shopId,
          platform,
        },
      },
    });

    if (!integration) {
      return null;
    }

    const settings = integration.settings as any;
    const termsAccepted = settings?.termsAccepted === true;
    const isActive = settings?.isActive !== false;

    if (termsAccepted && isActive) {
      return integration;
    }

    return null;
  } catch (error) {
    console.error("Error getting active integration:", error);
    return null;
  }
}

/**
 * Check if integration exists (regardless of active status)
 * Useful for showing integration setup prompts
 */
export async function hasIntegration(
  shopId: string,
  platform: Platform = Platform.SHOPEE
): Promise<boolean> {
  try {
    const integration = await prisma.integration.findUnique({
      where: {
        shopId_platform: {
          shopId,
          platform,
        },
      },
    });

    return !!integration;
  } catch (error) {
    console.error("Error checking integration existence:", error);
    return false;
  }
}

