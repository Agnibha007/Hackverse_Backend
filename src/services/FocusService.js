import * as FocusSessionModel from "../models/FocusSession.js";
import * as AnalyticsModel from "../models/Analytics.js";
import * as UserModel from "../models/User.js";
import * as CollectibleModel from "../models/Collectible.js";

export async function startFocusSession(userId, sessionData) {
  const session = await FocusSessionModel.createFocusSession(userId, sessionData);
  await UserModel.addFocusMinutes(userId, sessionData.duration_minutes);
  await CollectibleModel.awardCollectible(userId, 3, "first_session");
  const today = new Date().toISOString().split("T")[0];
  await updateDailyAnalyticsFromSessions(userId, today);
  const streak = await FocusSessionModel.calculateFocusStreak(userId);
  await UserModel.updateFocusStreak(userId, streak);
  return session;
}

export async function getUserFocusHistory(userId, days = 7) {
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - days);
  const formattedDate = dateFrom.toISOString().split("T")[0];

  const sessions = await FocusSessionModel.getUserFocusSessions(
    userId,
    formattedDate,
  );
  return sessions;
}

export async function getDailyFocusMetrics(userId, date) {
  const sessions = await FocusSessionModel.getFocusSessionsForDay(userId, date);
  const stats = await FocusSessionModel.getDailyFocusStats(userId, date);

  return {
    sessions,
    totalMinutes: stats?.total_minutes || 0,
    sessionCount: stats?.session_count || 0,
    avgDuration: Math.round(stats?.avg_duration || 0),
    deepFocusSessions: stats?.deep_focus_sessions || 0,
  };
}

export async function getWeeklyFocusMetrics(userId) {
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - 7);
  const formattedDate = dateFrom.toISOString().split("T")[0];

  const weeklyData = await FocusSessionModel.getWeeklyFocusStats(
    userId,
    formattedDate,
  );

  const totalMinutes = weeklyData.reduce(
    (sum, day) => sum + (day.total_minutes || 0),
    0,
  );
  const totalSessions = weeklyData.reduce(
    (sum, day) => sum + (day.session_count || 0),
    0,
  );

  return {
    dailyBreakdown: weeklyData,
    totalMinutesThisWeek: totalMinutes,
    totalSessionsThisWeek: totalSessions,
    avgMinutesPerDay: Math.round(totalMinutes / 7),
  };
}

export async function updateDailyAnalyticsFromSessions(userId, date) {
  const dailyMetrics = await getDailyFocusMetrics(userId, date);
  const productivityScore = await AnalyticsModel.computeProductivityScore(userId, date);
  const streak = await FocusSessionModel.calculateFocusStreak(userId);

  await AnalyticsModel.getOrCreateDailyAnalytics(userId, date);
  await AnalyticsModel.updateDailyAnalytics(userId, date, {
    totalFocusMinutes: parseInt(dailyMetrics.totalMinutes) || 0,
    avgSessionLength: dailyMetrics.avgDuration || 0,
    productivityScore: Math.round(productivityScore),
    streakCount: streak,
  });
}

export async function calculateFocusStreak(userId) {
  const streak = await FocusSessionModel.calculateFocusStreak(userId);
  return streak;
}
