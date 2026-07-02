import { SpaceDetailView } from "@/components/pages/space-detail-view";

type Props = {
  params: Promise<{ spaceId: string }>;
};

export default async function SpacePage({ params }: Props) {
  const { spaceId } = await params;
  const id = Number.parseInt(spaceId, 10);
  if (!Number.isFinite(id)) {
    return null;
  }
  return <SpaceDetailView spaceId={id} />;
}
