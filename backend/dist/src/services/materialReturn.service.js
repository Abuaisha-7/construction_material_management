"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMaterialReturn = createMaterialReturn;
exports.getMaterialReturnById = getMaterialReturnById;
exports.getMaterialReturns = getMaterialReturns;
exports.updateMaterialReturn = updateMaterialReturn;
exports.receiveMaterialReturn = receiveMaterialReturn;
const client_1 = require("@prisma/client");
const database_1 = require("../config/database");
const numberGenerator_1 = require("../utils/numberGenerator");
function decimal(value) {
    return new client_1.Prisma.Decimal(value ?? 0);
}
function assertPositive(value, field) {
    if (!Number.isFinite(value) || value <= 0) {
        throw new Error(`${field} must be greater than zero`);
    }
}
function assertNonNegative(value, field) {
    if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
        throw new Error(`${field} cannot be negative`);
    }
}
function parseDate(date) {
    if (!date)
        return new Date();
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
        throw new Error("Invalid returnDate");
    }
    return parsed;
}
/**
 * Calculates how much of a material from an issue
 * is still available for return.
 */
async function getRemainingReturnableQuantity(tx, issueId, materialId, excludeReturnId) {
    const issueItem = await tx.materialIssueItem.findFirst({
        where: {
            issueId,
            materialId,
        },
        select: {
            issuedQuantity: true,
        },
    });
    if (!issueItem) {
        throw new Error(`Material ${materialId} was not issued under this material issue`);
    }
    const consumed = await tx.materialConsumption.aggregate({
        where: {
            issueId,
            materialId,
        },
        _sum: {
            consumedQuantity: true,
        },
    });
    const returned = await tx.materialReturnItem.aggregate({
        where: {
            materialId,
            return: {
                originalIssueId: issueId,
                status: {
                    not: client_1.MaterialReturnStatus.REJECTED,
                },
                ...(excludeReturnId
                    ? {
                        id: {
                            not: excludeReturnId,
                        },
                    }
                    : {}),
            },
        },
        _sum: {
            returnedQuantity: true,
        },
    });
    const issued = decimal(issueItem.issuedQuantity);
    const consumedQty = decimal(consumed._sum.consumedQuantity);
    const returnedQty = decimal(returned._sum.returnedQuantity);
    const remaining = issued
        .minus(consumedQty)
        .minus(returnedQty);
    return {
        issued,
        consumed: consumedQty,
        previouslyReturned: returnedQty,
        remaining: remaining.lessThan(0)
            ? new client_1.Prisma.Decimal(0)
            : remaining,
    };
}
async function validateReturnItems(tx, issueId, items, excludeReturnId) {
    if (!Array.isArray(items) || items.length === 0) {
        throw new Error("At least one return item is required");
    }
    const materialIds = items.map((item) => item.materialId);
    if (new Set(materialIds).size !== materialIds.length) {
        throw new Error("Duplicate materials are not allowed in one return");
    }
    for (const item of items) {
        assertPositive(item.returnedQuantity, "returnedQuantity");
        assertNonNegative(item.damagedQuantity, "damagedQuantity");
        assertNonNegative(item.acceptedQuantity, "acceptedQuantity");
        assertNonNegative(item.rejectedQuantity, "rejectedQuantity");
        const quantities = decimal(item.damagedQuantity)
            .plus(decimal(item.acceptedQuantity))
            .plus(decimal(item.rejectedQuantity));
        if (!quantities.eq(decimal(item.returnedQuantity))) {
            throw new Error(`For material ${item.materialId}, damagedQuantity + acceptedQuantity + rejectedQuantity must equal returnedQuantity`);
        }
        const remaining = await getRemainingReturnableQuantity(tx, issueId, item.materialId, excludeReturnId);
        if (decimal(item.returnedQuantity).gt(remaining.remaining)) {
            throw new Error(`Material ${item.materialId}: return quantity ${item.returnedQuantity} exceeds remaining returnable quantity ${remaining.remaining.toString()}`);
        }
    }
}
/**
 * Create a pending material return.
 *
 * Inventory is NOT changed here.
 */
async function createMaterialReturn(userId, data) {
    return database_1.prisma.$transaction(async (tx) => {
        const issue = await tx.materialIssue.findUnique({
            where: {
                id: data.originalIssueId,
            },
            include: {
                items: true,
                project: true,
                warehouse: true,
            },
        });
        if (!issue) {
            throw new Error("Original material issue not found");
        }
        if (issue.projectId !== data.projectId) {
            throw new Error("Material issue does not belong to the specified project");
        }
        if (issue.status !== "ISSUED" &&
            issue.status !== "PARTIALLY_ISSUED") {
            throw new Error("Material can only be returned from an issued material issue");
        }
        await validateReturnItems(tx, data.originalIssueId, data.items);
        const returnNumber = await (0, numberGenerator_1.generateReturnNumber)(tx);
        const materialReturn = await tx.materialReturn.create({
            data: {
                returnNumber,
                projectId: data.projectId,
                originalIssueId: data.originalIssueId,
                returnedBy: userId,
                returnDate: parseDate(data.returnDate),
                reason: data.reason,
                remarks: data.remarks,
                status: client_1.MaterialReturnStatus.PENDING,
                items: {
                    create: data.items.map((item) => ({
                        materialId: item.materialId,
                        returnedQuantity: decimal(item.returnedQuantity),
                        damagedQuantity: decimal(item.damagedQuantity),
                        acceptedQuantity: decimal(item.acceptedQuantity),
                        rejectedQuantity: decimal(item.rejectedQuantity),
                        conditionStatus: item.conditionStatus,
                        remarks: item.remarks,
                        issuedQuantity: issue.items.find((issueItem) => issueItem.materialId === item.materialId)?.issuedQuantity,
                        consumedQuantity: 0,
                    })),
                },
            },
            include: {
                items: {
                    include: {
                        material: true,
                    },
                },
                originalIssue: true,
                project: true,
                returner: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
            },
        });
        return materialReturn;
    });
}
/**
 * Get one return.
 */
async function getMaterialReturnById(id) {
    const materialReturn = await database_1.prisma.materialReturn.findUnique({
        where: { id },
        include: {
            items: {
                include: {
                    material: {
                        include: {
                            unit: true,
                        },
                    },
                },
            },
            originalIssue: {
                include: {
                    items: {
                        include: {
                            material: true,
                        },
                    },
                    warehouse: true,
                    activity: true,
                    building: true,
                    zone: true,
                },
            },
            project: true,
            returner: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                },
            },
            receiver: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                },
            },
        },
    });
    if (!materialReturn) {
        throw new Error("Material return not found");
    }
    return materialReturn;
}
/**
 * List material returns.
 */
async function getMaterialReturns(filters) {
    return database_1.prisma.materialReturn.findMany({
        where: {
            ...(filters?.projectId
                ? { projectId: filters.projectId }
                : {}),
            ...(filters?.status
                ? { status: filters.status }
                : {}),
            ...(filters?.originalIssueId
                ? { originalIssueId: filters.originalIssueId }
                : {}),
        },
        orderBy: {
            createdAt: "desc",
        },
        include: {
            items: {
                include: {
                    material: true,
                },
            },
            originalIssue: {
                select: {
                    id: true,
                    issueNumber: true,
                    warehouseId: true,
                },
            },
            returner: {
                select: {
                    id: true,
                    fullName: true,
                },
            },
            receiver: {
                select: {
                    id: true,
                    fullName: true,
                },
            },
        },
    });
}
/**
 * Update a pending return.
 */
async function updateMaterialReturn(id, data) {
    return database_1.prisma.$transaction(async (tx) => {
        const existing = await tx.materialReturn.findUnique({
            where: { id },
            include: {
                items: true,
            },
        });
        if (!existing) {
            throw new Error("Material return not found");
        }
        if (existing.status !== client_1.MaterialReturnStatus.PENDING) {
            throw new Error("Only PENDING material returns can be updated");
        }
        if (data.items) {
            await validateReturnItems(tx, existing.originalIssueId, data.items, id);
            await tx.materialReturnItem.deleteMany({
                where: {
                    returnId: id,
                },
            });
            await tx.materialReturnItem.createMany({
                data: data.items.map((item) => ({
                    returnId: id,
                    materialId: item.materialId,
                    returnedQuantity: decimal(item.returnedQuantity),
                    damagedQuantity: decimal(item.damagedQuantity),
                    acceptedQuantity: decimal(item.acceptedQuantity),
                    rejectedQuantity: decimal(item.rejectedQuantity),
                    conditionStatus: item.conditionStatus,
                    remarks: item.remarks,
                })),
            });
        }
        return tx.materialReturn.update({
            where: { id },
            data: {
                ...(data.returnDate
                    ? { returnDate: parseDate(data.returnDate) }
                    : {}),
                ...(data.reason !== undefined
                    ? { reason: data.reason }
                    : {}),
                ...(data.remarks !== undefined
                    ? { remarks: data.remarks }
                    : {}),
            },
            include: {
                items: {
                    include: {
                        material: true,
                    },
                },
            },
        });
    });
}
/**
 * Receive/post a material return.
 *
 * This is the critical inventory operation.
 */
async function receiveMaterialReturn(id, receiverId) {
    return database_1.prisma.$transaction(async (tx) => {
        const materialReturn = await tx.materialReturn.findUnique({
            where: { id },
            include: {
                items: true,
                originalIssue: {
                    include: {
                        items: true,
                    },
                },
            },
        });
        if (!materialReturn) {
            throw new Error("Material return not found");
        }
        if (materialReturn.status !== client_1.MaterialReturnStatus.PENDING) {
            throw new Error(`Return cannot be received while status is ${materialReturn.status}`);
        }
        if (!materialReturn.originalIssue) {
            throw new Error("Original material issue is required to receive a return");
        }
        if (materialReturn.originalIssue.status !== "ISSUED" &&
            materialReturn.originalIssue.status !== "PARTIALLY_ISSUED") {
            throw new Error("Original material issue is not in an issued state");
        }
        const warehouseId = materialReturn.originalIssue.warehouseId;
        let totalAccepted = new client_1.Prisma.Decimal(0);
        let totalRejected = new client_1.Prisma.Decimal(0);
        for (const item of materialReturn.items) {
            const accepted = decimal(item.acceptedQuantity);
            const rejected = decimal(item.rejectedQuantity);
            totalAccepted = totalAccepted.plus(accepted);
            totalRejected = totalRejected.plus(rejected);
            /**
             * Only accepted material goes back into usable inventory.
             *
             * Damaged/rejected material does not increase usable stock.
             */
            if (accepted.gt(0)) {
                const inventory = await tx.inventoryBalance.findFirst({
                    where: {
                        projectId: materialReturn.projectId,
                        materialId: item.materialId,
                        warehouseId,
                    },
                });
                if (!inventory) {
                    throw new Error(`Inventory balance not found for material ${item.materialId}`);
                }
                const unitCost = inventory.averageUnitCost;
                const newPhysicalQuantity = inventory.physicalQuantity.plus(accepted);
                const newStockValue = newPhysicalQuantity.times(unitCost);
                await tx.inventoryBalance.update({
                    where: {
                        id: inventory.id,
                    },
                    data: {
                        physicalQuantity: newPhysicalQuantity,
                        stockValue: newStockValue,
                    },
                });
                const transactionNumber = await (0, numberGenerator_1.generateInventoryTransactionNumber)(tx);
                await tx.inventoryTransaction.create({
                    data: {
                        transactionNumber,
                        projectId: materialReturn.projectId,
                        materialId: item.materialId,
                        warehouseId,
                        storageLocationId: null,
                        transactionType: "RETURN",
                        quantity: accepted,
                        unitCost,
                        totalValue: accepted.times(unitCost),
                        referenceType: "MATERIAL_RETURN",
                        referenceId: materialReturn.id,
                        performedBy: receiverId,
                        reason: materialReturn.reason ||
                            "Material returned from site",
                    },
                });
            }
        }
        let newStatus;
        if (totalAccepted.eq(0)) {
            newStatus = client_1.MaterialReturnStatus.REJECTED;
        }
        else if (totalRejected.gt(0)) {
            newStatus =
                client_1.MaterialReturnStatus.PARTIALLY_ACCEPTED;
        }
        else {
            newStatus = client_1.MaterialReturnStatus.ACCEPTED;
        }
        const updatedReturn = await tx.materialReturn.update({
            where: {
                id,
            },
            data: {
                status: newStatus,
                receivedBy: receiverId,
            },
            include: {
                items: true,
            },
        });
        /**
         * Once inventory posting succeeds, mark the return
         * as POSTED.
         */
        if (newStatus === client_1.MaterialReturnStatus.ACCEPTED ||
            newStatus === client_1.MaterialReturnStatus.PARTIALLY_ACCEPTED) {
            return tx.materialReturn.update({
                where: {
                    id,
                },
                data: {
                    status: client_1.MaterialReturnStatus.POSTED,
                },
                include: {
                    items: {
                        include: {
                            material: true,
                        },
                    },
                },
            });
        }
        return updatedReturn;
    });
}
