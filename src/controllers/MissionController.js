import * as MissionService from "../services/MissionService.js";
import {
  validateSchema,
  createMissionSchema,
  updateMissionSchema,
} from "../utils/validation.js";
import { formatResponse } from "../utils/helpers.js";

export async function createMission(req, res, next) {
  try {
    const validated = validateSchema(createMissionSchema, req.body);
    const userId = req.user.id;

    const mission = await MissionService.createNewMission(userId, validated);
    res.status(201).json(formatResponse(true, mission));
  } catch (error) {
    next(error);
  }
}

export async function listMissions(req, res, next) {
  try {
    const userId = req.user.id;
    const { status, priority } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (priority) filters.priority = priority;

    const missions = await MissionService.listMissions(userId, filters);
    res.json(formatResponse(true, missions));
  } catch (error) {
    next(error);
  }
}

export async function getMission(req, res, next) {
  try {
    const mission = await MissionService.getMissionDetails(req.user.id, req.params.id);
    res.json(formatResponse(true, mission));
  } catch (error) {
    next(error);
  }
}

export async function updateMission(req, res, next) {
  try {
    const validated = validateSchema(updateMissionSchema, req.body);
    const mission = await MissionService.updateMissionDetails(req.user.id, req.params.id, validated);
    res.json(formatResponse(true, mission));
  } catch (error) {
    next(error);
  }
}

export async function deleteMission(req, res, next) {
  try {
    await MissionService.removeMission(req.user.id, req.params.id);
    res.json(formatResponse(true, { id: req.params.id, deleted: true }));
  } catch (error) {
    next(error);
  }
}

export async function getMissionsOverview(req, res, next) {
  try {
    const userId = req.user.id;
    const overview = await MissionService.getMissionsOverview(userId);

    res.json(formatResponse(true, overview));
  } catch (error) {
    next(error);
  }
}
