import { type EnvironmentVariable } from "../types/db.js";
import { type DB, query } from "../db/query.js";
import { randomUUID } from "node:crypto";

type EnvVar = {
    key: string;
    value: string;
};

// We pass an array of EnvVars so basically we can input a lot on env vars in a single query.
export async function createEnvironmentVariables(db: DB, serviceId: string, envVars: EnvVar[]) {
    const values: string[] = [];
    const params: (string | null)[] = [];

    // Fill the values and the params array
    envVars.forEach((env, i) => {
        const base = i * 4;

        values.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`);

        params.push(
            randomUUID(),
            serviceId,
            env.key,
            env.value
        );
    });

    const sql = `
        INSERT INTO environment_variables(env_var_id, service_id, env_key, env_val)
        VALUES ${values.join(",")}
        RETURNING *;
    `;

    const result = await query<EnvironmentVariable>(db, sql, params);
    return result.rows;
}

// Get all the env vars for a particular service.
export async function getEnvironmentVariables(db: DB, serviceId: string) {
    const sql = `
        SELECT *
        FROM environment_variables
        WHERE service_id = $1
        ORDER BY env_key;
    `;

    const result = await query<EnvironmentVariable>(db, sql, [serviceId]);
    return result.rows;
}

// Delete a single env var.
export async function deleteEnvironmentVariable(db: DB, envVarId: string) {
    const sql = `
        DELETE FROM environment_variables
        WHERE env_var_id = $1
        RETURNING *;
    `;

    const result = await query<EnvironmentVariable>(db, sql, [envVarId]);
    return result.rows[0];
}

// Delete all the env vars for a particular service.
export async function deleteAllEnvironmentVariables(db: DB, serviceId: string) {
    const sql = `
        DELETE FROM environment_variables
        WHERE service_id = $1
        RETURNING *;
    `;

    const result = await query<EnvironmentVariable>(db, sql, [serviceId]);
    return result.rows[0];
}

// The approach I will use to update the env vars is delete them all and create all of them again because it costs me 2 queries to do so and on an average normal update would cost be 5-6 queries per user per update.