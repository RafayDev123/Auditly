import crypto from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { authSessions, subscriptions, users } from "@/db/schema";

const SESSION_COOKIE = "wa_session";

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export async function createSession(params: {
  userId: string;
  userAgent?: string | null;
  ipAddress?: string | null;
}) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = sha256(token);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14);

  await db.insert(authSessions).values({
    userId: params.userId,
    tokenHash,
    userAgent: params.userAgent ?? null,
    ipAddress: params.ipAddress ?? null,
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(authSessions).where(eq(authSessions.tokenHash, sha256(token)));
  }
  cookieStore.delete(SESSION_COOKIE);
}

async function getSharedWorkspaceUser() {
  const email = "shared-workspace@localhost.invalid";
  let [user] = await db
    .select({ userId: users.id, email: users.email, fullName: users.fullName })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    await db
      .insert(users)
      .values({ email, fullName: "Shared Workspace", passwordHash: "disabled" })
      .onConflictDoNothing({ target: users.email });
    [user] = await db
      .select({ userId: users.id, email: users.email, fullName: users.fullName })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
  }

  if (!user) throw new Error("Unable to initialize local workspace user.");

  await db
    .insert(subscriptions)
    .values({ userId: user.userId, plan: "free" })
    .onConflictDoNothing({ target: subscriptions.userId });

  return user;
}

export async function getSessionUser() {
  return getSharedWorkspaceUser();
}
