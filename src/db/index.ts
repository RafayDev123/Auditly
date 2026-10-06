import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "@/lib/env";

const databaseUrl = env.databaseUrl;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is required. Add a valid PostgreSQL URL to your .env file, for example: postgresql://user:password@host:5432/database"
  );
}

if (!/^postgres(?:ql)?:\/\//i.test(databaseUrl)) {
  throw new Error(
    "DATABASE_URL must start with postgresql:// or postgres://. Example: postgresql://user:password@host:5432/database"
  );
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
