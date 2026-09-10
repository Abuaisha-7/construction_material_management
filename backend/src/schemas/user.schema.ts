import { z } from "zod";

export const createUserSchema = z.object({
  fullName: z
    .string()
    .min(2)
    .max(100),

  email: z
    .string()
    .email("Invalid email address"),

  phone: z
    .string()
    .max(50)
    .optional(),

  password: z
    .string()
    .min(8, "Password must contain at least 8 characters"),

  status: z
    .enum([
      "ACTIVE",
      "INACTIVE",
      "SUSPENDED",
    ])
    .default("ACTIVE"),
});

export const updateUserSchema = z.object({
  fullName: z
    .string()
    .min(2)
    .max(100)
    .optional(),

  email: z
    .string()
    .email("Invalid email address")
    .optional(),

  phone: z
    .string()
    .max(50)
    .optional(),

  password: z
    .string()
    .min(8, "Password must contain at least 8 characters")
    .optional(),

  status: z
    .enum([
      "ACTIVE",
      "INACTIVE",
      "SUSPENDED",
    ])
    .optional(),
});