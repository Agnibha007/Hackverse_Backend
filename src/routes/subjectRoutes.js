import express from "express";
import * as SubjectController from "../controllers/SubjectController.js";

const router = express.Router();

router.get("/", SubjectController.getSubjects);
router.post("/", SubjectController.createSubject);
router.patch("/:id", SubjectController.updateSubject);
router.delete("/:id", SubjectController.deleteSubject);
router.get("/:id/stats", SubjectController.getSubjectStats);

export default router;
