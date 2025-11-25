import { Request, Response } from "express";
import { AdService } from "../service/ad.service";
import { AdRequest, AdResponse } from "../api/ads/ad.types";
import { error } from "console";

import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

dotenv.config({ path: path.join(__dirname, "../.env") });

const adService = new AdService();

export class AdController {
  public async generatedAd(req: Request, res: Response): Promise<void> {
    try {
      const requestData: AdRequest = req.body;
      if (!requestData.product_name || !requestData.playbook) {
        res.status(400).json({ error: "Missing product_name or playbook" });
        return;
      }
      const adCopy = await adService.generateAdCopy(requestData);
      const response: AdResponse = {
        playbookUsed: requestData.playbook,
        product_name: requestData.product_name,
        generated_ad_copy: adCopy,
      };
      res.status(200).json(response);
    } catch (error) {
      // 6. Handle any errors from the service
      console.error("Error in AdController:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  }

  public async getPromotions(req: Request, res: Response): Promise<void> {
    try {
      const { shopId } = req.params;
      if (!shopId) {
        res.status(400).json({ error: "Shop ID is required" });
        return;
      }

      const promotions = await adService.getPromotions(shopId);
      res.status(200).json(promotions);
    } catch (error) {
      console.error("Error in getPromotions:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  }
}
