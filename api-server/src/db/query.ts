import { type Pool, type PoolClient } from "pg";

export type DB = Pool | PoolClient;

// for normal query calls no need to pass the executor its default db
// But for sequential queries that need a transaction pass a PoolClient in the query code 
export async function query<T>(db: DB, sql : string, params? : unknown[]) {
    const start = Date.now();
    const result = await db.query(sql,params);
    console.log(sql, Date.now()-start);
    return result;
}