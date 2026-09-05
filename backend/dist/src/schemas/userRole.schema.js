"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserRoleSchema = void 0;
const zod_1 = require("zod");
exports.createUserRoleSchema = zod_1.z.object({
    userId: zod_1.z
        .string()
        .uuid("Invalid user ID"),
    roleId: zod_1.z
        .string()
        .uuid("Invalid role ID"),
});
