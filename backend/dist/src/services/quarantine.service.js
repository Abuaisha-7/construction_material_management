"use strict";
// src/services/quarantine.service.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.createQuarantine = createQuarantine;
exports.getQuarantines = getQuarantines;
exports.getQuarantineById = getQuarantineById;
exports.updateQuarantine = updateQuarantine;
exports.createDisposition = createDisposition;
const client_1 = require("@prisma/client");
const database_1 = require("../config/database");
const numberGenerator_1 = require("../utils/numberGenerator");
async function createQuarantine(data, userId) {
    return database_1.prisma.$transaction(async (tx) => {
        // --------------------------------------------------
        // 1. Find inspection item
        // --------------------------------------------------
        const inspectionItem = await tx.inspectionItem.findUnique({
            where: {
                id: data.inspectionItemId,
            },
            include: {
                inspection: {
                    include: {
                        grn: true,
                    },
                },
                grnItem: {
                    include: {
                        material: true,
                        unit: true,
                    },
                },
            },
        });
        if (!inspectionItem) {
            throw new Error("Inspection item not found");
        }
        // --------------------------------------------------
        // 2. Inspection must be completed
        // --------------------------------------------------
        if (inspectionItem.inspection.status !==
            "COMPLETED") {
            throw new Error("Material can only be quarantined after inspection is completed");
        }
        // --------------------------------------------------
        // 3. Validate quantity
        // --------------------------------------------------
        const requestedQuantity = new client_1.Prisma.Decimal(data.quantity);
        const inspectionQuarantined = new client_1.Prisma.Decimal(inspectionItem.quantityQuarantined ?? 0);
        if (requestedQuantity.gt(inspectionQuarantined)) {
            throw new Error(`Cannot quarantine ${requestedQuantity.toString()} ${inspectionItem.grnItem.unit.id}. ` +
                `Maximum available quarantine quantity is ${inspectionQuarantined.toString()}`);
        }
        // --------------------------------------------------
        // 4. Check already-created quarantine quantity
        // --------------------------------------------------
        const existingQuarantine = await tx.materialQuarantine.aggregate({
            where: {
                inspectionItemId: data.inspectionItemId,
                status: {
                    in: ["QUARANTINED"],
                },
            },
            _sum: {
                quantity: true,
            },
        });
        const alreadyQuarantined = new client_1.Prisma.Decimal(existingQuarantine._sum.quantity ?? 0);
        const remainingQuantity = inspectionQuarantined.sub(alreadyQuarantined);
        if (requestedQuantity.gt(remainingQuantity)) {
            throw new Error(`Only ${remainingQuantity.toString()} units remain available for quarantine`);
        }
        // --------------------------------------------------
        // 5. Generate quarantine number
        // --------------------------------------------------
        const quarantineNumber = await (0, numberGenerator_1.generateQuarantineNumber)(tx);
        // --------------------------------------------------
        // 6. Create quarantine
        // --------------------------------------------------
        const quarantine = await tx.materialQuarantine.create({
            data: {
                quarantineNumber,
                projectId: inspectionItem.inspection.grn.projectId,
                inspectionId: inspectionItem.inspectionId,
                inspectionItemId: inspectionItem.id,
                grnId: inspectionItem.inspection.grnId,
                grnItemId: inspectionItem.grnItemId,
                materialId: inspectionItem.materialId ??
                    inspectionItem.grnItem.materialId,
                quantity: requestedQuantity,
                unitId: inspectionItem.grnItem.unitId,
                reason: data.reason,
                correctiveAction: data.correctiveAction,
                status: "QUARANTINED",
                createdBy: userId,
            },
            include: {
                project: true,
                inspection: true,
                inspectionItem: true,
                grn: true,
                grnItem: {
                    include: {
                        material: true,
                        unit: true,
                    },
                },
                material: true,
                unit: true,
                creator: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
            },
        });
        return quarantine;
    });
}
async function getQuarantines(params) {
    const page = Math.max(params?.page ?? 1, 1);
    const limit = Math.min(Math.max(params?.limit ?? 20, 1), 100);
    const skip = (page - 1) * limit;
    const where = {
        projectId: params?.projectId || undefined,
        status: params?.status || undefined,
        materialId: params?.materialId || undefined,
    };
    const [quarantines, total] = await Promise.all([
        database_1.prisma.materialQuarantine.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                createdAt: "desc",
            },
            include: {
                project: true,
                material: true,
                unit: true,
                inspection: true,
                grn: true,
                grnItem: {
                    include: {
                        material: true,
                        unit: true,
                    },
                },
                creator: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
                dispositions: {
                    orderBy: {
                        actionDate: "desc",
                    },
                    include: {
                        performer: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        }),
        database_1.prisma.materialQuarantine.count({
            where,
        }),
    ]);
    return {
        quarantines,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}
async function getQuarantineById(id) {
    const quarantine = await database_1.prisma.materialQuarantine.findUnique({
        where: {
            id,
        },
        include: {
            project: true,
            material: true,
            unit: true,
            inspection: true,
            inspectionItem: true,
            grn: true,
            grnItem: {
                include: {
                    material: true,
                    unit: true,
                    storageLocation: true,
                },
            },
            creator: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                },
            },
            dispositions: {
                orderBy: {
                    actionDate: "desc",
                },
                include: {
                    performer: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                        },
                    },
                },
            },
        },
    });
    if (!quarantine) {
        throw new Error("Quarantine record not found");
    }
    return quarantine;
}
async function updateQuarantine(id, data) {
    const quarantine = await database_1.prisma.materialQuarantine.findUnique({
        where: {
            id,
        },
    });
    if (!quarantine) {
        throw new Error("Quarantine record not found");
    }
    if (quarantine.status !== "QUARANTINED") {
        throw new Error("Only QUARANTINED records can be updated");
    }
    return database_1.prisma.materialQuarantine.update({
        where: {
            id,
        },
        data: {
            reason: data.reason,
            correctiveAction: data.correctiveAction,
        },
        include: {
            material: true,
            unit: true,
            inspection: true,
            grn: true,
        },
    });
}
async function createDisposition(quarantineId, data, userId) {
    return database_1.prisma.$transaction(async (tx) => {
        // --------------------------------------------------
        // 1. Get quarantine
        // --------------------------------------------------
        const quarantine = await tx.materialQuarantine.findUnique({
            where: {
                id: quarantineId,
            },
            include: {
                grnItem: {
                    include: {
                        material: true,
                        unit: true,
                    },
                },
                dispositions: true,
            },
        });
        if (!quarantine) {
            throw new Error("Quarantine record not found");
        }
        // --------------------------------------------------
        // 2. Must still be quarantined
        // --------------------------------------------------
        if (quarantine.status !==
            "QUARANTINED") {
            throw new Error(`Cannot dispose material from a ${quarantine.status} quarantine`);
        }
        // --------------------------------------------------
        // 3. Validate quantity
        // --------------------------------------------------
        const quantity = new client_1.Prisma.Decimal(data.quantity);
        if (quantity.lte(0)) {
            throw new Error("Disposition quantity must be greater than zero");
        }
        // --------------------------------------------------
        // 4. Calculate previously disposed quantity
        // --------------------------------------------------
        const disposed = quarantine.dispositions.reduce((sum, disposition) => sum.add(disposition.quantity), new client_1.Prisma.Decimal(0));
        const remaining = quarantine.quantity.sub(disposed);
        if (quantity.gt(remaining)) {
            throw new Error(`Cannot dispose ${quantity}. Only ${remaining} remains`);
        }
        // --------------------------------------------------
        // 5. Reason required for RETURN/SCRAP
        // --------------------------------------------------
        if ((data.action === "RETURN" ||
            data.action === "SCRAP") &&
            !data.reason?.trim()) {
            throw new Error(`Reason is required when material is ${data.action}`);
        }
        // --------------------------------------------------
        // 6. Generate disposition number
        // --------------------------------------------------
        const dispositionNumber = await (0, numberGenerator_1.generateDispositionNumber)(tx);
        // --------------------------------------------------
        // 7. Create disposition
        // --------------------------------------------------
        const disposition = await tx.materialDisposition.create({
            data: {
                dispositionNumber,
                quarantineId,
                action: data.action,
                quantity,
                reason: data.reason,
                remarks: data.remarks,
                performedBy: userId,
            },
            include: {
                performer: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
                quarantine: {
                    include: {
                        material: true,
                        unit: true,
                    },
                },
            },
        });
        // --------------------------------------------------
        // 8. Determine remaining quantity
        // --------------------------------------------------
        const newRemaining = remaining.sub(quantity);
        // --------------------------------------------------
        // 9. Update quarantine status
        // --------------------------------------------------
        if (newRemaining.eq(0)) {
            let status;
            if (data.action === "RELEASE") {
                status = "RELEASED";
            }
            else if (data.action === "RETURN") {
                status = "RETURNED";
            }
            else {
                status = "SCRAPPED";
            }
            await tx.materialQuarantine.update({
                where: {
                    id: quarantineId,
                },
                data: {
                    status,
                    ...(data.action ===
                        "RELEASE"
                        ? {
                            releasedAt: new Date(),
                        }
                        : {}),
                    ...(data.action ===
                        "RETURN"
                        ? {
                            returnedAt: new Date(),
                        }
                        : {}),
                    ...(data.action ===
                        "SCRAP"
                        ? {
                            scrappedAt: new Date(),
                        }
                        : {}),
                },
            });
        }
        return disposition;
    });
}
