import { type WebService } from "../types/db.js";
import { type DB, query } from "../db/query.js";
import { randomUUID } from "node:crypto";

// Create a new web service for a project id.
export async function createWebService(db: DB, serviceId: string, githubUrl: string, language: string, branch: string, region: string, rootDirectory: string | null, buildCommand: string, startCommand: string, instanceType: string) {
    const webServiceId = randomUUID();

    const sql = `
        INSERT INTO web_services(web_service_id, service_id, github_url, language, branch, region, root_directory, build_command, start_command, instance_type)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        RETURNING *;
    `;

    const result = await query<WebService>(db, sql, [webServiceId, serviceId, githubUrl, language, branch, region, rootDirectory, buildCommand, startCommand, instanceType]);
    return result.rows[0];
}

// Get a web service by it's service id.
export async function getWebService(db: DB, serviceId: string) {
    const sql = `
        SELECT *
        FROM web_services
        WHERE service_id = $1;
    `;

    const result = await query<WebService>(db, sql, [serviceId]);
    return result.rows[0];
}

// Update a web service.
export async function updateWebService(db: DB, serviceId: string, githubUrl: string, language: string, branch: string, region: string, rootDirectory: string | null, buildCommand: string, startCommand: string, instanceType: string, autoDeploy: boolean) {
    const sql = `
        UPDATE web_services
        SET github_url=$1, language=$2, branch=$3, region=$4, root_directory=$5, build_command=$6, start_command=$7, instance_type=$8, auto_deploy=$9
        WHERE service_id=$10
        RETURNING *;
    `;

    const result = await query<WebService>(db, sql, [githubUrl, language, branch, region, rootDirectory, buildCommand, startCommand, instanceType, autoDeploy, serviceId]);
    return result.rows[0];
}