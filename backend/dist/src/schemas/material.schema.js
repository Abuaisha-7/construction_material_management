"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMaterialSchema = exports.createMaterialSchema = void 0;
const zod_1 = require("zod");
exports.createMaterialSchema = zod_1.z
    .object({
    materialCode: zod_1.z
        .string()
        .min(2)
        .max(50),
    name: zod_1.z
        .string()
        .min(2)
        .max(255),
    categoryId: zod_1.z
        .string()
        .uuid(),
    unitId: zod_1.z
        .string()
        .uuid(),
    specification: zod_1.z
        .string()
        .optional(),
    standard: zod_1.z
        .string()
        .max(100)
        .optional(),
    description: zod_1.z
        .string()
        .optional(),
    estimatedUnitPrice: zod_1.z
        .number()
        .nonnegative()
        .default(0),
    currentUnitPrice: zod_1.z
        .number()
        .nonnegative()
        .default(0),
    minimumStock: zod_1.z
        .number()
        .nonnegative()
        .default(0),
    reorderLevel: zod_1.z
        .number()
        .nonnegative()
        .default(0),
    maximumStock: zod_1.z
        .number()
        .nonnegative()
        .optional(),
    requiresInspection: zod_1.z
        .boolean()
        .default(true),
    requiresCertificate: zod_1.z
        .boolean()
        .default(false),
    storageRequirements: zod_1.z
        .string()
        .optional(),
    isActive: zod_1.z
        .boolean()
        .default(true),
})
    .refine((data) => data.maximumStock === undefined ||
    (data.minimumStock <= data.reorderLevel &&
        data.reorderLevel <= data.maximumStock), {
    message: "Stock levels must satisfy minimumStock <= reorderLevel <= maximumStock",
    path: ["reorderLevel"],
});
exports.updateMaterialSchema = zod_1.z.object({
    materialCode: zod_1.z
        .string()
        .min(2)
        .max(50)
        .optional(),
    name: zod_1.z
        .string()
        .min(2)
        .max(255)
        .optional(),
    categoryId: zod_1.z
        .string()
        .uuid()
        .optional(),
    unitId: zod_1.z
        .string()
        .uuid()
        .optional(),
    specification: zod_1.z
        .string()
        .optional(),
    standard: zod_1.z
        .string()
        .max(100)
        .optional(),
    description: zod_1.z
        .string()
        .optional(),
    estimatedUnitPrice: zod_1.z
        .number()
        .nonnegative()
        .optional(),
    currentUnitPrice: zod_1.z
        .number()
        .nonnegative()
        .optional(),
    minimumStock: zod_1.z
        .number()
        .nonnegative()
        .optional(),
    reorderLevel: zod_1.z
        .number()
        .nonnegative()
        .optional(),
    maximumStock: zod_1.z
        .number()
        .nonnegative()
        .optional(),
    requiresInspection: zod_1.z
        .boolean()
        .optional(),
    requiresCertificate: zod_1.z
        .boolean()
        .optional(),
    storageRequirements: zod_1.z
        .string()
        .optional(),
    isActive: zod_1.z
        .boolean()
        .optional(),
});
