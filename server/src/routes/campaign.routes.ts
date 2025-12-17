import { Router } from "express";
import { campaignController } from "../controllers/campaign.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/campaigns - Get all campaigns
router.get("/", (req, res) => campaignController.getCampaigns(req, res));

// POST /api/campaigns - Create new campaign
router.post("/", (req, res) => campaignController.createCampaign(req, res));

// PUT /api/campaigns/:id - Update campaign
router.put("/:id", (req, res) => campaignController.updateCampaign(req, res));

// POST /api/campaigns/:id/schedule - Schedule campaign
router.post("/:id/schedule", (req, res) => campaignController.scheduleCampaign(req, res));

// POST /api/campaigns/:id/publish - Publish campaign
router.post("/:id/publish", (req, res) => campaignController.publishCampaign(req, res));

// POST /api/campaigns/:id/unschedule - Unschedule campaign (change to DRAFT)
router.post("/:id/unschedule", (req, res) => campaignController.unscheduleCampaign(req, res));

// DELETE /api/campaigns/:id - Delete campaign
router.delete("/:id", (req, res) => campaignController.deleteCampaign(req, res));

export default router;

