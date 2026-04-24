import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { authMiddleware } from "./middlewares/auth.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import { apiLimiter } from "./middlewares/rateLimiter.js";
import authRoutes from "./routes/authRoutes.js";
import missionRoutes from "./routes/missionRoutes.js";
import focusRoutes from "./routes/focusRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import collectibleRoutes from "./routes/collectibleRoutes.js";
import socialRoutes from "./routes/socialRoutes.js";
import db from "./db/index.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({
  origin: (process.env.CORS_ORIGIN || "http://localhost:5173").split(",").map(o => o.trim()),
  credentials: true,
}));
app.use(apiLimiter);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.options("*", cors());

app.get("/health", (req, res) => res.json({ status: "OK", timestamp: new Date().toISOString() }));

app.use("/api/auth", authRoutes);
app.use("/api/missions", authMiddleware, missionRoutes);
app.use("/api/focus", authMiddleware, focusRoutes);
app.use("/api/analytics", authMiddleware, analyticsRoutes);
app.use("/api/subjects", authMiddleware, subjectRoutes);
app.use("/api/ai", authMiddleware, aiRoutes);
app.use("/api/collectibles", authMiddleware, collectibleRoutes);
app.use("/api/social", authMiddleware, socialRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

process.on("SIGTERM", () => { console.log("SIGTERM received"); process.exit(0); });
process.on("SIGINT", () => { console.log("SIGINT received"); process.exit(0); });

const startServer = async () => {
  try {
    await db.runMigrations();
    console.log(`Gmail configured: ${!!process.env.GMAIL_USER}`);
    app.listen(PORT, () => {
      console.log(`Neon-Drive API running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

export default app;
