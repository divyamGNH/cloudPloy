import express from "express";
import { Deployer } from "../controllers/frontendDeploymentController.js";

const router = express.Router();

router.post("/", Deployer);

export default router;