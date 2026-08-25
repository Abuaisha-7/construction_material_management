import { z } from "zod";

export const createMaterialSchema = z
  .object({
    materialCode: z
      .string()
      .min(2)
      .max(50),

    name: z
      .string()
      .min(2)
      .max(255),

    categoryId: z
      .string()
      .uuid(),

    unitId: z
      .string()
      .uuid(),

    specification: z
      .string()
      .optional(),

    standard: z
      .string()
      .max(100)
      .optional(),

    description: z
      .string()
      .optional(),

    estimatedUnitPrice: z
      .number()
      .nonnegative()
      .default(0),

    currentUnitPrice: z
      .number()
      .nonnegative()
      .default(0),

    minimumStock: z
      .number()
      .nonnegative()
      .default(0),

    reorderLevel: z
      .number()
      .nonnegative()
      .default(0),

    maximumStock: z
      .number()
      .nonnegative()
      .optional(),

    requiresInspection: z
      .boolean()
      .default(true),

    requiresCertificate: z
      .boolean()
      .default(false),

    storageRequirements: z
      .string()
      .optional(),

    isActive: z
      .boolean()
      .default(true),
  })
  .refine(
    (data) =>
      data.maximumStock === undefined ||
      (
        data.minimumStock <= data.reorderLevel &&
        data.reorderLevel <= data.maximumStock
      ),
    {
      message:
        "Stock levels must satisfy minimumStock <= reorderLevel <= maximumStock",
      path: ["reorderLevel"],
    }
  );

export const updateMaterialSchema = z.object({
  materialCode: z
    .string()
    .min(2)
    .max(50)
    .optional(),

  name: z
    .string()
    .min(2)
    .max(255)
    .optional(),

  categoryId: z
    .string()
    .uuid()
    .optional(),

  unitId: z
    .string()
    .uuid()
    .optional(),

  specification: z
    .string()
    .optional(),

  standard: z
    .string()
    .max(100)
    .optional(),

  description: z
    .string()
    .optional(),

  estimatedUnitPrice: z
    .number()
    .nonnegative()
    .optional(),

  currentUnitPrice: z
    .number()
    .nonnegative()
    .optional(),

  minimumStock: z
    .number()
    .nonnegative()
    .optional(),

  reorderLevel: z
    .number()
    .nonnegative()
    .optional(),

  maximumStock: z
    .number()
    .nonnegative()
    .optional(),

  requiresInspection: z
    .boolean()
    .optional(),

  requiresCertificate: z
    .boolean()
    .optional(),

  storageRequirements: z
    .string()
    .optional(),

  isActive: z
    .boolean()
    .optional(),
});