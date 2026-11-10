import { AppShell } from "@/components/layout/app-shell";
import { requireRole } from "@/lib/auth/dal";
import { ADMIN_ROLES } from "@/lib/auth/roles";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const { user } = await requireRole(ADMIN_ROLES);

  return (
    <AppShell role="admin" user={user}>
      {children}
    </AppShell>
  );
}
