import { defineConfig } from "drizzle-kit";

// Load .env.local without a dotenv dependency (Node 20.12+ / 26 built-in).
process.loadEnvFile(".env.local");

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
  // We own the entire `public` schema (profiles is the primary user table).
  schemaFilter: ["public"],
  verbose: true,
  strict: true,
});
