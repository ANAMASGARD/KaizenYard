import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { AccentColorApplier } from "@/components/settings/accent-color-applier";
import { UserSync } from "@/components/user-sync";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <DashboardShell>
      <UserSync />
      <AccentColorApplier />
      {children}
    </DashboardShell>
  );
}
