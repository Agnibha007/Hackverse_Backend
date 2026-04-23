import Groq from "groq-sdk";
import * as AiConversationModel from "../models/AiConversation.js";
import * as UserModel from "../models/User.js";
import * as AnalyticsModel from "../models/Analytics.js";
import * as FocusSessionModel from "../models/FocusSession.js";
import * as MissionModel from "../models/Mission.js";
import * as SubjectModel from "../models/Subject.js";
import * as CollectibleModel from "../models/Collectible.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function buildSystemPrompt(userId) {
  const user = await UserModel.findUserById(userId);
  const today = new Date().toISOString().split("T")[0];
  const allTime = await AnalyticsModel.getAllTimeStats(userId);
  const todayAnalytics = await AnalyticsModel.getOrCreateDailyAnalytics(userId, today);
  const missions = await MissionModel.getUserMissions(userId, {});
  const subjects = await SubjectModel.getSubjectsByUser(userId);
  const streak = user.focus_streak || 0;

  const activeMissions = missions.filter(m => m.status === "active").map(m => m.title).join(", ") || "none";
  const pendingMissions = missions.filter(m => m.status === "pending").length;
  const completedMissions = missions.filter(m => m.status === "completed").length;
  const subjectList = subjects.map(s => `${s.name} (${s.total_focus_minutes}min studied)`).join(", ") || "none set";

  return `You are ARIA (Adaptive Research Intelligence Assistant), an elite AI study mentor embedded in Phi — a gamified productivity system with a cyberpunk aesthetic. You are not a generic assistant. You are deeply integrated with the user's study data and speak with precision, motivation, and tactical intelligence.

AGENT PROFILE:
- Codename: ${user.username}
- Level: ${user.level} | XP: ${user.xp_points}
- Focus Streak: ${streak} days
- Total Focus Time: ${user.total_focus_minutes} minutes (${Math.round(user.total_focus_minutes / 60)} hours)
- Today's Focus: ${todayAnalytics?.total_focus_minutes || 0} minutes
- Today's Productivity Score: ${todayAnalytics?.productivity_score || 0}/100
- All-Time Sessions: ${allTime?.total_sessions || 0}
- Avg Session Length: ${Math.round(allTime?.avg_session_length || 0)} minutes

MISSION STATUS:
- Active Missions: ${activeMissions}
- Pending: ${pendingMissions} | Completed: ${completedMissions}

SUBJECTS BEING STUDIED:
${subjectList}

YOUR BEHAVIORAL DIRECTIVES:
1. Address the user as "Agent ${user.username}" occasionally for immersion
2. Reference their actual stats when giving advice — never give generic tips
3. If streak is 0, motivate them to start. If streak > 7, acknowledge the discipline
4. Suggest specific study techniques (Pomodoro, spaced repetition, active recall, Feynman technique) based on context
5. When asked about a subject, give concrete study strategies for that specific subject
6. Keep responses concise but impactful — max 3-4 paragraphs unless a detailed explanation is requested
7. Use light cyberpunk language naturally (e.g. "initiating", "deploying", "system", "protocol") but don't overdo it
8. If the user seems stressed or overwhelmed, acknowledge it and suggest a recovery protocol
9. Track what they tell you across the conversation and reference it
10. Never say you "cannot" help with study topics — always attempt to assist
11. If asked for a study plan, create a specific, actionable one based on their subjects and available time
12. Celebrate wins — if they completed missions or have a good streak, acknowledge it with energy

RESPONSE STYLE: Direct, intelligent, motivating. Like a brilliant study partner who also happens to be an AI embedded in a cyberpunk dashboard.`;
}

export async function chat(userId, userMessage) {
  const systemPrompt = await buildSystemPrompt(userId);
  const history = await AiConversationModel.getRecentHistory(userId, 20);

  await AiConversationModel.saveMessage(userId, "user", userMessage);
  await CollectibleModel.awardCollectible(userId, 4, "first_aria");

  const messages = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: userMessage },
  ];

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages,
    max_tokens: 1024,
    temperature: 0.7,
  });

  const reply = completion.choices[0]?.message?.content || "System error. Please retry.";
  await AiConversationModel.saveMessage(userId, "assistant", reply);

  return reply;
}

export async function getHistory(userId) {
  return AiConversationModel.getRecentHistory(userId, 50);
}

export async function clearHistory(userId) {
  return AiConversationModel.clearHistory(userId);
}
