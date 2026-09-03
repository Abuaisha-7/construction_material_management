"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createZone = createZone;
exports.getZones = getZones;
exports.getZoneById = getZoneById;
exports.updateZone = updateZone;
exports.deleteZone = deleteZone;
const database_1 = require("../config/database");
async function createZone(data) {
    const { projectId, buildingId, code, name, description, } = data;
    // 1. Verify project exists
    const project = await database_1.prisma.project.findUnique({
        where: { id: projectId },
    });
    if (!project) {
        throw new Error("Project not found");
    }
    // 2. Verify building if supplied
    if (buildingId) {
        const building = await database_1.prisma.building.findUnique({
            where: { id: buildingId },
        });
        if (!building) {
            throw new Error("Building not found");
        }
        // Important: building must belong to same project
        if (building.projectId !== projectId) {
            throw new Error("Building does not belong to the selected project");
        }
    }
    // 3. Prevent duplicate zone code within project
    if (code) {
        const existingZone = await database_1.prisma.zone.findFirst({
            where: {
                projectId,
                code,
            },
        });
        if (existingZone) {
            throw new Error(`Zone code '${code}' already exists in this project`);
        }
    }
    // 4. Create zone
    return database_1.prisma.zone.create({
        data: {
            projectId,
            buildingId: buildingId ?? null,
            code: code ?? null,
            name,
            description: description ?? null,
        },
        include: {
            project: {
                select: {
                    id: true,
                    name: true,
                },
            },
            building: {
                select: {
                    id: true,
                    code: true,
                    name: true,
                },
            },
        },
    });
}
async function getZones(projectId, buildingId) {
    return database_1.prisma.zone.findMany({
        where: {
            ...(projectId && { projectId }),
            ...(buildingId && { buildingId }),
        },
        include: {
            project: {
                select: {
                    id: true,
                    name: true,
                },
            },
            building: {
                select: {
                    id: true,
                    code: true,
                    name: true,
                },
            },
            _count: {
                select: {
                    activities: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });
}
async function getZoneById(id) {
    const zone = await database_1.prisma.zone.findUnique({
        where: { id },
        include: {
            project: {
                select: {
                    id: true,
                    name: true,
                },
            },
            building: {
                select: {
                    id: true,
                    code: true,
                    name: true,
                },
            },
            activities: {
                orderBy: {
                    createdAt: "asc",
                },
            },
            _count: {
                select: {
                    activities: true,
                },
            },
        },
    });
    if (!zone) {
        throw new Error("Zone not found");
    }
    return zone;
}
async function updateZone(id, data) {
    const existingZone = await database_1.prisma.zone.findUnique({
        where: { id },
    });
    if (!existingZone) {
        throw new Error("Zone not found");
    }
    // If changing building, validate project relationship
    if (data.buildingId !== undefined) {
        if (data.buildingId) {
            const building = await database_1.prisma.building.findUnique({
                where: {
                    id: data.buildingId,
                },
            });
            if (!building) {
                throw new Error("Building not found");
            }
            if (building.projectId !== existingZone.projectId) {
                throw new Error("Building does not belong to this zone's project");
            }
        }
    }
    // Check duplicate code
    if (data.code &&
        data.code !== existingZone.code) {
        const duplicate = await database_1.prisma.zone.findFirst({
            where: {
                projectId: existingZone.projectId,
                code: data.code,
                NOT: {
                    id,
                },
            },
        });
        if (duplicate) {
            throw new Error(`Zone code '${data.code}' already exists in this project`);
        }
    }
    return database_1.prisma.zone.update({
        where: { id },
        data: {
            ...(data.buildingId !== undefined && {
                buildingId: data.buildingId,
            }),
            ...(data.code !== undefined && {
                code: data.code,
            }),
            ...(data.name !== undefined && {
                name: data.name,
            }),
            ...(data.description !== undefined && {
                description: data.description,
            }),
        },
        include: {
            project: {
                select: {
                    id: true,
                    name: true,
                },
            },
            building: {
                select: {
                    id: true,
                    code: true,
                    name: true,
                },
            },
        },
    });
}
async function deleteZone(id) {
    const zone = await database_1.prisma.zone.findUnique({
        where: { id },
        include: {
            _count: {
                select: {
                    activities: true,
                },
            },
        },
    });
    if (!zone) {
        throw new Error("Zone not found");
    }
    if (zone._count.activities > 0) {
        throw new Error("Cannot delete zone because it has activities");
    }
    return database_1.prisma.zone.delete({
        where: { id },
    });
}
