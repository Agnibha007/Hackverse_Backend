# Phi — Backend API

All endpoints return JSON in this shape:

```json
{ "success": true, "data": { ... }, "error": null }
```

Protected endpoints need a Bearer token in the Authorization header. Tokens come from login/signup and last 7 days.

---

## Auth — `/api/auth`

**POST `/signup`** — Create an account. Sends a 6-digit OTP to the email if Gmail is configured, otherwise auto-verifies. Body: `{ email, password, username }`.

**POST `/verify-otp`** — Verify the OTP from the signup email. Body: `{ email, otp }`. Returns a JWT on success.

**POST `/resend-otp`** — Resend the verification code. Body: `{ email }`.

**POST `/login`** — Log in with email and password. Returns JWT. Blocked if email isn't verified. Body: `{ email, password }`.

**POST `/google`** — Sign in with Google. Body: `{ idToken, isAccessToken }`. Google users skip email verification entirely.

**GET `/verify-email`** — Legacy link-based verification. Redirects to OTP flow now.

**GET `/profile`** *(protected)* — Get the current user's full profile.

**PATCH `/profile`** *(protected)* — Update username or profile image. Body: `{ username?, profileImageUrl? }`.

**DELETE `/profile`** *(protected)* — Delete account permanently. Requires username confirmation. Body: `{ username }`.

**GET `/user/onboarding-status`** *(protected)* — Returns `{ onboarding_completed, onboarding_step, callsign, main_goal }`.

**POST `/user/onboarding`** *(protected)* — Save onboarding progress. Body: `{ onboardingCompleted, onboardingStep, callsign?, mainGoal? }`.

---

## Missions — `/api/missions` *(all protected)*

**GET `/`** — List missions. Optional query params: `status`, `priority`.

**POST `/`** — Create a mission. Body: `{ title, priority?, xp_reward?, deadline?, description?, subject_id? }`.

**GET `/:id`** — Get a single mission.

**PATCH `/:id`** — Update a mission. Completing it (`status: "completed"`) awards XP automatically.

**DELETE `/:id`** — Delete a mission.

**GET `/overview`** — Summary stats: total, completed, active, total XP earned.

**POST `/:id/activate`** — Activate a mission and award 10 XP bonus.

**GET `/:id/items`** — Get workspace items (todos, thoughts, lists).

**POST `/:id/items`** — Add an item. Body: `{ type, content, list_name? }`. Type is `todo`, `thought`, or `list`.

**PATCH `/:id/items/:itemId`** — Update an item (toggle checked, edit content).

**DELETE `/:id/items/:itemId`** — Delete an item.

---

## Focus — `/api/focus` *(all protected)*

**POST `/session`** — Log a focus session. Body: `{ duration_minutes, focus_quality, notes?, subject_id? }`. Quality is `distracted`, `normal`, `focused`, or `deep`.

**GET `/history`** — Session history. Query: `days` (default 7).

**GET `/daily`** — Daily metrics. Query: `date` (YYYY-MM-DD, required).

**GET `/weekly`** — Weekly breakdown with per-day totals.

**GET `/streak`** — Current focus streak count.

**GET `/goal`** — Today's daily focus goal.

**POST `/goal`** — Set today's goal. Body: `{ target_minutes }`.

---

## Analytics — `/api/analytics` *(all protected)*

**GET `/dashboard`** — Today's stats, user profile (XP, level, streak), and all-time records in one call.

**GET `/trend`** — Weekly productivity trend. Query: `monthsBack` (default 1).

**GET `/system`** — Gamified system stats used for the dashboard status display.

---

## Subjects — `/api/subjects` *(all protected)*

**GET `/`** — All subjects with aggregated stats (total minutes, missions completed, mission count).

**POST `/`** — Create a subject. Body: `{ name, color? }`.

**PATCH `/:id`** — Update a subject.

**DELETE `/:id`** — Delete a subject. Missions and sessions are unlinked, not deleted.

**GET `/:id/stats`** — Detailed stats for a single subject.

---

## AI Mentor — `/api/ai` *(all protected)*

**POST `/chat`** — Send a message to aria.ai. Body: `{ message }`. Returns `{ reply }`. Context is built fresh from the user's current stats before every call.

**GET `/history`** — Last 50 messages of conversation history.

**DELETE `/history`** — Clear conversation history.

---

## Collectibles — `/api/collectibles` *(all protected)*

**GET `/`** — All collectibles earned by the current user.

**POST `/award`** — Award a collectible. Body: `{ memeId, reason }`. Idempotent — won't duplicate if the reason already exists.

---

## Social — `/api/social` *(all protected)*

**GET `/users/search`** — Search users by username or callsign. Query: `q` (min 2 chars). Returns relationship status with each result (none, friends, request_sent, request_received).

**GET `/friends`** — Friends list with presence status, studying subject, and unread message counts.

**POST `/friends/request`** — Send a friend request. Body: `{ userId }`.

**GET `/friends/requests/pending`** — Incoming friend requests.

**GET `/friends/requests/sent`** — Outgoing friend requests still pending.

**PATCH `/friends/requests/:id`** — Accept or reject a request. Body: `{ action }` — either `"accepted"` or `"rejected"`.

**DELETE `/friends/:friendId`** — Remove a friend and delete the request history.

**POST `/presence`** — Update your presence status. Body: `{ status, studying_subject? }`. Status is `online`, `offline`, or `studying`.

**GET `/messages/unread`** — Unread message counts grouped by sender.

**GET `/messages/:friendId`** — Conversation history with a friend. Also marks their messages as read.

**POST `/messages`** — Send a message. Body: `{ receiverId, content }`. Only works between friends.

**GET `/sessions/friends`** — Active study sessions from friends you could join.

**POST `/sessions`** — Create a study session. Body: `{ subject?, duration_minutes? }`. Sets your presence to "studying".

**GET `/sessions/:id`** — Get session details including participant list.

**POST `/sessions/:id/join`** — Join a session. Starts the timer if it was waiting.

**POST `/sessions/:id/end`** — End a session (host only). Sets your presence back to "online".

**GET `/leaderboard`** — You and your friends ranked by collectibles earned, with XP as tiebreaker.

---

## Error codes

`400` — Validation failed (message explains what's wrong). `401` — Missing or expired token. `404` — Resource not found. `409` — Conflict (email taken, already friends, etc.). `429` — Rate limited. `500` — Something broke on the server.

Auth endpoints are limited to 5 requests per 15 minutes. Everything else is 100 per 15 minutes.
