import { Router } from "express";
import { AdController } from "../../controllers/ad.controller";

const router = Router();
const controller = new AdController();

// Ad copy generation
router.post("/generate-ad", controller.generateAd.bind(controller));

// Ad image generation
router.post("/generate-ad-image", controller.generateAdImage.bind(controller));

// Smart promotions
router.get("/:shopId/promotions", controller.getPromotions.bind(controller));

export default router;
