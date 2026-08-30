import { z } from "zod";

/**
 * ============================================================
 * Create Inspection Item
 * ============================================================
 */

export const createInspectionItemSchema = z.object({
  grnItemId: z
    .string()
    .uuid("Invalid GRN item ID"),

  quantityInspected: z
    .number()
    .positive("Quantity inspected must be greater than zero")
    .optional(),

  quantityAccepted: z
    .number()
    .min(0, "Accepted quantity cannot be negative")
    .default(0),

  quantityConditionallyAccepted: z
    .number()
    .min(0, "Conditionally accepted quantity cannot be negative")
    .default(0),

  quantityQuarantined: z
    .number()
    .min(0, "Quarantined quantity cannot be negative")
    .default(0),

  quantityRejected: z
    .number()
    .min(0, "Rejected quantity cannot be negative")
    .default(0),

  specification: z
    .string()
    .optional(),

  requiredStandard: z
    .string()
    .max(100)
    .optional(),

  certificateNumber: z
    .string()
    .max(100)
    .optional(),

  testRequired: z
    .boolean()
    .default(false),

  testResult: z
    .string()
    .optional(),

  remarks: z
    .string()
    .optional(),

  materialId: z
    .string()
    .uuid("Invalid material ID")
    .optional(),
});


/**
 * ============================================================
 * Create Inspection
 * ============================================================
 */

export const createInspectionSchema = z.object({
  grnId: z
    .string()
    .uuid("Invalid GRN ID"),

  inspectionDate: z
    .coerce
    .date()
    .optional(),

  remarks: z
    .string()
    .optional(),

  correctiveAction: z
    .string()
    .optional(),

  items: z
    .array(createInspectionItemSchema)
    .min(1, "At least one inspection item is required"),
});


/**
 * ============================================================
 * Update Inspection
 * ============================================================
 */

export const updateInspectionSchema = z.object({
  inspectionDate: z
    .coerce
    .date()
    .optional(),

  remarks: z
    .string()
    .optional(),

  correctiveAction: z
    .string()
    .optional(),

  items: z
    .array(createInspectionItemSchema)
    .min(1)
    .optional(),
});


/**
 * ============================================================
 * Start Inspection
 * ============================================================
 */

export const startInspectionSchema = z.object({});


/**
 * ============================================================
 * Complete Inspection
 * ============================================================
 */

export const completeInspectionSchema = z.object({
  decision: z.enum([
    "ACCEPTED",
    "CONDITIONALLY_ACCEPTED",
    "PARTIALLY_ACCEPTED",
    "REJECTED",
    "QUARANTINED",
  ]),

  remarks: z
    .string()
    .optional(),

  correctiveAction: z
    .string()
    .optional(),
});


/**
 * ============================================================
 * Types
 * ============================================================
 */

export type CreateInspectionInput =
  z.infer<typeof createInspectionSchema>;

export type UpdateInspectionInput =
  z.infer<typeof updateInspectionSchema>;

export type CompleteInspectionInput =
  z.infer<typeof completeInspectionSchema>;
