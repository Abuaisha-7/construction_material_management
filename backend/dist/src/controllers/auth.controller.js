"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
const database_1 = require("../config/database");
const password_1 = require("../utils/password");
const auth_service_1 = require("../services/auth.service");
async function register(req, res) {
    try {
        const { fullName, email, password, phone } = req.body;
        const existingUser = await database_1.prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User already exists"
            });
        }
        const passwordHash = await (0, password_1.hashPassword)(password);
        const user = await database_1.prisma.user.create({
            data: {
                fullName,
                email,
                phone,
                passwordHash
            }
        });
        return res.status(201).json({
            success: true,
            message: "User created successfully",
            data: {
                id: user.id,
                fullName: user.fullName,
                email: user.email
            }
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to create user"
        });
    }
}
async function login(req, res) {
    try {
        const { email, password } = req.body;
        const result = await (0, auth_service_1.authenticateUser)(email, password);
        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: result
        });
    }
    catch (error) {
        if (error instanceof Error &&
            error.message === "INVALID_CREDENTIALS") {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }
        if (error instanceof Error &&
            error.message === "ACCOUNT_INACTIVE") {
            return res.status(403).json({
                success: false,
                message: "Your account is inactive"
            });
        }
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Login failed"
        });
    }
}
