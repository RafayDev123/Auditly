export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  databaseUrl: process.env.DATABASE_URL ?? "",
  sessionSecret: process.env.SESSION_SECRET ?? "",
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  aiApiKey: process.env.AI_API_KEY,
};

export function ensureEnv() {
  if (!env.databaseUrl) {
    throw new Error(
      "DATABASE_URL must be set to a valid PostgreSQL connection string, for example: postgresql://user:password@host:5432/database"
    );
  }

  if (!/^postgres(?:ql)?:\/\//i.test(env.databaseUrl)) {
    throw new Error(
      "DATABASE_URL must start with postgresql:// or postgres://. Example: postgresql://user:password@host:5432/database"
    );
  }

  if (!env.sessionSecret || env.sessionSecret.length < 32) {
    throw new Error("SESSION_SECRET must be set and at least 32 characters long");
  }
}
