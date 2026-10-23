import { z } from "zod";

export const createTicketSchema = z.object({
  type: z.enum(["contact", "issue", "feedback"], {
    errorMap: () => ({ message: "Type must be contact, issue, or feedback" }),
  }),
  subject: z
    .string()
    .trim()
    .min(3, "Subject must be at least 3 characters")
    .max(120, "Subject cannot exceed 120 characters"),
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message cannot exceed 2000 characters"),
});
