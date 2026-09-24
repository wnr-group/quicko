import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// The single DB entry point. Everything server-side reads/writes through this
// Drizzle client over a plain Postgres connection — NOT supabase-js. That is
// what keeps the database portable: swap DATABASE_URL to move Postgres hosts.

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

// Reuse the client across hot-reloads in dev to avoid exhausting connections.
const globalForDb = globalThis as unknown as {
  __quikoSql?: ReturnType<typeof postgres>;
};

// Serverless (Vercel) talks to Postgres through a transaction-mode pooler
// (e.g. Supabase PgBouncer on :6543), which does NOT support prepared
// statements — so disable them, and keep one connection per ephemeral function
// instance. Locally (long-lived dev server) a larger pool is fine.
const sql =
  globalForDb.__quikoSql ??
  postgres(connectionString, {
    // The transaction pooler (PgBouncer) multiplexes to backends, so a modest
    // client pool is safe and — unlike max:1 — a single slow/stale connection
    // no longer blocks every concurrent request on the instance.
    max: 10,
    prepare: false, // transaction pooler can't do prepared statements
    // Supabase's pooler drops idle server-side connections; without these a
    // reused socket goes stale and the next query hangs until it's cancelled
    // ("statement timeout"). Recycle idle connections and fail fast instead.
    idle_timeout: 20, // close a connection after 20s idle → always reconnect fresh
    max_lifetime: 60 * 30, // hard-recycle every 30 min
    connect_timeout: 15, // error out in 15s rather than hanging forever
  });
// Reuse the single client across warm serverless invocations (and dev HMR); its
// underlying connections are recycled by idle_timeout above.
globalForDb.__quikoSql = sql;

export const db = drizzle(sql, { schema });
export { schema };
