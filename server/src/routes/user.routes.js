"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const hashPassword_middleware_1 = require("../middlewares/hashPassword.middleware");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const userController = new user_controller_1.UserController();
// POST /api/users/register - Create a new user
// We apply the hashPasswordMiddleware here so the password is hashed BEFORE it reaches the controller
router.post("/register", hashPassword_middleware_1.hashPasswordMiddleware, userController.register);
// POST /api/users/login - Login
// We DO NOT apply the hash middleware here, because we need the raw password to compare
router.post("/login", userController.login);
// GET /api/users - List all users
router.get("/", auth_middleware_1.authMiddleware, userController.list);
// PUT /api/users/profile - Update user profile
router.put("/profile", auth_middleware_1.authMiddleware, userController.updateProfile);
// PUT /api/users/password - Update user password
router.put("/password", auth_middleware_1.authMiddleware, userController.updatePassword);
exports.default = router;
//# sourceMappingURL=user.routes.js.map