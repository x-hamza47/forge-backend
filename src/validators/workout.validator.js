import { z } from "zod";
import { WORKOUT_CATEGORIES } from "../models/workout.model.js";

const text = (max) => z.string().trim().max(max);

export const exerciseSchema = z.object({
  name: text(80).min(1, "Exercise name is required"),
  sets: z.coerce.number().int().min(1).max(100),
  reps: z.coerce.number().int().min(1).max(1000),
  weightKg: z.coerce.number().min(0).max(1000).nullable().optional().default(null),
  notes: text(300).optional().default(""),
});

const tagsSchema = z
  .array(text(30).min(1))
  .max(10, "A routine can have at most 10 tags")
  .transform((tags) => [...new Set(tags.map((t) => t.toLowerCase()))]);

const routineFields = {
  name: text(80).min(1, "Workout name is required"),
  category: z.enum(WORKOUT_CATEGORIES),
  tags: tagsSchema,
  exercises: z.array(exerciseSchema).max(50, "A routine can have at most 50 exercises"),
  durationMin: z.coerce.number().int().min(0).max(600),
  notes: text(1000),
};

export const createWorkoutSchema = z.object({
  name: routineFields.name,
  category: routineFields.category.optional().default("strength"),
  tags: routineFields.tags.optional().default([]),
  exercises: routineFields.exercises.optional().default([]),
  durationMin: routineFields.durationMin.optional().default(0),
  notes: routineFields.notes.optional().default(""),
});

export const updateWorkoutSchema = z
  .object({
    name: routineFields.name,
    category: routineFields.category,
    tags: routineFields.tags,
    exercises: routineFields.exercises,
    durationMin: routineFields.durationMin,
    notes: routineFields.notes,
    favorite: z.boolean(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, "Nothing to update");

export const listWorkoutsQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  category: z.enum([...WORKOUT_CATEGORIES, "all"]).optional(),
  tag: z.string().trim().max(30).optional(),
  favorite: z.enum(["true", "false"]).optional(),
  sort: z.enum(["recent", "name", "exercises"]).optional(),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid id"),
});