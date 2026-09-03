import { z } from "zod";

export const createUserRoleSchema = z.object({
  userId: z
    .string()
    .uuid("Invalid user ID"),

  roleId: z
    .string()
    .uuid("Invalid role ID"),
});