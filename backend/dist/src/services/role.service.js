"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRoles = getRoles;
exports.getRoleById = getRoleById;
exports.createRole = createRole;
exports.updateRole = updateRole;
exports.deleteRole = deleteRole;
const database_1 = require("../config/database");
async function getRoles() {
    const roles = await database_1.prisma.role.findMany({
        orderBy: {
            name: "asc",
        },
        include: {
            permissions: {
                include: {
                    permission: true,
                },
            },
            _count: {
                select: {
                    users: true,
                },
            },
        },
    });
    return roles;
}
async function getRoleById(roleId) {
    const role = await database_1.prisma.role.findUnique({
        where: {
            id: roleId,
        },
        include: {
            permissions: {
                include: {
                    permission: true,
                },
            },
            _count: {
                select: {
                    users: true,
                },
            },
        },
    });
    if (!role) {
        throw new Error("Role not found");
    }
    return role;
}
async function createRole(data) {
    const existingRole = await database_1.prisma.role.findUnique({
        where: {
            name: data.name,
        },
    });
    if (existingRole) {
        throw new Error("Role with this name already exists");
    }
    return database_1.prisma.role.create({
        data: {
            name: data.name,
            description: data.description,
        },
    });
}
async function updateRole(roleId, data) {
    const existingRole = await database_1.prisma.role.findUnique({
        where: {
            id: roleId,
        },
    });
    if (!existingRole) {
        throw new Error("Role not found");
    }
    if (data.name &&
        data.name !== existingRole.name) {
        const duplicate = await database_1.prisma.role.findUnique({
            where: {
                name: data.name,
            },
        });
        if (duplicate) {
            throw new Error("Role with this name already exists");
        }
    }
    return database_1.prisma.role.update({
        where: {
            id: roleId,
        },
        data: {
            name: data.name,
            description: data.description,
        },
    });
}
async function deleteRole(roleId) {
    const existingRole = await database_1.prisma.role.findUnique({
        where: {
            id: roleId,
        },
    });
    if (!existingRole) {
        throw new Error("Role not found");
    }
    await database_1.prisma.role.delete({
        where: {
            id: roleId,
        },
    });
    return true;
}
