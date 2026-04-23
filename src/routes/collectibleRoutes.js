import express from "express";
import * as CollectibleController from "../controllers/CollectibleController.js";

const router = express.Router();

router.get("/", CollectibleController.getCollectibles);
router.post("/award", CollectibleController.awardCollectible);

export default router;
