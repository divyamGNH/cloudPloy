import { randomUUID } from "node:crypto";
import { type User } from "../types/db.js";
import { query } from "../db/query.js";

export async function createUser(name : string, email: string, passwordHash: string): Promise<User> {

    const userId : string = randomUUID();

    const sql = `
        INSERT INTO users (
            user_id,
            name,
            email,
            password_hash
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *
    `;

    const result = await query<User>(sql,[userId, name, email, passwordHash]);

    return result.rows[0];
}

export async function getUserByEmail(email : string) : Promise<User|null>{ 
    const sql = `
        SELECT * FROM users
        WHERE email = $1
    `;

    const result = await query<User>(sql,[email]);
    return result.rows[0] ?? null;
}

export async function getUserById(userId : string) : Promise<User|null> {
    const sql = `
        SELECT * FROM users
        WHERE user_id = $1
    `;

    const result = await query<User>(sql,[userId])
    return result.rows[0] ?? null;
}