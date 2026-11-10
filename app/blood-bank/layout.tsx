/** Secures the provider route group and supplies verified user data to the shared shell. */

import { AppShell } from "@/components/layout/app-shell";
import { requireRole } from "@/lib/auth/dal";
import { BLOOD_BANK_ROLES } from "@/lib/auth/roles";

export default async function BloodBankLayout({ children }: LayoutProps<"/blood-bank">) {
  const { user } = await requireRole(BLOOD_BANK_ROLES);

  return (
    <AppShell role="blood-bank" user={user}>
      {children}
    </AppShell>
  );
}
