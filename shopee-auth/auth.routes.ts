// src/routes/auth.routes.ts
import { Router, Request, Response } from "express";
import { authController } from "./auth.controller";
import { authMiddleware } from "./auth.middleware";

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post("/register", (req: Request, res: Response) => authController.register(req, res));

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post("/login", (req: Request, res: Response) => authController.login(req, res));

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/me", authMiddleware, (req: Request, res: Response) => authController.getMe(req, res));

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side)
 * @access  Private
 */
router.post("/logout", authMiddleware, (req: Request, res: Response) => authController.logout(req, res));

export default router;
