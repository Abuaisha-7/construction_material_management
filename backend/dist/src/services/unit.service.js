"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUnit = createUnit;
exports.getUnits = getUnits;
exports.getUnitById = getUnitById;
exports.updateUnit = updateUnit;
exports.deleteUnit = deleteUnit;
const database_1 = require("../config/database");
/**
 * Create a new unit
 */
async function createUnit(data) {
    const { code, name, symbol } = data;
    const existing = await database_1.prisma.unit.findFirst({
        where: {
            OR: [
                {
                    code,
                },
                {
                    name,
                },
            ],
        },
    });
    if (existing) {
        throw new Error("UNIT_ALREADY_EXISTS");
    }
    return database_1.prisma.unit.create({
        data: {
            code,
            name,
            symbol,
        },
    });
}
/**
 * Get all units
 */
async function getUnits() {
    return database_1.prisma.unit.findMany({
        orderBy: {
            name: "asc",
        },
    });
}
/**
 * Get unit by ID
 */
async function getUnitById(id) {
    return database_1.prisma.unit.findUnique({
        where: {
            id,
        },
    });
}
/**
 * Update unit
 */
async function updateUnit(id, data) {
    const existing = await database_1.prisma.unit.findUnique({
        where: {
            id,
        },
    });
    if (!existing) {
        throw new Error("UNIT_NOT_FOUND");
    }
    if (data.code || data.name) {
        const duplicate = await database_1.prisma.unit.findFirst({
            where: {
                OR: [
                    ...(data.code
                        ? [
                            {
                                code: data.code,
                            },
                        ]
                        : []),
                    ...(data.name
                        ? [
                            {
                                name: data.name,
                            },
                        ]
                        : []),
                ],
                NOT: {
                    id,
                },
            },
        });
        if (duplicate) {
            throw new Error("UNIT_ALREADY_EXISTS");
        }
    }
    return database_1.prisma.unit.update({
        where: {
            id,
        },
        data,
    });
}
/**
 * Delete unit
 */
async function deleteUnit(id) {
    const existing = await database_1.prisma.unit.findUnique({
        where: {
            id,
        },
    });
    if (!existing) {
        throw new Error("UNIT_NOT_FOUND");
    }
    return database_1.prisma.unit.delete({
        where: {
            id,
        },
    });
}
