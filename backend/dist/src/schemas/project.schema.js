"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProjectSchema = exports.createProjectSchema = void 0;
const zod_1 = require("zod");
exports.createProjectSchema = zod_1.z.object({
    projectCode: zod_1.z
        .string()
        .min(2)
        .max(50),
    name: zod_1.z
        .string()
        .min(3)
        .max(255),
    description: zod_1.z
        .string()
        .optional(),
    clientName: zod_1.z
        .string()
        .min(2)
        .max(255),
    consultantName: zod_1.z
        .string()
        .max(255)
        .optional(),
    contractorName: zod_1.z
        .string()
        .max(255)
        .optional(),
    location: zod_1.z
        .string()
        .max(255)
        .optional(),
    contractValue: zod_1.z
        .number()
        .nonnegative()
        .optional(),
    currency: zod_1.z
        .string()
        .length(3)
        .default("ETB"),
    startDate: zod_1.z
        .coerce
        .date()
        .optional(),
    completionDate: zod_1.z
        .coerce
        .date()
        .optional(),
    status: zod_1.z
        .enum([
        "PLANNING",
        "ACTIVE",
        "ON_HOLD",
        "COMPLETED",
        "CANCELLED",
    ])
        .default("PLANNING"),
});
exports.updateProjectSchema = exports.createProjectSchema.partial();
