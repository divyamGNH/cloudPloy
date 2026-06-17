import express from "express";
import { backendDeployemntStatusChecker, backendDeployer } from "../controllers/backendDeploymentController.js";

const router = express.Router();

router.post("/",backendDeployer);
router.post("/status", backendDeployemntStatusChecker)

export default router;