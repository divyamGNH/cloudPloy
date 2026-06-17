export type BackendDeploymentPayload = {
    GITHUB_URL: string,
    RUNTIME: string,
    BUILD_COMMAND: string,
    START_COMMAND: string,
    PROJECT_ROOT: string,
}

export type BackendDeploymentResponse = {
    message: string,
    data: {
        ProjectID: string,
        DeploymentID: string,
    }
}

export type BackendDeploymentStatusResponse = {
    data: {
        ProjectID: string,
        DeploymentID: string,
    }
}