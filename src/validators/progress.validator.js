import { z } from "zod";
import { MEASUREMENT_KEYS } from "../models/bodyEntry.model.js";
import { PERFORMANCE_METRICS } from "../models/performanceEntry.model.js";

const text = (max) => z.string().trim().max(max);
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");

const measurementsSchema = z
  .object(
    Object.fromEntries(
      MEASUREMENT_KEYS.map((key) => [key, z.coerce.number().min(0).max(500).optional()]),
    ),
  )
  .default({});

export const createBodySchema = z.object({
  date: dateString,
  weightKg: z.coerce.number().min(0).max(700).nullable().optional().default(null),
  measurements: measurementsSchema,
  notes: text(500).optional().default(""),
});

export const updateBodySchema = z
  .object({
    date: dateString,
    weightKg: z.coerce.number().min(0).max(700).nullable(),
    measurements: measurementsSchema,
    notes: text(500),
  })
  .partial()
  .refine((d) => Object.keys(d).length > 0, "Nothing to update");

export const createPerformanceSchema = z.object({
  date: dateString,
  metric: z.enum(PERFORMANCE_METRICS),
  value: z.coerce.number().min(0).max(100000),
  notes: text(500).optional().default(""),
});

export const updatePerformanceSchema = z
  .object({
    date: dateString,
    metric: z.enum(PERFORMANCE_METRICS),
    value: z.coerce.number().min(0).max(100000),
    notes: text(500),
  })
  .partial()
  .refine((d) => Object.keys(d).length > 0, "Nothing to update");

export const progressQuerySchema = z.object({
  range: z.enum(["30d", "90d", "1y"]).optional(),
});