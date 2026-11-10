import { AppShell } from "@/components/layout/app-shell";
export default function HospitalLayout({ children }: LayoutProps<"/hospital">) {
  return <AppShell role="hospital">{children}</AppShell>;
}
