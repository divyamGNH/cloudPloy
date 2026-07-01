import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

import backendDeploymentRouter from "./routes/backendDeploymentRoutes.js";
import frontendDeploymentRouter from "./routes/frontendDeploymentRoutes.js";
import authRouter from "./routes/authRoutes.js";

//Add task roles in order to prevent the use to access and secret ID in the env.

// TODO : Add the config approach as we did in GO for env variables just to be safe and that is more production grade.

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
app.use(cookieParser());

const DeploymentStatus = new Map();

app.use("/backend-deploy",backendDeploymentRouter);
app.use("/deploy", frontendDeploymentRouter);
app.use("/auth", authRouter)


// TODO : Deprecate these 2 routes as we will need to poll AWS task by ARN to check it ended succesfully or not hence we won't need these routes later.
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
