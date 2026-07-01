export type ServiceType = "static_site" | "web_service";

export type ServiceStatus =
    | "active"
    | "suspended"
    | "deleted";

export type DeploymentStatus =
    | "queued"
    | "building"
    | "deploying"
    | "live"
    | "failed"
    | "cancelled";

export type InstanceType = "starter";

export interface User {
    user_id: string;
    name : string;
    email: string;
    password_hash: string;
    created_at: Date;
    updated_at: Date;
}

export interface Project {
    project_id: string;
    project_name: string;
    user_id: string;
    created_at: Date;
    updated_at: Date;
}

export interface Service {
    service_id: string;
    service_name: string;
    type: ServiceType;
    service_status: ServiceStatus;
    project_id: string;
    deployment_url: string | null;
    created_at: Date;
    updated_at: Date;
}

export interface StaticSite {
    static_site_id: string;
    service_id: string;

    github_url: string;
    branch: string;
    root_directory: string | null;
    build_command: string;

    auto_deploy: boolean;

    created_at: Date;
    updated_at: Date;
}

export interface WebService {
    web_service_id: string;
    service_id: string;

    github_url: string;
    language: string;
    branch: string;
    region: string;
    root_directory: string | null;

    build_command: string;
    start_command: string;

    instance_type: InstanceType;
    auto_deploy: boolean;

    created_at: Date;
    updated_at: Date;
}

export interface Deployment {
    deployment_id: string;
    service_id: string;

    image_uri: string;
    commit_sha: string;
    deployment_status: DeploymentStatus;

    started_at: Date | null;
    finished_at: Date | null;

    error_message: string | null;

    created_at: Date;
    updated_at: Date;
}

export interface CurrentDeployment {
    service_id: string;
    deployment_id: string;

    created_at: Date;
    updated_at: Date;
}

export interface EnvironmentVariable {
    env_var_id: string;
    service_id: string;

    env_key: string;
    env_val: string;

    created_at: Date;
    updated_at: Date;
}