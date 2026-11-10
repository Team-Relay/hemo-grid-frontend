/** Sign-in page that returns existing valid sessions to their own workspace. */

import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginForm } from "@/features/requests/login-form";
import { getOptionalSession } from "@/lib/auth/dal";
import { workspacePathForRole } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  const session = await getOptionalSession();
  if (session) redirect(workspacePathForRole(session.user.role));

  return <LoginForm />;
}
