import express from "express";
import * as projectController from "../controllers/projectController.js";

const router = express.Router();

router.post("/new-project", projectController.createProject);

router.get("/get-all-projects", projectController.getAllProjects);

router.get("/get-project/:projectId", projectController.getProject);

router.delete("/delete-project/:projectId", projectController.deleteProject);

export default router;