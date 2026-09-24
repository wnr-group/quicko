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
const isProd = process.env.NODE_ENV === "production";
const sql =
  globalForDb.__quikoSql ??
  postgres(connectionString, { max: isProd ? 1 : 10, prepare: false });
if (!isProd) globalForDb.__quikoSql = sql;

export const db = drizzle(sql, { schema });
export { schema };
