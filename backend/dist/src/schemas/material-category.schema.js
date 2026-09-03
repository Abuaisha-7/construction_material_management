"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCategorySchema = exports.createCategorySchema = void 0;
const zod_1 = require("zod");
exports.createCategorySchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .trim()
        .min(2, "Category name must be at least 2 characters")
        .max(100, "Category name cannot exceed 100 characters"),
    description: zod_1.z
        .string()
        .trim()
        .optional(),
});
exports.updateCategorySchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .trim()
        .min(2, "Category name must be at least 2 characters")
        .max(100, "Category name cannot exceed 100 characters")
        .optional(),
    description: zod_1.z
        .string()
        .trim()
        .optional(),
});
