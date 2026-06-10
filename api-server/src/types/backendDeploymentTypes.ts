export type backendDeploymentRequestBody = {
    GITHUB_URL: string,
    RUNTIME: string,
    BUILD_COMMAND: string,
    START_COMMAND: string,
    PROJECT_ROOT: string,
    PROJECT_NAME: string,
}