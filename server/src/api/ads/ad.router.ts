import { Router } from "express";
import { AdController } from "../../controllers/ad.controller";

const router = Router();
const controller = new AdController();

router.post("/generate-ad", controller.generatedAd);
router.get("/:shopId/promotions", controller.getPromotions);

export default router;
