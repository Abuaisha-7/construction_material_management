"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignRoleToUser = assignRoleToUser;
exports.getAllUserRoles = getAllUserRoles;
exports.getUserRolesByUser = getUserRolesByUser;
exports.getUserRole = getUserRole;
exports.removeRoleFromUser = removeRoleFromUser;
const database_1 = require("../config/database");
// =====================================================
// ASSIGN ROLE TO USER
// =====================================================
async function assignRoleToUser(data) {
    const { userId, roleId } = data;
    // Check user
    const user = await database_1.prisma.user.findUnique({
        where: {
            id: userId,
        },
    });
    if (!user) {
        throw new Error("User not found");
    }
    // Check role
    const role = await database_1.prisma.role.findUnique({
        where: {
            id: roleId,
        },
    });
    if (!role) {
        throw new Error("Role not found");
    }
    // Check if role already assigned
    const existingUserRole = await database_1.prisma.userRole.findUnique({
        where: {
            userId_roleId: {
                userId,
                roleId,
            },
        },
    });
    if (existingUserRole) {
        throw new Error("Role is already assigned to this user");
    }
    // Create user-role relationship
    return database_1.prisma.userRole.create({
        data: {
            userId,
            roleId,
        },
        include: {
            user: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                },
            },
            role: {
                select: {
                    id: true,
                    name: true,
                    description: true,
                },
            },
        },
    });
}
// =====================================================
// GET ALL USER ROLE ASSIGNMENTS
// =====================================================
async function getAllUserRoles() {
    return database_1.prisma.userRole.findMany({
        include: {
            user: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    status: true,
                },
            },
            role: {
                select: {
                    id: true,
                    name: true,
                    description: true,
                },
            },
        },
        orderBy: {
            user: {
                fullName: "asc",
            },
        },
    });
}
// =====================================================
// GET ROLES FOR A USER
// =====================================================
async function getUserRolesByUser(userId) {
    const user = await database_1.prisma.user.findUnique({
        where: {
            id: userId,
        },
        select: {
            id: true,
            fullName: true,
            email: true,
            status: true,
        },
    });
    if (!user) {
        throw new Error("User not found");
    }
    const userRoles = await database_1.prisma.userRole.findMany({
        where: {
            userId,
        },
        include: {
            role: {
                select: {
                    id: true,
                    name: true,
                    description: true,
                },
            },
        },
    });
    return {
        user,
        roles: userRoles.map((userRole) => userRole.role),
    };
}
// =====================================================
// GET ONE USER ROLE ASSIGNMENT
// =====================================================
async function getUserRole(userId, roleId) {
    const userRole = await database_1.prisma.userRole.findUnique({
        where: {
            userId_roleId: {
                userId,
                roleId,
            },
        },
        include: {
            user: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    status: true,
                },
            },
            role: {
                select: {
                    id: true,
                    name: true,
                    description: true,
                },
            },
        },
    });
    if (!userRole) {
        throw new Error("Role assignment not found");
    }
    return userRole;
}
// =====================================================
// REMOVE ROLE FROM USER
// =====================================================
async function removeRoleFromUser(userId, roleId) {
    const existingUserRole = await database_1.prisma.userRole.findUnique({
        where: {
            userId_roleId: {
                userId,
                roleId,
            },
        },
    });
    if (!existingUserRole) {
        throw new Error("Role assignment not found");
    }
    await database_1.prisma.userRole.delete({
        where: {
            userId_roleId: {
                userId,
                roleId,
            },
        },
    });
    return true;
}
