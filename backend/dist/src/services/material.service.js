"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMaterial = createMaterial;
exports.getMaterials = getMaterials;
exports.getMaterialById = getMaterialById;
const database_1 = require("../config/database");
async function createMaterial(data) {
    const existingMaterial = await database_1.prisma.material.findUnique({
        where: {
            materialCode: data.materialCode,
        },
    });
    if (existingMaterial) {
        throw new Error("Material code already exists");
    }
    const category = await database_1.prisma.materialCategory.findUnique({
        where: {
            id: data.categoryId,
        },
    });
    if (!category) {
        throw new Error("Material category not found");
    }
    const unit = await database_1.prisma.unit.findUnique({
        where: {
            id: data.unitId,
        },
    });
    if (!unit) {
        throw new Error("Unit of measurement not found");
    }
    return database_1.prisma.material.create({
        data: {
            materialCode: data.materialCode,
            name: data.name,
            categoryId: data.categoryId,
            unitId: data.unitId,
            specification: data.specification,
            standard: data.standard,
            description: data.description,
            estimatedUnitPrice: data.estimatedUnitPrice ?? 0,
            currentUnitPrice: data.currentUnitPrice ?? 0,
            minimumStock: data.minimumStock ?? 0,
            reorderLevel: data.reorderLevel ?? 0,
            maximumStock: data.maximumStock,
            requiresInspection: data.requiresInspection ?? true,
            requiresCertificate: data.requiresCertificate ?? false,
            storageRequirements: data.storageRequirements,
            isActive: data.isActive ?? true,
        },
        include: {
            category: true,
            unit: true,
        },
    });
}
async function getMaterials(params) {
    const { search, categoryId, unitId, isActive, page = 1, limit = 20, } = params;
    const skip = (page - 1) * limit;
    const where = {};
    // Search
    if (search) {
        where.OR = [
            {
                materialCode: {
                    contains: search,
                },
            },
            {
                name: {
                    contains: search,
                },
            },
            {
                specification: {
                    contains: search,
                },
            },
            {
                standard: {
                    contains: search,
                },
            },
            {
                description: {
                    contains: search,
                },
            },
        ];
    }
    // Category filter
    if (categoryId) {
        where.categoryId = categoryId;
    }
    // Unit filter
    if (unitId) {
        where.unitId = unitId;
    }
    // Active filter
    if (isActive !== undefined) {
        where.isActive = isActive;
    }
    const [materials, total] = await database_1.prisma.$transaction([
        database_1.prisma.material.findMany({
            where,
            include: {
                category: true,
                unit: true,
            },
            orderBy: {
                name: "asc",
            },
            skip,
            take: limit,
        }),
        database_1.prisma.material.count({
            where,
        }),
    ]);
    return {
        materials,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}
async function getMaterialById(materialId) {
    const material = await database_1.prisma.material.findUnique({
        where: {
            id: materialId
        },
        include: {
            category: true,
            unit: true,
            suppliers: {
                include: {
                    supplier: true
                }
            },
            inventoryBalances: {
                include: {
                    warehouse: true,
                    storageLocation: true
                }
            }
        }
    });
    if (!material) {
        throw new Error("MATERIAL_NOT_FOUND");
    }
    return material;
}
