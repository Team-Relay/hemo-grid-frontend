/** Renders admin chrome while strict data loaders retain backend authorization. */

import { AdminDataNotice } from "@/components/admin/admin-data-notice";
import { AppShell } from "@/components/layout/app-shell";
import { requireShellRole } from "@/lib/auth/dal";
import { ADMIN_ROLES } from "@/lib/auth/roles";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const { user, serviceUnavailable } = await requireShellRole(ADMIN_ROLES);

  return (
    <AppShell role="admin" user={user} serviceUnavailable={serviceUnavailable}>
      <AdminDataNotice />
      {children}
    </AppShell>
  );
}
