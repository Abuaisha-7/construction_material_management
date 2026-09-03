"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageLocationListSchema = exports.updateStorageLocationSchema = exports.createStorageLocationSchema = void 0;
const zod_1 = require("zod");
const uuidSchema = zod_1.z.string().uuid();
exports.createStorageLocationSchema = zod_1.z.object({
    warehouseId: uuidSchema,
    code: zod_1.z
        .string()
        .trim()
        .min(1, "Storage location code is required")
        .max(50, "Storage location code cannot exceed 50 characters"),
    name: zod_1.z
        .string()
        .trim()
        .min(1, "Storage location name is required")
        .max(255, "Storage location name cannot exceed 255 characters"),
    locationType: zod_1.z
        .string()
        .trim()
        .max(50)
        .optional()
        .nullable(),
    capacity: zod_1.z
        .union([
        zod_1.z.number().nonnegative(),
        zod_1.z.string().regex(/^\d+(\.\d+)?$/),
    ])
        .optional()
        .nullable(),
    description: zod_1.z
        .string()
        .trim()
        .optional()
        .nullable(),
    isActive: zod_1.z.boolean().optional(),
});
exports.updateStorageLocationSchema = zod_1.z.object({
    warehouseId: uuidSchema.optional(),
    code: zod_1.z
        .string()
        .trim()
        .min(1)
        .max(50)
        .optional(),
    name: zod_1.z
        .string()
        .trim()
        .min(1)
        .max(255)
        .optional(),
    locationType: zod_1.z
        .string()
        .trim()
        .max(50)
        .optional()
        .nullable(),
    capacity: zod_1.z
        .union([
        zod_1.z.number().nonnegative(),
        zod_1.z.string().regex(/^\d+(\.\d+)?$/),
    ])
        .optional()
        .nullable(),
    description: zod_1.z
        .string()
        .trim()
        .optional()
        .nullable(),
    isActive: zod_1.z.boolean().optional(),
});
exports.storageLocationListSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
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
    warehouseId: uuidSchema.optional(),
    isActive: zod_1.z
        .enum(["true", "false"])
        .transform((value) => value === "true")
        .optional(),
});
