import express from "express";
import { backendDeployer } from "../controllers/backendDeploymentController.js";

const router = express.Router();

router.post("/",backendDeployer);

export default router;