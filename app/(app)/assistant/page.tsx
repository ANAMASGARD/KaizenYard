import { Suspense } from "react";
import { AssistantPage } from "@/components/assistant/assistant-page";
import { KaizenLoadingScreen } from "@/components/loading/kaizen-loading";

export default function Page() {
  return (
    <Suspense fallback={<KaizenLoadingScreen label="Loading assistant" />}>
      <AssistantPage />
    </Suspense>
  );
}
