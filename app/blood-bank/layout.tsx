/** Renders provider chrome while strict data loaders retain backend authorization. */

import { AppShell } from "@/components/layout/app-shell";
import { requireShellRole } from "@/lib/auth/dal";
import { BLOOD_BANK_ROLES } from "@/lib/auth/roles";

export default async function BloodBankLayout({ children }: LayoutProps<"/blood-bank">) {
  const { user, serviceUnavailable } = await requireShellRole(BLOOD_BANK_ROLES);

  return (
    <AppShell role="blood-bank" user={user} serviceUnavailable={serviceUnavailable}>
      {children}
    </AppShell>
  );
}
