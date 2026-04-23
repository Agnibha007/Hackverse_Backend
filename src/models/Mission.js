import pool from "../db/index.js";
import { NotFoundError } from "../utils/errors.js";

export async function createMission(userId, missionData) {
  const { title, description, priority, deadline, xp_reward, subject_id } = missionData;
  const result = await pool.query(
    `INSERT INTO missions (user_id, title, description, priority, deadline, xp_reward, status, subject_id)
     VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7) RETURNING *`,
    [userId, title, description || null, priority, deadline || null, xp_reward, subject_id || null],
  );
  return result.rows[0];
}

export async function getUserMissions(userId, filters = {}) {
  let query = "SELECT * FROM missions WHERE user_id = $1";
  const params = [userId];

  if (filters.status) {
    query += ` AND status = $${params.length + 1}`;
    params.push(filters.status);
  }

  if (filters.priority) {
    query += ` AND priority = $${params.length + 1}`;
    params.push(filters.priority);
  }

  query += " ORDER BY deadline ASC NULLS LAST, created_at DESC";

  const result = await pool.query(query, params);
  return result.rows;
}

export async function getMissionById(missionId, userId) {
  const result = await pool.query(
    "SELECT * FROM missions WHERE id = $1 AND user_id = $2",
    [missionId, userId],
  );

  if (result.rows.length === 0) {
    throw new NotFoundError("Mission not found");
  }

  return result.rows[0];
}

export async function updateMission(missionId, userId, updates) {
  const allowedFields = ["title", "description", "priority", "status", "deadline", "xp_reward", "subject_id"];
  const updateFields = [];
  const params = [];

  Object.entries(updates).forEach(([key, value]) => {
    if (allowedFields.includes(key) && value !== undefined) {
      updateFields.push(`${key} = $${params.length + 1}`);
      params.push(value);
    }
  });

  if (updateFields.length === 0) throw new Error("No valid fields to update");

  if (updates.status === "completed") {
    updateFields.push(`completed_at = CURRENT_TIMESTAMP`);
  }

  updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

  params.push(missionId);
  params.push(userId);

  const query = `UPDATE missions SET ${updateFields.join(", ")}
                 WHERE id = $${params.length - 1} AND user_id = $${params.length}
                 RETURNING *`;

  const result = await pool.query(query, params);
  if (result.rows.length === 0) throw new NotFoundError("Mission not found");
  return result.rows[0];
}

export async function deleteMission(missionId, userId) {
  const result = await pool.query(
    "DELETE FROM missions WHERE id = $1 AND user_id = $2 RETURNING id",
    [missionId, userId],
  );

  if (result.rows.length === 0) {
    throw new NotFoundError("Mission not found");
  }

  return true;
}

export async function getMissionsStats(userId) {
  const result = await pool.query(
    `SELECT 
       COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
       COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
       COUNT(*) as total_count,
       COALESCE(SUM(CASE WHEN status = 'completed' THEN xp_reward ELSE 0 END), 0) as total_xp
     FROM missions 
     WHERE user_id = $1`,
    [userId],
  );
  return result.rows[0];
}

