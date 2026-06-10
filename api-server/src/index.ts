import express from "express";
import dotenv from "dotenv";
import { RunTaskCommand } from "@aws-sdk/client-ecs";
import { createECSClient } from "./config/ecsClient.js";
import cors from "cors";
import { randomUUID } from "crypto";

import backendDeploymentRouter from "./routes/backendDeploymentRoutes.js";
import frontendDeploymentRouter from "./routes/frontendDeploymentRoutes.js";
import { GetEnvironmentConfigs } from "./config/getEnvironment.js"

//Add task roles in order to prevent the use to access and secret ID in the env.

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL;
const FRONTEND_URL = process.env.FRONTEND_URL;
const API_SERVER_URL = process.env.API_SERVER_URL;

app.use(express.json());
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));

const DeploymentStatus = new Map();

// app.use("/backend",backendDeploymentRouter);

app.use("/deploy", frontendDeploymentRouter);

app.get("/deploymentStatus", (req, res) => {
  const { ProjectID, DeploymentID } = req.query;

  if (!ProjectID || !DeploymentID) {
    return res.status(400).json({ error: "Missing deployment identifiers" });
  }

  const status = DeploymentStatus.get(`${ProjectID}/${DeploymentID}`);

  res.json({
    //If we could not find a status of the project it is probably still building.
    status: status || "Building",
  });
});

app.post("/deploymentComplete", (req, res) => {
  const { ProjectID, DeploymentID, status } = req.body;

  if (!ProjectID || !DeploymentID || !status) {
    return res.status(400).json({ error: "Missing deployment identifiers" });
  }

  DeploymentStatus.set(`${ProjectID}/${DeploymentID}`, status);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running on PORT:${PORT}`);
});
