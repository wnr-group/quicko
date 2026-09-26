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
    // Keep the per-instance pool small. Each open connection is another chance
    // to be frozen mid-protocol and leave a backend wedged in `ClientRead`
    // holding a pooler slot — three at once were observed on the demo, all
    // from the admin dashboard's old 15-way fan-out. Now that the heavy pages
    // issue a single statement, a render needs one connection; a few spare
    // ones keep the remaining small Promise.all sites from serialising, and
    // the query deadline below stops a stale one blocking others for long.
    max: 3,
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

// ── Query deadline ────────────────────────────────────────────────────────
// Vercel FREEZES this function between requests while Supabase's pooler drops
// the server side of connections it considers idle. On thaw we can hand a
// query to a socket whose peer is already gone. postgres-js has no per-query
// timeout — `connect_timeout` only covers opening a connection — so that query
// never settles. Because RSC responses STREAM, the browser has already been
// sent a 200 and the shell by then, so a stalled query shows up as a page that
// loads forever with no error anyone can catch. (Observed on the demo: a
// backend left sitting in `ClientRead` for 500s+ after its Lambda went away.)
//
// So give every query a deadline. A blown deadline throws, which a React error
// boundary can render and the user can retry — a fresh invocation dials a
// fresh socket and normally succeeds. The DB itself is not the problem here:
// the whole admin fan-out measures ~400ms from a laptop, far below this.
const QUERY_TIMEOUT_MS = Number(process.env.DB_QUERY_TIMEOUT_MS ?? 8000);

export class DbTimeoutError extends Error {
  constructor(ms: number) {
    super(`Database query exceeded ${ms}ms — the connection was likely stale.`);
    this.name = "DbTimeoutError";
  }
}

/** Race a postgres-js pending query against the deadline, cancelling on loss. */
function withDeadline<T>(pending: PromiseLike<T> & { cancel?: () => void }): Promise<T> {
  if (!(QUERY_TIMEOUT_MS > 0)) return Promise.resolve(pending);
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    Promise.resolve(pending),
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        // Tell the server to stop too, so a wedged backend is not left holding
        // a pooler slot for the full server-side statement_timeout.
        try {
          pending.cancel?.();
        } catch {
          /* best effort — the socket may already be gone */
        }
        reject(new DbTimeoutError(QUERY_TIMEOUT_MS));
      }, QUERY_TIMEOUT_MS);
    }),
  ]).finally(() => clearTimeout(timer)) as Promise<T>;
}

// drizzle's postgres-js driver only ever calls `unsafe`, `begin` and
// `savepoint` on the client, so guarding those three covers every query the
// app can issue — including the ones inside a transaction, whose callback gets
// its own guarded client.
type Pending = PromiseLike<unknown> & { cancel?: () => void; values?: () => PromiseLike<unknown> };

function guard<T extends object>(client: T): T {
  return new Proxy(client, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (prop === "unsafe" && typeof value === "function") {
        return (...args: unknown[]) => {
          const pending = value.apply(target, args) as Pending;
          // Stay lazy: drizzle either awaits this directly or chains .values(),
          // and only the branch it picks should start a deadline timer.
          return {
            then: (ok?: never, err?: never) => withDeadline(pending).then(ok, err),
            catch: (err?: never) => withDeadline(pending).catch(err),
            finally: (f?: never) => withDeadline(pending).finally(f),
            values: () => withDeadline(pending.values!() as Pending),
          };
        };
      }
      // begin()/savepoint() hand a transaction-scoped client to their callback;
      // guard that too or queries inside a transaction lose their deadline.
      if ((prop === "begin" || prop === "savepoint") && typeof value === "function") {
        return (...args: unknown[]) =>
          value.apply(
            target,
            args.map((a) =>
              typeof a === "function"
                ? (txClient: object, ...rest: unknown[]) => a(guard(txClient), ...rest)
                : a,
            ),
          );
      }
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

export const db = drizzle(guard(sql), { schema });
export { schema };
