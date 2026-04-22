import pool from "../db/index.js";

export async function getOrCreateDailyAnalytics(userId, date) {
  const result = await pool.query(
    `SELECT * FROM analytics 
     WHERE user_id = $1 AND date = $2`,
    [userId, date],
  );

  if (result.rows.length > 0) {
    return result.rows[0];
  }

  // Create new record if it doesn't exist
  const createResult = await pool.query(
    `INSERT INTO analytics (user_id, date, missions_completed, total_focus_minutes, avg_session_length, productivity_score, streak_count)
     VALUES ($1, $2, 0, 0, 0, 0, 0)
     ON CONFLICT (user_id, date) DO NOTHING
     RETURNING *`,
    [userId, date],
  );

  return createResult.rows[0] || result.rows[0];
}

export async function updateDailyAnalytics(userId, date, updates) {
  const {
    missionsCompleted,
    totalFocusMinutes,
    avgSessionLength,
    productivityScore,
    streakCount,
  } = updates;

  const result = await pool.query(
    `UPDATE analytics 
     SET missions_completed = COALESCE($1, missions_completed),
         total_focus_minutes = COALESCE($2, total_focus_minutes),
         avg_session_length = COALESCE($3, avg_session_length),
         productivity_score = COALESCE($4, productivity_score),
         streak_count = COALESCE($5, streak_count)
     WHERE user_id = $6 AND date = $7
     RETURNING *`,
    [
      missionsCompleted,
      totalFocusMinutes,
      avgSessionLength,
      productivityScore,
      streakCount,
      userId,
      date,
    ],
  );

  return result.rows[0];
}

export async function getUserAnalytics(userId, dateFrom = null, dateTo = null) {
  let query = "SELECT * FROM analytics WHERE user_id = $1";
  const params = [userId];

  if (dateFrom) {
    query += ` AND date >= $${params.length + 1}`;
    params.push(dateFrom);
  }

  if (dateTo) {
    query += ` AND date <= $${params.length + 1}`;
    params.push(dateTo);
  }

  query += " ORDER BY date DESC";

  const result = await pool.query(query, params);
  return result.rows;
}

export async function computeProductivityScore(userId, date) {
  const result = await pool.query(
    `SELECT 
       COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
       SUM(duration_minutes) as total_focus,
       COUNT(DISTINCT fs.id) as session_count
     FROM missions m
     FULL OUTER JOIN focus_sessions fs ON fs.user_id = m.user_id
     WHERE m.user_id = $1 AND (m.completed_at::date = $2 OR fs.session_date = $2)`,
    [userId, date],
  );

  const row = result.rows[0];

  // Score = (completed_missions * 25) + (total_focus_minutes) + (sessions_count * 10)
  const score =
    (row.completed || 0) * 25 +
    (row.total_focus || 0) * 0.5 +
    (row.session_count || 0) * 10;

  return Math.min(score, 100); // Cap at 100
}

export async function getMonthlyProductivityTrend(userId, monthsBack = 1) {
  const result = await pool.query(
    `SELECT 
       DATE_TRUNC('week', date)::date as week,
       AVG(productivity_score) as avg_score,
       SUM(total_focus_minutes) as total_minutes,
       SUM(missions_completed) as missions_done
     FROM analytics 
     WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '1 month' * $2
     GROUP BY DATE_TRUNC('week', date)
     ORDER BY week DESC`,
    [userId, monthsBack],
  );

  return result.rows;
}

export async function getAllTimeStats(userId) {
  const focusResult = await pool.query(
    `SELECT 
       COUNT(*) AS total_sessions,
       COALESCE(SUM(duration_minutes), 0) AS total_focus_minutes,
       COALESCE(AVG(duration_minutes), 0) AS avg_session_length
     FROM focus_sessions
     WHERE user_id = $1`,
    [userId],
  );

  const analyticsResult = await pool.query(
    `SELECT 
       COALESCE(MAX(productivity_score), 0) AS max_productivity_score,
       COALESCE(AVG(productivity_score), 0) AS avg_productivity_score,
       COALESCE(MAX(streak_count), 0) AS max_streak
     FROM analytics
     WHERE user_id = $1`,
    [userId],
  );

  return {
    ...focusResult.rows[0],
    ...analyticsResult.rows[0],
  };
}
