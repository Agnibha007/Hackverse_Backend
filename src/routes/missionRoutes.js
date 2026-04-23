import express from "express";
import * as MissionController from "../controllers/MissionController.js";
import * as MissionItemController from "../controllers/MissionItemController.js";

const router = express.Router();

router.get("/overview", MissionController.getMissionsOverview);
router.get("/", MissionController.listMissions);
router.post("/", MissionController.createMission);
router.get("/:id", MissionController.getMission);
router.patch("/:id", MissionController.updateMission);
router.delete("/:id", MissionController.deleteMission);

// Mission workspace
router.post("/:id/activate", MissionItemController.activateMission);
router.get("/:id/items", MissionItemController.getItems);
router.post("/:id/items", MissionItemController.createItem);
router.patch("/:id/items/:itemId", MissionItemController.updateItem);
router.delete("/:id/items/:itemId", MissionItemController.deleteItem);

export default router;
