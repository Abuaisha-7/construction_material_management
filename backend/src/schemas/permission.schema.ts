import { z } from "zod";

export const createPermissionSchema = z.object({
  name: z
    .string()
    .min(3)
    .max(150),

  description: z
    .string()
    .optional(),
});