"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.purchaseOrderQuerySchema = exports.updatePurchaseOrderSchema = exports.createPurchaseOrderSchema = void 0;
const zod_1 = require("zod");
exports.createPurchaseOrderSchema = zod_1.z.object({
    projectId: zod_1.z
        .string()
        .min(1, "Project is required"),
    supplierId: zod_1.z
        .string()
        .min(1, "Supplier is required"),
    materialRequestId: zod_1.z
        .string()
        .min(1, "Material request is required"),
    expectedDeliveryDate: zod_1.z
        .coerce
        .date()
        .optional(),
    currency: zod_1.z
        .string()
        .length(3)
        .default("ETB"),
    remarks: zod_1.z
        .string()
        .optional(),
    items: zod_1.z
        .array(zod_1.z.object({
        materialId: zod_1.z
            .string()
            .min(1, "Material is required"),
        orderedQuantity: zod_1.z
            .number()
            .positive("Ordered quantity must be greater than zero"),
        unitPrice: zod_1.z
            .number()
            .nonnegative("Unit price cannot be negative")
    }))
        .min(1, "At least one item is required")
});
exports.updatePurchaseOrderSchema = zod_1.z.object({
    expectedDeliveryDate: zod_1.z
        .coerce
        .date()
        .optional(),
    remarks: zod_1.z
        .string()
        .optional(),
    items: zod_1.z
        .array(zod_1.z.object({
        materialId: zod_1.z.string().min(1),
        orderedQuantity: zod_1.z.number().positive(),
        unitPrice: zod_1.z.number().nonnegative()
    }))
        .min(1)
        .optional()
});
exports.purchaseOrderQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce
        .number()
        .int()
        .positive()
        .default(1),
    limit: zod_1.z.coerce
        .number()
        .int()
        .positive()
        .max(100)
        .default(20),
    search: zod_1.z
        .string()
        .optional(),
    status: zod_1.z
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
    projectId: zod_1.z
        .string()
        .optional(),
    supplierId: zod_1.z
        .string()
        .optional()
});
