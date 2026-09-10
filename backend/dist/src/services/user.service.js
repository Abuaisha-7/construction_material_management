"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsers = getUsers;
exports.getUserById = getUserById;
exports.createUser = createUser;
exports.updateUser = updateUser;
const database_1 = require("../config/database");
const password_1 = require("../utils/password");
async function getUsers(params) {
    const { search, status, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;
    const where = {};
    if (search) {
        where.OR = [
            {
                fullName: {
                    contains: search,
                },
            },
            {
                email: {
                    contains: search,
                },
            },
            {
                phone: {
                    contains: search,
                },
            },
        ];
    }
    if (status) {
        where.status = status;
    }
    const [users, total] = await database_1.prisma.$transaction([
        database_1.prisma.user.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                fullName: "asc",
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                roles: {
                    include: {
                        role: {
                            select: {
                                id: true,
                                name: true,
                                description: true,
                            },
                        },
                    },
                },
            },
        }),
        database_1.prisma.user.count({
            where,
        }),
    ]);
    return {
        users,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}
async function getUserById(userId) {
    const user = await database_1.prisma.user.findUnique({
        where: {
            id: userId,
        },
        include: {
            roles: {
                include: {
                    role: {
                        include: {
                            permissions: {
                                include: {
                                    permission: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });
    if (!user) {
        throw new Error("User not found");
    }
    return user;
}
async function createUser(data) {
    const existingUser = await database_1.prisma.user.findUnique({
        where: {
            email: data.email,
        },
    });
    if (existingUser) {
        throw new Error("User with this email already exists");
    }
    const passwordHash = await (0, password_1.hashPassword)(data.password);
    return database_1.prisma.user.create({
        data: {
            fullName: data.fullName,
            email: data.email,
            phone: data.phone,
            passwordHash,
            status: data.status ?? "ACTIVE",
        },
        select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            status: true,
            createdAt: true,
            updatedAt: true,
        },
    });
}
async function updateUser(userId, data) {
    const existingUser = await database_1.prisma.user.findUnique({
        where: {
            id: userId,
        },
    });
    if (!existingUser) {
        throw new Error("User not found");
    }
    if (data.email &&
        data.email !== existingUser.email) {
        const duplicate = await database_1.prisma.user.findUnique({
            where: {
                email: data.email,
            },
        });
        if (duplicate) {
            throw new Error("User with this email already exists");
        }
    }
    const updateData = {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        status: data.status,
    };
    if (data.password) {
        updateData.passwordHash = await (0, password_1.hashPassword)(data.password);
    }
    return database_1.prisma.user.update({
        where: {
            id: userId,
        },
        data: updateData,
        select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            status: true,
            createdAt: true,
            updatedAt: true,
        },
    });
}
