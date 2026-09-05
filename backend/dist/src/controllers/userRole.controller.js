"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserRole = createUserRole;
exports.getUserRoles = getUserRoles;
exports.getUserRolesForUser = getUserRolesForUser;
exports.getUserRole = getUserRole;
exports.deleteUserRole = deleteUserRole;
const userRole_service_1 = require("../services/userRole.service");
// =====================================================
// ASSIGN ROLE
// POST /api/user-roles
// =====================================================
async function createUserRole(req, res) {
    try {
        const { userId, roleId } = req.body;
        const userRole = await (0, userRole_service_1.assignRoleToUser)({
            userId,
            roleId,
        });
        return res.status(201).json({
            success: true,
            message: "Role assigned successfully",
            data: userRole,
        });
    }
    catch (error) {
        console.error("Create user role error:", error);
        const message = error instanceof Error
            ? error.message
            : "Failed to assign role";
        const statusCode = message === "User not found" ||
            message === "Role not found" ||
            message === "Role assignment not found"
            ? 404
            : message ===
                "Role is already assigned to this user"
                ? 409
                : 500;
        return res.status(statusCode).json({
            success: false,
            message,
        });
    }
}
// =====================================================
// GET ALL
// GET /api/user-roles
// =====================================================
async function getUserRoles(req, res) {
    try {
        const userRoles = await (0, userRole_service_1.getAllUserRoles)();
        return res.status(200).json({
            success: true,
            data: userRoles,
        });
    }
    catch (error) {
        console.error("Get user roles error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve user roles",
        });
    }
}
// =====================================================
// GET USER'S ROLES
// GET /api/user-roles/user/:userId
// =====================================================
async function getUserRolesForUser(req, res) {
    try {
        const { userId } = req.params;
        const result = await (0, userRole_service_1.getUserRolesByUser)(userId);
        return res.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        console.error("Get user roles by user error:", error);
        const message = error instanceof Error
            ? error.message
            : "Failed to retrieve user roles";
        const statusCode = message === "User not found" ? 404 : 500;
        return res.status(statusCode).json({
            success: false,
            message,
        });
    }
}
// =====================================================
// GET ONE ASSIGNMENT
// GET /api/user-roles/:userId/:roleId
// =====================================================
async function getUserRole(req, res) {
    try {
        const { userId, roleId } = req.params;
        const userRole = await (0, userRole_service_1.getUserRole)(userId, roleId);
        return res.status(200).json({
            success: true,
            data: userRole,
        });
    }
    catch (error) {
        console.error("Get user role error:", error);
        const message = error instanceof Error
            ? error.message
            : "Failed to retrieve role assignment";
        const statusCode = message === "Role assignment not found"
            ? 404
            : 500;
        return res.status(statusCode).json({
            success: false,
            message,
        });
    }
}
// =====================================================
// REMOVE ROLE
// DELETE /api/user-roles/:userId/:roleId
// =====================================================
async function deleteUserRole(req, res) {
    try {
        const { userId, roleId } = req.params;
        await (0, userRole_service_1.removeRoleFromUser)(userId, roleId);
        return res.status(200).json({
            success: true,
            message: "Role removed from user successfully",
        });
    }
    catch (error) {
        console.error("Delete user role error:", error);
        const message = error instanceof Error
            ? error.message
            : "Failed to remove role";
        const statusCode = message === "Role assignment not found"
            ? 404
            : 500;
        return res.status(statusCode).json({
            success: false,
            message,
        });
    }
}
