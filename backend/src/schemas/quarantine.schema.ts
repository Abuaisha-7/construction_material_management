// src/schemas/quarantine.schema.ts

import { z } from "zod";

export const createQuarantineSchema = z.object({
  inspectionId: z.string().uuid(),
  inspectionItemId: z.string().uuid(),
  quantity: z.coerce.number().positive(),
  reason: z.string().max(5000).optional(),
  correctiveAction: z.string().max(5000).optional(),
});

export const updateQuarantineSchema = z.object({
    reason: z
      .string()
      .trim()
      .min(3)
      .optional(),
  
    correctiveAction: z
      .string()
      .trim()
      .optional(),
  });

export const dispositionSchema = z.object({
  action: z.enum(["RELEASE", "RETURN", "SCRAP"]),
  quantity: z.coerce.number().positive(),
  reason: z.string().max(5000).optional(),
  remarks: z.string().max(5000).optional(),
});

export const quarantineListSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z
    .enum([
      "QUARANTINED",
      "RELEASED",
      "RETURNED",
      "SCRAPPED",
      "CANCELLED",
    ])
    .optional(),
  projectId: z.string().uuid().optional(),
});

export type CreateQuarantineInput = z.infer<
  typeof createQuarantineSchema
>;

export type UpdateQuarantineInput = z.infer<
  typeof updateQuarantineSchema
>;

export type DispositionInput = z.infer<
  typeof dispositionSchema
>;