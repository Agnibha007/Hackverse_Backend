import * as MissionItemModel from "../models/MissionItem.js";
import * as MissionModel from "../models/Mission.js";
import * as AuthService from "../services/AuthService.js";
import { formatResponse } from "../utils/helpers.js";

const ACTIVATION_XP = 10;

export async function activateMission(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const mission = await MissionModel.updateMission(id, userId, { status: "active" });
    await AuthService.awardXP(userId, ACTIVATION_XP);
    res.json(formatResponse(true, { mission, xpAwarded: ACTIVATION_XP }));
  } catch (error) {
    next(error);
  }
}

export async function getItems(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const items = await MissionItemModel.getItemsByMission(id, userId);
    res.json(formatResponse(true, items));
  } catch (error) {
    next(error);
  }
}

export async function createItem(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { type, content, list_name } = req.body;
    if (!["todo", "thought", "list"].includes(type) || !content?.trim()) {
      return res.status(400).json(formatResponse(false, null, "Invalid item data"));
    }
    const item = await MissionItemModel.createItem(id, userId, { type, content: content.trim(), list_name });
    res.status(201).json(formatResponse(true, item));
  } catch (error) {
    next(error);
  }
}

export async function updateItem(req, res, next) {
  try {
    const { itemId } = req.params;
    const userId = req.user.id;
    const item = await MissionItemModel.updateItem(itemId, userId, req.body);
    res.json(formatResponse(true, item));
  } catch (error) {
    next(error);
  }
}

export async function deleteItem(req, res, next) {
  try {
    const { itemId } = req.params;
    const userId = req.user.id;
    await MissionItemModel.deleteItem(itemId, userId);
    res.json(formatResponse(true, { deleted: true }));
  } catch (error) {
    next(error);
  }
}
