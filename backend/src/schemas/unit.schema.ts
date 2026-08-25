import { z } from "zod";

export const createUnitSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Unit code is required")
    .max(20, "Unit code cannot exceed 20 characters")
    .transform((value) => value.toUpperCase()),

  name: z
    .string()
    .trim()
    .min(2, "Unit name must be at least 2 characters")
    .max(100, "Unit name cannot exceed 100 characters"),

  symbol: z
    .string()
    .trim()
    .min(1, "Unit symbol is required")
    .max(20, "Unit symbol cannot exceed 20 characters"),
});

export const updateUnitSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1)
    .max(20)
    .transform((value) => value.toUpperCase())
    .optional(),

  name: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .optional(),

  symbol: z
    .string()
    .trim()
    .min(1)
    .max(20)
    .optional(),
});