import * as FocusService from "../services/FocusService.js";
import { validateSchema, focusSessionSchema } from "../utils/validation.js";
import { formatResponse } from "../utils/helpers.js";

export async function recordFocusSession(req, res, next) {
  try {
    const validated = validateSchema(focusSessionSchema, req.body);
    const userId = req.user.id;

    const session = await FocusService.startFocusSession(userId, validated);

    // Update analytics
    const today = new Date().toISOString().split("T")[0];
    await FocusService.updateDailyAnalyticsFromSessions(userId, today);

    res.status(201).json(formatResponse(true, session));
  } catch (error) {
    next(error);
  }
}

export async function getFocusHistory(req, res, next) {
  try {
    const userId = req.user.id;
    const { days = 7 } = req.query;

    const sessions = await FocusService.getUserFocusHistory(
      userId,
      parseInt(days),
    );
    res.json(formatResponse(true, sessions));
  } catch (error) {
    next(error);
  }
}

export async function getDailyMetrics(req, res, next) {
  try {
    const userId = req.user.id;
    const { date } = req.query;

    if (!date) {
      return res
        .status(400)
        .json(formatResponse(false, null, "Date parameter is required"));
    }

    const metrics = await FocusService.getDailyFocusMetrics(userId, date);
    res.json(formatResponse(true, metrics));
  } catch (error) {
    next(error);
  }
}

export async function getWeeklyMetrics(req, res, next) {
  try {
    const userId = req.user.id;
    const metrics = await FocusService.getWeeklyFocusMetrics(userId);
    res.json(formatResponse(true, metrics));
  } catch (error) {
    next(error);
  }
}

export async function getFocusStreak(req, res, next) {
  try {
    const userId = req.user.id;
    const streak = await FocusService.calculateFocusStreak(userId);
    res.json(formatResponse(true, { streak }));
  } catch (error) {
    next(error);
  }
}
