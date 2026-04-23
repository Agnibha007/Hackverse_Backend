import pool from "../db/index.js";

export async function awardCollectible(userId, memeId, reason) {
  const existing = await pool.query(
    `SELECT id FROM collectibles WHERE user_id = $1 AND reason = $2`,
    [userId, reason]
  );
  if (existing.rows[0]) return null;
  const result = await pool.query(
    `INSERT INTO collectibles (user_id, meme_id, reason) VALUES ($1, $2, $3) RETURNING *`,
    [userId, memeId, reason]
  );
  return result.rows[0];
}

export async function getUserCollectibles(userId) {
  const result = await pool.query(
    `SELECT * FROM collectibles WHERE user_id = $1 ORDER BY earned_at ASC`,
    [userId]
  );
  return result.rows;
}
