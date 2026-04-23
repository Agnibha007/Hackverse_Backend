import pool from "../db/index.js";

export async function getOrCreateDailyGoal(userId, date, defaultMinutes = 60) {
  const existing = await pool.query(
    `SELECT * FROM daily_goals WHERE user_id = $1 AND date = $2`,
    [userId, date]
  );
  if (existing.rows[0]) return existing.rows[0];
  const result = await pool.query(
    `INSERT INTO daily_goals (user_id, date, target_minutes) VALUES ($1, $2, $3)
     ON CONFLICT (user_id, date) DO NOTHING RETURNING *`,
    [userId, date, defaultMinutes]
  );
  return result.rows[0] || existing.rows[0];
}

export async function setDailyGoal(userId, date, targetMinutes) {
  const result = await pool.query(
    `INSERT INTO daily_goals (user_id, date, target_minutes) VALUES ($1, $2, $3)
     ON CONFLICT (user_id, date) DO UPDATE SET target_minutes = $3 RETURNING *`,
    [userId, date, targetMinutes]
  );
  return result.rows[0];
}
