import { z } from "zod";

export const createProjectSchema = z.object({
    projectCode: z
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
  
    contractValue: z
      .number()
      .nonnegative()
      .optional(),
  
    currency: z
      .string()
      .length(3)
      .default("ETB"),
  
    startDate: z
      .coerce
      .date()
      .optional(),
  
    completionDate: z
      .coerce
      .date()
      .optional(),
  
    status: z
      .enum([
        "PLANNING",
        "ACTIVE",
        "ON_HOLD",
        "COMPLETED",
        "CANCELLED",
      ])
      .default("PLANNING"),
  });

export const updateProjectSchema =
  createProjectSchema.partial();