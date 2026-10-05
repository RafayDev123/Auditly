import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

function isErrorLike(value: unknown): value is {
  cause?: unknown;
  code?: unknown;
  name?: unknown;
} {
  return typeof value === "object" && value !== null;
}

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true });
  } catch (error) {
    const causeCodes: string[] = [];
    let cause = isErrorLike(error) ? error.cause : undefined;
    const seen = new Set<object>();

    while (isErrorLike(cause) && !seen.has(cause)) {
      seen.add(cause);
      if (typeof cause.code === "string") causeCodes.push(cause.code);
      cause = cause.cause;
    }

    console.error("Database health check failed", {
      name: isErrorLike(error) && typeof error.name === "string" ? error.name : undefined,
      code: isErrorLike(error) && typeof error.code === "string" ? error.code : undefined,
      causeCode: causeCodes[0],
    });
    return Response.json({ ok: false }, { status: 500 });
  }
}
