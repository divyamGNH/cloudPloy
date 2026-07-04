import { type CurrentDeployment } from "../types/db.js";
import { type DB, query } from "../db/query.js";
import type { Pool, PoolClient } from "pg";

// Create a new current deployment record for a deployment.
export async function createOrUpdateCurrentDeployment(db: DB, serviceId: string, deploymentId: string) {
    const sql = `
        INSERT INTO current_deployments(service_id, deployment_id)
        VALUES ($1, $2)
        ON CONFLICT (service_id)
        DO UPDATE
        SET deployment_id = EXCLUDED.deployment_id,
            updated_at = NOW()
        RETURNING *;
    `;

    const result = await query<CurrentDeployment>(db, sql, [serviceId, deploymentId]);
    return result.rows[0];
}

// Update the current deployment to the latest deployment id.
export async function getCurrentDeployment(db: DB, serviceId: string) {
    const sql = `
        SELECT * FROM current_deployments
        WHERE service_id = $1
    `;

    const result = await query<CurrentDeployment>(db, sql, [serviceId]);
    return result.rows[0];
}