"use strict";
// src/controllers/quarantine.controller.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.createQuarantineController = createQuarantineController;
exports.getQuarantinesController = getQuarantinesController;
exports.getQuarantineByIdController = getQuarantineByIdController;
exports.createDispositionController = createDispositionController;
const quarantine_service_1 = require("../services/quarantine.service");
async function createQuarantineController(req, res) {
    try {
        const userId = req.user.id;
        const quarantine = await (0, quarantine_service_1.createQuarantine)(req.body, userId);
        return res.status(201).json({
            success: true,
            message: "Material quarantine created successfully",
            data: quarantine,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to create quarantine",
        });
    }
}
async function getQuarantinesController(req, res) {
    try {
        const result = await (0, quarantine_service_1.getQuarantines)({
            page: Number(req.query.page) || 1,
            limit: Number(req.query.limit) || 20,
            status: req.query.status,
            projectId: req.query.projectId,
        });
        return res.json({
            success: true,
            ...result,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to get quarantines",
        });
    }
}
async function getQuarantineByIdController(req, res) {
    try {
        const quarantine = await (0, quarantine_service_1.getQuarantineById)(req.params.id);
        return res.json({
            success: true,
            data: quarantine,
        });
    }
    catch (error) {
        return res.status(404).json({
            success: false,
            message: error.message ||
                "Quarantine not found",
        });
    }
}
async function createDispositionController(req, res) {
    try {
        const userId = req.user.id;
        const disposition = await (0, quarantine_service_1.createDisposition)(req.params.id, req.body, userId);
        return res.status(201).json({
            success: true,
            message: "Material disposition recorded successfully",
            data: disposition,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to create disposition",
        });
    }
}
