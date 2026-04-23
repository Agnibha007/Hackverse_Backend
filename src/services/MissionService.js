import * as MissionModel from "../models/Mission.js";
import * as AnalyticsModel from "../models/Analytics.js";
import * as AuthService from "./AuthService.js";
import * as CollectibleModel from "../models/Collectible.js";
import { NotFoundError } from "../utils/errors.js";

export async function createNewMission(userId, missionData) {
  const mission = await MissionModel.createMission(userId, missionData);
  await CollectibleModel.awardCollectible(userId, 2, "first_mission");
  return mission;
}

export async function listMissions(userId, filters = {}) {
  const missions = await MissionModel.getUserMissions(userId, filters);
  return missions;
}

export async function getMissionDetails(userId, missionId) {
  const mission = await MissionModel.getMissionById(missionId, userId);
  return mission;
}

export async function updateMissionDetails(userId, missionId, updates) {
  const mission = await MissionModel.updateMission(missionId, userId, updates);

  // Award XP if mission was completed
  if (updates.status === "completed" && mission) {
    const xpReward = mission.xp_reward || 50;
    await AuthService.awardXP(userId, xpReward);

    const today = new Date().toISOString().split("T")[0];
    const analyticsRecord = await AnalyticsModel.getOrCreateDailyAnalytics(userId, today);
    const missionsCompletedToday = (analyticsRecord?.missions_completed || 0) + 1;
    const productivityScore = await AnalyticsModel.computeProductivityScore(userId, today);

    await AnalyticsModel.updateDailyAnalytics(userId, today, {
      missionsCompleted: missionsCompletedToday,
      productivityScore: Math.round(productivityScore),
    });
  }

  return mission;
}

export async function removeMission(userId, missionId) {
  await MissionModel.deleteMission(missionId, userId);
  return true;
}

export async function getMissionsOverview(userId) {
  const stats = await MissionModel.getMissionsStats(userId);
  return {
    total: stats.total_count || 0,
    completed: stats.completed_count || 0,
    active: stats.active_count || 0,
    totalXpEarned: stats.total_xp || 0,
  };
}
