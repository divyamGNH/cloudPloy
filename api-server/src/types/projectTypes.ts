export interface CreateProjectReq {
    projectName: string;
}

export interface GetProjectReq {
    projectId: string;
}

export interface UpdateProjectReq {
    projectId: string;
    projectName: string;
}

export interface DeleteProjectReq {
    projectId: string;
}

export interface PauseProjectReq {
    projectId: string;
}

export interface ResumeProjectReq {
    projectId: string;
}