import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { hashPasswordMiddleware } from "../middlewares/hashPassword.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();
const userController = new UserController();

// POST /api/users/register - Create a new user
// We apply the hashPasswordMiddleware here so the password is hashed BEFORE it reaches the controller
router.post("/register", hashPasswordMiddleware, userController.register);

// POST /api/users/login - Login
// We DO NOT apply the hash middleware here, because we need the raw password to compare
router.post("/login", userController.login);

// GET /api/users - List all users
router.get("/", authMiddleware, userController.list);

// PUT /api/users/profile - Update user profile
router.put("/profile", authMiddleware, userController.updateProfile);

// PUT /api/users/password - Update user password
router.put("/password", authMiddleware, userController.updatePassword);

// POST /api/users/shopee-sync - Sync user from Shopee-Clone system (SSO)
router.post("/shopee-sync", userController.syncShopeeUser);

export default router;
