import { GeneratedAppView } from "@/components/templates/generated-app-view";
import { getGeneratedApp } from "@/lib/templates/actions";

type Props = {
  params: Promise<{ appId: string }>;
};

export default async function GeneratedAppPage({ params }: Props) {
  const { appId } = await params;
  const id = Number.parseInt(appId, 10);
  if (!Number.isFinite(id)) {
    return null;
  }

  const app = await getGeneratedApp(id);
  return <GeneratedAppView app={app} />;
}
