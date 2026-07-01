import { drizzle } from "drizzle-orm/node-postgres";
import { getPool } from "@/db/pool";

const pool = await getPool();

export const db = drizzle({ client: pool });
export * from "@/db/schema";
