"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ad_controller_1 = require("../../controllers/ad.controller");
const router = (0, express_1.Router)();
const controller = new ad_controller_1.AdController();
// Ad copy generation
router.post("/generate-ad", controller.generatedAd.bind(controller));
// Ad image generation
router.post("/generate-ad-image", controller.generateAdImage.bind(controller));
// Smart promotions
router.get("/:shopId/promotions", controller.getPromotions.bind(controller));
exports.default = router;
//# sourceMappingURL=ad.router.js.map