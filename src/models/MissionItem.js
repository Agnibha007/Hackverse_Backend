import pool from "../db/index.js";

export async function getItemsByMission(missionId, userId) {
  const result = await pool.query(
    `SELECT * FROM mission_items WHERE mission_id = $1 AND user_id = $2 ORDER BY created_at ASC`,
    [missionId, userId]
  );
  return result.rows;
}

export async function createItem(missionId, userId, { type, content, list_name }) {
  const result = await pool.query(
    `INSERT INTO mission_items (mission_id, user_id, type, content, list_name)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [missionId, userId, type, content, list_name || null]
  );
  return result.rows[0];
}

export async function updateItem(itemId, userId, { content, checked, list_name }) {
  const result = await pool.query(
    `UPDATE mission_items
     SET content = COALESCE($1, content),
         checked = COALESCE($2, checked),
         list_name = COALESCE($3, list_name),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $4 AND user_id = $5
     RETURNING *`,
    [content ?? null, checked ?? null, list_name ?? null, itemId, userId]
  );
  return result.rows[0];
}

export async function deleteItem(itemId, userId) {
  await pool.query(
    `DELETE FROM mission_items WHERE id = $1 AND user_id = $2`,
    [itemId, userId]
  );
}
