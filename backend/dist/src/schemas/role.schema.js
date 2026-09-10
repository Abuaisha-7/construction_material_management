"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRoleSchema = exports.createRoleSchema = void 0;
const zod_1 = require("zod");
exports.createRoleSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(2)
        .max(100),
    description: zod_1.z
        .string()
        .optional(),
});
exports.updateRoleSchema = exports.createRoleSchema.partial();
