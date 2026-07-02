"use client";

import dynamic from "next/dynamic";
import { KaizenLoadingScreen } from "@/components/loading/kaizen-loading";

const WhiteboardPage = dynamic(
  () =>
    import("@/components/whiteboard/whiteboard-page").then(
      (mod) => mod.WhiteboardPage,
    ),
  {
    ssr: false,
    loading: () => <KaizenLoadingScreen label="Loading whiteboard" />,
  },
);

export function WhiteboardPageLoader() {
  return <WhiteboardPage />;
}
