/** Public entry point that restores a still-valid authenticated workspace. */

import { redirect } from "next/navigation";

import { getOptionalSession } from "@/lib/auth/dal";
import { workspacePathForRole } from "@/lib/auth/roles";

export default async function Home() {
  const session = await getOptionalSession();
  redirect(session ? workspacePathForRole(session.user.role) : "/login");
}
