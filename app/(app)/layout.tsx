import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { UserSync } from "@/components/user-sync";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <DashboardShell>
      <UserSync />
      {children}
    </DashboardShell>
  );
}
