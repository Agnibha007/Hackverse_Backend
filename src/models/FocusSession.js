import pool from "../db/index.js";

export async function createFocusSession(userId, sessionData) {
  const { duration_minutes, mission_id, focus_quality, notes } = sessionData;

  const now = new Date();
  const sessionDate = now.toISOString().split("T")[0];

  const result = await pool.query(
    `INSERT INTO focus_sessions (user_id, mission_id, duration_minutes, session_date, started_at, ended_at, focus_quality, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      userId,
      mission_id || null,
      duration_minutes,
      sessionDate,
      new Date(now.getTime() - duration_minutes * 60000).toISOString(),
      now.toISOString(),
      focus_quality,
      notes || null,
    ],
  );

  return result.rows[0];
}

export async function getUserFocusSessions(
  userId,
  dateFrom = null,
  dateTo = null,
) {
  let query = "SELECT * FROM focus_sessions WHERE user_id = $1";
  const params = [userId];

  if (dateFrom) {
    query += ` AND session_date >= $${params.length + 1}`;
    params.push(dateFrom);
  }

  if (dateTo) {
    query += ` AND session_date <= $${params.length + 1}`;
    params.push(dateTo);
  }

  query += " ORDER BY session_date DESC, started_at DESC";

  const result = await pool.query(query, params);
  return result.rows;
}

export async function getFocusSessionsForDay(userId, date) {
  const result = await pool.query(
    `SELECT * FROM focus_sessions 
     WHERE user_id = $1 AND session_date = $2
     ORDER BY started_at ASC`,
    [userId, date],
  );
  return result.rows;
}

export async function getDailyFocusStats(userId, date) {
  const result = await pool.query(
    `SELECT 
       SUM(duration_minutes) as total_minutes,
       COUNT(*) as session_count,
       AVG(duration_minutes) as avg_duration,
       COUNT(CASE WHEN focus_quality = 'deep' THEN 1 END) as deep_focus_sessions
     FROM focus_sessions 
     WHERE user_id = $1 AND session_date = $2`,
    [userId, date],
  );
  return result.rows[0];
}

export async function getWeeklyFocusStats(userId, dateFrom) {
  const result = await pool.query(
    `SELECT 
       session_date,
       SUM(duration_minutes) as total_minutes,
       COUNT(*) as session_count
     FROM focus_sessions 
     WHERE user_id = $1 AND session_date >= $2
     GROUP BY session_date
     ORDER BY session_date DESC`,
    [userId, dateFrom],
  );
  return result.rows;
}

export async function calculateFocusStreak(userId) {
  // Count consecutive days with at least one session, going back from today
  const result = await pool.query(
    `WITH ordered_days AS (
       SELECT DISTINCT session_date,
              CURRENT_DATE - session_date AS days_ago
       FROM focus_sessions
       WHERE user_id = $1
       ORDER BY session_date DESC
     ),
     consecutive AS (
       SELECT session_date, days_ago,
              ROW_NUMBER() OVER (ORDER BY session_date DESC) AS rn
       FROM ordered_days
     )
     SELECT COUNT(*) AS streak_count
     FROM consecutive
     WHERE days_ago = rn - 1`,
    [userId],
  );

  return parseInt(result.rows[0]?.streak_count || 0);
}
