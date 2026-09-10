import { z } from "zod";

export const createRolePermissionSchema = z.object({
  roleId: z
    .string()
    .uuid("Invalid role ID"),

  permissionId: z
    .string()
    .uuid("Invalid permission ID"),
});