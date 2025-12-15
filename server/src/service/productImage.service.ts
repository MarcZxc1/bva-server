/**
 * Product Image Service
 * Handles fetching product images from integrated platforms (Shopee-Clone, Lazada-Clone)
 */

import prisma from "../lib/prisma";
import axios from "axios";

/**
 * Get product with image URL from integrated platform
 * @param productId - BVA product ID
 * @returns Product with imageUrl from the source platform
 */
export async function getProductWithImage(productId: string) {
  // 1. Get product from BVA database
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      Shop: {
        include: {
          Integration: {
            where: {
              OR: [
                { platform: "SHOPEE" },
                { platform: "LAZADA" },
              ],
            },
          },
        },
      },
    },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  // 2. If product already has imageUrl in BVA, return it
  if (product.imageUrl) {
    console.log(`✅ Product ${productId} already has imageUrl in BVA:`, product.imageUrl);
    return {
      id: product.id,
      name: product.name,
      imageUrl: product.imageUrl,
      platform: product.Shop.platform,
      externalId: product.externalId,
    };
  }

  // 3. If no imageUrl, try to fetch from integrated platform
  if (!product.externalId) {
    console.log(`⚠️  Product ${productId} has no externalId, cannot fetch from platform`);
    return {
      id: product.id,
      name: product.name,
      imageUrl: null,
      platform: product.Shop.platform,
      externalId: null,
    };
  }

  try {
    let platformImageUrl: string | null = null;

    // Get active integration for the product's platform
    const integration = product.Shop.Integration?.find(
      (int) => int.platform === product.Shop.platform && (int.settings as any)?.isActive !== false
    );

    if (!integration) {
      console.log(`⚠️  No active ${product.Shop.platform} integration for shop ${product.shopId}`);
      return {
        id: product.id,
        name: product.name,
        imageUrl: null,
        platform: product.Shop.platform,
        externalId: product.externalId,
      };
    }

    // Extract platform-specific product ID from externalId (e.g., "SHOPEE-123" -> "123")
    const platformProductId = product.externalId.split("-")[1];

    if (product.Shop.platform === "SHOPEE") {
      // Fetch from Shopee-Clone API
      const shopeeUrl = process.env.SHOPEE_CLONE_URL || "http://localhost:5174";
      const response = await axios.get<{ success: boolean; data: { image: string } }>(`${shopeeUrl}/api/products/${platformProductId}`);
      
      if (response.data?.success && response.data?.data?.image) {
        platformImageUrl = response.data.data.image;
        console.log(`✅ Fetched image from Shopee-Clone for product ${productId}:`, platformImageUrl);
      }
    } else if (product.Shop.platform === "LAZADA") {
      // Fetch from Lazada-Clone API
      const lazadaUrl = process.env.LAZADA_CLONE_URL || "http://localhost:3001";
      const response = await axios.get<{ success: boolean; data: { image: string } }>(`${lazadaUrl}/api/products/${platformProductId}`);
      
      if (response.data?.success && response.data?.data?.image) {
        platformImageUrl = response.data.data.image;
        console.log(`✅ Fetched image from Lazada-Clone for product ${productId}:`, platformImageUrl);
      }
    }

    // 4. Update BVA product with the fetched imageUrl (cache for future use)
    if (platformImageUrl) {
      await prisma.product.update({
        where: { id: productId },
        data: { imageUrl: platformImageUrl },
      });
      console.log(`✅ Updated BVA product ${productId} with imageUrl from ${product.Shop.platform}`);
    }

    return {
      id: product.id,
      name: product.name,
      imageUrl: platformImageUrl,
      platform: product.Shop.platform,
      externalId: product.externalId,
    };
  } catch (error: any) {
    console.error(`❌ Error fetching image from ${product.Shop.platform} for product ${productId}:`, error.message);
    return {
      id: product.id,
      name: product.name,
      imageUrl: null,
      platform: product.Shop.platform,
      externalId: product.externalId,
    };
  }
}

/**
 * Get product image URL by external ID (for direct platform queries)
 * @param externalId - External product ID (e.g., "SHOPEE-123")
 * @param platform - Platform name (SHOPEE, LAZADA)
 */
export async function getProductImageByExternalId(externalId: string, platform: string): Promise<string | null> {
  try {
    const product = await prisma.product.findFirst({
      where: {
        externalId,
        Shop: {
          platform: platform as any,
        },
      },
    });

    if (!product) {
      return null;
    }

    const productWithImage = await getProductWithImage(product.id);
    return productWithImage.imageUrl;
  } catch (error) {
    console.error(`Error fetching image for ${externalId}:`, error);
    return null;
  }
}
