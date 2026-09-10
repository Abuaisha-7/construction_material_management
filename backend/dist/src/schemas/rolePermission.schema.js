"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRolePermissionSchema = void 0;
const zod_1 = require("zod");
exports.createRolePermissionSchema = zod_1.z.object({
    roleId: zod_1.z
        .string()
        .uuid("Invalid role ID"),
    permissionId: zod_1.z
        .string()
        .uuid("Invalid permission ID"),
});
