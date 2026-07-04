import { type Deployment } from "../types/db.js";
import { type DB, query } from "../db/query.js";
import { randomUUID } from "node:crypto";

// Create new deployment.
export async function createNewDeployment(db: DB, serviceId: string, imageUri: string, commitSha: string, deploymentStatus: string) {
    const deploymentId = randomUUID();
    const startedAt = new Date();

    const sql = `
        INSERT INTO deployments(deployment_id, service_id, image_uri, commit_sha, deployment_status, started_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
    `;

    const result = await query<Deployment>(db, sql, [deploymentId, serviceId, imageUri, commitSha, deploymentStatus, startedAt]);
    return result.rows[0];
}

// Get any deployment with the id.
export async function getDeployment(db: DB, deploymentId: string) {
    const sql = `
        SELECT *
        FROM deployments
        WHERE deployment_id = $1;
    `;

    const result = await query<Deployment>(db, sql, [deploymentId]);
    return result.rows[0];
}

// Get all the deployments for a particular service.
export async function getAllDeployments(db: DB, serviceId: string) {
    const sql = `
        SELECT *
        FROM deployments
        WHERE service_id = $1
        ORDER BY created_at DESC;
    `;

    const result = await query<Deployment>(db, sql, [serviceId]);
    return result.rows;
}

// Update the deployment status.
export async function updateDeploymentStatus(db: DB, deploymentId: string, deploymentStatus: string) {
    const sql = `
        UPDATE deployments
        SET deployment_status = $1
        WHERE deployment_id = $2
        RETURNING *;
    `;

    const result = await query<Deployment>(db, sql, [deploymentStatus, deploymentId]);
    return result.rows[0];
}

// Enter the finish time of the deployment container.
export async function updateFinishTime(db: DB, deploymentId: string) {
    const sql = `
        UPDATE deployments
        SET finished_at = NOW()
        WHERE deployment_id = $1
        RETURNING *;
    `;

    const result = await query<Deployment>(db, sql, [deploymentId]);
    return result.rows[0];
}

// Enter the error message if any.
export async function updateErrorMessage(db: DB, deploymentId: string, errorMessage: string) {
    const sql = `
        UPDATE deployments
        SET error_message = $1
        WHERE deployment_id = $2
        RETURNING *;
    `;

    const result = await query<Deployment>(db, sql, [errorMessage, deploymentId]);
    return result.rows[0];
}