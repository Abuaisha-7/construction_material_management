"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProject = createProject;
exports.getProjects = getProjects;
exports.getProjectById = getProjectById;
exports.updateProject = updateProject;
exports.deactivateProject = deactivateProject;
const database_1 = require("../config/database");
async function createProject(data) {
    const existingProject = await database_1.prisma.project.findUnique({
        where: {
            projectCode: data.projectCode,
        }
    });
    if (existingProject) {
        throw new Error("PROJECT_CODE_ALREADY_EXISTS");
    }
    return database_1.prisma.project.create({
        data: {
            ...data
        }
    });
}
async function getProjects(params) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;
    const where = {
        ...(params.search
            ? {
                OR: [
                    {
                        projectCode: {
                            contains: params.search
                        }
                    },
                    {
                        name: {
                            contains: params.search
                        }
                    },
                    {
                        clientName: {
                            contains: params.search
                        }
                    }
                ]
            }
            : {}),
        ...(params.status
            ? {
                status: params.status
            }
            : {})
    };
    const [projects, total] = await database_1.prisma.$transaction([
        database_1.prisma.project.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                createdAt: "desc"
            }
        }),
        database_1.prisma.project.count({
            where
        })
    ]);
    return {
        projects,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}
async function getProjectById(projectId) {
    const project = await database_1.prisma.project.findUnique({
        where: {
            id: projectId
        },
        include: {
            buildings: true,
            activities: true
        }
    });
    if (!project) {
        throw new Error("PROJECT_NOT_FOUND");
    }
    return project;
}
async function updateProject(projectId, data) {
    const project = await database_1.prisma.project.findUnique({
        where: {
            id: projectId
        }
    });
    if (!project) {
        throw new Error("PROJECT_NOT_FOUND");
    }
    return database_1.prisma.project.update({
        where: {
            id: projectId
        },
        data
    });
}
async function deactivateProject(projectId) {
    const project = await database_1.prisma.project.findUnique({
        where: {
            id: projectId
        }
    });
    if (!project) {
        throw new Error("PROJECT_NOT_FOUND");
    }
    return database_1.prisma.project.update({
        where: {
            id: projectId
        },
        data: {
            status: "CANCELLED"
        }
    });
}
