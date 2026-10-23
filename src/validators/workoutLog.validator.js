import { z } from "zod";
import { WORKOUT_CATEGORIES } from "../models/workout.model.js";

const text = (max) => z.string().trim().max(max);

const dateString = z
  .string()
  .trim()
  .refine((value) => !Number.isNaN(new Date(value).getTime()), "Invalid date");

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

const setSchema = z.object({
  reps: z.coerce.number().int().min(1).max(1000),
  weightKg: z.coerce.number().min(0).max(1000).nullable().optional().default(null),
});

const logExerciseSchema = z.object({
  name: text(80).min(1, "Exercise name is required"),
  sets: z.array(setSchema).min(1, "Each exercise needs at least one set").max(100),
  notes: text(300).optional().default(""),
});

export const createLogSchema = z
  .object({
    workoutId: objectId.optional(),
    name: text(80).min(1, "Workout name is required").optional(),
    category: z.enum(WORKOUT_CATEGORIES).optional(),
    performedAt: dateString.optional(),
    durationMin: z.coerce.number().int().min(0).max(600).optional(),
    exercises: z.array(logExerciseSchema).max(50).optional(),
    notes: text(1000).optional(),
  })
  .refine((data) => data.workoutId || data.name, {
    message: "Provide a workoutId or a workout name",
    path: ["name"],
  });

export const listLogsQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  category: z.enum([...WORKOUT_CATEGORIES, "all"]).optional(),
  from: dateString.optional(),
  to: dateString.optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const exerciseNameParamSchema = z.object({
  name: z.string().trim().min(1, "Exercise name is required").max(80),
});

export const exerciseProgressQuerySchema = z.object({
  range: z.enum(["7d", "30d", "90d"]).optional(),
});