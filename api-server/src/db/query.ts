import { db } from "./db.js";

export async function query<T>(sql : string, params? : unknown[]) {
    const start = Date.now();
    const result = await db.query(sql,params);
    console.log(sql, Date.now()-start);
    return result;
}