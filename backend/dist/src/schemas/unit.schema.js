"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUnitSchema = exports.createUnitSchema = void 0;
const zod_1 = require("zod");
exports.createUnitSchema = zod_1.z.object({
    code: zod_1.z
        .string()
        .trim()
        .min(1, "Unit code is required")
        .max(20, "Unit code cannot exceed 20 characters")
        .transform((value) => value.toUpperCase()),
    name: zod_1.z
        .string()
        .trim()
        .min(2, "Unit name must be at least 2 characters")
        .max(100, "Unit name cannot exceed 100 characters"),
    symbol: zod_1.z
        .string()
        .trim()
        .min(1, "Unit symbol is required")
        .max(20, "Unit symbol cannot exceed 20 characters"),
});
exports.updateUnitSchema = zod_1.z.object({
    code: zod_1.z
        .string()
        .trim()
        .min(1)
        .max(20)
        .transform((value) => value.toUpperCase())
        .optional(),
    name: zod_1.z
        .string()
        .trim()
        .min(2)
        .max(100)
        .optional(),
    symbol: zod_1.z
        .string()
        .trim()
        .min(1)
        .max(20)
        .optional(),
});
