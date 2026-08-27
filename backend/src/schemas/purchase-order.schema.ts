import { z } from "zod";

export const createPurchaseOrderSchema = z.object({
  projectId: z
    .string()
    .min(1, "Project is required"),

  supplierId: z
    .string()
    .min(1, "Supplier is required"),

  materialRequestId: z
    .string()
    .min(1, "Material request is required"),

  expectedDeliveryDate: z
    .coerce
    .date()
    .optional(),

  currency: z
    .string()
    .length(3)
    .default("ETB"),

  remarks: z
    .string()
    .optional(),

  items: z
    .array(
      z.object({
        materialId: z
          .string()
          .min(1, "Material is required"),

        orderedQuantity: z
          .number()
          .positive("Ordered quantity must be greater than zero"),

        unitPrice: z
          .number()
          .nonnegative("Unit price cannot be negative")
      })
    )
    .min(1, "At least one item is required")
});

export const updatePurchaseOrderSchema = z.object({
  expectedDeliveryDate: z
    .coerce
    .date()
    .optional(),

  remarks: z
    .string()
    .optional(),

  items: z
    .array(
      z.object({
        materialId: z.string().min(1),
        orderedQuantity: z.number().positive(),
        unitPrice: z.number().nonnegative()
      })
    )
    .min(1)
    .optional()
});

export const purchaseOrderQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .positive()
    .default(1),

  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(100)
    .default(20),

  search: z
    .string()
    .optional(),

  status: z
    .enum([
      "DRAFT",
      "PENDING_APPROVAL",
      "APPROVED",
      "PARTIALLY_RECEIVED",
      "FULLY_RECEIVED",
      "CANCELLED",
      "CLOSED"
    ])
    .optional(),

  projectId: z
    .string()
    .optional(),

  supplierId: z
    .string()
    .optional()
});