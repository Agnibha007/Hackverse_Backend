import express from "express";
import * as AiController from "../controllers/AiController.js";

const router = express.Router();

router.post("/chat", AiController.sendMessage);
router.get("/history", AiController.getHistory);
router.delete("/history", AiController.clearHistory);

export default router;
