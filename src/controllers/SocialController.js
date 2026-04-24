import * as Social from "../models/Social.js";
import { formatResponse } from "../utils/helpers.js";
import { ValidationError } from "../utils/errors.js";

// ── Friends ──────────────────────────────────────────────

export async function searchUsers(req, res, next) {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) throw new ValidationError("Search query must be at least 2 characters");
    const users = await Social.searchUsers(q.trim(), req.user.id);
    res.json(formatResponse(true, users));
  } catch (err) { next(err); }
}

export async function sendFriendRequest(req, res, next) {
  try {
    const { userId } = req.body;
    if (!userId) throw new ValidationError("userId is required");
    if (userId === req.user.id) throw new ValidationError("Cannot add yourself");
    const result = await Social.sendRequest(req.user.id, userId);
    if (result.error) throw new ValidationError(result.error);
    res.status(201).json(formatResponse(true, result.request));
  } catch (err) { next(err); }
}

export async function respondRequest(req, res, next) {
  try {
    const { id } = req.params;
    const { action } = req.body;
    if (!["accepted", "rejected"].includes(action)) throw new ValidationError("action must be accepted or rejected");
    const result = await Social.respondToRequest(id, req.user.id, action);
    if (!result) throw new ValidationError("Request not found or already handled");
    res.json(formatResponse(true, result));
  } catch (err) { next(err); }
}

export async function removeFriend(req, res, next) {
  try {
    await Social.removeFriend(req.user.id, req.params.friendId);
    res.json(formatResponse(true, { removed: true }));
  } catch (err) { next(err); }
}

export async function getFriends(req, res, next) {
  try {
    const friends = await Social.getFriends(req.user.id);
    res.json(formatResponse(true, friends));
  } catch (err) { next(err); }
}

export async function getPendingRequests(req, res, next) {
  try {
    const requests = await Social.getPendingRequests(req.user.id);
    res.json(formatResponse(true, requests));
  } catch (err) { next(err); }
}

export async function getSentRequests(req, res, next) {
  try {
    const requests = await Social.getSentRequests(req.user.id);
    res.json(formatResponse(true, requests));
  } catch (err) { next(err); }
}

// ── Presence ─────────────────────────────────────────────

export async function updatePresence(req, res, next) {
  try {
    const { status, studying_subject } = req.body;
    if (!["online", "offline", "studying"].includes(status)) throw new ValidationError("Invalid status");
    await Social.upsertPresence(req.user.id, status, studying_subject || null);
    res.json(formatResponse(true, { updated: true }));
  } catch (err) { next(err); }
}

// ── Messages ─────────────────────────────────────────────

export async function sendMessage(req, res, next) {
  try {
    const { receiverId, content } = req.body;
    if (!receiverId || !content?.trim()) throw new ValidationError("receiverId and content are required");
    if (content.trim().length > 1000) throw new ValidationError("Message too long");
    const msg = await Social.sendMessage(req.user.id, receiverId, content);
    if (!msg) throw new ValidationError("You can only message friends");
    res.status(201).json(formatResponse(true, msg));
  } catch (err) { next(err); }
}

export async function getConversation(req, res, next) {
  try {
    const msgs = await Social.getConversation(req.user.id, req.params.friendId);
    await Social.markRead(req.params.friendId, req.user.id);
    res.json(formatResponse(true, msgs));
  } catch (err) { next(err); }
}

export async function getUnreadCounts(req, res, next) {
  try {
    const counts = await Social.getUnreadCounts(req.user.id);
    res.json(formatResponse(true, counts));
  } catch (err) { next(err); }
}

// ── Study Sessions ────────────────────────────────────────

export async function createSession(req, res, next) {
  try {
    const { subject, duration_minutes } = req.body;
    const session = await Social.createStudySession(req.user.id, subject, duration_minutes);
    await Social.upsertPresence(req.user.id, "studying", subject || "General");
    res.status(201).json(formatResponse(true, session));
  } catch (err) { next(err); }
}

export async function joinSession(req, res, next) {
  try {
    const session = await Social.joinStudySession(req.params.id, req.user.id);
    if (!session) throw new ValidationError("Session not found or ended");
    await Social.upsertPresence(req.user.id, "studying", session.subject);
    res.json(formatResponse(true, session));
  } catch (err) { next(err); }
}

export async function getSession(req, res, next) {
  try {
    const session = await Social.getStudySession(req.params.id);
    if (!session) throw new ValidationError("Session not found");
    res.json(formatResponse(true, session));
  } catch (err) { next(err); }
}

export async function endSession(req, res, next) {
  try {
    await Social.endStudySession(req.params.id, req.user.id);
    await Social.upsertPresence(req.user.id, "online");
    res.json(formatResponse(true, { ended: true }));
  } catch (err) { next(err); }
}

export async function getFriendSessions(req, res, next) {
  try {
    const sessions = await Social.getActiveFriendSessions(req.user.id);
    res.json(formatResponse(true, sessions));
  } catch (err) { next(err); }
}

// ── Leaderboard ───────────────────────────────────────────

export async function getLeaderboard(req, res, next) {
  try {
    const board = await Social.getFriendsLeaderboard(req.user.id);
    res.json(formatResponse(true, board));
  } catch (err) { next(err); }
}
