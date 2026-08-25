import express from "express";
import cors from "cors";
import helmet from "helmet";

import authRoutes from "./routes/auth.routes";
import materialRoutes from "./routes/material.routes";
import projectRoutes from "./routes/project.routes";

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

export default app;