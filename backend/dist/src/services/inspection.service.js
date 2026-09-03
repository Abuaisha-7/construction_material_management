"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInspection = createInspection;
exports.getInspections = getInspections;
exports.getInspectionById = getInspectionById;
exports.startInspection = startInspection;
exports.updateInspection = updateInspection;
exports.completeInspection = completeInspection;
const client_1 = require("@prisma/client");
const database_1 = require("../config/database");
const numberGenerator_1 = require("../utils/numberGenerator");
const inventory_service_1 = require("./inventory.service");
/**
 * ============================================================
 * CREATE INSPECTION
 * ============================================================
 */
async function createInspection(data, userId) {
    return database_1.prisma.$transaction(async (tx) => {
        // --------------------------------------------------------
        // 1. Validate GRN
        // --------------------------------------------------------
        const grn = await tx.goodsReceivedNote.findUnique({
            where: {
                id: data.grnId,
            },
            include: {
                items: true,
                purchaseOrder: true,
                supplier: true,
                project: true,
            },
        });
        if (!grn) {
            throw new Error("Goods Received Note not found");
        }
        // --------------------------------------------------------
        // 2. GRN must be awaiting inspection
        // --------------------------------------------------------
        if (grn.status !== "AWAITING_INSPECTION") {
            throw new Error(`Inspection can only be created for GRN with status AWAITING_INSPECTION. Current status: ${grn.status}`);
        }
        // --------------------------------------------------------
        // 3. Prevent duplicate inspection
        // --------------------------------------------------------
        const existingInspection = await tx.materialInspection.findFirst({
            where: {
                grnId: data.grnId,
            },
        });
        if (existingInspection) {
            throw new Error(`An inspection already exists for this GRN: ${existingInspection.inspectionNumber}`);
        }
        // --------------------------------------------------------
        // 4. GRN must contain items
        // --------------------------------------------------------
        if (grn.items.length === 0) {
            throw new Error("Cannot create inspection for a GRN without items");
        }
        // --------------------------------------------------------
        // 5. Validate inspection items
        // --------------------------------------------------------
        const grnItemMap = new Map(grn.items.map((item) => [
            item.id,
            item,
        ]));
        for (const item of data.items) {
            const grnItem = grnItemMap.get(item.grnItemId);
            if (!grnItem) {
                throw new Error(`GRN item not found: ${item.grnItemId}`);
            }
            const deliveredQuantity = new client_1.Prisma.Decimal(grnItem.deliveredQuantity);
            const quantityInspected = new client_1.Prisma.Decimal(item.quantityInspected ?? 0);
            const accepted = new client_1.Prisma.Decimal(item.quantityAccepted ?? 0);
            const conditionallyAccepted = new client_1.Prisma.Decimal(item.quantityConditionallyAccepted ?? 0);
            const quarantined = new client_1.Prisma.Decimal(item.quantityQuarantined ?? 0);
            const rejected = new client_1.Prisma.Decimal(item.quantityRejected ?? 0);
            // ------------------------------------------------------
            // Quantity inspected cannot exceed delivered quantity
            // ------------------------------------------------------
            if (quantityInspected.gt(deliveredQuantity)) {
                throw new Error(`Inspected quantity cannot exceed delivered quantity for material ${grnItem.materialId}`);
            }
            // ------------------------------------------------------
            // Result quantities cannot exceed inspected quantity
            // ------------------------------------------------------
            const resultTotal = accepted
                .add(conditionallyAccepted)
                .add(quarantined)
                .add(rejected);
            if (resultTotal.gt(quantityInspected)) {
                throw new Error(`Accepted, conditionally accepted, quarantined and rejected quantities cannot exceed inspected quantity for GRN item ${grnItem.id}`);
            }
        }
        // --------------------------------------------------------
        // 6. Generate inspection number
        // --------------------------------------------------------
        const inspectionNumber = await (0, numberGenerator_1.generateInspectionNumber)(tx);
        // --------------------------------------------------------
        // 7. Create inspection
        // --------------------------------------------------------
        const inspection = await tx.materialInspection.create({
            data: {
                inspectionNumber,
                grnId: data.grnId,
                inspectionDate: data.inspectionDate ??
                    new Date(),
                inspectorId: userId,
                status: "PENDING",
                remarks: data.remarks,
                correctiveAction: data.correctiveAction,
                items: {
                    create: data.items.map((item) => ({
                        grnItemId: item.grnItemId,
                        quantityInspected: item.quantityInspected !== undefined
                            ? new client_1.Prisma.Decimal(item.quantityInspected)
                            : null,
                        quantityAccepted: new client_1.Prisma.Decimal(item.quantityAccepted ?? 0),
                        quantityConditionallyAccepted: new client_1.Prisma.Decimal(item.quantityConditionallyAccepted ?? 0),
                        quantityQuarantined: new client_1.Prisma.Decimal(item.quantityQuarantined ?? 0),
                        quantityRejected: new client_1.Prisma.Decimal(item.quantityRejected ?? 0),
                        specification: item.specification,
                        requiredStandard: item.requiredStandard,
                        certificateNumber: item.certificateNumber,
                        testRequired: item.testRequired ?? false,
                        testResult: item.testResult,
                        remarks: item.remarks,
                        materialId: item.materialId,
                    })),
                },
            },
            include: {
                grn: {
                    include: {
                        supplier: true,
                        project: true,
                        purchaseOrder: true,
                    },
                },
                inspector: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
                items: {
                    include: {
                        grnItem: {
                            include: {
                                material: true,
                                unit: true,
                                storageLocation: true,
                            },
                        },
                        material: true,
                    },
                },
            },
        });
        return inspection;
    });
}
/**
 * ============================================================
 * GET ALL INSPECTIONS
 * ============================================================
 */
async function getInspections(params) {
    const page = Math.max(params?.page ?? 1, 1);
    const limit = Math.min(Math.max(params?.limit ?? 20, 1), 100);
    const skip = (page - 1) * limit;
    const where = {};
    if (params?.status) {
        where.status =
            params.status;
    }
    if (params?.decision) {
        where.decision =
            params.decision;
    }
    if (params?.grnId) {
        where.grnId =
            params.grnId;
    }
    if (params?.inspectorId) {
        where.inspectorId =
            params.inspectorId;
    }
    const [inspections, total,] = await database_1.prisma.$transaction([
        database_1.prisma.materialInspection.findMany({
            where,
            include: {
                grn: {
                    include: {
                        supplier: true,
                        project: true,
                        purchaseOrder: true,
                    },
                },
                inspector: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
                items: {
                    include: {
                        grnItem: {
                            include: {
                                material: true,
                                unit: true,
                                storageLocation: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                inspectionDate: "desc",
            },
            skip,
            take: limit,
        }),
        database_1.prisma.materialInspection.count({
            where,
        }),
    ]);
    return {
        inspections,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}
/**
 * ============================================================
 * GET INSPECTION BY ID
 * ============================================================
 */
async function getInspectionById(id) {
    const inspection = await database_1.prisma.materialInspection.findUnique({
        where: {
            id,
        },
        include: {
            grn: {
                include: {
                    supplier: true,
                    project: true,
                    purchaseOrder: true,
                    items: {
                        include: {
                            material: true,
                            unit: true,
                            storageLocation: true,
                        },
                    },
                },
            },
            inspector: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                },
            },
            items: {
                include: {
                    grnItem: {
                        include: {
                            material: true,
                            unit: true,
                            storageLocation: true,
                        },
                    },
                    Material: true,
                },
            },
        },
    });
    if (!inspection) {
        throw new Error("Material inspection not found");
    }
    return inspection;
}
/**
 * ============================================================
 * START INSPECTION
 * PENDING → IN_PROGRESS
 * ============================================================
 */
async function startInspection(id) {
    const inspection = await database_1.prisma.materialInspection.findUnique({
        where: {
            id,
        },
    });
    if (!inspection) {
        throw new Error("Material inspection not found");
    }
    if (inspection.status !== "PENDING") {
        throw new Error("Only PENDING inspections can be started");
    }
    return database_1.prisma.materialInspection.update({
        where: {
            id,
        },
        data: {
            status: "IN_PROGRESS",
        },
        include: {
            items: {
                include: {
                    grnItem: {
                        include: {
                            material: true,
                            unit: true,
                        },
                    },
                },
            },
        },
    });
}
/**
 * ============================================================
 * UPDATE INSPECTION
 * ============================================================
 */
async function updateInspection(id, data) {
    return database_1.prisma.$transaction(async (tx) => {
        const inspection = await tx.materialInspection.findUnique({
            where: {
                id,
            },
            include: {
                grn: {
                    include: {
                        items: true,
                    },
                },
            },
        });
        if (!inspection) {
            throw new Error("Material inspection not found");
        }
        if (inspection.status === "COMPLETED") {
            throw new Error("Completed inspections cannot be modified");
        }
        if (data.items) {
            const grnItemMap = new Map(inspection.grn.items.map((item) => [
                item.id,
                item,
            ]));
            for (const item of data.items) {
                const grnItem = grnItemMap.get(item.grnItemId);
                if (!grnItem) {
                    throw new Error(`GRN item not found: ${item.grnItemId}`);
                }
                const inspected = new client_1.Prisma.Decimal(item.quantityInspected ?? 0);
                const delivered = new client_1.Prisma.Decimal(grnItem.deliveredQuantity);
                if (inspected.gt(delivered)) {
                    throw new Error("Inspected quantity cannot exceed delivered quantity");
                }
                const resultTotal = new client_1.Prisma.Decimal(item.quantityAccepted ?? 0)
                    .add(new client_1.Prisma.Decimal(item.quantityConditionallyAccepted ?? 0))
                    .add(new client_1.Prisma.Decimal(item.quantityQuarantined ?? 0))
                    .add(new client_1.Prisma.Decimal(item.quantityRejected ?? 0));
                if (resultTotal.gt(inspected)) {
                    throw new Error("Inspection result quantities cannot exceed inspected quantity");
                }
            }
            // Delete old items and recreate them.
            await tx.inspectionItem.deleteMany({
                where: {
                    inspectionId: id,
                },
            });
        }
        const updated = await tx.materialInspection.update({
            where: {
                id,
            },
            data: {
                inspectionDate: data.inspectionDate,
                remarks: data.remarks,
                correctiveAction: data.correctiveAction,
                ...(data.items
                    ? {
                        items: {
                            create: data.items.map((item) => ({
                                grnItemId: item.grnItemId,
                                quantityInspected: item.quantityInspected !== undefined
                                    ? new client_1.Prisma.Decimal(item.quantityInspected)
                                    : null,
                                quantityAccepted: new client_1.Prisma.Decimal(item.quantityAccepted ?? 0),
                                quantityConditionallyAccepted: new client_1.Prisma.Decimal(item.quantityConditionallyAccepted ?? 0),
                                quantityQuarantined: new client_1.Prisma.Decimal(item.quantityQuarantined ?? 0),
                                quantityRejected: new client_1.Prisma.Decimal(item.quantityRejected ?? 0),
                                specification: item.specification,
                                requiredStandard: item.requiredStandard,
                                certificateNumber: item.certificateNumber,
                                testRequired: item.testRequired ?? false,
                                testResult: item.testResult,
                                remarks: item.remarks,
                                materialId: item.materialId,
                            })),
                        },
                    }
                    : {}),
            },
            include: {
                items: {
                    include: {
                        grnItem: {
                            include: {
                                material: true,
                                unit: true,
                            },
                        },
                    },
                },
            },
        });
        return updated;
    });
}
/**
 * ============================================================
 * COMPLETE INSPECTION
 * IN_PROGRESS → COMPLETED
 * ============================================================
 */
async function completeInspection(inspectionId, userId, data) {
    return database_1.prisma.$transaction(async (tx) => {
        // ==================================================
        // 1. LOAD INSPECTION
        // ==================================================
        const inspection = await tx.materialInspection.findUnique({
            where: {
                id: inspectionId,
            },
            include: {
                grn: {
                    include: {
                        purchaseOrder: true,
                    },
                },
                items: {
                    include: {
                        grnItem: {
                            include: {
                                material: true,
                                unit: true,
                                storageLocation: {
                                    include: {
                                        warehouse: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!inspection) {
            throw new Error("Material inspection not found");
        }
        // ==================================================
        // 2. VALIDATE INSPECTION STATUS
        // ==================================================
        if (inspection.status === "COMPLETED") {
            throw new Error("Inspection is already completed");
        }
        if (inspection.status !== "IN_PROGRESS" &&
            inspection.status !== "PENDING") {
            throw new Error(`Inspection cannot be completed from status ${inspection.status}`);
        }
        // ==================================================
        // 3. VALIDATE INSPECTION ITEMS
        // ==================================================
        if (inspection.items.length === 0) {
            throw new Error("Cannot complete inspection without inspection items");
        }
        // ==================================================
        // 4. VALIDATE INSPECTOR
        // ==================================================
        const inspector = await tx.user.findUnique({
            where: {
                id: inspection.inspectorId,
            },
            select: {
                id: true,
                status: true,
            },
        });
        if (!inspector) {
            throw new Error("Inspection inspector not found");
        }
        // ==================================================
        // 5. INITIALIZE TOTALS
        // ==================================================
        let totalAccepted = new client_1.Prisma.Decimal(0);
        let totalConditional = new client_1.Prisma.Decimal(0);
        let totalQuarantined = new client_1.Prisma.Decimal(0);
        let totalRejected = new client_1.Prisma.Decimal(0);
        // ==================================================
        // 6. VALIDATE EVERY INSPECTION ITEM
        // ==================================================
        for (const item of inspection.items) {
            const inspected = new client_1.Prisma.Decimal(item.quantityInspected ?? 0);
            const accepted = new client_1.Prisma.Decimal(item.quantityAccepted ?? 0);
            const conditional = new client_1.Prisma.Decimal(item.quantityConditionallyAccepted ?? 0);
            const quarantined = new client_1.Prisma.Decimal(item.quantityQuarantined ?? 0);
            const rejected = new client_1.Prisma.Decimal(item.quantityRejected ?? 0);
            const materialName = item.grnItem.material.name;
            // --------------------------------------------------
            // Inspection quantity must be greater than zero
            // --------------------------------------------------
            if (inspected.lte(0)) {
                throw new Error(`Inspection quantity must be greater than zero for material ${materialName}`);
            }
            // --------------------------------------------------
            // No negative quantities
            // --------------------------------------------------
            if (accepted.lt(0) ||
                conditional.lt(0) ||
                quarantined.lt(0) ||
                rejected.lt(0)) {
                throw new Error(`Inspection quantities cannot be negative for material ${materialName}`);
            }
            // --------------------------------------------------
            // Total decision quantity
            // must equal inspected quantity
            // --------------------------------------------------
            const totalDecisionQuantity = accepted
                .add(conditional)
                .add(quarantined)
                .add(rejected);
            if (!totalDecisionQuantity.eq(inspected)) {
                throw new Error(`Inspection quantities do not balance for ${materialName}. ` +
                    `Inspected: ${inspected}, ` +
                    `Accepted: ${accepted}, ` +
                    `Conditional: ${conditional}, ` +
                    `Quarantined: ${quarantined}, ` +
                    `Rejected: ${rejected}, ` +
                    `Total: ${totalDecisionQuantity}`);
            }
            // --------------------------------------------------
            // Cannot inspect more than delivered quantity
            // --------------------------------------------------
            const delivered = new client_1.Prisma.Decimal(item.grnItem.deliveredQuantity);
            if (inspected.gt(delivered)) {
                throw new Error(`Inspected quantity for ${materialName} ` +
                    `cannot exceed delivered quantity ${delivered}`);
            }
            // --------------------------------------------------
            // Individual results cannot exceed inspected
            // --------------------------------------------------
            if (accepted.gt(inspected) ||
                conditional.gt(inspected) ||
                quarantined.gt(inspected) ||
                rejected.gt(inspected)) {
                throw new Error(`Inspection result exceeds inspected quantity for ${materialName}`);
            }
            // --------------------------------------------------
            // Add to overall totals
            // --------------------------------------------------
            totalAccepted =
                totalAccepted.add(accepted);
            totalConditional =
                totalConditional.add(conditional);
            totalQuarantined =
                totalQuarantined.add(quarantined);
            totalRejected =
                totalRejected.add(rejected);
        }
        // ==================================================
        // 7. DETERMINE INSPECTION DECISION
        // ==================================================
        let decision;
        const hasAccepted = totalAccepted.gt(0);
        const hasConditional = totalConditional.gt(0);
        const hasQuarantine = totalQuarantined.gt(0);
        const hasRejected = totalRejected.gt(0);
        const resultTypes = [
            hasAccepted,
            hasConditional,
            hasQuarantine,
            hasRejected,
        ].filter(Boolean).length;
        if (resultTypes > 1) {
            decision = "PARTIALLY_ACCEPTED";
        }
        else if (hasAccepted) {
            decision = "ACCEPTED";
        }
        else if (hasConditional) {
            decision = "CONDITIONALLY_ACCEPTED";
        }
        else if (hasQuarantine) {
            decision = "QUARANTINED";
        }
        else {
            decision = "REJECTED";
        }
        // ==================================================
        // 8. CREATE QUARANTINE RECORDS
        // ==================================================
        for (const item of inspection.items) {
            const quarantineQuantity = new client_1.Prisma.Decimal(item.quantityQuarantined ?? 0);
            if (quarantineQuantity.lte(0)) {
                continue;
            }
            const quarantineNumber = await (0, numberGenerator_1.generateQuarantineNumber)(tx);
            await tx.materialQuarantine.create({
                data: {
                    quarantineNumber,
                    projectId: inspection.grn.projectId,
                    inspectionId: inspection.id,
                    inspectionItemId: item.id,
                    grnId: inspection.grnId,
                    grnItemId: item.grnItemId,
                    materialId: item.grnItem.materialId,
                    quantity: quarantineQuantity,
                    unitId: item.grnItem.unitId,
                    reason: item.remarks ??
                        "Material quarantined during inspection",
                    correctiveAction: data?.correctiveAction,
                    status: "QUARANTINED",
                    createdBy: userId,
                },
            });
        }
        // ==================================================
        // 9. POST ACCEPTED MATERIAL INTO INVENTORY
        // ==================================================
        for (const item of inspection.items) {
            const acceptedQuantity = new client_1.Prisma.Decimal(item.quantityAccepted ?? 0);
            // Nothing accepted -> nothing enters inventory
            if (acceptedQuantity.lte(0)) {
                continue;
            }
            const grnItem = item.grnItem;
            // --------------------------------------------------
            // Storage location is required
            // --------------------------------------------------
            if (!grnItem.storageLocationId) {
                throw new Error(`Storage location is required for accepted material: ${grnItem.material.name}`);
            }
            const storageLocation = grnItem.storageLocation;
            if (!storageLocation) {
                throw new Error(`Storage location not found for GRN item ${grnItem.id}`);
            }
            if (!storageLocation.warehouse) {
                throw new Error(`Warehouse not found for storage location ${storageLocation.id}`);
            }
            // --------------------------------------------------
            // Determine unit cost
            // --------------------------------------------------
            let unitCost = new client_1.Prisma.Decimal(0);
            if (inspection.grn.purchaseOrder &&
                grnItem.materialId) {
                const poItem = await tx.purchaseOrderItem.findFirst({
                    where: {
                        purchaseOrderId: inspection.grn.purchaseOrder.id,
                        materialId: grnItem.materialId,
                    },
                    select: {
                        unitPrice: true,
                    },
                });
                if (poItem) {
                    unitCost =
                        new client_1.Prisma.Decimal(poItem.unitPrice);
                }
            }
            // --------------------------------------------------
            // Post inventory receipt
            // --------------------------------------------------
            await (0, inventory_service_1.postInventoryReceipt)(tx, {
                projectId: inspection.grn.projectId,
                materialId: grnItem.materialId,
                warehouseId: storageLocation.warehouseId,
                storageLocationId: grnItem.storageLocationId,
                quantity: acceptedQuantity,
                unitCost,
                referenceType: "GRN",
                referenceId: inspection.grnId,
                performedBy: userId,
                reason: `Accepted material from inspection ${inspection.inspectionNumber}`,
            });
        }
        // ==================================================
        // 10. UPDATE INSPECTION
        // ==================================================
        const updatedInspection = await tx.materialInspection.update({
            where: {
                id: inspectionId,
            },
            data: {
                status: "COMPLETED",
                decision,
                remarks: data?.remarks ??
                    inspection.remarks,
                correctiveAction: data?.correctiveAction ??
                    inspection.correctiveAction,
            },
            include: {
                items: {
                    include: {
                        grnItem: {
                            include: {
                                material: true,
                                unit: true,
                                storageLocation: {
                                    include: {
                                        warehouse: true,
                                    },
                                },
                            },
                        },
                    },
                },
                inspector: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
                grn: true,
            },
        });
        // ==================================================
        // 11. UPDATE GRN STATUS
        // ==================================================
        let grnStatus;
        if (decision === "ACCEPTED") {
            grnStatus = "ACCEPTED";
        }
        else if (decision === "PARTIALLY_ACCEPTED" ||
            decision === "CONDITIONALLY_ACCEPTED") {
            grnStatus = "PARTIALLY_ACCEPTED";
        }
        else if (decision === "REJECTED" ||
            decision === "QUARANTINED") {
            grnStatus = "REJECTED";
        }
        else {
            grnStatus = "POSTED";
        }
        await tx.goodsReceivedNote.update({
            where: {
                id: inspection.grnId,
            },
            data: {
                status: grnStatus,
            },
        });
        // ==================================================
        // 12. UPDATE PURCHASE ORDER RECEIVING STATUS
        // ==================================================
        if (inspection.grn.purchaseOrderId) {
            const purchaseOrder = await tx.purchaseOrder.findUnique({
                where: {
                    id: inspection.grn.purchaseOrderId,
                },
                include: {
                    items: true,
                    goodsReceived: {
                        where: {
                            status: {
                                in: [
                                    "ACCEPTED",
                                    "PARTIALLY_ACCEPTED",
                                    "POSTED",
                                ],
                            },
                        },
                        include: {
                            items: true,
                        },
                    },
                },
            });
            if (purchaseOrder) {
                let fullyReceived = true;
                for (const poItem of purchaseOrder.items) {
                    const received = purchaseOrder.goodsReceived.reduce((total, grn) => {
                        return total.add(grn.items
                            .filter(item => item.materialId ===
                            poItem.materialId)
                            .reduce((itemTotal, item) => itemTotal.add(item.acceptedQuantity ?? 0), new client_1.Prisma.Decimal(0)));
                    }, new client_1.Prisma.Decimal(0));
                    if (received.lt(poItem.orderedQuantity)) {
                        fullyReceived = false;
                        break;
                    }
                }
                await tx.purchaseOrder.update({
                    where: {
                        id: purchaseOrder.id,
                    },
                    data: {
                        status: fullyReceived
                            ? "FULLY_RECEIVED"
                            : "PARTIALLY_RECEIVED",
                    },
                });
            }
        }
        // ==================================================
        // 13. RETURN
        // ==================================================
        return updatedInspection;
    }, {
        isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable,
    });
}
