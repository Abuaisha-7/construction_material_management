"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGrnController = createGrnController;
exports.getGrnsController = getGrnsController;
exports.getGrnByIdController = getGrnByIdController;
exports.updateGrnController = updateGrnController;
exports.confirmGrnController = confirmGrnController;
exports.rejectGrnController = rejectGrnController;
const grn_service_1 = require("../services/grn.service");
// ======================================================
// CREATE
// ======================================================
async function createGrnController(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }
        const grn = await (0, grn_service_1.createGrn)(req.body, userId);
        return res.status(201).json({
            success: true,
            message: "Goods receipt note created successfully",
            data: grn,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to create GRN",
        });
    }
}
// ======================================================
// GET ALL
// ======================================================
async function getGrnsController(_req, res) {
    try {
        const grns = await (0, grn_service_1.getGrns)();
        return res.json({
            success: true,
            data: grns,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: error.message ||
                "Failed to fetch GRNs",
        });
    }
}
// ======================================================
// GET ONE
// ======================================================
async function getGrnByIdController(req, res) {
    try {
        const grn = await (0, grn_service_1.getGrnById)(req.params.id);
        return res.json({
            success: true,
            data: grn,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(404).json({
            success: false,
            message: error.message ||
                "GRN not found",
        });
    }
}
// ======================================================
// UPDATE
// ======================================================
async function updateGrnController(req, res) {
    try {
        const grn = await (0, grn_service_1.updateGrn)(req.params.id, req.body);
        return res.json({
            success: true,
            message: "GRN updated successfully",
            data: grn,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to update GRN",
        });
    }
}
// ======================================================
// CONFIRM
// ======================================================
async function confirmGrnController(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }
        const grn = await (0, grn_service_1.confirmGrn)(req.params.id, userId);
        return res.json({
            success: true,
            message: "GRN confirmed successfully",
            data: grn,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to confirm GRN",
        });
    }
}
// ======================================================
// REJECT
// ======================================================
async function rejectGrnController(req, res) {
    try {
        const { reason } = req.body;
        const grn = await (0, grn_service_1.rejectGrn)(req.params.id, reason);
        return res.json({
            success: true,
            message: "GRN rejected successfully",
            data: grn,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(400).json({
            success: false,
            message: error.message ||
                "Failed to reject GRN",
        });
    }
}
