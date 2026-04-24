import pool from "../db/index.js";

// ── Friends ──────────────────────────────────────────────

export async function sendRequest(senderId, receiverId) {
  const existing = await pool.query(
    `SELECT id, status FROM friend_requests WHERE
     (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)`,
    [senderId, receiverId]
  );
  if (existing.rows[0]) return { error: "Request already exists", existing: existing.rows[0] };

  const alreadyFriends = await pool.query(
    `SELECT id FROM friendships WHERE (user_a = $1 AND user_b = $2) OR (user_a = $2 AND user_b = $1)`,
    [senderId, receiverId]
  );
  if (alreadyFriends.rows[0]) return { error: "Already friends" };

  const result = await pool.query(
    `INSERT INTO friend_requests (sender_id, receiver_id) VALUES ($1, $2) RETURNING *`,
    [senderId, receiverId]
  );
  return { request: result.rows[0] };
}

export async function respondToRequest(requestId, userId, action) {
  const req = await pool.query(
    `SELECT * FROM friend_requests WHERE id = $1 AND receiver_id = $2 AND status = 'pending'`,
    [requestId, userId]
  );
  if (!req.rows[0]) return null;

  await pool.query(
    `UPDATE friend_requests SET status = $1, updated_at = NOW() WHERE id = $2`,
    [action, requestId]
  );

  if (action === "accepted") {
    const a = req.rows[0].sender_id < userId ? req.rows[0].sender_id : userId;
    const b = req.rows[0].sender_id < userId ? userId : req.rows[0].sender_id;
    await pool.query(
      `INSERT INTO friendships (user_a, user_b) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [a, b]
    );
  }
  return req.rows[0];
}

export async function removeFriend(userId, friendId) {
  await pool.query(
    `DELETE FROM friendships WHERE (user_a = $1 AND user_b = $2) OR (user_a = $2 AND user_b = $1)`,
    [userId, friendId]
  );
  await pool.query(
    `DELETE FROM friend_requests WHERE
     (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)`,
    [userId, friendId]
  );
}

export async function getFriends(userId) {
  const result = await pool.query(
    `SELECT u.id, u.username, u.callsign, u.profile_image_url, u.xp_points, u.level,
            p.status as presence_status, p.studying_subject, p.last_seen,
            (SELECT COUNT(*) FROM collectibles WHERE user_id = u.id) as collectible_count
     FROM friendships f
     JOIN users u ON (u.id = CASE WHEN f.user_a = $1 THEN f.user_b ELSE f.user_a END)
     LEFT JOIN presence p ON p.user_id = u.id
     WHERE (f.user_a = $1 OR f.user_b = $1) AND u.deleted_at IS NULL
     ORDER BY p.status ASC, u.username ASC`,
    [userId]
  );
  return result.rows;
}

export async function getPendingRequests(userId) {
  const result = await pool.query(
    `SELECT fr.id, fr.created_at, fr.status,
            u.id as sender_id, u.username, u.callsign, u.profile_image_url, u.level
     FROM friend_requests fr
     JOIN users u ON u.id = fr.sender_id
     WHERE fr.receiver_id = $1 AND fr.status = 'pending' AND u.deleted_at IS NULL
     ORDER BY fr.created_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function getSentRequests(userId) {
  const result = await pool.query(
    `SELECT fr.id, fr.created_at, fr.status,
            u.id as receiver_id, u.username, u.callsign, u.profile_image_url
     FROM friend_requests fr
     JOIN users u ON u.id = fr.receiver_id
     WHERE fr.sender_id = $1 AND fr.status = 'pending' AND u.deleted_at IS NULL
     ORDER BY fr.created_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function searchUsers(query, currentUserId) {
  const result = await pool.query(
    `SELECT u.id, u.username, u.callsign, u.profile_image_url, u.level,
            CASE
              WHEN f.id IS NOT NULL THEN 'friends'
              WHEN fr_sent.id IS NOT NULL THEN 'request_sent'
              WHEN fr_recv.id IS NOT NULL THEN 'request_received'
              ELSE 'none'
            END as relationship
     FROM users u
     LEFT JOIN friendships f ON (f.user_a = $2 AND f.user_b = u.id) OR (f.user_a = u.id AND f.user_b = $2)
     LEFT JOIN friend_requests fr_sent ON fr_sent.sender_id = $2 AND fr_sent.receiver_id = u.id AND fr_sent.status = 'pending'
     LEFT JOIN friend_requests fr_recv ON fr_recv.receiver_id = $2 AND fr_recv.sender_id = u.id AND fr_recv.status = 'pending'
     WHERE u.id != $2 AND u.deleted_at IS NULL
       AND (u.username ILIKE $1 OR u.callsign ILIKE $1)
     LIMIT 20`,
    [`%${query}%`, currentUserId]
  );
  return result.rows;
}

// ── Presence ─────────────────────────────────────────────

export async function upsertPresence(userId, status, studyingSubject = null) {
  await pool.query(
    `INSERT INTO presence (user_id, status, studying_subject, last_seen)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (user_id) DO UPDATE
     SET status = $2, studying_subject = $3, last_seen = NOW()`,
    [userId, status, studyingSubject]
  );
}

export async function setOffline(userId) {
  await pool.query(
    `INSERT INTO presence (user_id, status, last_seen) VALUES ($1, 'offline', NOW())
     ON CONFLICT (user_id) DO UPDATE SET status = 'offline', last_seen = NOW()`,
    [userId]
  );
}

// ── Messages ─────────────────────────────────────────────

export async function sendMessage(senderId, receiverId, content) {
  const areFriends = await pool.query(
    `SELECT id FROM friendships WHERE (user_a = $1 AND user_b = $2) OR (user_a = $2 AND user_b = $1)`,
    [senderId, receiverId]
  );
  if (!areFriends.rows[0]) return null;

  const result = await pool.query(
    `INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3) RETURNING *`,
    [senderId, receiverId, content.trim()]
  );
  return result.rows[0];
}

export async function getConversation(userA, userB, limit = 50) {
  const result = await pool.query(
    `SELECT m.*, u.username as sender_username, u.callsign as sender_callsign
     FROM messages m
     JOIN users u ON u.id = m.sender_id
     WHERE (m.sender_id = $1 AND m.receiver_id = $2)
        OR (m.sender_id = $2 AND m.receiver_id = $1)
     ORDER BY m.created_at DESC LIMIT $3`,
    [userA, userB, limit]
  );
  return result.rows.reverse();
}

export async function markRead(senderId, receiverId) {
  await pool.query(
    `UPDATE messages SET read = TRUE WHERE sender_id = $1 AND receiver_id = $2 AND read = FALSE`,
    [senderId, receiverId]
  );
}

export async function getUnreadCounts(userId) {
  const result = await pool.query(
    `SELECT sender_id, COUNT(*) as count
     FROM messages WHERE receiver_id = $1 AND read = FALSE
     GROUP BY sender_id`,
    [userId]
  );
  return result.rows;
}

// ── Study Sessions ────────────────────────────────────────

export async function createStudySession(hostId, subject, durationMinutes) {
  const result = await pool.query(
    `INSERT INTO study_sessions (host_id, subject, duration_minutes)
     VALUES ($1, $2, $3) RETURNING *`,
    [hostId, subject || "General", durationMinutes || 25]
  );
  const session = result.rows[0];
  await pool.query(
    `INSERT INTO study_session_participants (session_id, user_id) VALUES ($1, $2)`,
    [session.id, hostId]
  );
  return session;
}

export async function joinStudySession(sessionId, userId) {
  const session = await pool.query(
    `SELECT * FROM study_sessions WHERE id = $1 AND status != 'ended'`,
    [sessionId]
  );
  if (!session.rows[0]) return null;

  await pool.query(
    `INSERT INTO study_session_participants (session_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [sessionId, userId]
  );

  if (session.rows[0].status === "waiting") {
    const endsAt = new Date(Date.now() + session.rows[0].duration_minutes * 60000);
    await pool.query(
      `UPDATE study_sessions SET status = 'active', started_at = NOW(), ends_at = $1 WHERE id = $2`,
      [endsAt, sessionId]
    );
  }
  return getStudySession(sessionId);
}

export async function getStudySession(sessionId) {
  const result = await pool.query(
    `SELECT s.*,
            json_agg(json_build_object('id', u.id, 'username', u.username, 'callsign', u.callsign)) as participants
     FROM study_sessions s
     JOIN study_session_participants sp ON sp.session_id = s.id
     JOIN users u ON u.id = sp.user_id
     WHERE s.id = $1
     GROUP BY s.id`,
    [sessionId]
  );
  return result.rows[0];
}

export async function endStudySession(sessionId, userId) {
  await pool.query(
    `UPDATE study_sessions SET status = 'ended' WHERE id = $1 AND host_id = $2`,
    [sessionId, userId]
  );
}

export async function getActiveFriendSessions(userId) {
  const result = await pool.query(
    `SELECT s.*, u.username as host_username, u.callsign as host_callsign,
            (SELECT COUNT(*) FROM study_session_participants WHERE session_id = s.id) as participant_count
     FROM study_sessions s
     JOIN users u ON u.id = s.host_id
     JOIN study_session_participants sp ON sp.session_id = s.id
     JOIN friendships f ON (f.user_a = $1 AND f.user_b = sp.user_id) OR (f.user_a = sp.user_id AND f.user_b = $1)
     WHERE s.status IN ('waiting', 'active') AND sp.user_id != $1
     GROUP BY s.id, u.username, u.callsign
     ORDER BY s.created_at DESC`,
    [userId]
  );
  return result.rows;
}

// ── Leaderboard ───────────────────────────────────────────

export async function getFriendsLeaderboard(userId) {
  const result = await pool.query(
    `SELECT u.id, u.username, u.callsign, u.profile_image_url, u.xp_points, u.level, u.focus_streak,
            COUNT(c.id) as collectible_count,
            COALESCE(SUM(c.meme_id), 0) as collectible_score
     FROM users u
     LEFT JOIN collectibles c ON c.user_id = u.id
     WHERE u.id = $1 OR EXISTS (
       SELECT 1 FROM friendships f
       WHERE (f.user_a = $1 AND f.user_b = u.id) OR (f.user_a = u.id AND f.user_b = $1)
     )
     AND u.deleted_at IS NULL
     GROUP BY u.id
     ORDER BY collectible_count DESC, u.xp_points DESC`,
    [userId]
  );
  return result.rows;
}
