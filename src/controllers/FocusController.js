import * as FocusService from "../services/FocusService.js";
import * as DailyGoalModel from "../models/DailyGoal.js";
import { validateSchema, focusSessionSchema } from "../utils/validation.js";
import { formatResponse } from "../utils/helpers.js";

export async function recordFocusSession(req, res, next) {
  try {
    const validated = validateSchema(focusSessionSchema, req.body);
    const session = await FocusService.startFocusSession(req.user.id, {
      ...validated,
      subject_id: req.body.subject_id || null,
    });
    res.status(201).json(formatResponse(true, session));
  } catch (error) {
    next(error);
  }
}

export async function getFocusHistory(req, res, next) {
  try {
    const sessions = await FocusService.getUserFocusHistory(req.user.id, parseInt(req.query.days || 7));
    res.json(formatResponse(true, sessions));
  } catch (error) {
    next(error);
  }
}

export async function getDailyMetrics(req, res, next) {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json(formatResponse(false, null, "Date parameter is required"));
    const metrics = await FocusService.getDailyFocusMetrics(req.user.id, date);
    res.json(formatResponse(true, metrics));
  } catch (error) {
    next(error);
  }
}

export async function getWeeklyMetrics(req, res, next) {
  try {
    const metrics = await FocusService.getWeeklyFocusMetrics(req.user.id);
    res.json(formatResponse(true, metrics));
  } catch (error) {
    next(error);
  }
}

export async function getFocusStreak(req, res, next) {
  try {
    const streak = await FocusService.calculateFocusStreak(req.user.id);
    res.json(formatResponse(true, { streak }));
  } catch (error) {
    next(error);
  }
}

export async function getDailyGoal(req, res, next) {
  try {
    const today = new Date().toISOString().split("T")[0];
    const goal = await DailyGoalModel.getOrCreateDailyGoal(req.user.id, today);
    res.json(formatResponse(true, goal));
  } catch (error) {
    next(error);
  }
}

export async function setDailyGoal(req, res, next) {
  try {
    const { target_minutes } = req.body;
    if (!target_minutes || target_minutes < 1) return res.status(400).json(formatResponse(false, null, "Invalid target"));
    const today = new Date().toISOString().split("T")[0];
    const goal = await DailyGoalModel.setDailyGoal(req.user.id, today, target_minutes);
    res.json(formatResponse(true, goal));
  } catch (error) {
    next(error);
  }
}
