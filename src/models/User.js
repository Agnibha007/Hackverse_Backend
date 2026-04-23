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

export async function verifyUserWithOtp(email, otp) {
  const result = await pool.query(
    `UPDATE users SET email_verified = TRUE, otp_code = NULL, otp_expires_at = NULL, updated_at = CURRENT_TIMESTAMP
     WHERE email = $1 AND otp_code = $2 AND otp_expires_at > NOW() AND deleted_at IS NULL
     RETURNING *`,
    [email.toLowerCase(), otp]
  );
  return result.rows[0];
}

export async function findUserByUsername(username) {
  const result = await pool.query(
    "SELECT id FROM users WHERE username = $1 AND deleted_at IS NULL",
    [username]
  );
  return result.rows[0];
}


export async function createUser(email, passwordHash, username, onboardingCompleted = false, onboardingStep = 0) {
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, username, onboarding_completed, onboarding_step, email_verified)
     VALUES ($1, $2, $3, $4, $5, FALSE)
     RETURNING id, email, username, onboarding_completed, onboarding_step, email_verified, created_at`,
    [email.toLowerCase(), passwordHash, username, onboardingCompleted, onboardingStep],
  );
  return result.rows[0];
}

export async function createUserWithVerification(email, passwordHash, username, otp) {
  await pool.query(
    `DELETE FROM users WHERE email = $1 AND deleted_at IS NOT NULL`,
    [email.toLowerCase()]
  );
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, username, onboarding_completed, onboarding_step, email_verified, otp_code, otp_expires_at)
     VALUES ($1, $2, $3, FALSE, 0, FALSE, $4, $5)
     RETURNING id, email, username, onboarding_completed, onboarding_step, email_verified, created_at`,
    [email.toLowerCase(), passwordHash, username, otp, otpExpiry]
  );
  return result.rows[0];
}

export async function findUserByVerificationToken(token) {
  const result = await pool.query(
    `SELECT * FROM users WHERE verification_token = $1 AND deleted_at IS NULL`,
    [token]
  );
  return result.rows[0];
}

export async function updateOtp(email, otp) {
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
  await pool.query(
    `UPDATE users SET otp_code = $1, otp_expires_at = $2, updated_at = CURRENT_TIMESTAMP
     WHERE email = $3 AND deleted_at IS NULL`,
    [otp, otpExpiry, email.toLowerCase()]
  );
}

export async function verifyUserEmail(userId) {
  const result = await pool.query(
    `UPDATE users SET email_verified = TRUE, verification_token = NULL, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 RETURNING *`,
    [userId]
  );
  return result.rows[0];
}

export async function findOrCreateGoogleUser(email, googleId, username, profileImageUrl) {
  // Hard-delete any soft-deleted rows with this email or google_id to free up unique constraints
  await pool.query(
    `DELETE FROM users WHERE (email = $1 OR google_id = $2) AND deleted_at IS NOT NULL`,
    [email.toLowerCase(), googleId]
  );

  let result = await pool.query(
    `SELECT * FROM users WHERE google_id = $1 AND deleted_at IS NULL`,
    [googleId]
  );
  if (result.rows[0]) return { user: result.rows[0], isNew: false };

  result = await pool.query(
    `SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL`,
    [email.toLowerCase()]
  );
  if (result.rows[0]) {
    const updated = await pool.query(
      `UPDATE users SET google_id = $1, email_verified = TRUE, profile_image_url = COALESCE(profile_image_url, $2), updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 RETURNING *`,
      [googleId, profileImageUrl, result.rows[0].id]
    );
    return { user: updated.rows[0], isNew: false };
  }

  const newUser = await pool.query(
    `INSERT INTO users (email, username, google_id, profile_image_url, email_verified, onboarding_completed, onboarding_step)
     VALUES ($1, $2, $3, $4, TRUE, FALSE, 0)
     RETURNING *`,
    [email.toLowerCase(), username, googleId, profileImageUrl]
  );
  return { user: newUser.rows[0], isNew: true };
}

export async function getUserOnboardingStatus(userId) {
  const result = await pool.query(
    `SELECT onboarding_completed, onboarding_step, callsign, main_goal FROM users WHERE id = $1 AND deleted_at IS NULL`,
    [userId],
  );
  return result.rows[0];
}

export async function updateUserOnboarding(userId, onboardingCompleted, onboardingStep, callsign, mainGoal) {
  const result = await pool.query(
    `UPDATE users SET
       onboarding_completed = $1,
       onboarding_step = $2,
       callsign = COALESCE($3, callsign),
       main_goal = COALESCE($4, main_goal),
       updated_at = CURRENT_TIMESTAMP
     WHERE id = $5 AND deleted_at IS NULL
     RETURNING onboarding_completed, onboarding_step, callsign, main_goal`,
    [onboardingCompleted, onboardingStep, callsign || null, mainGoal || null, userId]
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

export async function softDeleteUser(userId) {
  await pool.query(
    `UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1`,
    [userId]
  );
}
export async function incrementUserXP(userId, amount) {
  const before = await pool.query(
    `SELECT level FROM users WHERE id = $1`, [userId]
  );
  const oldLevel = before.rows[0]?.level || 1;

  const result = await pool.query(
    `UPDATE users
     SET xp_points = xp_points + $1,
         level = (
           SELECT COALESCE(
             (SELECT MAX(l) FROM generate_series(1, 50) AS l
              WHERE (100 * (power(2, l-1) - 1)) <= (xp_points + $1)),
             1
           )
         ),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING xp_points, level`,
    [amount, userId]
  );
  const newLevel = result.rows[0]?.level || 1;
  return { ...result.rows[0], oldLevel, newLevel, leveledUp: newLevel > oldLevel };
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

