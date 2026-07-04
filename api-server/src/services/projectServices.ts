import * as projectRepository from "../repositories/projectRepo.js";
import { db } from "../db/db.js";

export async function createProject(userId: string, projectName: string) {
    return await projectRepository.createProject(db, userId, projectName);
}

export async function getAllProjects(userId: string) {
    return await projectRepository.getAllProjectsFromUserId(db, userId);
}

export async function getProject(projectId: string) {
    return await projectRepository.getProjectFromProjectId(db, projectId);
}

export async function deleteProject(projectId: string) {
    return await projectRepository.deleteProject(db, projectId);
}