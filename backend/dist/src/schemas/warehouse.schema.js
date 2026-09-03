"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.warehouseListSchema = exports.updateWarehouseSchema = exports.createWarehouseSchema = void 0;
const zod_1 = require("zod");
const uuidSchema = zod_1.z.string().uuid();
exports.createWarehouseSchema = zod_1.z.object({
    projectId: uuidSchema,
    code: zod_1.z
        .string()
        .trim()
        .min(1, "Warehouse code is required")
        .max(50, "Warehouse code cannot exceed 50 characters"),
    name: zod_1.z
        .string()
        .trim()
        .min(1, "Warehouse name is required")
        .max(255, "Warehouse name cannot exceed 255 characters"),
    type: zod_1.z
        .string()
        .trim()
        .max(50)
        .optional()
        .nullable(),
    responsibleUserId: uuidSchema
        .optional()
        .nullable(),
    capacityDescription: zod_1.z
        .string()
        .trim()
        .optional()
        .nullable(),
    isActive: zod_1.z.boolean().optional(),
});
exports.updateWarehouseSchema = zod_1.z.object({
    projectId: uuidSchema.optional(),
    code: zod_1.z
        .string()
        .trim()
        .min(1, "Warehouse code is required")
        .max(50)
        .optional(),
    name: zod_1.z
        .string()
        .trim()
        .min(1, "Warehouse name is required")
        .max(255)
        .optional(),
    type: zod_1.z
        .string()
        .trim()
        .max(50)
        .optional()
        .nullable(),
    responsibleUserId: zod_1.z
        .union([
        uuidSchema,
        zod_1.z.null(),
    ])
        .optional(),
    capacityDescription: zod_1.z
        .string()
        .trim()
        .optional()
        .nullable(),
    isActive: zod_1.z.boolean().optional(),
});
exports.warehouseListSchema = zod_1.z.object({
    page: zod_1.z.coerce
        .number()
        .int()
        .min(1)
        .default(1),
    limit: zod_1.z.coerce
        .number()
        .int()
        .min(1)
        .max(100)
        .default(20),
    search: zod_1.z
        .string()
        .trim()
        .optional(),
    projectId: uuidSchema.optional(),
    responsibleUserId: uuidSchema.optional(),
    isActive: zod_1.z
        .enum(["true", "false"])
        .transform((value) => value === "true")
        .optional(),
});
