import { z } from "zod";

export const reportParamSchema = z.object({
  type: z.enum(["workouts", "nutrition", "progress"], {
    errorMap: () => ({ message: "Report type must be workouts, nutrition, or progress" }),
  }),
});

export const reportQuerySchema = z.object({
  format: z.enum(["csv", "pdf"]).default("csv"),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "From date must be YYYY-MM-DD")
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "To date must be YYYY-MM-DD")
    .optional(),
});
