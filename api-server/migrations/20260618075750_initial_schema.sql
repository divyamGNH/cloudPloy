-- migrate:up

CREATE TABLE users (
    user_id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE projects (
    project_id TEXT PRIMARY KEY,
    project_name TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE services (
    service_id TEXT PRIMARY KEY,
    service_name TEXT NOT NULL,
    type TEXT NOT NULL,
    service_status TEXT NOT NULL DEFAULT 'active' CHECK (
        service_status IN(
            'active',
            'suspended',
            'deleted'
        )
    ),
    project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    deployment_url TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(service_name, project_id)
);

CREATE TABLE static_sites (
    static_site_id TEXT PRIMARY KEY,
    service_id TEXT UNIQUE NOT NULL REFERENCES services(service_id) ON DELETE CASCADE,

    github_url TEXT NOT NULL,
    branch TEXT NOT NULL,
    root_directory TEXT,
    build_command TEXT NOT NULL,

    auto_deploy BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE web_services (
    web_service_id TEXT PRIMARY KEY,
    service_id TEXT UNIQUE NOT NULL REFERENCES services(service_id) ON DELETE CASCADE,

    github_url TEXT NOT NULL,
    language TEXT NOT NULL,
    branch TEXT NOT NULL,
    region TEXT NOT NULL,
    root_directory TEXT,
    build_command TEXT NOT NULL,
    start_command TEXT NOT NULL,
    instance_type TEXT NOT NULL DEFAULT 'starter',

    auto_deploy BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE deployments (
    deployment_id TEXT PRIMARY KEY,
    service_id TEXT NOT NULL REFERENCES services(service_id) ON DELETE CASCADE,

    image_uri TEXT NOT NULL,
    commit_sha TEXT NOT NULL,
    deployment_status TEXT NOT NULL CHECK (
        deployment_status IN(
            'queued',
            'building',
            'deploying',
            'live',
            'failed',
            'cancelled'
        )
    ),
    started_at TIMESTAMP,
    finished_at TIMESTAMP,
    error_message TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(service_id, commit_sha)
);

CREATE TABLE current_deployments (
    service_id TEXT PRIMARY KEY REFERENCES services(service_id) ON DELETE CASCADE,
    deployment_id TEXT REFERENCES deployments(deployment_id) ON DELETE CASCADE,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE environment_variables (
    env_var_id TEXT PRIMARY KEY,
    service_id TEXT NOT NULL REFERENCES services(service_id) ON DELETE CASCADE,

    env_key TEXT NOT NULL,
    env_val TEXT NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(env_key, service_id)
);

CREATE INDEX index_projects_user_id
ON projects(user_id);

CREATE INDEX index_deployments_service_id
ON deployments(service_id);

CREATE INDEX index_services_project_id
ON services(project_id);

CREATE INDEX index_env_vars_service_id
ON environment_variables(service_id);

-- migrate:down

DROP TABLE IF EXISTS environment_variables;
DROP TABLE IF EXISTS current_deployments;
DROP TABLE IF EXISTS deployments;
DROP TABLE IF EXISTS web_services;
DROP TABLE IF EXISTS static_sites;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS users;