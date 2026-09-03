"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMaterialWastage = createMaterialWastage;
exports.getMaterialWastageById = getMaterialWastageById;
exports.getMaterialWastages = getMaterialWastages;
exports.updateMaterialWastage = updateMaterialWastage;
exports.approveMaterialWastage = approveMaterialWastage;
exports.rejectMaterialWastage = rejectMaterialWastage;
exports.postMaterialWastage = postMaterialWastage;
const client_1 = require("@prisma/client");
const database_1 = require("../config/database");
const numberGenerator_1 = require("../utils/numberGenerator");
function toDecimal(value) {
    return new client_1.Prisma.Decimal(value);
}
function parseDate(value) {
    if (!value) {
        return new Date();
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        throw new Error("Invalid wastageDate");
    }
    return date;
}
function validatePositiveQuantity(quantity) {
    if (typeof quantity !== "number" ||
        !Number.isFinite(quantity) ||
        quantity <= 0) {
        throw new Error("Quantity must be greater than zero");
    }
}
/**
 * Validate that the project exists.
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
 * Validate material belongs to the system and is active.
 */
async function validateMaterial(materialId) {
    const material = await database_1.prisma.material.findUnique({
        where: {
            id: materialId,
        },
    });
    if (!material) {
        throw new Error("Material not found");
    }
    if (!material.isActive) {
        throw new Error("Material is inactive");
    }
    return material;
}
/**
 * Validate optional building.
 */
async function validateBuilding(projectId, buildingId) {
    if (!buildingId) {
        return null;
    }
    const building = await database_1.prisma.building.findFirst({
        where: {
            id: buildingId,
            projectId,
        },
    });
    if (!building) {
        throw new Error("Building not found or does not belong to the project");
    }
    return building;
}
/**
 * Validate optional activity.
 */
async function validateActivity(projectId, activityId) {
    if (!activityId) {
        return null;
    }
    const activity = await database_1.prisma.activity.findFirst({
        where: {
            id: activityId,
            projectId,
        },
    });
    if (!activity) {
        throw new Error("Activity not found or does not belong to the project");
    }
    return activity;
}
/**
 * Create wastage report.
 *
 * Inventory is NOT changed here.
 */
async function createMaterialWastage(userId, data) {
    validatePositiveQuantity(data.quantity);
    if (!data.reason?.trim()) {
        throw new Error("Reason is required");
    }
    await validateProject(data.projectId);
    await validateMaterial(data.materialId);
    await validateBuilding(data.projectId, data.buildingId);
    await validateActivity(data.projectId, data.activityId);
    /**
     * If activity has a building, make sure the
     * explicitly supplied building is consistent.
     */
    if (data.activityId && data.buildingId) {
        const activity = await database_1.prisma.activity.findUnique({
            where: {
                id: data.activityId,
            },
            select: {
                buildingId: true,
            },
        });
        if (activity?.buildingId &&
            activity.buildingId !== data.buildingId) {
            throw new Error("Activity does not belong to the specified building");
        }
    }
    return database_1.prisma.materialWastage.create({
        data: {
            projectId: data.projectId,
            materialId: data.materialId,
            activityId: data.activityId,
            buildingId: data.buildingId,
            wastageDate: parseDate(data.wastageDate),
            quantity: toDecimal(data.quantity),
            reason: data.reason.trim(),
            reportedBy: userId,
            status: client_1.StockAdjustmentStatus.PENDING,
        },
        include: {
            project: true,
            material: {
                include: {
                    unit: true,
                },
            },
            activity: true,
            building: true,
            reporter: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                },
            },
        },
    });
}
/**
 * Get one wastage record.
 */
async function getMaterialWastageById(id) {
    const wastage = await database_1.prisma.materialWastage.findUnique({
        where: {
            id,
        },
        include: {
            project: true,
            material: {
                include: {
                    unit: true,
                    category: true,
                },
            },
            activity: true,
            building: true,
            reporter: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                },
            },
            approver: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                },
            },
        },
    });
    if (!wastage) {
        throw new Error("Material wastage not found");
    }
    return wastage;
}
/**
 * List wastage records.
 */
async function getMaterialWastages(filters) {
    return database_1.prisma.materialWastage.findMany({
        where: {
            ...(filters?.projectId
                ? {
                    projectId: filters.projectId,
                }
                : {}),
            ...(filters?.materialId
                ? {
                    materialId: filters.materialId,
                }
                : {}),
            ...(filters?.activityId
                ? {
                    activityId: filters.activityId,
                }
                : {}),
            ...(filters?.buildingId
                ? {
                    buildingId: filters.buildingId,
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
            material: {
                include: {
                    unit: true,
                },
            },
            project: true,
            activity: true,
            building: true,
            reporter: {
                select: {
                    id: true,
                    fullName: true,
                },
            },
            approver: {
                select: {
                    id: true,
                    fullName: true,
                },
            },
        },
    });
}
/**
 * Update PENDING wastage.
 */
async function updateMaterialWastage(id, data) {
    const existing = await database_1.prisma.materialWastage.findUnique({
        where: {
            id,
        },
    });
    if (!existing) {
        throw new Error("Material wastage not found");
    }
    if (existing.status !==
        client_1.StockAdjustmentStatus.PENDING) {
        throw new Error("Only PENDING wastage records can be updated");
    }
    if (data.quantity !== undefined) {
        validatePositiveQuantity(data.quantity);
    }
    if (data.reason !== undefined &&
        !data.reason.trim()) {
        throw new Error("Reason cannot be empty");
    }
    if (data.buildingId !== undefined) {
        await validateBuilding(existing.projectId, data.buildingId);
    }
    if (data.activityId !== undefined) {
        await validateActivity(existing.projectId, data.activityId);
    }
    return database_1.prisma.materialWastage.update({
        where: {
            id,
        },
        data: {
            ...(data.activityId !== undefined
                ? {
                    activityId: data.activityId,
                }
                : {}),
            ...(data.buildingId !== undefined
                ? {
                    buildingId: data.buildingId,
                }
                : {}),
            ...(data.wastageDate !== undefined
                ? {
                    wastageDate: parseDate(data.wastageDate),
                }
                : {}),
            ...(data.quantity !== undefined
                ? {
                    quantity: toDecimal(data.quantity),
                }
                : {}),
            ...(data.reason !== undefined
                ? {
                    reason: data.reason.trim(),
                }
                : {}),
        },
        include: {
            material: true,
            activity: true,
            building: true,
            project: true,
        },
    });
}
/**
 * Approve wastage.
 *
 * Inventory is NOT changed here.
 */
async function approveMaterialWastage(id, approverId) {
    return database_1.prisma.$transaction(async (tx) => {
        const wastage = await tx.materialWastage.findUnique({
            where: {
                id,
            },
        });
        if (!wastage) {
            throw new Error("Material wastage not found");
        }
        if (wastage.status !==
            client_1.StockAdjustmentStatus.PENDING) {
            throw new Error(`Wastage cannot be approved from status ${wastage.status}`);
        }
        if (wastage.reportedBy === approverId) {
            throw new Error("The person who reported wastage cannot approve the same record");
        }
        return tx.materialWastage.update({
            where: {
                id,
            },
            data: {
                status: client_1.StockAdjustmentStatus.APPROVED,
                approvedBy: approverId,
            },
            include: {
                material: true,
                project: true,
                activity: true,
                building: true,
                reporter: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
                approver: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
            },
        });
    });
}
/**
 * Reject wastage.
 *
 * No inventory change.
 */
async function rejectMaterialWastage(id, approverId) {
    return database_1.prisma.$transaction(async (tx) => {
        const wastage = await tx.materialWastage.findUnique({
            where: {
                id,
            },
        });
        if (!wastage) {
            throw new Error("Material wastage not found");
        }
        if (wastage.status !==
            client_1.StockAdjustmentStatus.PENDING) {
            throw new Error(`Wastage cannot be rejected from status ${wastage.status}`);
        }
        if (wastage.reportedBy === approverId) {
            throw new Error("The person who reported wastage cannot reject the same record");
        }
        return tx.materialWastage.update({
            where: {
                id,
            },
            data: {
                status: client_1.StockAdjustmentStatus.REJECTED,
                approvedBy: approverId,
            },
            include: {
                material: true,
                project: true,
                reporter: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
                approver: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
            },
        });
    });
}
/**
 * Post approved wastage to inventory.
 *
 * This is the operation that actually decreases stock.
 */
async function postMaterialWastage(id, userId) {
    return database_1.prisma.$transaction(async (tx) => {
        const wastage = await tx.materialWastage.findUnique({
            where: {
                id,
            },
            include: {
                material: true,
            },
        });
        if (!wastage) {
            throw new Error("Material wastage not found");
        }
        if (wastage.status !==
            client_1.StockAdjustmentStatus.APPROVED) {
            throw new Error(`Only APPROVED wastage can be posted. Current status: ${wastage.status}`);
        }
        /**
         * Find inventory for this project/material.
         *
         * Wastage model has no warehouseId, so the current
         * schema does not tell us which warehouse should be
         * reduced if multiple warehouses contain the material.
         *
         * We therefore require exactly one inventory balance.
         */
        const balances = await tx.inventoryBalance.findMany({
            where: {
                projectId: wastage.projectId,
                materialId: wastage.materialId,
            },
        });
        if (balances.length === 0) {
            throw new Error("No inventory balance found for this material in the project");
        }
        if (balances.length > 1) {
            throw new Error("Multiple inventory balances found. MaterialWastage needs warehouseId/storageLocationId to safely post wastage.");
        }
        const inventory = balances[0];
        if (inventory.physicalQuantity.lt(wastage.quantity)) {
            throw new Error(`Insufficient inventory. Available: ${inventory.physicalQuantity.toString()}, wastage: ${wastage.quantity.toString()}`);
        }
        const newPhysicalQuantity = inventory.physicalQuantity.minus(wastage.quantity);
        const newStockValue = newPhysicalQuantity.times(inventory.averageUnitCost);
        await tx.inventoryBalance.update({
            where: {
                id: inventory.id,
            },
            data: {
                physicalQuantity: newPhysicalQuantity,
                stockValue: newStockValue,
            },
        });
        /**
         * Use DAMAGE by default.
         *
         * LOSS/DISPOSAL can be added later when a dedicated
         * wastage type is introduced into the schema.
         */
        const transactionNumber = await (0, numberGenerator_1.generateInventoryTransactionNumber)(tx);
        await tx.inventoryTransaction.create({
            data: {
                transactionNumber,
                projectId: wastage.projectId,
                materialId: wastage.materialId,
                warehouseId: inventory.warehouseId,
                storageLocationId: inventory.storageLocationId,
                transactionType: client_1.InventoryTransactionType.DAMAGE,
                quantity: wastage.quantity,
                unitCost: inventory.averageUnitCost,
                totalValue: wastage.quantity.times(inventory.averageUnitCost),
                referenceType: "MATERIAL_WASTAGE",
                referenceId: wastage.id,
                performedBy: userId,
                reason: wastage.reason,
            },
        });
        return tx.materialWastage.update({
            where: {
                id,
            },
            data: {
                status: client_1.StockAdjustmentStatus.POSTED,
            },
            include: {
                material: true,
                project: true,
                activity: true,
                building: true,
                reporter: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
                approver: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
            },
        });
    });
}
