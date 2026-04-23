import pool from "../db/index.js";


// not the best way but works
export async function getOrCreateDailyAnalytics(usrId, dt) {
  const res = await pool.query(
    `SELECT * FROM analytics 
     WHERE user_id = $1 AND date = $2`,
    [usrId, dt],
  );

  if (res.rows.length > 0) {
    return res.rows[0];
  }

  // quick fix for race
  const createRes = await pool.query(
    `INSERT INTO analytics (user_id, date)
     VALUES ($1, $2)
     ON CONFLICT (user_id, date) DO NOTHING
     RETURNING *`,
    [usrId, dt],
  );

  if (createRes.rows.length > 0) {
    return createRes.rows[0];
  }
  // might optimize later
  return await getOrCreateDailyAnalytics(usrId, dt);
}

export async function updateDailyAnalytics(user_id, dt, updates) {
  const {
    missionsCompleted: missions_done,
    totalFocusMinutes: total_focus,
    avgSessionLength: avgSessLen,
    productivityScore: prodScore,
    streakCount: streak_cnt,
  } = updates;

  const respnse = await pool.query(
    `UPDATE analytics 
     SET missions_completed = COALESCE($1, missions_completed),
         total_focus_minutes = COALESCE($2, total_focus_minutes),
         avg_session_length = COALESCE($3, avg_session_length),
         productivity_score = COALESCE($4, productivity_score),
         streak_count = COALESCE($5, streak_count)
     WHERE user_id = $6 AND date = $7
     RETURNING *`,
    [
      missions_done,
      total_focus,
      avgSessLen,
      prodScore,
      streak_cnt,
      user_id,
      dt,
    ],
  );

  return respnse.rows[0];
}

export async function getUserAnalytics(user_id, dateFrom = null, dateTo = null) {
  let q = "SELECT * FROM analytics WHERE user_id = $1";
  const params = [user_id];

  if (dateFrom) {
    q += ` AND date >= $${params.length + 1}`;
    params.push(dateFrom);
  }

  if (dateTo) {
    q += ` AND date <= $${params.length + 1}`;
    params.push(dateTo);
  }

  q += " ORDER BY date DESC";

  const res = await pool.query(q, params);
  return res.rows;
}

export async function computeProductivityScore(user_id, dt) {
  const res = await pool.query(
    `SELECT 
       (SELECT COUNT(*) FROM missions WHERE user_id = $1 AND status = 'completed' AND completed_at::date = $2) as completed,
       (SELECT COALESCE(SUM(duration_minutes), 0) FROM focus_sessions WHERE user_id = $1 AND session_date = $2) as total_focus,
       (SELECT COUNT(*) FROM focus_sessions WHERE user_id = $1 AND session_date = $2) as session_count
    `,
    [user_id, dt],
  );

  const row = res.rows[0];

  // quick calc
  const scr =
    (parseInt(row.completed) || 0) * 25 +
    (parseInt(row.total_focus) || 0) * 0.5 +
    (parseInt(row.session_count) || 0) * 10;

  return Math.min(scr, 100); // Cap at 100
}

export async function getMonthlyProductivityTrend(user_id, monthsBack = 1) {
  const res = await pool.query(
    `SELECT 
       DATE_TRUNC('week', date)::date as week,
       AVG(productivity_score) as avg_score,
       SUM(total_focus_minutes) as total_minutes,
       SUM(missions_completed) as missions_done
     FROM analytics 
     WHERE user_id = $1 AND date >= CURRENT_DATE - (INTERVAL '1 month' * $2)
     GROUP BY DATE_TRUNC('week', date)
     ORDER BY week DESC`,
    [user_id, monthsBack],
  );

  return res.rows;
}

export async function getAllTimeStats(user_id) {
  const res = await pool.query(
    `SELECT 
       (SELECT COUNT(*) FROM focus_sessions WHERE user_id = $1) AS total_sessions,
       (SELECT COALESCE(SUM(duration_minutes), 0) FROM focus_sessions WHERE user_id = $1) AS total_focus_minutes,
       (SELECT COALESCE(AVG(duration_minutes), 0) FROM focus_sessions WHERE user_id = $1) AS avg_session_length,
       (SELECT COALESCE(MAX(productivity_score), 0) FROM analytics WHERE user_id = $1) AS max_productivity_score,
       (SELECT COALESCE(AVG(productivity_score), 0) FROM analytics WHERE user_id = $1) AS avg_productivity_score,
       (SELECT COALESCE(MAX(streak_count), 0) FROM analytics WHERE user_id = $1) AS max_streak
    `,
    [user_id]
  );

  return res.rows[0];
}