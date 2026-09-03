"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.connectDatabase = connectDatabase;
const client_1 = require("@prisma/client");
exports.prisma = new client_1.PrismaClient();
async function connectDatabase() {
    try {
        await exports.prisma.$connect();
        console.log("MySQL database connected successfully");
    }
    catch (error) {
        console.error("Database connection failed:", error);
        process.exit(1);
    }
}
