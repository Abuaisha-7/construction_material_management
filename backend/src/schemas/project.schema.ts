import { z } from "zod";

export const createProjectSchema = z.object({
  code: z
    .string()
    .min(2)
    .max(50),

  name: z
    .string()
    .min(3)
    .max(255),

  description: z
    .string()
    .optional(),

  clientName: z
    .string()
    .min(2)
    .max(255),

  consultantName: z
    .string()
    .max(255)
    .optional(),

  contractorName: z
    .string()
    .max(255)
    .optional(),

  location: z
    .string()
    .max(255)
    .optional(),

  contractNumber: z
    .string()
    .max(100)
    .optional(),

  contractAmount: z
    .number()
    .nonnegative()
    .optional(),

  currency: z
    .string()
    .length(3)
    .default("ETB"),

  startDate: z
    .coerce
    .date(),

  plannedCompletionDate: z
    .coerce
    .date(),

  actualCompletionDate: z
    .coerce
    .date()
    .optional(),

  contractDurationDays: z
    .number()
    .int()
    .positive()
    .optional(),

  status: z
    .enum([
      "PLANNED",
      "IN_PROGRESS",
      "ON_HOLD",
      "COMPLETED",
      "CANCELLED"
    ])
    .default("PLANNED")
});

export const updateProjectSchema =
  createProjectSchema.partial();