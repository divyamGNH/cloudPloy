import type { Request, Response } from "express";
import * as projectService from "../services/projectServices.js";

import type {
    CreateProjectReq,
    GetProjectReq,
    DeleteProjectReq,
} from "../types/projectTypes.js";

function getUserId(req: Request, res: Response): string | null {
    const userId = req.auth?.userId;

    if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return null;
    }

    return userId;
}

export async function createProject(req: Request, res: Response): Promise<void> {
    try {
        const userId = getUserId(req, res);
        if (!userId) return;

        const { projectName } = req.body as CreateProjectReq;

        const project = await projectService.createProject(userId, projectName);

        res.status(201).json(project);
    } catch (err) {
        console.error("createProject:", err);
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function getAllProjects(req: Request, res: Response): Promise<void> {
    try {
        const userId = getUserId(req, res);
        if (!userId) return;

        const projects = await projectService.getAllProjects(userId);

        res.status(200).json(projects);
    } catch (err) {
        console.error("getProjects:", err);
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function getProject(req: Request, res: Response): Promise<void> {
    try {
        const userId = getUserId(req, res);
        if (!userId) return;

        const { projectId } = req.params as unknown as GetProjectReq;

        const project = await projectService.getProject(projectId);

        if (!project) {
            res.status(404).json({ message: "Project not found" });
            return;
        }

        res.status(200).json(project);
    } catch (err) {
        console.error("getProject:", err);
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function deleteProject(req: Request, res: Response): Promise<void> {
    try {
        const userId = getUserId(req, res);
        if (!userId) return;

        const { projectId } = req.params as unknown as DeleteProjectReq;

        const project = await projectService.deleteProject(projectId);

        if (!project) {
            res.status(404).json({ message: "Project not found" });
            return;
        }

        res.status(200).json(project);
    } catch (err) {
        console.error("deleteProject:", err);
        res.status(500).json({ message: "Internal server error" });
    }
}