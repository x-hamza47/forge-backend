import { z } from "zod";
import { MEAL_TYPES } from "../models/meal.model.js";

const text = (max) => z.string().trim().max(max);
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");

const macrosSchema = z.object({
  protein: z.coerce.number().min(0).max(1000).default(0),
  carbs: z.coerce.number().min(0).max(1000).default(0),
  fat: z.coerce.number().min(0).max(1000).default(0),
});

const foodItemSchema = z.object({
  name: text(80).min(1, "Food name is required"),
  quantity: z.coerce.number().min(0).max(100000),
  unit: text(20).min(1, "Unit is required"),
  calories: z.coerce.number().min(0).max(20000),
  macros: macrosSchema.optional().default({ protein: 0, carbs: 0, fat: 0 }),
});

export const createMealSchema = z.object({
  date: dateString,
  mealType: z.enum(MEAL_TYPES),
  items: z.array(foodItemSchema).min(1, "Add at least one food item").max(30),
  notes: text(500).optional().default(""),
});

export const updateMealSchema = z
  .object({
    date: dateString,
    mealType: z.enum(MEAL_TYPES),
    items: z.array(foodItemSchema).min(1).max(30),
    notes: text(500),
  })
  .partial()
  .refine((d) => Object.keys(d).length > 0, "Nothing to update");

export const dayParamSchema = z.object({ date: dateString });

export const analyticsQuerySchema = z.object({
  range: z.enum(["7d", "30d", "90d"]).optional(),
});