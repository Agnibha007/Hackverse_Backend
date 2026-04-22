import * as AnalyticsModel from "../models/Analytics.js";
import * as UserModel from "../models/User.js";

export async function getUserDashboardStats(userId) {
  const today = new Date().toISOString().split("T")[0];

  // Get today's analytics
  const todayAnalytics = await AnalyticsModel.getOrCreateDailyAnalytics(
    userId,
    today,
  );

  // Get user's overall stats
  const user = await UserModel.findUserById(userId);

  // Get all-time stats
  const allTimeStats = await AnalyticsModel.getAllTimeStats(userId);

  return {
    today: {
      missionsCompleted: todayAnalytics?.missions_completed || 0,
      focusMinutes: todayAnalytics?.total_focus_minutes || 0,
      productivityScore: todayAnalytics?.productivity_score || 0,
    },
    user: {
      username: user?.username,
      xpPoints: user?.xp_points || 0,
      level: user?.level || 1,
      focusStreak: user?.focus_streak || 0,
      totalFocusMinutes: user?.total_focus_minutes || 0,
    },
    allTime: {
      totalSessions: allTimeStats?.total_sessions || 0,
      totalFocusMinutes: allTimeStats?.total_focus_minutes || 0,
      avgSessionLength: Math.round(allTimeStats?.avg_session_length || 0),
      maxProductivityScore: Math.round(
        allTimeStats?.max_productivity_score || 0,
      ),
      avgProductivityScore: Math.round(
        allTimeStats?.avg_productivity_score || 0,
      ),
      maxStreak: allTimeStats?.max_streak || 0,
    },
  };
}

export async function getProductivityTrend(userId, monthsBack = 1) {
  const trend = await AnalyticsModel.getMonthlyProductivityTrend(
    userId,
    monthsBack,
  );

  return {
    data: trend,
    summary: {
      averageProductivity: Math.round(
        trend.reduce((sum, week) => sum + (week.avg_score || 0), 0) /
          (trend.length || 1),
      ),
      totalFocusMinutes: trend.reduce(
        (sum, week) => sum + (week.total_minutes || 0),
        0,
      ),
      missionsCompleted: trend.reduce(
        (sum, week) => sum + (week.missions_done || 0),
        0,
      ),
    },
  };
}

export async function getDetailedAnalytics(
  userId,
  dateFrom = null,
  dateTo = null,
) {
  const analytics = await AnalyticsModel.getUserAnalytics(
    userId,
    dateFrom,
    dateTo,
  );

  return {
    records: analytics,
    dateRange: {
      from: dateFrom,
      to: dateTo,
    },
  };
}
