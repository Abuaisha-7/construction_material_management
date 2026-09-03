"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeInspectionSchema = exports.startInspectionSchema = exports.updateInspectionSchema = exports.createInspectionSchema = exports.createInspectionItemSchema = void 0;
const zod_1 = require("zod");
/**
 * ============================================================
 * Create Inspection Item
 * ============================================================
 */
exports.createInspectionItemSchema = zod_1.z.object({
    grnItemId: zod_1.z
        .string()
        .uuid("Invalid GRN item ID"),
    quantityInspected: zod_1.z
        .number()
        .positive("Quantity inspected must be greater than zero")
        .optional(),
    quantityAccepted: zod_1.z
        .number()
        .min(0, "Accepted quantity cannot be negative")
        .default(0),
    quantityConditionallyAccepted: zod_1.z
        .number()
        .min(0, "Conditionally accepted quantity cannot be negative")
        .default(0),
    quantityQuarantined: zod_1.z
        .number()
        .min(0, "Quarantined quantity cannot be negative")
        .default(0),
    quantityRejected: zod_1.z
        .number()
        .min(0, "Rejected quantity cannot be negative")
        .default(0),
    specification: zod_1.z
        .string()
        .optional(),
    requiredStandard: zod_1.z
        .string()
        .max(100)
        .optional(),
    certificateNumber: zod_1.z
        .string()
        .max(100)
        .optional(),
    testRequired: zod_1.z
        .boolean()
        .default(false),
    testResult: zod_1.z
        .string()
        .optional(),
    remarks: zod_1.z
        .string()
        .optional(),
    materialId: zod_1.z
        .string()
        .uuid("Invalid material ID")
        .optional(),
});
/**
 * ============================================================
 * Create Inspection
 * ============================================================
 */
exports.createInspectionSchema = zod_1.z.object({
    grnId: zod_1.z
        .string()
        .uuid("Invalid GRN ID"),
    inspectionDate: zod_1.z
        .coerce
        .date()
        .optional(),
    remarks: zod_1.z
        .string()
        .optional(),
    correctiveAction: zod_1.z
        .string()
        .optional(),
    items: zod_1.z
        .array(exports.createInspectionItemSchema)
        .min(1, "At least one inspection item is required"),
});
/**
 * ============================================================
 * Update Inspection
 * ============================================================
 */
exports.updateInspectionSchema = zod_1.z.object({
    inspectionDate: zod_1.z
        .coerce
        .date()
        .optional(),
    remarks: zod_1.z
        .string()
        .optional(),
    correctiveAction: zod_1.z
        .string()
        .optional(),
    items: zod_1.z
        .array(exports.createInspectionItemSchema)
        .min(1)
        .optional(),
});
/**
 * ============================================================
 * Start Inspection
 * ============================================================
 */
exports.startInspectionSchema = zod_1.z.object({});
/**
 * ============================================================
 * Complete Inspection
 * ============================================================
 */
exports.completeInspectionSchema = zod_1.z.object({
    decision: zod_1.z.enum([
        "ACCEPTED",
        "CONDITIONALLY_ACCEPTED",
        "PARTIALLY_ACCEPTED",
        "REJECTED",
        "QUARANTINED",
    ]),
    remarks: zod_1.z
        .string()
        .optional(),
    correctiveAction: zod_1.z
        .string()
        .optional(),
});
