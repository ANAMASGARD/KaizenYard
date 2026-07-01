import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { getPool } from "../db/pool.ts";

config({ path: ".env" });

const pool = await getPool();
const db = drizzle({ client: pool });

try {
  console.log("Applying migrations from ./migrations …");
  await migrate(db, { migrationsFolder: "./migrations" });
  console.log("Migrations complete.");
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Migration failed:", message);
  process.exit(1);
} finally {
  await pool.end();
}
