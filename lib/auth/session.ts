/**
 * Access-token cookie management shared between Next.js SSR and browser API requests.
 */

import "server-only";

import { cookies } from "next/headers";

import type { BackendLoginResponse } from "@/lib/api/backend-types";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/constants";

export async function createSession(
  loginResponse: BackendLoginResponse,
  remember: boolean,
): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(ACCESS_TOKEN_COOKIE, loginResponse.accessToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(remember ? { maxAge: loginResponse.expiresIn } : {}),
  });
}

export async function getAccessToken(): Promise<string | null> {
  return (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value ?? null;
}

export async function deleteSession(): Promise<void> {
  (await cookies()).delete(ACCESS_TOKEN_COOKIE);
}
