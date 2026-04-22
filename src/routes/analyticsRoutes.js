import express from "express";
import * as AnalyticsController from "../controllers/AnalyticsController.js";

const router = express.Router();

router.get("/dashboard", AnalyticsController.getDashboardStats);
router.get("/trend", AnalyticsController.getProductivityTrend);
router.get("/detailed", AnalyticsController.getDetailedAnalytics);
router.get("/system", AnalyticsController.getSystemStats);

export default router;
