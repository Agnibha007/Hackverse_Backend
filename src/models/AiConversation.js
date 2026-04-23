import pool from "../db/index.js";

export async function saveMessage(userId, role, content) {
  const result = await pool.query(
    `INSERT INTO ai_conversations (user_id, role, content) VALUES ($1, $2, $3) RETURNING *`,
    [userId, role, content]
  );
  return result.rows[0];
}

export async function getRecentHistory(userId, limit = 20) {
  const result = await pool.query(
    `SELECT role, content FROM ai_conversations
     WHERE user_id = $1
     ORDER BY created_at DESC LIMIT $2`,
    [userId, limit]
  );
  return result.rows.reverse();
}

export async function clearHistory(userId) {
  await pool.query(`DELETE FROM ai_conversations WHERE user_id = $1`, [userId]);
}
