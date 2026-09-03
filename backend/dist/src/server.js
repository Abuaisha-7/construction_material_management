"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const database_1 = require("./config/database");
const env_1 = require("./config/env");
async function startServer() {
    await (0, database_1.connectDatabase)();
    app_1.default.listen(env_1.env.port, () => {
        console.log(`Server running on http://localhost:${env_1.env.port}`);
    });
}
startServer();
