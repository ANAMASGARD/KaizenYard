import { Suspense } from "react";
import { getDashboardSnapshot } from "@/lib/dashboard/actions";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { KaizenLoadingScreen } from "@/components/loading/kaizen-loading";

async function DashboardContent() {
  const snapshot = await getDashboardSnapshot();
  return <DashboardView snapshot={snapshot} />;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<KaizenLoadingScreen label="Loading dashboard…" />}>
      <DashboardContent />
    </Suspense>
  );
}
