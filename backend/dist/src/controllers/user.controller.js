"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsersController = getUsersController;
exports.getUserByIdController = getUserByIdController;
exports.createUserController = createUserController;
exports.updateUserController = updateUserController;
const user_service_1 = require("../services/user.service");
async function getUsersController(req, res) {
    try {
        const search = typeof req.query.search === "string"
            ? req.query.search
            : undefined;
        const status = typeof req.query.status === "string" &&
            ["ACTIVE", "INACTIVE", "SUSPENDED"].includes(req.query.status)
            ? req.query.status
            : undefined;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const result = await (0, user_service_1.getUsers)({
            search,
            status,
            page,
            limit,
        });
        return res.status(200).json({
            success: true,
            data: result.users,
            pagination: {
                total: result.total,
                page: result.page,
                limit: result.limit,
                totalPages: result.totalPages,
            },
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch users",
        });
    }
}
async function getUserByIdController(req, res) {
    try {
        const { id } = req.params;
        const user = await (0, user_service_1.getUserById)(id);
        return res.status(200).json({
            success: true,
            data: user,
        });
    }
    catch (error) {
        console.error(error);
        const message = error instanceof Error
            ? error.message
            : "Failed to fetch user";
        if (message === "User not found") {
            return res.status(404).json({
                success: false,
                message,
            });
        }
        return res.status(500).json({
            success: false,
            message: "Failed to fetch user",
        });
    }
}
async function createUserController(req, res) {
    try {
        const user = await (0, user_service_1.createUser)(req.body);
        return res.status(201).json({
            success: true,
            message: "User created successfully",
            data: user,
        });
    }
    catch (error) {
        console.error(error);
        const message = error instanceof Error
            ? error.message
            : "Failed to create user";
        if (message === "User with this email already exists") {
            return res.status(409).json({
                success: false,
                message,
            });
        }
        return res.status(500).json({
            success: false,
            message: "Failed to create user",
        });
    }
}
async function updateUserController(req, res) {
    try {
        const { id } = req.params;
        const user = await (0, user_service_1.updateUser)(id, req.body);
        return res.status(200).json({
            success: true,
            message: "User updated successfully",
            data: user,
        });
    }
    catch (error) {
        console.error(error);
        const message = error instanceof Error
            ? error.message
            : "Failed to update user";
        if (message === "User not found") {
            return res.status(404).json({
                success: false,
                message,
            });
        }
        if (message === "User with this email already exists") {
            return res.status(409).json({
                success: false,
                message,
            });
        }
        return res.status(500).json({
            success: false,
            message: "Failed to update user",
        });
    }
}
