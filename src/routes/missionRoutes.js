import express from "express";
import * as MissionController from "../controllers/MissionController.js";

const router = express.Router();

router.get("/overview", MissionController.getMissionsOverview);
router.get("/", MissionController.listMissions);
router.post("/", MissionController.createMission);
router.get("/:id", MissionController.getMission);
router.patch("/:id", MissionController.updateMission);
router.delete("/:id", MissionController.deleteMission);

export default router;
