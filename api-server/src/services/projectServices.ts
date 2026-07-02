import * as projectRepository from "../repositories/projectRepo.js";

export async function createProject(userId: string, projectName: string) {
    return await projectRepository.createProject(userId, projectName);
}

export async function getAllProjects(userId: string) {
    return await projectRepository.getAllProjectsFromUserId(userId);
}

export async function getProject(projectId: string) {
    return await projectRepository.getProjectFromProjectId(projectId);
}

export async function deleteProject(projectId: string) {
    return await projectRepository.deleteProject(projectId);
}