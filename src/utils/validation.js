import { z } from "zod";
import { ValidationError } from "./errors.js";

export const userSignupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
});

export const userLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string(),
});

export const createMissionSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(1000).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  deadline: z.string().datetime().optional(),
  xp_reward: z.number().int().min(10).max(500).default(50),
  subject_id: z.string().uuid().optional().nullable(),
});

export const updateMissionSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  status: z.enum(["pending", "active", "completed", "cancelled"]).optional(),
  deadline: z.string().datetime().optional(),
  subject_id: z.string().uuid().optional().nullable(),
});

export const focusSessionSchema = z.object({
  duration_minutes: z.number().int().min(1).max(480),
  mission_id: z.number().int().optional().nullable(),
  focus_quality: z
    .enum(["distracted", "normal", "focused", "deep"])
    .default("normal"),
  notes: z.string().max(500).optional(),
});

export function validateSchema(schema, data) {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues || error.errors || [];
      const first = issues[0];
      const message = first ? `${first.path.join(".") ? first.path.join(".") + ": " : ""}${first.message}` : "Validation failed";
      throw new ValidationError(message);
    }
    throw error;
  }
}
