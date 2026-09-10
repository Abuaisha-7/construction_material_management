"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignPermissionToRole = assignPermissionToRole;
exports.getAllRolePermissions = getAllRolePermissions;
exports.getRolePermission = getRolePermission;
exports.removePermissionFromRole = removePermissionFromRole;
const database_1 = require("../config/database");
async function assignPermissionToRole(data) {
    const { roleId, permissionId } = data;
    const role = await database_1.prisma.role.findUnique({
        where: {
            id: roleId,
        },
    });
    if (!role) {
        throw new Error("Role not found");
    }
    const permission = await database_1.prisma.permission.findUnique({
        where: {
            id: permissionId,
        },
    });
    if (!permission) {
        throw new Error("Permission not found");
    }
    const existingRolePermission = await database_1.prisma.rolePermission.findUnique({
        where: {
            roleId_permissionId: {
                roleId,
                permissionId,
            },
        },
    });
    if (existingRolePermission) {
        throw new Error("Permission is already assigned to this role");
    }
    return database_1.prisma.rolePermission.create({
        data: {
            roleId,
            permissionId,
        },
        include: {
            role: {
                select: {
                    id: true,
                    name: true,
                    description: true,
                },
            },
            permission: {
                select: {
                    id: true,
                    name: true,
                    description: true,
                },
            },
        },
    });
}
async function getAllRolePermissions() {
    return database_1.prisma.rolePermission.findMany({
        include: {
            role: {
                select: {
                    id: true,
                    name: true,
                    description: true,
                },
            },
            permission: {
                select: {
                    id: true,
                    name: true,
                    description: true,
                },
            },
        },
        orderBy: {
            role: {
                name: "asc",
            },
        },
    });
}
async function getRolePermission(roleId, permissionId) {
    const rolePermission = await database_1.prisma.rolePermission.findUnique({
        where: {
            roleId_permissionId: {
                roleId,
                permissionId,
            },
        },
        include: {
            role: {
                select: {
                    id: true,
                    name: true,
                    description: true,
                },
            },
            permission: {
                select: {
                    id: true,
                    name: true,
                    description: true,
                },
            },
        },
    });
    if (!rolePermission) {
        throw new Error("Role permission assignment not found");
    }
    return rolePermission;
}
async function removePermissionFromRole(roleId, permissionId) {
    const existingRolePermission = await database_1.prisma.rolePermission.findUnique({
        where: {
            roleId_permissionId: {
                roleId,
                permissionId,
            },
        },
    });
    if (!existingRolePermission) {
        throw new Error("Role permission assignment not found");
    }
    await database_1.prisma.rolePermission.delete({
        where: {
            roleId_permissionId: {
                roleId,
                permissionId,
            },
        },
    });
    return true;
}
