"use strict";
// src/schemas/quarantine.schema.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.quarantineListSchema = exports.dispositionSchema = exports.updateQuarantineSchema = exports.createQuarantineSchema = void 0;
const zod_1 = require("zod");
exports.createQuarantineSchema = zod_1.z.object({
    inspectionId: zod_1.z.string().uuid(),
    inspectionItemId: zod_1.z.string().uuid(),
    quantity: zod_1.z.coerce.number().positive(),
    reason: zod_1.z.string().max(5000).optional(),
    correctiveAction: zod_1.z.string().max(5000).optional(),
});
exports.updateQuarantineSchema = zod_1.z.object({
    reason: zod_1.z
        .string()
        .trim()
        .min(3)
        .optional(),
    correctiveAction: zod_1.z
        .string()
        .trim()
        .optional(),
});
exports.dispositionSchema = zod_1.z.object({
    action: zod_1.z.enum(["RELEASE", "RETURN", "SCRAP"]),
    quantity: zod_1.z.coerce.number().positive(),
    reason: zod_1.z.string().max(5000).optional(),
    remarks: zod_1.z.string().max(5000).optional(),
});
exports.quarantineListSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(20),
    status: zod_1.z
        .enum([
        "QUARANTINED",
        "RELEASED",
        "RETURNED",
        "SCRAPPED",
        "CANCELLED",
    ])
        .optional(),
    projectId: zod_1.z.string().uuid().optional(),
});
