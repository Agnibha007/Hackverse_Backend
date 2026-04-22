import express from "express";
import * as AuthController from "../controllers/AuthController.js";
import { authMiddleware } from "../middlewares/auth.js";
import { authLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

router.post("/signup", authLimiter, AuthController.signup);
router.post("/login", authLimiter, AuthController.login);
router.get("/profile", authMiddleware, AuthController.getProfile);
router.patch("/profile", authMiddleware, AuthController.updateProfile);
router.post("/refresh-token", authMiddleware, AuthController.refreshToken);
router.delete("/account", authMiddleware, AuthController.deleteAccount);

export default router;
