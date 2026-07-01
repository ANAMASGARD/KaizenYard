import { config } from "dotenv";
import { getPool } from "../db/pool.ts";

config({ path: ".env" });

const pool = await getPool();

try {
  const ping = await pool.query("SELECT 1 AS ok");
  console.log("Connection OK:", ping.rows[0]);

  const columns = await pool.query<{ column_name: string }>(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users'
    ORDER BY ordinal_position
  `);
  console.log(
    "users columns:",
    columns.rows.map((c) => c.column_name).join(", ") || "(table missing)",
  );

  if (!columns.rows.some((c) => c.column_name === "clerk_id")) {
    console.error("\nMissing clerk_id on users — run: npm run db:migrate");
    process.exit(1);
  }

  console.log("\nDatabase looks ready.");
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Database check failed:", message);
  console.error(
    "\nTips: use Neon pooled URL (*-pooler.*), add ?sslmode=require, wake DB in Neon console, check VPN/firewall.",
  );
  process.exit(1);
} finally {
  await pool.end();
}
