"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectMaterialRequestSchema = exports.materialRequestIdSchema = exports.updateMaterialRequestSchema = exports.createMaterialRequestSchema = void 0;
const zod_1 = require("zod");
exports.createMaterialRequestSchema = zod_1.z.object({
    projectId: zod_1.z
        .string()
        .min(1, "Project is required"),
    buildingId: zod_1.z
        .string()
        .min(1)
        .optional(),
    zoneId: zod_1.z
        .string()
        .min(1)
        .optional(),
    activityId: zod_1.z
        .string()
        .min(1)
        .optional(),
    requiredDate: zod_1.z
        .coerce
        .date()
        .optional(),
    priority: zod_1.z
        .enum([
        "LOW",
        "NORMAL",
        "HIGH",
        "URGENT"
    ])
        .default("NORMAL"),
    purpose: zod_1.z
        .string()
        .max(2000)
        .optional(),
    remarks: zod_1.z
        .string()
        .max(2000)
        .optional(),
    items: zod_1.z
        .array(zod_1.z.object({
        materialId: zod_1.z
            .string()
            .min(1, "Material is required"),
        requestedQuantity: zod_1.z
            .number()
            .positive("Requested quantity must be greater than 0"),
        estimatedUnitPrice: zod_1.z
            .number()
            .nonnegative()
            .optional(),
        remarks: zod_1.z
            .string()
            .max(1000)
            .optional()
    }))
        .min(1, "At least one material item is required")
});
exports.updateMaterialRequestSchema = zod_1.z.object({
    buildingId: zod_1.z
        .string()
        .min(1)
        .optional(),
    zoneId: zod_1.z
        .string()
        .min(1)
        .optional(),
    activityId: zod_1.z
        .string()
        .min(1)
        .optional(),
    requiredDate: zod_1.z
        .coerce
        .date()
        .optional(),
    priority: zod_1.z
        .enum([
        "LOW",
        "NORMAL",
        "HIGH",
        "URGENT"
    ])
        .optional(),
    purpose: zod_1.z
        .string()
        .max(2000)
        .optional(),
    remarks: zod_1.z
        .string()
        .max(2000)
        .optional()
});
exports.materialRequestIdSchema = zod_1.z.object({
    id: zod_1.z.string().min(1)
});
exports.rejectMaterialRequestSchema = zod_1.z.object({
    reason: zod_1.z
        .string()
        .min(5, "Rejection reason must be at least 5 characters")
        .max(2000, "Rejection reason is too long")
        .trim()
});
