"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPermissions = getPermissions;
exports.createPermission = createPermission;
const database_1 = require("../config/database");
async function getPermissions() {
    const permissions = await database_1.prisma.permission.findMany({
        orderBy: {
            name: "asc",
        },
        include: {
            roles: {
                include: {
                    role: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            },
        },
    });
    return permissions;
}
async function createPermission(data) {
    const existingPermission = await database_1.prisma.permission.findUnique({
        where: {
            name: data.name,
        },
    });
    if (existingPermission) {
        throw new Error("Permission with this name already exists");
    }
    return database_1.prisma.permission.create({
        data: {
            name: data.name,
            description: data.description,
        },
    });
}
