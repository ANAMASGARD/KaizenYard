import dns from "node:dns/promises";
import { Pool, type PoolConfig } from "pg";

const globalForPg = globalThis as typeof globalThis & {
  pgPool?: Pool;
  pgPoolInit?: Promise<Pool>;
};

async function resolvePoolConfig(databaseUrl: string): Promise<PoolConfig> {
  const url = new URL(databaseUrl);
  const servername = url.hostname;
  const { address: host } = await dns.lookup(servername, { family: 4 });

  return {
    host,
    port: Number(url.port || 5432),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1).split("?")[0],
    ssl: { rejectUnauthorized: false, servername },
    max: process.env.NODE_ENV === "production" ? 10 : 3,
    connectionTimeoutMillis: 20_000,
  };
}

export async function getPool(): Promise<Pool> {
  if (globalForPg.pgPool) {
    return globalForPg.pgPool;
  }

  if (!globalForPg.pgPoolInit) {
    globalForPg.pgPoolInit = (async () => {
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error("DATABASE_URL is not set");
      }

      const pool = new Pool(await resolvePoolConfig(databaseUrl));
      globalForPg.pgPool = pool;
      return pool;
    })();
  }

  return globalForPg.pgPoolInit;
}
