import { z } from "zod";

export const createMaterialRequestSchema = z.object({
  projectId: z
    .string()
    .min(1, "Project is required"),

  buildingId: z
    .string()
    .min(1)
    .optional(),

  zoneId: z
    .string()
    .min(1)
    .optional(),

  activityId: z
    .string()
    .min(1)
    .optional(),

  requiredDate: z
    .coerce
    .date()
    .optional(),

  priority: z
    .enum([
      "LOW",
      "NORMAL",
      "HIGH",
      "URGENT"
    ])
    .default("NORMAL"),

  purpose: z
    .string()
    .max(2000)
    .optional(),

  remarks: z
    .string()
    .max(2000)
    .optional(),

  items: z
    .array(
      z.object({
        materialId: z
          .string()
          .min(1, "Material is required"),

        requestedQuantity: z
          .number()
          .positive("Requested quantity must be greater than 0"),

        estimatedUnitPrice: z
          .number()
          .nonnegative()
          .optional(),

        remarks: z
          .string()
          .max(1000)
          .optional()
      })
    )
    .min(1, "At least one material item is required")
});

export const updateMaterialRequestSchema = z.object({
  buildingId: z
    .string()
    .min(1)
    .optional(),

  zoneId: z
    .string()
    .min(1)
    .optional(),

  activityId: z
    .string()
    .min(1)
    .optional(),

  requiredDate: z
    .coerce
    .date()
    .optional(),

  priority: z
    .enum([
      "LOW",
      "NORMAL",
      "HIGH",
      "URGENT"
    ])
    .optional(),

  purpose: z
    .string()
    .max(2000)
    .optional(),

  remarks: z
    .string()
    .max(2000)
    .optional()
});

export const materialRequestIdSchema = z.object({
  id: z.string().min(1)
});

export const rejectMaterialRequestSchema =
  z.object({
    reason: z
      .string()
      .min(
        5,
        "Rejection reason must be at least 5 characters"
      )
      .max(
        2000,
        "Rejection reason is too long"
      )
      .trim()
  });