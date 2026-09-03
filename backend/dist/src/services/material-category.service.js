"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCategory = createCategory;
exports.getCategories = getCategories;
exports.getCategoryById = getCategoryById;
exports.updateCategory = updateCategory;
exports.deleteCategory = deleteCategory;
const database_1 = require("../config/database");
async function createCategory(data) {
    const { name, description } = data;
    const existing = await database_1.prisma.materialCategory.findUnique({
        where: {
            name,
        },
    });
    if (existing) {
        throw new Error("CATEGORY_ALREADY_EXISTS");
    }
    return database_1.prisma.materialCategory.create({
        data: {
            name,
            description,
        },
    });
}
async function getCategories() {
    return database_1.prisma.materialCategory.findMany({
        orderBy: {
            name: "asc",
        },
    });
}
async function getCategoryById(id) {
    return database_1.prisma.materialCategory.findUnique({
        where: {
            id,
        },
    });
}
async function updateCategory(id, data) {
    const existing = await database_1.prisma.materialCategory.findUnique({
        where: {
            id,
        },
    });
    if (!existing) {
        throw new Error("CATEGORY_NOT_FOUND");
    }
    if (data.name && data.name !== existing.name) {
        const duplicate = await database_1.prisma.materialCategory.findUnique({
            where: {
                name: data.name,
            },
        });
        if (duplicate) {
            throw new Error("CATEGORY_ALREADY_EXISTS");
        }
    }
    return database_1.prisma.materialCategory.update({
        where: {
            id,
        },
        data,
    });
}
async function deleteCategory(id) {
    const existing = await database_1.prisma.materialCategory.findUnique({
        where: {
            id,
        },
    });
    if (!existing) {
        throw new Error("CATEGORY_NOT_FOUND");
    }
    return database_1.prisma.materialCategory.delete({
        where: {
            id,
        },
    });
}
