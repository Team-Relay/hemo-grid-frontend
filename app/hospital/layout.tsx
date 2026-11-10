/** Secures the hospital route group and passes verified identity into the application shell. */

import { AppShell } from "@/components/layout/app-shell";
import { requireRole } from "@/lib/auth/dal";
import { HOSPITAL_ROLES } from "@/lib/auth/roles";

export default async function HospitalLayout({ children }: LayoutProps<"/hospital">) {
  const { user } = await requireRole(HOSPITAL_ROLES);

  return (
    <AppShell role="hospital" user={user}>
      {children}
    </AppShell>
  );
}
