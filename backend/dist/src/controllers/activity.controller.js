"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createActivityController = createActivityController;
exports.getActivitiesController = getActivitiesController;
exports.getActivityByIdController = getActivityByIdController;
exports.updateActivityController = updateActivityController;
exports.deleteActivityController = deleteActivityController;
const activity_service_1 = require("../services/activity.service");
async function createActivityController(req, res) {
    try {
        const activity = await (0, activity_service_1.createActivity)(req.body);
        return res.status(201).json({
            success: true,
            message: "Activity created successfully",
            data: activity,
        });
    }
    catch (error) {
        console.error("Create activity error:", error);
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to create activity",
        });
    }
}
async function getActivitiesController(req, res) {
    try {
        const projectId = req.query.projectId
            ? String(req.query.projectId)
            : undefined;
        const buildingId = req.query.buildingId
            ? String(req.query.buildingId)
            : undefined;
        const zoneId = req.query.zoneId
            ? String(req.query.zoneId)
            : undefined;
        const status = req.query.status
            ? String(req.query.status)
            : undefined;
        const activities = await (0, activity_service_1.getActivities)(projectId, buildingId, zoneId, status);
        return res.status(200).json({
            success: true,
            data: activities,
        });
    }
    catch (error) {
        console.error("Get activities error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to get activities",
        });
    }
}
async function getActivityByIdController(req, res) {
    try {
        const { id } = req.params;
        const activity = await (0, activity_service_1.getActivityById)(id);
        return res.status(200).json({
            success: true,
            data: activity,
        });
    }
    catch (error) {
        console.error("Get activity error:", error);
        return res.status(404).json({
            success: false,
            message: error.message || "Activity not found",
        });
    }
}
async function updateActivityController(req, res) {
    try {
        const { id } = req.params;
        const activity = await (0, activity_service_1.updateActivity)(id, req.body);
        return res.status(200).json({
            success: true,
            message: "Activity updated successfully",
            data: activity,
        });
    }
    catch (error) {
        console.error("Update activity error:", error);
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to update activity",
        });
    }
}
async function deleteActivityController(req, res) {
    try {
        const { id } = req.params;
        await (0, activity_service_1.deleteActivity)(id);
        return res.status(200).json({
            success: true,
            message: "Activity deleted successfully",
        });
    }
    catch (error) {
        console.error("Delete activity error:", error);
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to delete activity",
        });
    }
}
