export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-16">
      <div>
        <h1 className="font-head text-4xl tracking-tight">Kaizenyard</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Productivity app — database ready with Drizzle ORM and Neon Postgres.
        </p>
      </div>
      <p className="text-muted-foreground">
        Schema: <code className="rounded bg-muted px-1.5 py-0.5">users</code> and{" "}
        <code className="rounded bg-muted px-1.5 py-0.5">posts</code> tables in{" "}
        <code className="rounded bg-muted px-1.5 py-0.5">db/schema.ts</code>.
      </p>
    </main>
  );
}
