"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStockCount = createStockCount;
exports.getStockCountById = getStockCountById;
exports.getStockCounts = getStockCounts;
exports.updateStockCount = updateStockCount;
exports.startStockCount = startStockCount;
exports.completeStockCount = completeStockCount;
exports.approveStockCount = approveStockCount;
const client_1 = require("@prisma/client");
const database_1 = require("../config/database");
const numberGenerator_1 = require("../utils/numberGenerator");
function decimal(value) {
    return new client_1.Prisma.Decimal(value);
}
function parseDate(value) {
    if (!value) {
        return new Date();
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        throw new Error("Invalid countDate");
    }
    return date;
}
function validatePhysicalQuantity(quantity) {
    if (typeof quantity !== "number" ||
        !Number.isFinite(quantity) ||
        quantity < 0) {
        throw new Error("physicalQuantity must be zero or greater");
    }
}
/**
 * Validate project.
 */
async function validateProject(projectId) {
    const project = await database_1.prisma.project.findUnique({
        where: {
            id: projectId,
        },
    });
    if (!project) {
        throw new Error("Project not found");
    }
    return project;
}
/**
 * Validate warehouse belongs to project.
 */
async function validateWarehouse(projectId, warehouseId) {
    if (!warehouseId) {
        return null;
    }
    const warehouse = await database_1.prisma.warehouse.findFirst({
        where: {
            id: warehouseId,
            projectId,
            isActive: true,
        },
    });
    if (!warehouse) {
        throw new Error("Warehouse not found, inactive, or does not belong to the project");
    }
    return warehouse;
}
/**
 * Validate material.
 */
async function validateMaterial(materialId) {
    const material = await database_1.prisma.material.findUnique({
        where: {
            id: materialId,
        },
    });
    if (!material) {
        throw new Error(`Material ${materialId} not found`);
    }
    if (!material.isActive) {
        throw new Error(`Material ${materialId} is inactive`);
    }
    return material;
}
/**
 * Validate storage location.
 */
async function validateStorageLocation(warehouseId, storageLocationId) {
    if (!storageLocationId) {
        return null;
    }
    const location = await database_1.prisma.storageLocation.findUnique({
        where: {
            id: storageLocationId,
        },
    });
    if (!location) {
        throw new Error(`Storage location ${storageLocationId} not found`);
    }
    if (!location.isActive) {
        throw new Error(`Storage location ${storageLocationId} is inactive`);
    }
    if (warehouseId &&
        location.warehouseId !== warehouseId) {
        throw new Error("Storage location does not belong to the specified warehouse");
    }
    return location;
}
/**
 * Validate count items and prevent duplicates.
 */
async function validateItems(projectId, warehouseId, items) {
    if (!Array.isArray(items) ||
        items.length === 0) {
        throw new Error("At least one stock count item is required");
    }
    const keys = new Set();
    for (const item of items) {
        validatePhysicalQuantity(item.physicalQuantity);
        await validateMaterial(item.materialId);
        await validateStorageLocation(warehouseId, item.storageLocationId);
        const key = `${item.materialId}:${item.storageLocationId ?? "NULL"}`;
        if (keys.has(key)) {
            throw new Error(`Duplicate stock count item: ${key}`);
        }
        keys.add(key);
        /**
         * If a warehouse is supplied, make sure the
         * material actually has an inventory balance
         * in that warehouse/location.
         */
        if (warehouseId) {
            const balance = await database_1.prisma.inventoryBalance.findFirst({
                where: {
                    projectId,
                    materialId: item.materialId,
                    warehouseId,
                    storageLocationId: item.storageLocationId ?? null,
                },
            });
            if (!balance) {
                throw new Error(`No inventory balance found for material ${item.materialId}`);
            }
        }
    }
}
/**
 * Determine the system quantity at the time
 * the count is created.
 */
async function getSystemQuantity(projectId, warehouseId, item) {
    if (warehouseId) {
        const balance = await database_1.prisma.inventoryBalance.findFirst({
            where: {
                projectId,
                materialId: item.materialId,
                warehouseId,
                storageLocationId: item.storageLocationId ?? null,
            },
        });
        return balance?.physicalQuantity ??
            new client_1.Prisma.Decimal(0);
    }
    /**
     * If no warehouse is specified, aggregate
     * all inventory balances for the project/material.
     */
    const balances = await database_1.prisma.inventoryBalance.findMany({
        where: {
            projectId,
            materialId: item.materialId,
        },
        select: {
            physicalQuantity: true,
        },
    });
    return balances.reduce((total, balance) => total.plus(balance.physicalQuantity), new client_1.Prisma.Decimal(0));
}
/**
 * Create stock count.
 *
 * Inventory is NOT modified.
 */
async function createStockCount(userId, data) {
    await validateProject(data.projectId);
    await validateWarehouse(data.projectId, data.warehouseId);
    await validateItems(data.projectId, data.warehouseId, data.items);
    return database_1.prisma.$transaction(async (tx) => {
        const countNumber = await (0, numberGenerator_1.generateCountNumber)(tx);
        const itemsData = [];
        for (const item of data.items) {
            const systemQuantity = await getSystemQuantity(data.projectId, data.warehouseId, item);
            itemsData.push({
                materialId: item.materialId,
                storageLocationId: item.storageLocationId ?? null,
                systemQuantity,
                physicalQuantity: decimal(item.physicalQuantity),
                reason: item.reason,
            });
        }
        return tx.stockCount.create({
            data: {
                countNumber,
                projectId: data.projectId,
                warehouseId: data.warehouseId,
                countDate: parseDate(data.countDate),
                countedBy: userId,
                remarks: data.remarks,
                status: client_1.StockCountStatus.DRAFT,
                items: {
                    create: itemsData,
                },
            },
            include: {
                items: {
                    include: {
                        material: {
                            include: {
                                unit: true,
                            },
                        },
                        storageLocation: true,
                    },
                },
                project: true,
                warehouse: true,
                counter: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
            },
        });
    });
}
/**
 * Get stock count by ID.
 */
async function getStockCountById(id) {
    const count = await database_1.prisma.stockCount.findUnique({
        where: {
            id,
        },
        include: {
            project: true,
            warehouse: true,
            counter: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                },
            },
            verifier: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                },
            },
            items: {
                include: {
                    material: {
                        include: {
                            unit: true,
                            category: true,
                        },
                    },
                    storageLocation: true,
                },
            },
        },
    });
    if (!count) {
        throw new Error("Stock count not found");
    }
    return count;
}
/**
 * List stock counts.
 */
async function getStockCounts(filters) {
    return database_1.prisma.stockCount.findMany({
        where: {
            ...(filters?.projectId
                ? {
                    projectId: filters.projectId,
                }
                : {}),
            ...(filters?.warehouseId
                ? {
                    warehouseId: filters.warehouseId,
                }
                : {}),
            ...(filters?.status
                ? {
                    status: filters.status,
                }
                : {}),
        },
        orderBy: {
            createdAt: "desc",
        },
        include: {
            project: true,
            warehouse: true,
            counter: {
                select: {
                    id: true,
                    fullName: true,
                },
            },
            verifier: {
                select: {
                    id: true,
                    fullName: true,
                },
            },
            items: {
                include: {
                    material: true,
                },
            },
        },
    });
}
/**
 * Update DRAFT stock count.
 */
async function updateStockCount(id, data) {
    return database_1.prisma.$transaction(async (tx) => {
        const existing = await tx.stockCount.findUnique({
            where: {
                id,
            },
        });
        if (!existing) {
            throw new Error("Stock count not found");
        }
        if (existing.status !==
            client_1.StockCountStatus.DRAFT) {
            throw new Error("Only DRAFT stock counts can be updated");
        }
        if (data.items) {
            await tx.stockCountItem.deleteMany({
                where: {
                    stockCountId: id,
                },
            });
            for (const item of data.items) {
                validatePhysicalQuantity(item.physicalQuantity);
                await validateMaterial(item.materialId);
                await validateStorageLocation(existing.warehouseId ?? undefined, item.storageLocationId);
                const systemQuantity = await getSystemQuantity(existing.projectId, existing.warehouseId ??
                    undefined, item);
                await tx.stockCountItem.create({
                    data: {
                        stockCountId: id,
                        materialId: item.materialId,
                        storageLocationId: item.storageLocationId ??
                            null,
                        systemQuantity,
                        physicalQuantity: decimal(item.physicalQuantity),
                        reason: item.reason,
                    },
                });
            }
        }
        return tx.stockCount.update({
            where: {
                id,
            },
            data: {
                ...(data.countDate
                    ? {
                        countDate: parseDate(data.countDate),
                    }
                    : {}),
                ...(data.remarks !== undefined
                    ? {
                        remarks: data.remarks,
                    }
                    : {}),
            },
            include: {
                items: {
                    include: {
                        material: true,
                        storageLocation: true,
                    },
                },
            },
        });
    });
}
/**
 * Start stock count.
 */
async function startStockCount(id) {
    const count = await database_1.prisma.stockCount.findUnique({
        where: {
            id,
        },
    });
    if (!count) {
        throw new Error("Stock count not found");
    }
    if (count.status !==
        client_1.StockCountStatus.DRAFT) {
        throw new Error("Only DRAFT stock counts can be started");
    }
    return database_1.prisma.stockCount.update({
        where: {
            id,
        },
        data: {
            status: client_1.StockCountStatus.IN_PROGRESS,
        },
        include: {
            items: true,
        },
    });
}
/**
 * Complete stock count.
 *
 * Still does NOT modify inventory.
 */
async function completeStockCount(id) {
    const count = await database_1.prisma.stockCount.findUnique({
        where: {
            id,
        },
        include: {
            items: true,
        },
    });
    if (!count) {
        throw new Error("Stock count not found");
    }
    if (count.status !==
        client_1.StockCountStatus.IN_PROGRESS) {
        throw new Error("Only IN_PROGRESS stock counts can be completed");
    }
    if (count.items.length === 0) {
        throw new Error("Cannot complete a stock count without items");
    }
    return database_1.prisma.stockCount.update({
        where: {
            id,
        },
        data: {
            status: client_1.StockCountStatus.COMPLETED,
        },
        include: {
            items: {
                include: {
                    material: true,
                    storageLocation: true,
                },
            },
        },
    });
}
/**
 * Approve stock count.
 *
 * Inventory is NOT modified.
 *
 * Approval simply confirms the physical count
 * and makes it available for Stock Adjustment.
 */
async function approveStockCount(id, verifierId) {
    return database_1.prisma.$transaction(async (tx) => {
        const count = await tx.stockCount.findUnique({
            where: {
                id,
            },
            include: {
                items: true,
            },
        });
        if (!count) {
            throw new Error("Stock count not found");
        }
        if (count.status !==
            client_1.StockCountStatus.COMPLETED) {
            throw new Error("Only COMPLETED stock counts can be approved");
        }
        if (count.countedBy === verifierId) {
            throw new Error("The person who performed the stock count cannot approve the same count");
        }
        return tx.stockCount.update({
            where: {
                id,
            },
            data: {
                status: client_1.StockCountStatus.APPROVED,
                verifiedBy: verifierId,
            },
            include: {
                items: {
                    include: {
                        material: true,
                        storageLocation: true,
                    },
                },
                verifier: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
            },
        });
    });
}
