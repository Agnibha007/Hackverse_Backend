import express from "express";
import * as S from "../controllers/SocialController.js";

const router = express.Router();

router.get("/users/search", S.searchUsers);

router.get("/friends", S.getFriends);
router.post("/friends/request", S.sendFriendRequest);
router.get("/friends/requests/pending", S.getPendingRequests);
router.get("/friends/requests/sent", S.getSentRequests);
router.patch("/friends/requests/:id", S.respondRequest);
router.delete("/friends/:friendId", S.removeFriend);

router.post("/presence", S.updatePresence);

router.get("/messages/unread", S.getUnreadCounts);
router.get("/messages/:friendId", S.getConversation);
router.post("/messages", S.sendMessage);

router.get("/sessions/friends", S.getFriendSessions);
router.post("/sessions", S.createSession);
router.get("/sessions/:id", S.getSession);
router.post("/sessions/:id/join", S.joinSession);
router.post("/sessions/:id/end", S.endSession);

router.get("/leaderboard", S.getLeaderboard);

export default router;
