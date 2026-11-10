/** Renders hospital chrome from verified identity or outage-only JWT presentation claims. */

import { AppShell } from "@/components/layout/app-shell";
import { requireShellRole } from "@/lib/auth/dal";
import { HOSPITAL_ROLES } from "@/lib/auth/roles";

export default async function HospitalLayout({ children }: LayoutProps<"/hospital">) {
  const { user, serviceUnavailable } = await requireShellRole(HOSPITAL_ROLES);

  return (
    <AppShell role="hospital" user={user} serviceUnavailable={serviceUnavailable}>
      {children}
    </AppShell>
  );
}
