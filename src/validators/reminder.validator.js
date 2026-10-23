import { z } from "zod";

export const createReminderSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(100),
  kind: z.enum(["workout", "meal", "goal"], {
    errorMap: () => ({ message: "Kind must be workout, meal, or goal" }),
  }),
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be in HH:mm format (e.g. 08:30, 18:00)"),
  days: z.array(z.number().int().min(0).max(6)).min(1, "Select at least one day"),
  active: z.boolean().optional(),
});

export const updateReminderSchema = createReminderSchema.partial();

export const reminderIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid reminder ID"),
});
