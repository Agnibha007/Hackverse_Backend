import express from "express";
import * as AuthController from "../controllers/AuthController.js";
import { authMiddleware } from "../middlewares/auth.js";
import { authLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

router.post("/signup", authLimiter, AuthController.signup);
router.post("/verify-otp", AuthController.verifyOtp);
router.post("/resend-otp", AuthController.resendOtp);
router.post("/login", authLimiter, AuthController.login);
router.post("/google", authLimiter, AuthController.googleLogin);
router.get("/verify-email", AuthController.verifyEmail);

router.get("/profile", authMiddleware, AuthController.getProfile);
router.patch("/profile", authMiddleware, AuthController.updateProfile);
router.delete("/profile", authMiddleware, AuthController.deleteAccount);
router.post("/refresh-token", authMiddleware, AuthController.refreshToken);

router.get("/user/onboarding-status", authMiddleware, AuthController.getOnboardingStatus);
router.post("/user/onboarding", authMiddleware, AuthController.updateOnboarding);

export default router;
