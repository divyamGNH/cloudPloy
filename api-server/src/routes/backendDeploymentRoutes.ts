import express from "express";
import { backendDeployer } from "../controllers/backendDeploymentController.js";

const router = express.Router();

router.post("/deploy",backendDeployer);

export default router;