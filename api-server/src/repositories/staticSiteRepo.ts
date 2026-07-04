import { type StaticSite } from "../types/db.js";
import { type DB, query } from "../db/query.js";
import { randomUUID } from "node:crypto";

// Create a static site for a project id.
export async function createStaticSite(db: DB, serviceId: string, githubUrl: string, branch: string, rootDirectory: string | null, buildCommand: string) {
    const staticSiteId = randomUUID();

    const sql = `
        INSERT INTO static_sites(static_site_id, service_id, github_url, branch, root_directory, build_command)
        VALUES ($1,$2,$3,$4,$5,$6)
        RETURNING *;
    `;

    const result = await query<StaticSite>(db, sql, [staticSiteId, serviceId, githubUrl, branch, rootDirectory, buildCommand]);
    return result.rows[0];
}

// Get a static site with it's service id.
export async function getStaticSite(db: DB, serviceId: string) {
    const sql = `
        SELECT *
        FROM static_sites
        WHERE service_id = $1;
    `;

    const result = await query<StaticSite>(db, sql, [serviceId]);
    return result.rows[0];
}

// Update a static site.
export async function updateStaticSite(db: DB, serviceId: string, githubUrl: string, branch: string, rootDirectory: string | null, buildCommand: string, autoDeploy: boolean) {
    const sql = `
        UPDATE static_sites
        SET github_url=$1, branch=$2, root_directory=$3, build_command=$4, auto_deploy=$5
        WHERE service_id=$6
        RETURNING *;
    `;

    const result = await query<StaticSite>(db, sql, [githubUrl, branch, rootDirectory, buildCommand, autoDeploy, serviceId]);
    return result.rows[0];
}