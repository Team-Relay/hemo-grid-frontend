import { AppShell } from "@/components/layout/app-shell";
export default function BloodBankLayout({ children }: LayoutProps<"/blood-bank">) {
  return <AppShell role="blood-bank">{children}</AppShell>;
}
