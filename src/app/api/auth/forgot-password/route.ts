import crypto from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { passwordResetTokens, users } from "@/db/schema";
import { forgotPasswordSchema } from "@/lib/auth/validators";

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email." }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const found = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);

  if (found[0]) {
    const token = crypto.randomBytes(24).toString("hex");
    const tokenHash = sha256(token);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

    await db.insert(passwordResetTokens).values({
      userId: found[0].id,
      tokenHash,
      expiresAt,
    });

    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log(`Reset link: ${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/reset-password?token=${token}`);
    }
  }

  return NextResponse.json({
    ok: true,
    message: "If an account exists, a reset link has been generated.",
  });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) return NextResponse.json({ valid: false }, { status: 400 });

  const found = await db
    .select({ id: passwordResetTokens.id })
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, sha256(token)),
        gt(passwordResetTokens.expiresAt, new Date()),
        isNull(passwordResetTokens.usedAt),
      ),
    )
    .limit(1);

  return NextResponse.json({ valid: Boolean(found[0]) });
}
