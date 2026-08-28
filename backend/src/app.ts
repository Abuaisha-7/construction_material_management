import express from "express";
import cors from "cors";
import helmet from "helmet";

import authRoutes from "./routes/auth.routes";
import materialRoutes from "./routes/material.routes";
import projectRoutes from "./routes/project.routes";
import materialCategoryRoutes from "./routes/material-category.routes";
import unitRoutes from "./routes/unit.routes";
import supplierRoutes from "./routes/supplier.routes";
import materialRequestRoutes from "./routes/material-request.routes";
import purchaseOrderRoutes from "./routes/purchase-order.routes";
import grnRoutes from "./routes/grn.routes";
import storageLocationRoutes from "./routes/storage-location.routes";
import warehouseRoutes from "./routes/warehouse.routes";

import { env } from "./config/env";

const app = express();

app.use(
  helmet()
);

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true
  })
);

app.use(
  express.json({
    limit: "10mb"
  })
);

app.use(
  express.urlencoded({
    extended: true
  })
);

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message:
      "Construction Material Management API is running",
    timestamp: new Date().toISOString()
  });
});

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/materials",
  materialRoutes
);

app.use(
  "/api/projects",
  projectRoutes
);

app.use(
  "/api/material-categories",
  materialCategoryRoutes
);

app.use("/api/units", unitRoutes);

app.use("/api/suppliers", supplierRoutes);

app.use(
  "/api/material-requests",
  materialRequestRoutes
);

app.use(
  "/api/purchase-orders",
  purchaseOrderRoutes
);

app.use(
  "/api/grns",
  grnRoutes
);

app.use(
  "/api/storage-locations",
  storageLocationRoutes
);

app.use(
  "/api/warehouses",
  warehouseRoutes
);

export default app;