"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const material_routes_1 = __importDefault(require("./routes/material.routes"));
const project_routes_1 = __importDefault(require("./routes/project.routes"));
const material_category_routes_1 = __importDefault(require("./routes/material-category.routes"));
const unit_routes_1 = __importDefault(require("./routes/unit.routes"));
const supplier_routes_1 = __importDefault(require("./routes/supplier.routes"));
const material_request_routes_1 = __importDefault(require("./routes/material-request.routes"));
const purchase_order_routes_1 = __importDefault(require("./routes/purchase-order.routes"));
const grn_routes_1 = __importDefault(require("./routes/grn.routes"));
const storage_location_routes_1 = __importDefault(require("./routes/storage-location.routes"));
const warehouse_routes_1 = __importDefault(require("./routes/warehouse.routes"));
const inspection_routes_1 = __importDefault(require("./routes/inspection.routes"));
const quarantine_routes_1 = __importDefault(require("./routes/quarantine.routes"));
const inventory_routes_1 = __importDefault(require("./routes/inventory.routes"));
const material_issue_routes_1 = __importDefault(require("./routes/material-issue.routes"));
const building_routes_1 = __importDefault(require("./routes/building.routes"));
const zone_routes_1 = __importDefault(require("./routes/zone.routes"));
const activity_routes_1 = __importDefault(require("./routes/activity.routes"));
const materialConsumption_routes_1 = __importDefault(require("./routes/materialConsumption.routes"));
const materialReturn_routes_1 = __importDefault(require("./routes/materialReturn.routes"));
const env_1 = require("./config/env");
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: env_1.env.frontendUrl,
    credentials: true
}));
app.use(express_1.default.json({
    limit: "10mb"
}));
app.use(express_1.default.urlencoded({
    extended: true
}));
app.get("/api/health", (_req, res) => {
    res.json({
        success: true,
        message: "Construction Material Management API is running",
        timestamp: new Date().toISOString()
    });
});
app.use("/api/auth", auth_routes_1.default);
app.use("/api/materials", material_routes_1.default);
app.use("/api/projects", project_routes_1.default);
app.use("/api/material-categories", material_category_routes_1.default);
app.use("/api/units", unit_routes_1.default);
app.use("/api/suppliers", supplier_routes_1.default);
app.use("/api/material-requests", material_request_routes_1.default);
app.use("/api/purchase-orders", purchase_order_routes_1.default);
app.use("/api/grns", grn_routes_1.default);
app.use("/api/storage-locations", storage_location_routes_1.default);
app.use("/api/warehouses", warehouse_routes_1.default);
app.use("/api/inspections", inspection_routes_1.default);
app.use("/api/quarantines", quarantine_routes_1.default);
app.use("/api/inventory", inventory_routes_1.default);
app.use("/api/material-issues", material_issue_routes_1.default);
app.use("/api/buildings", building_routes_1.default);
app.use("/api/zones", zone_routes_1.default);
app.use("/api/activities", activity_routes_1.default);
app.use("/api/material-consumption", materialConsumption_routes_1.default);
app.use("/api/material-returns", materialReturn_routes_1.default);
exports.default = app;
