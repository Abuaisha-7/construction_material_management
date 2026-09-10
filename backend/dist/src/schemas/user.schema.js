"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserSchema = exports.createUserSchema = void 0;
const zod_1 = require("zod");
exports.createUserSchema = zod_1.z.object({
    fullName: zod_1.z
        .string()
        .min(2)
        .max(100),
    email: zod_1.z
        .string()
        .email("Invalid email address"),
    phone: zod_1.z
        .string()
        .max(50)
        .optional(),
    password: zod_1.z
        .string()
        .min(8, "Password must contain at least 8 characters"),
    status: zod_1.z
        .enum([
        "ACTIVE",
        "INACTIVE",
        "SUSPENDED",
    ])
        .default("ACTIVE"),
});
exports.updateUserSchema = zod_1.z.object({
    fullName: zod_1.z
        .string()
        .min(2)
        .max(100)
        .optional(),
    email: zod_1.z
        .string()
        .email("Invalid email address")
        .optional(),
    phone: zod_1.z
        .string()
        .max(50)
        .optional(),
    password: zod_1.z
        .string()
        .min(8, "Password must contain at least 8 characters")
        .optional(),
    status: zod_1.z
        .enum([
        "ACTIVE",
        "INACTIVE",
        "SUSPENDED",
    ])
        .optional(),
});
