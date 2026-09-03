"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSupplier = createSupplier;
exports.getSuppliers = getSuppliers;
exports.getSupplierById = getSupplierById;
exports.updateSupplier = updateSupplier;
exports.deleteSupplier = deleteSupplier;
const database_1 = require("../config/database");
/**
 * Create supplier
 */
async function createSupplier(data) {
    const existingSupplier = await database_1.prisma.supplier.findUnique({
        where: {
            supplierCode: data.supplierCode,
        },
    });
    if (existingSupplier) {
        throw new Error("Supplier code already exists");
    }
    return database_1.prisma.supplier.create({
        data: {
            supplierCode: data.supplierCode,
            companyName: data.companyName,
            contactPerson: data.contactPerson,
            phone: data.phone,
            email: data.email,
            address: data.address,
            registrationNumber: data.registrationNumber,
            taxNumber: data.taxNumber,
            licenseNumber: data.licenseNumber,
            rating: data.rating,
            isActive: data.isActive ?? true,
        },
    });
}
/**
 * Get all suppliers
 */
async function getSuppliers(params) {
    const { search, page = 1, limit = 20, isActive, } = params;
    const skip = (page - 1) * limit;
    const where = {};
    if (typeof isActive === "boolean") {
        where.isActive = isActive;
    }
    if (search) {
        where.OR = [
            {
                supplierCode: {
                    contains: search,
                },
            },
            {
                companyName: {
                    contains: search,
                },
            },
            {
                contactPerson: {
                    contains: search,
                },
            },
            {
                phone: {
                    contains: search,
                },
            },
            {
                email: {
                    contains: search,
                },
            },
            {
                registrationNumber: {
                    contains: search,
                },
            },
            {
                taxNumber: {
                    contains: search,
                },
            },
        ];
    }
    const [suppliers, total] = await database_1.prisma.$transaction([
        database_1.prisma.supplier.findMany({
            where,
            orderBy: {
                companyName: "asc",
            },
            skip,
            take: limit,
        }),
        database_1.prisma.supplier.count({
            where,
        }),
    ]);
    return {
        suppliers,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}
/**
 * Get supplier by ID
 */
async function getSupplierById(id) {
    const supplier = await database_1.prisma.supplier.findUnique({
        where: {
            id,
        },
        include: {
            materials: true,
            purchaseOrders: true,
            goodsReceived: true,
        },
    });
    if (!supplier) {
        throw new Error("Supplier not found");
    }
    return supplier;
}
/**
 * Update supplier
 */
async function updateSupplier(id, data) {
    const existingSupplier = await database_1.prisma.supplier.findUnique({
        where: {
            id,
        },
    });
    if (!existingSupplier) {
        throw new Error("Supplier not found");
    }
    if (data.supplierCode &&
        data.supplierCode !==
            existingSupplier.supplierCode) {
        const duplicate = await database_1.prisma.supplier.findUnique({
            where: {
                supplierCode: data.supplierCode,
            },
        });
        if (duplicate) {
            throw new Error("Supplier code already exists");
        }
    }
    return database_1.prisma.supplier.update({
        where: {
            id,
        },
        data,
    });
}
/**
 * Delete supplier
 */
async function deleteSupplier(id) {
    const supplier = await database_1.prisma.supplier.findUnique({
        where: {
            id,
        },
    });
    if (!supplier) {
        throw new Error("Supplier not found");
    }
    return database_1.prisma.supplier.delete({
        where: {
            id,
        },
    });
}
