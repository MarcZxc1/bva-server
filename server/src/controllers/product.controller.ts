import { Request, Response } from "express";
import * as productService from "../service/product.service";

export const getProductsByShop = async (req: Request, res: Response) => {
  try {
    const { shopId } = req.params;

    if (!shopId) {
      return res.status(400).json({ error: "Shop ID is required" });
    }

    const products = await productService.getProductsByShop(shopId);
    res.json({
      success: true,
      data: products,
    });
  } catch (error: any) {
    console.error("Error in getProductsByShop:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};
