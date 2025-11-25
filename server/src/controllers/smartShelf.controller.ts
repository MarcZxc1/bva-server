import { Request, Response } from "express";
import * as smartShelfService from "../service/smartShelf.service";

export const getAtRiskInventory = async (req: Request, res: Response) => {
  try {
    const { shopId } = req.params;

    if (!shopId) {
      return res.status(400).json({ error: "Shop ID is required" });
    }

    const result = await smartShelfService.getAtRiskInventory(shopId);
    res.json(result);
  } catch (error: any) {
    console.error("Error in getAtRiskInventory:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};
