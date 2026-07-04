import { type Project } from "../types/db.js";
import { type DB, query } from "../db/query.js";
import { randomUUID } from "node:crypto";

export async function createProject(db: DB, userId: string, projectName: string) {

    const projectId: string = randomUUID()

    const sql = `
        INSERT INTO projects (project_id, project_name, user_id)
        VALUES ($1, $2, $3)
        RETURNING *
    `;

    const result = await query<Project>(db, sql, [projectId, projectName, userId]);
    return result.rows[0];
}

export async function getAllProjectsFromUserId(db: DB, userId: string) {
    const sql = `
        SELECT * FROM projects
        WHERE user_id = $1
        ORDER BY created_at DESC;
    `

    // Will return the whole list of projects that the user has.
    const result = await query<Project>(db, sql, [userId]);
    return result.rows;
}

export async function getProjectFromProjectId(db: DB, projectId: string) {
    const sql = `
        SELECT * FROM projects 
        WHERE project_id = $1;
    `

    const result = await query<Project>(db, sql, [projectId]);
    return result.rows[0];
}

export async function deleteProject(db: DB, projectId: string) {
    const sql = `
        DELETE FROM projects
        WHERE project_id = $1
        RETURNING *;
    `;

    const result = await query<Project>(db, sql, [projectId]);
    return result.rows[0];
}

// TODO : We will need another migration code to add a status column to the project table for "active", "paused" or "deleted" status.