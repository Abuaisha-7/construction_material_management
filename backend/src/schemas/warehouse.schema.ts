import { z } from "zod";

const uuidSchema = z.string().uuid();

export const createWarehouseSchema = z.object({
  projectId: uuidSchema,

  code: z
    .string()
    .trim()
    .min(1, "Warehouse code is required")
    .max(
      50,
      "Warehouse code cannot exceed 50 characters"
    ),

  name: z
    .string()
    .trim()
    .min(1, "Warehouse name is required")
    .max(
      255,
      "Warehouse name cannot exceed 255 characters"
    ),

  type: z
    .string()
    .trim()
    .max(50)
    .optional()
    .nullable(),

  responsibleUserId: uuidSchema
    .optional()
    .nullable(),

  capacityDescription: z
    .string()
    .trim()
    .optional()
    .nullable(),

  isActive: z.boolean().optional(),
});

export const updateWarehouseSchema = z.object({
  projectId: uuidSchema.optional(),

  code: z
    .string()
    .trim()
    .min(1, "Warehouse code is required")
    .max(50)
    .optional(),

  name: z
    .string()
    .trim()
    .min(1, "Warehouse name is required")
    .max(255)
    .optional(),

  type: z
    .string()
    .trim()
    .max(50)
    .optional()
    .nullable(),

  responsibleUserId: z
    .union([
      uuidSchema,
      z.null(),
    ])
    .optional(),

  capacityDescription: z
    .string()
    .trim()
    .optional()
    .nullable(),

  isActive: z.boolean().optional(),
});

export const warehouseListSchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(1),

  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20),

  search: z
    .string()
    .trim()
    .optional(),

  projectId: uuidSchema.optional(),

  responsibleUserId:
    uuidSchema.optional(),

  isActive: z
    .enum(["true", "false"])
    .transform(
      (value) => value === "true"
    )
    .optional(),
});

export type CreateWarehouseInput =
  z.infer<
    typeof createWarehouseSchema
  >;

export type UpdateWarehouseInput =
  z.infer<
    typeof updateWarehouseSchema
  >;