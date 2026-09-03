"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBuilding = createBuilding;
exports.getBuildings = getBuildings;
exports.getBuildingById = getBuildingById;
exports.updateBuilding = updateBuilding;
exports.deleteBuilding = deleteBuilding;
const database_1 = require("../config/database");
async function createBuilding(data) {
    const { projectId, code, name, description } = data;
    // 1. Verify project exists
    const project = await database_1.prisma.project.findUnique({
        where: { id: projectId },
    });
    if (!project) {
        throw new Error("Project not found");
    }
    // 2. Check duplicate building code within project
    const existingBuilding = await database_1.prisma.building.findFirst({
        where: {
            projectId,
            code,
        },
    });
    if (existingBuilding) {
        throw new Error(`Building code '${code}' already exists in this project`);
    }
    // 3. Create building
    return database_1.prisma.building.create({
        data: {
            projectId,
            code,
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
        },
    });
}
async function getBuildings(projectId) {
    return database_1.prisma.building.findMany({
        where: projectId
            ? {
                projectId,
            }
            : undefined,
        include: {
            project: {
                select: {
                    id: true,
                    name: true,
                },
            },
            _count: {
                select: {
                    zones: true,
                    activities: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });
}
async function getBuildingById(id) {
    const building = await database_1.prisma.building.findUnique({
        where: { id },
        include: {
            project: {
                select: {
                    id: true,
                    name: true,
                },
            },
            zones: {
                orderBy: {
                    createdAt: "asc",
                },
            },
            activities: {
                orderBy: {
                    createdAt: "asc",
                },
            },
            _count: {
                select: {
                    zones: true,
                    activities: true,
                },
            },
        },
    });
    if (!building) {
        throw new Error("Building not found");
    }
    return building;
}
async function updateBuilding(id, data) {
    const existingBuilding = await database_1.prisma.building.findUnique({
        where: { id },
    });
    if (!existingBuilding) {
        throw new Error("Building not found");
    }
    // Check duplicate code if code is being changed
    if (data.code && data.code !== existingBuilding.code) {
        const duplicate = await database_1.prisma.building.findFirst({
            where: {
                projectId: existingBuilding.projectId,
                code: data.code,
                NOT: {
                    id,
                },
            },
        });
        if (duplicate) {
            throw new Error(`Building code '${data.code}' already exists in this project`);
        }
    }
    return database_1.prisma.building.update({
        where: { id },
        data: {
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
        },
    });
}
async function deleteBuilding(id) {
    const building = await database_1.prisma.building.findUnique({
        where: { id },
        include: {
            _count: {
                select: {
                    zones: true,
                    activities: true,
                },
            },
        },
    });
    if (!building) {
        throw new Error("Building not found");
    }
    // Don't allow deletion if it contains dependent data
    if (building._count.zones > 0) {
        throw new Error("Cannot delete building because it has zones");
    }
    if (building._count.activities > 0) {
        throw new Error("Cannot delete building because it has activities");
    }
    return database_1.prisma.building.delete({
        where: { id },
    });
}
