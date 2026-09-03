"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSupplierSchema = exports.createSupplierSchema = void 0;
const zod_1 = require("zod");
exports.createSupplierSchema = zod_1.z.object({
    supplierCode: zod_1.z
        .string()
        .min(2)
        .max(50),
    companyName: zod_1.z
        .string()
        .min(2)
        .max(255),
    contactPerson: zod_1.z
        .string()
        .max(255)
        .optional(),
    phone: zod_1.z
        .string()
        .max(50)
        .optional(),
    email: zod_1.z
        .email()
        .max(255)
        .optional(),
    address: zod_1.z
        .string()
        .optional(),
    registrationNumber: zod_1.z
        .string()
        .max(100)
        .optional(),
    taxNumber: zod_1.z
        .string()
        .max(100)
        .optional(),
    licenseNumber: zod_1.z
        .string()
        .max(100)
        .optional(),
    rating: zod_1.z
        .number()
        .min(0)
        .max(5)
        .optional(),
    isActive: zod_1.z
        .boolean()
        .default(true),
});
exports.updateSupplierSchema = exports.createSupplierSchema.partial();
