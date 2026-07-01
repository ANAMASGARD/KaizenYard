/** Surface nested causes from Drizzle / Neon fetch errors. */
export function formatDbError(error: unknown): string {
  const parts: string[] = [];

  let current: unknown = error;
  let depth = 0;
  while (current instanceof Error && depth < 4) {
    if (current.message && !parts.includes(current.message)) {
      parts.push(current.message);
    }
    current = (current as Error & { cause?: unknown }).cause;
    depth += 1;
  }

  const text = parts.join(" | ");

  if (text.includes("fetch failed") || text.includes("ETIMEDOUT")) {
    return `${text} — Check DATABASE_URL, Neon project status (paused DB wakes on first query), VPN/firewall, then retry.`;
  }

  if (text.includes('relation "users" does not exist')) {
    return `${text} — Run: npm run db:migrate`;
  }

  if (text.includes("clerk_id")) {
    return `${text} — Schema out of date. Run: npm run db:migrate`;
  }

  return text || String(error);
}
