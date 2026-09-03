"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMaterialConsumption = createMaterialConsumption;
exports.getMaterialConsumptionById = getMaterialConsumptionById;
exports.getMaterialConsumptions = getMaterialConsumptions;
exports.updateMaterialConsumption = updateMaterialConsumption;
exports.deleteMaterialConsumption = deleteMaterialConsumption;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Validate a positive/non-negative quantity.
 */
function validateQuantity(value, fieldName, allowZero = true) {
    if (value === undefined)
        return;
    if (!Number.isFinite(value)) {
        throw new Error(`${fieldName} must be a valid number`);
    }
    if (allowZero) {
        if (value < 0) {
            throw new Error(`${fieldName} cannot be negative`);
        }
    }
    else {
        if (value <= 0) {
            throw new Error(`${fieldName} must be greater than zero`);
        }
    }
}
/**
 * Validate that building belongs to project.
 */
async function validateBuilding(tx, projectId, buildingId) {
    if (!buildingId)
        return;
    const building = await tx.building.findFirst({
        where: {
            id: buildingId,
            projectId,
        },
    });
    if (!building) {
        throw new Error("Building not found or does not belong to the selected project");
    }
}
/**
 * Validate that zone belongs to project and,
 * when a building is supplied, belongs to that building.
 */
async function validateZone(tx, projectId, zoneId, buildingId) {
    if (!zoneId)
        return;
    const zone = await tx.zone.findFirst({
        where: {
            id: zoneId,
            projectId,
        },
    });
    if (!zone) {
        throw new Error("Zone not found or does not belong to the selected project");
    }
    if (buildingId &&
        zone.buildingId &&
        zone.buildingId !== buildingId) {
        throw new Error("Selected zone does not belong to the selected building");
    }
}
/**
 * Validate activity and its project/building/zone relationships.
 */
async function validateActivity(tx, projectId, activityId, buildingId, zoneId) {
    if (!activityId)
        return;
    const activity = await tx.activity.findFirst({
        where: {
            id: activityId,
            projectId,
        },
    });
    if (!activity) {
        throw new Error("Activity not found or does not belong to the selected project");
    }
    if (buildingId &&
        activity.buildingId &&
        activity.buildingId !== buildingId) {
        throw new Error("Selected activity does not belong to the selected building");
    }
    if (zoneId &&
        activity.zoneId &&
        activity.zoneId !== zoneId) {
        throw new Error("Selected activity does not belong to the selected zone");
    }
}
/**
 * Validate material.
 */
async function validateMaterial(tx, materialId) {
    const material = await tx.material.findUnique({
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
 * Validate issue and calculate issued quantity.
 */
async function validateIssue(tx, projectId, materialId, issueId) {
    if (!issueId) {
        return null;
    }
    const issue = await tx.materialIssue.findFirst({
        where: {
            id: issueId,
            projectId,
        },
        include: {
            items: {
                where: {
                    materialId,
                },
            },
        },
    });
    if (!issue) {
        throw new Error("Material issue not found or does not belong to the selected project");
    }
    if (issue.status !== "PARTIALLY_ISSUED" &&
        issue.status !== "ISSUED") {
        throw new Error(`Material issue cannot be consumed from status ${issue.status}`);
    }
    const issueItem = issue.items[0];
    if (!issueItem) {
        throw new Error("The selected material does not exist in this material issue");
    }
    return {
        issue,
        issueItem,
    };
}
/**
 * Get total previously consumed quantity for an issue/material.
 */
async function getConsumedQuantity(tx, issueId, materialId, excludeId) {
    const records = await tx.materialConsumption.findMany({
        where: {
            issueId,
            materialId,
            ...(excludeId
                ? {
                    NOT: {
                        id: excludeId,
                    },
                }
                : {}),
        },
        select: {
            consumedQuantity: true,
        },
    });
    return records.reduce((total, record) => total.add(new client_1.Prisma.Decimal(record.consumedQuantity ?? 0)), new client_1.Prisma.Decimal(0));
}
/**
 * CREATE
 */
async function createMaterialConsumption(data) {
    validateQuantity(data.plannedQuantity, "plannedQuantity");
    validateQuantity(data.issuedQuantity, "issuedQuantity");
    validateQuantity(data.returnedQuantity, "returnedQuantity");
    validateQuantity(data.consumedQuantity, "consumedQuantity");
    if (data.consumedQuantity === undefined &&
        data.issuedQuantity === undefined) {
        throw new Error("At least consumedQuantity or issuedQuantity must be provided");
    }
    return prisma.$transaction(async (tx) => {
        // ---------------------------------------------
        // 1. Validate project
        // ---------------------------------------------
        const project = await tx.project.findUnique({
            where: {
                id: data.projectId,
            },
        });
        if (!project) {
            throw new Error("Project not found");
        }
        // ---------------------------------------------
        // 2. Validate material
        // ---------------------------------------------
        await validateMaterial(tx, data.materialId);
        // ---------------------------------------------
        // 3. Validate building
        // ---------------------------------------------
        await validateBuilding(tx, data.projectId, data.buildingId);
        // ---------------------------------------------
        // 4. Validate zone
        // ---------------------------------------------
        await validateZone(tx, data.projectId, data.zoneId, data.buildingId);
        // ---------------------------------------------
        // 5. Validate activity
        // ---------------------------------------------
        await validateActivity(tx, data.projectId, data.activityId, data.buildingId, data.zoneId);
        // ---------------------------------------------
        // 6. Validate issue
        // ---------------------------------------------
        const issueData = await validateIssue(tx, data.projectId, data.materialId, data.issueId);
        // ---------------------------------------------
        // 7. Validate consumption against issue
        // ---------------------------------------------
        if (issueData &&
            data.consumedQuantity !== undefined) {
            const previousConsumed = await getConsumedQuantity(tx, data.issueId, data.materialId);
            const newConsumed = new client_1.Prisma.Decimal(data.consumedQuantity);
            const issuedQuantity = new client_1.Prisma.Decimal(issueData.issueItem.issuedQuantity);
            const totalConsumed = previousConsumed.add(newConsumed);
            if (totalConsumed.gt(issuedQuantity)) {
                throw new Error(`Consumed quantity exceeds issued quantity. ` +
                    `Issued: ${issuedQuantity.toString()}, ` +
                    `Already consumed: ${previousConsumed.toString()}, ` +
                    `Requested: ${newConsumed.toString()}, ` +
                    `Remaining: ${issuedQuantity
                        .sub(previousConsumed)
                        .toString()}`);
            }
        }
        // ---------------------------------------------
        // 8. If issue is supplied, validate issuedQuantity
        // ---------------------------------------------
        if (issueData &&
            data.issuedQuantity !== undefined) {
            const issueIssuedQuantity = new client_1.Prisma.Decimal(issueData.issueItem.issuedQuantity);
            const requestedIssuedQuantity = new client_1.Prisma.Decimal(data.issuedQuantity);
            if (requestedIssuedQuantity.gt(issueIssuedQuantity)) {
                throw new Error(`Issued quantity cannot exceed the actual material issue quantity of ${issueIssuedQuantity.toString()}`);
            }
        }
        // ---------------------------------------------
        // 9. Validate date
        // ---------------------------------------------
        const consumptionDate = new Date(data.consumptionDate);
        if (Number.isNaN(consumptionDate.getTime())) {
            throw new Error("Invalid consumptionDate");
        }
        // ---------------------------------------------
        // 10. Create consumption
        // ---------------------------------------------
        const consumption = await tx.materialConsumption.create({
            data: {
                projectId: data.projectId,
                materialId: data.materialId,
                activityId: data.activityId,
                buildingId: data.buildingId,
                zoneId: data.zoneId,
                issueId: data.issueId,
                consumptionDate,
                plannedQuantity: data.plannedQuantity,
                issuedQuantity: data.issuedQuantity,
                returnedQuantity: data.returnedQuantity,
                consumedQuantity: data.consumedQuantity,
                remarks: data.remarks,
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
                zone: true,
                issue: true,
            },
        });
        return consumption;
    });
}
/**
 * GET BY ID
 */
async function getMaterialConsumptionById(id) {
    const consumption = await prisma.materialConsumption.findUnique({
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
            zone: true,
            issue: {
                include: {
                    items: {
                        include: {
                            material: true,
                        },
                    },
                },
            },
        },
    });
    if (!consumption) {
        throw new Error("Material consumption record not found");
    }
    return consumption;
}
/**
 * LIST
 */
async function getMaterialConsumptions(filters) {
    const where = {};
    if (filters?.projectId) {
        where.projectId = filters.projectId;
    }
    if (filters?.materialId) {
        where.materialId = filters.materialId;
    }
    if (filters?.issueId) {
        where.issueId = filters.issueId;
    }
    if (filters?.activityId) {
        where.activityId = filters.activityId;
    }
    if (filters?.buildingId) {
        where.buildingId = filters.buildingId;
    }
    if (filters?.zoneId) {
        where.zoneId = filters.zoneId;
    }
    if (filters?.startDate ||
        filters?.endDate) {
        where.consumptionDate = {};
        if (filters.startDate) {
            where.consumptionDate.gte =
                new Date(filters.startDate);
        }
        if (filters.endDate) {
            where.consumptionDate.lte =
                new Date(filters.endDate);
        }
    }
    return prisma.materialConsumption.findMany({
        where,
        orderBy: {
            consumptionDate: "desc",
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
            zone: true,
            issue: true,
        },
    });
}
/**
 * UPDATE
 */
async function updateMaterialConsumption(id, data) {
    validateQuantity(data.plannedQuantity, "plannedQuantity");
    validateQuantity(data.issuedQuantity, "issuedQuantity");
    validateQuantity(data.returnedQuantity, "returnedQuantity");
    validateQuantity(data.consumedQuantity, "consumedQuantity");
    return prisma.$transaction(async (tx) => {
        const existing = await tx.materialConsumption.findUnique({
            where: {
                id,
            },
        });
        if (!existing) {
            throw new Error("Material consumption record not found");
        }
        await validateBuilding(tx, existing.projectId, data.buildingId);
        await validateZone(tx, existing.projectId, data.zoneId, data.buildingId);
        await validateActivity(tx, existing.projectId, data.activityId, data.buildingId, data.zoneId);
        const newConsumedQuantity = data.consumedQuantity !== undefined
            ? new client_1.Prisma.Decimal(data.consumedQuantity)
            : new client_1.Prisma.Decimal(existing.consumedQuantity ?? 0);
        // ---------------------------------------------
        // Validate against issue
        // ---------------------------------------------
        if (existing.issueId) {
            const issue = await tx.materialIssue.findUnique({
                where: {
                    id: existing.issueId,
                },
                include: {
                    items: {
                        where: {
                            materialId: existing.materialId,
                        },
                    },
                },
            });
            if (!issue) {
                throw new Error("Related material issue not found");
            }
            const issueItem = issue.items[0];
            if (!issueItem) {
                throw new Error("Material issue item not found");
            }
            const previousConsumed = await getConsumedQuantity(tx, existing.issueId, existing.materialId, id);
            const totalConsumed = previousConsumed.add(newConsumedQuantity);
            const issuedQuantity = new client_1.Prisma.Decimal(issueItem.issuedQuantity);
            if (totalConsumed.gt(issuedQuantity)) {
                throw new Error(`Updated consumed quantity exceeds issued quantity. ` +
                    `Issued: ${issuedQuantity.toString()}, ` +
                    `Already consumed by other records: ${previousConsumed.toString()}, ` +
                    `New total: ${totalConsumed.toString()}`);
            }
            if (data.issuedQuantity !== undefined &&
                new client_1.Prisma.Decimal(data.issuedQuantity).gt(issuedQuantity)) {
                throw new Error(`Issued quantity cannot exceed ${issuedQuantity.toString()}`);
            }
        }
        const updateData = {};
        if (data.activityId !== undefined) {
            updateData.activity = {
                connect: {
                    id: data.activityId,
                },
            };
        }
        if (data.buildingId !== undefined) {
            updateData.building = data.buildingId
                ? {
                    connect: {
                        id: data.buildingId,
                    },
                }
                : {
                    disconnect: true,
                };
        }
        if (data.zoneId !== undefined) {
            updateData.zone = data.zoneId
                ? {
                    connect: {
                        id: data.zoneId,
                    },
                }
                : {
                    disconnect: true,
                };
        }
        if (data.consumptionDate !== undefined) {
            const date = new Date(data.consumptionDate);
            if (Number.isNaN(date.getTime())) {
                throw new Error("Invalid consumptionDate");
            }
            updateData.consumptionDate = date;
        }
        if (data.plannedQuantity !== undefined) {
            updateData.plannedQuantity =
                data.plannedQuantity;
        }
        if (data.issuedQuantity !== undefined) {
            updateData.issuedQuantity =
                data.issuedQuantity;
        }
        if (data.returnedQuantity !== undefined) {
            updateData.returnedQuantity =
                data.returnedQuantity;
        }
        if (data.consumedQuantity !== undefined) {
            updateData.consumedQuantity =
                data.consumedQuantity;
        }
        if (data.remarks !== undefined) {
            updateData.remarks = data.remarks;
        }
        return tx.materialConsumption.update({
            where: {
                id,
            },
            data: updateData,
            include: {
                project: true,
                material: {
                    include: {
                        unit: true,
                    },
                },
                activity: true,
                building: true,
                zone: true,
                issue: true,
            },
        });
    });
}
/**
 * DELETE
 */
async function deleteMaterialConsumption(id) {
    const existing = await prisma.materialConsumption.findUnique({
        where: {
            id,
        },
    });
    if (!existing) {
        throw new Error("Material consumption record not found");
    }
    return prisma.materialConsumption.delete({
        where: {
            id,
        },
    });
}
