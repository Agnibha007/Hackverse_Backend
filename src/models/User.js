import pool from "../db/index.js";
import { NotFoundError } from "../utils/errors.js";

export async function findUserById(userId) {
  const result = await pool.query(
    "SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL",
    [userId],
  );
  return result.rows[0];
}

export async function findUserByEmail(email) {
  const result = await pool.query(
    "SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL",
    [email.toLowerCase()],
  );
  return result.rows[0];
}

export async function createUser(email, passwordHash, username) {
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, username)
     VALUES ($1, $2, $3)
     RETURNING id, email, username, created_at`,
    [email.toLowerCase(), passwordHash, username],
  );
  return result.rows[0];
}

export async function updateUserProfile(userId, updates) {
  const { username, profileImageUrl } = updates;

  const result = await pool.query(
    `UPDATE users
     SET username = COALESCE($1, username),
         profile_image_url = COALESCE($2, profile_image_url),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $3 AND deleted_at IS NULL
     RETURNING *`,
    [username, profileImageUrl, userId],
  );

  if (result.rows.length === 0) {
    throw new NotFoundError("User not found");
  }

  return result.rows[0];
}

export async function incrementUserXP(userId, amount) {
  const result = await pool.query(
    `UPDATE users
     SET xp_points = xp_points + $1,
         level = FLOOR(xp_points / 100) + 1
     WHERE id = $2
     RETURNING xp_points, level`,
    [amount, userId],
  );
  return result.rows[0];
}

export async function updateFocusStreak(userId, streakCount) {
  const result = await pool.query(
    `UPDATE users
     SET focus_streak = $1,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING focus_streak`,
    [streakCount, userId],
  );
  return result.rows[0];
}

export async function deleteUser(userId) {
  // Hard delete - cascades to missions, focus_sessions, analytics via FK ON DELETE CASCADE
  const result = await pool.query(
    "DELETE FROM users WHERE id = $1 RETURNING id",
    [userId],
  );
  return result.rows[0];
}

export async function addFocusMinutes(userId, minutes) {
  const result = await pool.query(
    `UPDATE users
     SET total_focus_minutes = total_focus_minutes + $1,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING total_focus_minutes`,
    [minutes, userId],
  );
  return result.rows[0];
}
