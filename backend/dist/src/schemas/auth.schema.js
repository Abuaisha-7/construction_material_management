"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
exports.loginSchema = zod_1.z.object({
    email: zod_1.z
        .string()
        .email("Invalid email address"),
    password: zod_1.z
        .string()
        .min(6, "Password must contain at least 6 characters")
});
exports.registerSchema = zod_1.z.object({
    fullName: zod_1.z
        .string()
        .min(2)
        .max(100),
    email: zod_1.z
        .string()
        .email(),
    phone: zod_1.z
        .string()
        .optional(),
    password: zod_1.z
        .string()
        .min(8)
});
