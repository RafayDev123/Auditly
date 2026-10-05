import crypto from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { subscriptions, users } from "@/db/schema";
import { createSession } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";

type GoogleUser = {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  verified_email?: boolean;
};

export async function GET(req: Request) {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL("/login?google=not-configured", appUrl)
    );
  }

  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const googleError = requestUrl.searchParams.get("error");

  if (googleError) {
    return NextResponse.redirect(
      new URL("/login?google=cancelled", appUrl)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/login?google=invalid-request", appUrl)
    );
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get("google_oauth_state")?.value;

  cookieStore.set("google_oauth_state", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth/google",
    maxAge: 0,
  });

  if (!savedState || savedState !== state) {
    return NextResponse.redirect(
      new URL("/login?google=invalid-state", appUrl)
    );
  }

  const redirectUri = `${appUrl}/api/auth/google/callback`;

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) {
    return NextResponse.redirect(
      new URL("/login?google=token-error", appUrl)
    );
  }

  const tokenData = (await tokenResponse.json()) as {
    access_token?: string;
  };

  if (!tokenData.access_token) {
    return NextResponse.redirect(
      new URL("/login?google=no-access-token", appUrl)
    );
  }

  const userResponse = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    }
  );

  if (!userResponse.ok) {
    return NextResponse.redirect(
      new URL("/login?google=user-error", appUrl)
    );
  }

  const googleUser = (await userResponse.json()) as GoogleUser;

  if (!googleUser.email || googleUser.verified_email !== true) {
    return NextResponse.redirect(
      new URL("/login?google=email-not-verified", appUrl)
    );
  }

  const email = googleUser.email.toLowerCase();

  let found = await db
    .select({
      id: users.id,
      email: users.email,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  let userId: string;

  if (found[0]) {
    userId = found[0].id;
  } else {
    const randomPassword = crypto.randomBytes(32).toString("hex");
    const passwordHash = await hashPassword(randomPassword);

    const inserted = await db
      .insert(users)
      .values({
        email,
        fullName: googleUser.name?.trim() || "Google User",
        passwordHash,
        avatarUrl: googleUser.picture || null,
        emailVerifiedAt: new Date(),
      })
      .returning({
        id: users.id,
      });

    userId = inserted[0].id;

    await db.insert(subscriptions).values({
      userId,
      plan: "free",
    });
  }

  await createSession({
    userId,
    userAgent: req.headers.get("user-agent"),
    ipAddress: req.headers.get("x-forwarded-for"),
  });

  return NextResponse.redirect(new URL("/dashboard", appUrl));
}