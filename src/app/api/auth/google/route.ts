// import { NextResponse } from "next/server";

// export async function GET() {
//   if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
//     return NextResponse.redirect(new URL("/login?google=not-configured", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
//   }

//   return NextResponse.redirect(new URL("/login?google=pending-setup", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
// }


import crypto from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!clientId) {
    return NextResponse.redirect(
      new URL("/login?google=not-configured", appUrl)
    );
  }

  const state = crypto.randomBytes(32).toString("hex");
  const redirectUri = `${appUrl}/api/auth/google/callback`;

  const cookieStore = await cookies();

  cookieStore.set("google_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth/google",
    maxAge: 60 * 10,
  });

  const googleUrl = new URL(
    "https://accounts.google.com/o/oauth2/v2/auth"
  );

  googleUrl.searchParams.set("client_id", clientId);
  googleUrl.searchParams.set("redirect_uri", redirectUri);
  googleUrl.searchParams.set("response_type", "code");
  googleUrl.searchParams.set("scope", "openid email profile");
  googleUrl.searchParams.set("state", state);
  googleUrl.searchParams.set("access_type", "offline");
  googleUrl.searchParams.set("prompt", "consent");

  return NextResponse.redirect(googleUrl);
}