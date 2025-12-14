import { Request, Response } from "express";
import * as productService from "../service/product.service";
import { getShopIdFromRequest, verifyShopAccess } from "../utils/requestHelpers";
import * as socketService from "../services/socket.service";

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    // Support platform filtering via query parameter
    // ?platform=LAZADA or ?platform=SHOPEE or ?platform=TIKTOK
    const platform = req.query.platform as string | undefined;
    
    const products = await productService.getAllProducts(platform);
    
    console.log(`📦 getAllProducts: Returning ${products.length} products${platform ? ` for platform ${platform}` : ''}`);
    
    res.json({
      success: true,
      data: products,
    });
  } catch (error: any) {
    console.error("Error in getAllProducts:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};

/**
 * Get all products from shops the user has access to (owned + linked)
 * GET /api/products/user
 */
export const getUserProducts = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const platform = req.query.platform as string | undefined;
    const products = await productService.getProductsForUser(user.userId, platform);
    
    console.log(`📦 getUserProducts: Returning ${products.length} products for user ${user.userId}${platform ? ` (platform: ${platform})` : ''}`);
    
    res.json({
      success: true,
      data: products,
    });
  } catch (error: any) {
    console.error("Error in getUserProducts:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};

export const getProductsByShop = async (req: Request, res: Response) => {
  try {
    const { shopId } = req.params;

    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: "Shop ID is required",
      });
    }

    // Verify user has access to this shop (owned or linked)
    const user = (req as any).user;
    if (!user || !user.userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const hasAccess = await verifyShopAccess(req, shopId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: "Access denied. You do not have permission to access this shop.",
      });
    }

    const platform = req.query.platform as string | undefined;
    const products = await productService.getProductsByShop(shopId, platform);
    
    console.log(`📦 getProductsByShop: Returning ${products.length} products for shop ${shopId}${platform ? ` (platform: ${platform})` : ''}`);
    
    res.json({
      success: true,
      data: products,
    });
  } catch (error: any) {
    console.error("Error in getProductsByShop:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};

// Public endpoint for BVA integration (no auth required)
export const getProductsByShopPublic = async (req: Request, res: Response) => {
  try {
    const { shopId } = req.params;
    const platform = req.query.platform as string | undefined;

    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: "Shop ID is required",
      });
    }

    const products = await productService.getProductsByShop(shopId, platform);

    console.log(`📦 getProductsByShopPublic: Returning ${products.length} products for shop ${shopId}${platform ? ` (platform: ${platform})` : ''}`);

    res.json({
      success: true,
      data: products,
    });
  } catch (error: any) {
    console.error("Error in getProductsByShopPublic:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Product ID is required",
      });
    }
    const product = await productService.getProductById(id);
    res.json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    console.error("Error in getProductById:", error);
    res.status(404).json({
      success: false,
      error: error.message || "Product not found",
    });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    // Try to get shopId from request body first (if provided by frontend)
    let shopId = req.body.shopId;
    
    // If not in body, try to get from request (token or user's shops)
    if (!shopId) {
      shopId = await getShopIdFromRequest(req);
    }
    
    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: "Shop ID is required. Please ensure you have a shop associated with your account.",
      });
    }

    const product = await productService.createProduct({
      ...req.body,
      shopId,
    });

    // Notify clients about the new product
    socketService.notifyNewProduct(product);

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    console.error("Error in createProduct:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Product ID is required",
      });
    }
    const product = await productService.updateProduct(id, req.body);
    res.json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    console.error("Error in updateProduct:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Product ID is required",
      });
    }
    await productService.deleteProduct(id);
    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error: any) {
    console.error("Error in deleteProduct:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};
