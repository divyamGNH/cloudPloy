import { Pool, type PoolConfig } from "pg"

const config : PoolConfig = {
    connectionString : process.env.DATABASE_URL,
    max : 10,
    min : 5,
    idleTimeoutMillis : 30000, // close idle conns after 30 sec of inactivity.
    connectionTimeoutMillis : 5000, // How much time untill i get a idle connection to work with else throw an error.
    // log?: ((...messages: any[]) => void) | undefined;
    // Promise?: PromiseConstructorLike | undefined;
    // allowExitOnIdle?: boolean | undefined;
    // maxUses?: number | undefined;
    // maxLifetimeSeconds?: number | undefined;
    // Client?: (new() => ClientBase) | undefined;
    // onConnect?: ((client: ClientBase) => void) | undefined;
}

export const db = new Pool(config);