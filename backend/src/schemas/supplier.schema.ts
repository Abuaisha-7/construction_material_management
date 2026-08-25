
import { z } from "zod";

export const createSupplierSchema = z.object({
  supplierCode: z
    .string()
    .min(2)
    .max(50),

  companyName: z
    .string()
    .min(2)
    .max(255),

  contactPerson: z
    .string()
    .max(255)
    .optional(),

  phone: z
    .string()
    .max(50)
    .optional(),

  email: z
    .email()
    .max(255)
    .optional(),

  address: z
    .string()
    .optional(),

  registrationNumber: z
    .string()
    .max(100)
    .optional(),

  taxNumber: z
    .string()
    .max(100)
    .optional(),

  licenseNumber: z
    .string()
    .max(100)
    .optional(),

  rating: z
    .number()
    .min(0)
    .max(5)
    .optional(),

  isActive: z
    .boolean()
    .default(true),
});

export const updateSupplierSchema =
  createSupplierSchema.partial();
