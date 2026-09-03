"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMaterialRequest = createMaterialRequest;
exports.getMaterialRequests = getMaterialRequests;
exports.getMaterialRequestById = getMaterialRequestById;
exports.updateMaterialRequest = updateMaterialRequest;
exports.submitMaterialRequest = submitMaterialRequest;
exports.startMaterialRequestReview = startMaterialRequestReview;
exports.approveMaterialRequest = approveMaterialRequest;
exports.cancelMaterialRequest = cancelMaterialRequest;
exports.rejectMaterialRequest = rejectMaterialRequest;
const database_1 = require("../config/database");
const client_1 = require("@prisma/client");
const numberGenerator_1 = require("../utils/numberGenerator");
const Prisma = new client_1.PrismaClient();
async function createMaterialRequest(userId, data) {
    return database_1.prisma.$transaction(async (tx) => {
        // --------------------------------------------------
        // Validate project
        // --------------------------------------------------
        const project = await tx.project.findUnique({
            where: {
                id: data.projectId
            }
        });
        if (!project) {
            throw new Error("Project not found");
        }
        // --------------------------------------------------
        // Validate building if supplied
        // --------------------------------------------------
        if (data.buildingId) {
            const building = await tx.building.findUnique({
                where: {
                    id: data.buildingId
                }
            });
            if (!building) {
                throw new Error("Building not found");
            }
        }
        // --------------------------------------------------
        // Validate zone if supplied
        // --------------------------------------------------
        if (data.zoneId) {
            const zone = await tx.zone.findUnique({
                where: {
                    id: data.zoneId
                }
            });
            if (!zone) {
                throw new Error("Zone not found");
            }
        }
        // --------------------------------------------------
        // Validate activity if supplied
        // --------------------------------------------------
        if (data.activityId) {
            const activity = await tx.activity.findUnique({
                where: {
                    id: data.activityId
                }
            });
            if (!activity) {
                throw new Error("Activity not found");
            }
        }
        // --------------------------------------------------
        // Validate materials
        // --------------------------------------------------
        const materialIds = data.items.map(item => item.materialId);
        const materials = await tx.material.findMany({
            where: {
                id: {
                    in: materialIds
                },
                isActive: true
            }
        });
        if (materials.length !==
            new Set(materialIds).size) {
            throw new Error("One or more materials were not found or are inactive");
        }
        // --------------------------------------------------
        // Generate request number
        // --------------------------------------------------
        const requestNumber = await (0, numberGenerator_1.generateRequestNumber)(tx);
        // --------------------------------------------------
        // Create request
        // --------------------------------------------------
        const materialRequest = await tx.materialRequest.create({
            data: {
                requestNumber,
                projectId: data.projectId,
                requestedBy: userId,
                buildingId: data.buildingId,
                zoneId: data.zoneId,
                activityId: data.activityId,
                requestDate: new Date(),
                requiredDate: data.requiredDate,
                priority: data.priority ?? "NORMAL",
                purpose: data.purpose,
                remarks: data.remarks,
                status: "DRAFT",
                items: {
                    create: data.items.map(item => ({
                        materialId: item.materialId,
                        requestedQuantity: item.requestedQuantity,
                        estimatedUnitPrice: item.estimatedUnitPrice,
                        remarks: item.remarks
                    }))
                }
            },
            include: {
                project: true,
                requester: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true
                    }
                },
                items: {
                    include: {
                        material: {
                            include: {
                                category: true,
                                unit: true
                            }
                        }
                    }
                },
                building: true,
                zone: true,
                activity: true
            }
        });
        return materialRequest;
    });
}
async function getMaterialRequests(page = 1, limit = 20, search, status, projectId) {
    const skip = (page - 1) * limit;
    const where = {};
    if (search) {
        where.OR = [
            {
                requestNumber: {
                    contains: search
                }
            },
            {
                purpose: {
                    contains: search
                }
            }
        ];
    }
    if (status) {
        where.status = status;
    }
    if (projectId) {
        where.projectId = projectId;
    }
    const [requests, total] = await database_1.prisma.$transaction([
        database_1.prisma.materialRequest.findMany({
            where,
            include: {
                project: {
                    select: {
                        id: true,
                        projectCode: true,
                        name: true
                    }
                },
                requester: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true
                    }
                },
                items: {
                    include: {
                        material: {
                            include: {
                                category: true,
                                unit: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            },
            skip,
            take: limit
        }),
        database_1.prisma.materialRequest.count({
            where
        })
    ]);
    return {
        requests,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}
async function getMaterialRequestById(id) {
    const request = await database_1.prisma.materialRequest.findUnique({
        where: {
            id
        },
        include: {
            project: true,
            requester: {
                select: {
                    id: true,
                    fullName: true,
                    email: true
                }
            },
            building: true,
            zone: true,
            activity: true,
            items: {
                include: {
                    material: {
                        include: {
                            category: true,
                            unit: true
                        }
                    }
                }
            },
            approvals: true
        }
    });
    if (!request) {
        throw new Error("Material request not found");
    }
    return request;
}
async function updateMaterialRequest(id, data) {
    const existing = await database_1.prisma.materialRequest.findUnique({
        where: {
            id
        }
    });
    if (!existing) {
        throw new Error("Material request not found");
    }
    // Only DRAFT or RETURNED requests
    // should normally be editable.
    if (existing.status !== "DRAFT" &&
        existing.status !== "RETURNED") {
        throw new Error("Only DRAFT or RETURNED requests can be updated");
    }
    return database_1.prisma.materialRequest.update({
        where: {
            id
        },
        data: {
            buildingId: data.buildingId,
            zoneId: data.zoneId,
            activityId: data.activityId,
            requiredDate: data.requiredDate,
            priority: data.priority,
            purpose: data.purpose,
            remarks: data.remarks
        },
        include: {
            items: {
                include: {
                    material: true
                }
            }
        }
    });
}
async function submitMaterialRequest(id) {
    const request = await database_1.prisma.materialRequest.findUnique({
        where: {
            id
        }
    });
    if (!request) {
        throw new Error("Material request not found");
    }
    if (request.status !== "DRAFT") {
        throw new Error("Only DRAFT requests can be submitted");
    }
    return database_1.prisma.materialRequest.update({
        where: {
            id
        },
        data: {
            status: "SUBMITTED"
        },
        include: {
            items: {
                include: {
                    material: true
                }
            }
        }
    });
}
async function startMaterialRequestReview(id) {
    const request = await database_1.prisma.materialRequest.findUnique({
        where: {
            id
        }
    });
    if (!request) {
        throw new Error("Material request not found");
    }
    if (request.status !== "SUBMITTED") {
        throw new Error("Only SUBMITTED requests can be placed under review");
    }
    return database_1.prisma.materialRequest.update({
        where: {
            id
        },
        data: {
            status: "UNDER_REVIEW"
        }
    });
}
async function approveMaterialRequest(id, approverId, comments) {
    return database_1.prisma.$transaction(async (tx) => {
        // ==================================================
        // 1. Find material request
        // ==================================================
        const request = await tx.materialRequest.findUnique({
            where: {
                id,
            },
            include: {
                items: {
                    include: {
                        material: true,
                    },
                },
            },
        });
        if (!request) {
            throw new Error("Material request not found");
        }
        // ==================================================
        // 2. Only UNDER_REVIEW can be approved
        // ==================================================
        if (request.status !== "UNDER_REVIEW") {
            throw new Error("Only UNDER_REVIEW requests can be approved");
        }
        // ==================================================
        // 3. Request must contain items
        // ==================================================
        if (request.items.length === 0) {
            throw new Error("Cannot approve a request without items");
        }
        // ==================================================
        // 4. Validate requested quantities
        // ==================================================
        for (const item of request.items) {
            if (item.requestedQuantity
                .lessThanOrEqualTo(0)) {
                throw new Error(`Invalid requested quantity for ${item.material.name}`);
            }
            if (!item.material.isActive) {
                throw new Error(`Material is inactive: ${item.material.name}`);
            }
        }
        // ==================================================
        // 5. Approve requested quantities
        // ==================================================
        for (const item of request.items) {
            await tx.materialRequestItem.update({
                where: {
                    id: item.id,
                },
                data: {
                    approvedQuantity: item.requestedQuantity,
                },
            });
        }
        // ==================================================
        // 6. Record approval history
        // ==================================================
        await tx.materialRequestApproval.create({
            data: {
                requestId: request.id,
                approverId,
                action: "APPROVED",
                approvedQuantity: request.items.length,
                comments: comments ??
                    "Material request approved",
            },
        });
        // ==================================================
        // 7. Change request status
        // ==================================================
        const approvedRequest = await tx.materialRequest.update({
            where: {
                id: request.id,
            },
            data: {
                status: "APPROVED",
            },
            include: {
                project: true,
                requester: true,
                items: {
                    include: {
                        material: {
                            include: {
                                category: true,
                                unit: true,
                            },
                        },
                    },
                },
                approvals: {
                    include: {
                        approver: true,
                    },
                    orderBy: {
                        actionDate: "desc",
                    },
                },
            },
        });
        return approvedRequest;
    });
}
async function cancelMaterialRequest(id) {
    const request = await database_1.prisma.materialRequest.findUnique({
        where: {
            id
        }
    });
    if (!request) {
        throw new Error("Material request not found");
    }
    if (request.status === "COMPLETED" ||
        request.status === "FULLY_SUPPLIED") {
        throw new Error("Completed or fully supplied requests cannot be cancelled");
    }
    return database_1.prisma.materialRequest.update({
        where: {
            id
        },
        data: {
            status: "CANCELLED"
        }
    });
}
async function rejectMaterialRequest(id, reason) {
    const request = await database_1.prisma.materialRequest.findUnique({
        where: {
            id
        }
    });
    if (!request) {
        throw new Error("Material request not found");
    }
    if (request.status !== "UNDER_REVIEW") {
        throw new Error("Only UNDER_REVIEW requests can be rejected");
    }
    return database_1.prisma.materialRequest.update({
        where: {
            id
        },
        data: {
            status: "REJECTED",
            remarks: reason
        },
        include: {
            items: {
                include: {
                    material: true
                }
            }
        }
    });
}
