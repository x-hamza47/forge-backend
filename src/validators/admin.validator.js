import { z } from "zod";

export const adminUsersQuerySchema = z.object({
  search: z.string().optional(),
  role: z.enum(["all", "user", "admin"]).optional(),
  status: z.enum(["all", "active", "inactive"]).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const adminTicketsQuerySchema = z.object({
  status: z.enum(["all", "open", "in_progress", "resolved"]).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const adminTicketUpdateSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved"]).optional(),
  adminReply: z.string().optional(),
});

export const createAdminUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["user", "admin"]).default("user"),
  isActive: z.boolean().optional().default(true),
});

export const updateAdminUserSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/)
    .optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional().or(z.literal("")),
  role: z.enum(["user", "admin"]).optional(),
  isActive: z.boolean().optional(),
});

