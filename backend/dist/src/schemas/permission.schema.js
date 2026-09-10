"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPermissionSchema = void 0;
const zod_1 = require("zod");
exports.createPermissionSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(3)
        .max(150),
    description: zod_1.z
        .string()
        .optional(),
});
