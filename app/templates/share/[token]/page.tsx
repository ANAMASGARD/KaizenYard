import { notFound } from "next/navigation";
import { SharedAppView } from "@/components/templates/shared-app-view";
import { getGeneratedAppByToken } from "@/lib/templates/actions";

type Props = {
  params: Promise<{ token: string }>;
};

export default async function SharedGeneratedAppPage({ params }: Props) {
  const { token } = await params;
  const app = await getGeneratedAppByToken(token);

  if (!app) {
    notFound();
  }

  return <SharedAppView app={app} />;
}
