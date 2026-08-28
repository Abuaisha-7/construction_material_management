import { z } from "zod";

const uuidSchema = z.string().uuid();

export const createStorageLocationSchema = z.object({
  warehouseId: uuidSchema,

  code: z
    .string()
    .trim()
    .min(1, "Storage location code is required")
    .max(50, "Storage location code cannot exceed 50 characters"),

  name: z
    .string()
    .trim()
    .min(1, "Storage location name is required")
    .max(255, "Storage location name cannot exceed 255 characters"),

  locationType: z
    .string()
    .trim()
    .max(50)
    .optional()
    .nullable(),

  capacity: z
    .union([
      z.number().nonnegative(),
      z.string().regex(/^\d+(\.\d+)?$/),
    ])
    .optional()
    .nullable(),

  description: z
    .string()
    .trim()
    .optional()
    .nullable(),

  isActive: z.boolean().optional(),
});

export const updateStorageLocationSchema =
  z.object({
    warehouseId: uuidSchema.optional(),

    code: z
      .string()
      .trim()
      .min(1)
      .max(50)
      .optional(),

    name: z
      .string()
      .trim()
      .min(1)
      .max(255)
      .optional(),

    locationType: z
      .string()
      .trim()
      .max(50)
      .optional()
      .nullable(),

    capacity: z
      .union([
        z.number().nonnegative(),
        z.string().regex(/^\d+(\.\d+)?$/),
      ])
      .optional()
      .nullable(),

    description: z
      .string()
      .trim()
      .optional()
      .nullable(),

    isActive: z.boolean().optional(),
  });

export const storageLocationListSchema =
  z.object({
    page: z.coerce.number().int().min(1).default(1),

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

    warehouseId: uuidSchema.optional(),

    isActive: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .optional(),
  });

export type CreateStorageLocationInput =
  z.infer<typeof createStorageLocationSchema>;

export type UpdateStorageLocationInput =
  z.infer<typeof updateStorageLocationSchema>;