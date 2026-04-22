import * as AnalyticsService from "../services/AnalyticsService.js";
import { formatResponse } from "../utils/helpers.js";

export async function getDashboardStats(req, res, next) {
  try {
    const userId = req.user.id;
    const stats = await AnalyticsService.getUserDashboardStats(userId);
    res.json(formatResponse(true, stats));
  } catch (error) {
    next(error);
  }
}

export async function getProductivityTrend(req, res, next) {
  try {
    const userId = req.user.id;
    const { monthsBack = 1 } = req.query;

    const trend = await AnalyticsService.getProductivityTrend(
      userId,
      parseInt(monthsBack),
    );
    res.json(formatResponse(true, trend));
  } catch (error) {
    next(error);
  }
}

export async function getDetailedAnalytics(req, res, next) {
  try {
    const userId = req.user.id;
    const { dateFrom, dateTo } = req.query;

    const analytics = await AnalyticsService.getDetailedAnalytics(
      userId,
      dateFrom,
      dateTo,
    );
    res.json(formatResponse(true, analytics));
  } catch (error) {
    next(error);
  }
}

export async function getSystemStats(req, res, next) {
  try {
    const userId = req.user.id;
    const stats = await AnalyticsService.getUserDashboardStats(userId);

    // Return a game-like system stats object
    const systemStats = {
      commandCenter: {
        operationalStatus: "ONLINE",
        systemIntegrity: stats.user.level * 10,
      },
      unitStatus: {
        designation: stats.user.username,
        powerLevel: stats.user.xpPoints,
        operatingLevel: stats.user.level,
        focusResonance: stats.user.focusStreak,
      },
      missionMetrics: {
        completedToday: stats.today.missionsCompleted,
        productivityOutput: stats.today.productivityScore,
      },
      focusCore: {
        totalActivationTime: stats.user.totalFocusMinutes,
        averageSessionLength: stats.allTime.avgSessionLength,
      },
    };

    res.json(formatResponse(true, systemStats));
  } catch (error) {
    next(error);
  }
}
