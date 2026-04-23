import pool from "../db/index.js";

export async function getSubjectsByUser(userId) {
  const result = await pool.query(
    `SELECT s.*,
       COUNT(DISTINCT m.id) FILTER (WHERE m.status != 'cancelled') as mission_count,
       COUNT(DISTINCT m.id) FILTER (WHERE m.status = 'completed') as completed_missions,
       COALESCE(SUM(fs.duration_minutes), 0) as total_focus_minutes
     FROM subjects s
     LEFT JOIN missions m ON m.subject_id = s.id
     LEFT JOIN focus_sessions fs ON fs.subject_id = s.id
     WHERE s.user_id = $1
     GROUP BY s.id
     ORDER BY s.created_at ASC`,
    [userId]
  );
  return result.rows;
}

export async function createSubject(userId, { name, color, icon }) {
  const result = await pool.query(
    `INSERT INTO subjects (user_id, name, color, icon) VALUES ($1, $2, $3, $4) RETURNING *`,
    [userId, name, color || "blue", icon || "book"]
  );
  return result.rows[0];
}

export async function updateSubject(subjectId, userId, { name, color, icon }) {
  const result = await pool.query(
    `UPDATE subjects SET name = COALESCE($1, name), color = COALESCE($2, color), icon = COALESCE($3, icon)
     WHERE id = $4 AND user_id = $5 RETURNING *`,
    [name, color, icon, subjectId, userId]
  );
  return result.rows[0];
}

export async function deleteSubject(subjectId, userId) {
  await pool.query(`DELETE FROM subjects WHERE id = $1 AND user_id = $2`, [subjectId, userId]);
}

export async function getSubjectStats(subjectId, userId) {
  const result = await pool.query(
    `SELECT
       s.name, s.color, s.icon,
       COUNT(DISTINCT m.id) FILTER (WHERE m.status = 'completed') as completed_missions,
       COUNT(DISTINCT m.id) FILTER (WHERE m.status = 'active') as active_missions,
       COALESCE(SUM(fs.duration_minutes), 0) as total_minutes,
       COUNT(DISTINCT fs.session_date) as study_days,
       COALESCE(AVG(fs.duration_minutes), 0) as avg_session_minutes
     FROM subjects s
     LEFT JOIN missions m ON m.subject_id = s.id
     LEFT JOIN focus_sessions fs ON fs.subject_id = s.id
     WHERE s.id = $1 AND s.user_id = $2
     GROUP BY s.id`,
    [subjectId, userId]
  );
  return result.rows[0];
}
