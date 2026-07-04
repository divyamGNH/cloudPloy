import { type Service } from "../types/db.js";
import { type DB, query } from "../db/query.js";
import { randomUUID } from "node:crypto";

export async function createNewService(
    db: DB,
    serviceName: string,
    type: string,
    serviceStatus: string,
    projectId: string
) {
    const serviceId = randomUUID();

    const sql = `
        INSERT INTO services(service_id, service_name, type, service_status, project_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
    `;

    const result = await query<Service>(db, sql, [
        serviceId,
        serviceName,
        type,
        serviceStatus,
        projectId
    ]);

    return result.rows[0];
}

export async function getAllServices(db: DB, projectId: string) {
    const sql = `
        SELECT *
        FROM services
        WHERE project_id = $1
        ORDER BY created_at DESC;
    `;

    const result = await query<Service>(db, sql, [projectId]);
    return result.rows;
}

export async function getService(db: DB, serviceId: string) {
    const sql = `
        SELECT *
        FROM services
        WHERE service_id = $1;
    `;

    const result = await query<Service>(db, sql, [serviceId]);
    return result.rows[0];
}

export async function updateServiceName(db: DB, serviceId: string, name: string) {
    const sql = `
        UPDATE services
        SET service_name = $1
        WHERE service_id = $2
        RETURNING *;
    `;

    const result = await query<Service>(db, sql, [name, serviceId]);
    return result.rows[0];
}

// Toggle service status between active, paused and deleted.
export async function changeServiceStatus(db: DB, serviceId: string, status: string) {
    const sql = `
        UPDATE services
        SET service_status = $1
        WHERE service_id = $2
        RETURNING *;
    `;

    const result = await query<Service>(db, sql, [status, serviceId]);
    return result.rows[0];
}

export async function deleteService(db: DB, serviceId: string) {
    const sql = `
        DELETE FROM services
        WHERE service_id = $1
        RETURNING *;
    `;

    const result = await query<Service>(db, sql, [serviceId]);
    return result.rows[0];
}

export async function updateDeploymentUrl(db: DB, serviceId: string, deploymentUrl: string) {
    const sql = `
        UPDATE services
        SET deployment_url = $1
        WHERE service_id = $2
        RETURNING *;
    `;

    const result = await query<Service>(db, sql, [deploymentUrl, serviceId]);
    return result.rows[0];
}