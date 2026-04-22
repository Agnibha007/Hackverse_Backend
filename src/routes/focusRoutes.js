import express from "express";
import * as FocusController from "../controllers/FocusController.js";

const router = express.Router();

router.post("/session", FocusController.recordFocusSession);
router.get("/history", FocusController.getFocusHistory);
router.get("/daily", FocusController.getDailyMetrics);
router.get("/weekly", FocusController.getWeeklyMetrics);
router.get("/streak", FocusController.getFocusStreak);

export default router;
