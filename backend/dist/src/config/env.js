"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.env = {
    nodeEnv: process.env.NODE_ENV || "development",
    port: Number(process.env.PORT) || 5000,
    databaseUrl: process.env.DATABASE_URL || "",
    jwtSecret: process.env.JWT_SECRET || "",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173"
};
if (!exports.env.databaseUrl) {
    throw new Error("DATABASE_URL is required");
}
if (!exports.env.jwtSecret) {
    throw new Error("JWT_SECRET is required");
}
